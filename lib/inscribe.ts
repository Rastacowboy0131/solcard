"use client";

// Inscription mint flow (devnet):
// 1. Create an NFT mint (mpl-token-metadata createV1 + mintV1).
// 2. initializeFromMint: creates the mint inscription account (the json).
// 3. initializeAssociatedInscription("avatar"): account for avatar bytes.
// 4. allocate + writeData in chunks for both json and avatar.
// 5. First tx also carries a fee transfer to FEE_WALLET.

import { WalletAdapter } from "@solana/wallet-adapter-base";
import {
  createUmi,
} from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  percentAmount,
  publicKey,
  sol,
  Umi,
  TransactionBuilder,
} from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  mplInscription,
  initializeFromMint,
  initializeAssociatedInscription,
  allocate,
  writeData,
  findInscriptionMetadataPda,
  findMintInscriptionPda,
  findAssociatedInscriptionPda,
} from "@metaplex-foundation/mpl-inscription";
import {
  mplTokenMetadata,
  createV1,
  mintV1,
  TokenStandard,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata";
import { transferSol } from "@metaplex-foundation/mpl-toolbox";
import type { SolCard } from "./card";

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const FEE_WALLET = process.env.NEXT_PUBLIC_FEE_WALLET || "";
const FEE_SOL = Number(process.env.NEXT_PUBLIC_FEE_SOL || "0.15");

const CHUNK = 800; // bytes per writeData ix, keeps txs under size limit
const AVATAR_TAG = "avatar";

export type MintProgress = (msg: string) => void;

export async function mintCard(
  wallet: WalletAdapter,
  card: SolCard,
  avatar: { bytes: Uint8Array; mime: string },
  onProgress: MintProgress
): Promise<{ mint: string; inscription: string }> {
  const umi: Umi = createUmi(RPC_URL)
    .use(mplInscription())
    .use(mplTokenMetadata())
    .use(walletAdapterIdentity(wallet));

  const jsonBytes = new TextEncoder().encode(JSON.stringify(card));

  // 1. NFT mint
  onProgress("Creating NFT mint...");
  const mint = generateSigner(umi);
  await (createV1(umi, {
    mint,
    name: `SolCard: ${card.name}`,
    uri: "", // data lives in the inscription, not offchain json
    sellerFeeBasisPoints: percentAmount(0),
    tokenStandard: TokenStandard.NonFungible,
  }) as TransactionBuilder)
    .add(
      mintV1(umi, {
        mint: mint.publicKey,
        tokenStandard: TokenStandard.NonFungible,
        amount: 1,
      })
    )
    .sendAndConfirm(umi);

  const inscriptionAccount = findMintInscriptionPda(umi, {
    mint: mint.publicKey,
  });
  const inscriptionMetadataAccount = findInscriptionMetadataPda(umi, {
    inscriptionAccount: inscriptionAccount[0],
  });

  // 2. Initialize inscription + fee transfer in one tx
  onProgress("Initializing inscription (includes SolCard fee)...");
  let init = initializeFromMint(umi, {
    mintAccount: mint.publicKey,
  }) as TransactionBuilder;
  if (FEE_WALLET) {
    init = init.add(
      transferSol(umi, {
        destination: publicKey(FEE_WALLET),
        amount: sol(FEE_SOL),
      })
    );
  }
  await init.sendAndConfirm(umi);

  // 3. Associated inscription for the avatar
  onProgress("Initializing avatar inscription...");
  await (initializeAssociatedInscription(umi, {
    inscriptionAccount: inscriptionAccount[0],
    inscriptionMetadataAccount,
    associationTag: AVATAR_TAG,
  }) as TransactionBuilder).sendAndConfirm(umi);

  const associatedInscriptionAccount = findAssociatedInscriptionPda(umi, {
    associated_tag: AVATAR_TAG,
    inscriptionMetadataAccount: inscriptionMetadataAccount[0],
  });

  // 4. Write json chunks
  await writeChunks(
    umi,
    jsonBytes,
    {
      inscriptionAccount: inscriptionAccount[0],
      inscriptionMetadataAccount,
      associatedTag: null,
    },
    "card json",
    onProgress
  );

  // 5. Write avatar chunks
  await writeChunks(
    umi,
    avatar.bytes,
    {
      inscriptionAccount: associatedInscriptionAccount[0],
      inscriptionMetadataAccount,
      associatedTag: AVATAR_TAG,
    },
    "avatar",
    onProgress
  );

  return {
    mint: mint.publicKey.toString(),
    inscription: inscriptionAccount[0].toString(),
  };
}

async function writeChunks(
  umi: Umi,
  data: Uint8Array,
  accounts: {
    inscriptionAccount: any;
    inscriptionMetadataAccount: any;
    associatedTag: string | null;
  },
  label: string,
  onProgress: MintProgress
) {
  // Allocate to full size first (resizes account in 10kb steps internally).
  let alloc = allocate(umi, {
    inscriptionAccount: accounts.inscriptionAccount,
    inscriptionMetadataAccount: accounts.inscriptionMetadataAccount,
    associatedTag: accounts.associatedTag,
    targetSize: data.length,
  }) as TransactionBuilder;
  await alloc.sendAndConfirm(umi);

  const total = Math.ceil(data.length / CHUNK);
  for (let i = 0; i < total; i++) {
    onProgress(`Writing ${label} chunk ${i + 1}/${total}...`);
    const slice = data.slice(i * CHUNK, (i + 1) * CHUNK);
    await (writeData(umi, {
      inscriptionAccount: accounts.inscriptionAccount,
      inscriptionMetadataAccount: accounts.inscriptionMetadataAccount,
      associatedTag: accounts.associatedTag,
      offset: i * CHUNK,
      value: slice,
    }) as TransactionBuilder).sendAndConfirm(umi);
  }
}
