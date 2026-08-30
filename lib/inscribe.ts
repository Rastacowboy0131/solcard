"use client";

// Inscription mint flow (devnet), single-popup batched signing:
// All transactions are built up front on one fresh blockhash, signed
// together via the wallet identity's signAllTransactions (one popup),
// then sent:
//   Group A (sequential, confirm each): createV1 + mintV1, then
//     initializeFromMint + fee transfer + associated inscription inits
//     + allocates, greedily packed by transaction size.
//   Group B (parallel): all writeData chunk txs (independent offsets).
//     Failed writes are rebuilt on a fresh blockhash and re-signed
//     (one extra popup only when retries are needed).
//   Group C: the registry name-claim tx, sent after writes confirm.

import { WalletAdapter } from "@solana/wallet-adapter-base";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  percentAmount,
  publicKey,
  sol,
  Umi,
  Transaction as UmiTransaction,
  TransactionBuilder,
  transactionBuilder,
  BlockhashWithExpiryBlockHeight,
} from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { fromWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
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
} from "@metaplex-foundation/mpl-token-metadata";
import { transferSol } from "@metaplex-foundation/mpl-toolbox";
import { PublicKey } from "@solana/web3.js";
import { claimIx, fetchConfig, getConnection } from "./registry";
import type { SolCard } from "./card";

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const FEE_WALLET = process.env.NEXT_PUBLIC_FEE_WALLET || "";
const FEE_SOL = Number(process.env.NEXT_PUBLIC_FEE_SOL || "0.15");
// extra fee when a custom background image is inscribed (env-tunable)
export const BG_FEE_SOL = Number(process.env.NEXT_PUBLIC_BG_FEE_SOL || "0");

// Bytes per writeData ix. The tx budget is 1232 bytes; a writeData tx
// carries ~230 bytes of overhead (header, 3 accounts, sig, ix framing),
// so 900 keeps a comfortable margin while cutting chunk count vs 800.
const CHUNK = 900;
const AVATAR_TAG = "avatar";
const BG_TAG = "bg";

export type MintProgress = (msg: string) => void;

/** Error thrown when the card minted fine but the name claim failed. */
export class ClaimFailedError extends Error {
  constructor(msg: string, public readonly mint: string) {
    super(msg);
    this.name = "ClaimFailedError";
  }
}

type WriteJob = {
  label: string;
  build: () => TransactionBuilder;
};

export async function mintCard(
  wallet: WalletAdapter,
  card: SolCard,
  avatar: { bytes: Uint8Array; mime: string },
  onProgress: MintProgress,
  bg?: { bytes: Uint8Array; mime: string } | null
): Promise<{ mint: string; inscription: string }> {
  const umi: Umi = createUmi(RPC_URL)
    .use(mplInscription())
    .use(mplTokenMetadata())
    .use(walletAdapterIdentity(wallet));

  const jsonBytes = new TextEncoder().encode(JSON.stringify(card));

  onProgress("Preparing transactions...");

  // Registry config (fee wallet) for the final claim tx, fetched up front.
  const conn = getConnection();
  const cfg = await fetchConfig(conn);
  if (!cfg) throw new Error("registry config not found on this cluster");
  if (!wallet.publicKey) throw new Error("wallet not connected");

  const mint = generateSigner(umi);
  const inscriptionAccount = findMintInscriptionPda(umi, {
    mint: mint.publicKey,
  });
  const inscriptionMetadataAccount = findInscriptionMetadataPda(umi, {
    inscriptionAccount: inscriptionAccount[0],
  });
  const avatarAccount = findAssociatedInscriptionPda(umi, {
    associated_tag: AVATAR_TAG,
    inscriptionMetadataAccount: inscriptionMetadataAccount[0],
  });
  const bgAccount = bg
    ? findAssociatedInscriptionPda(umi, {
        associated_tag: BG_TAG,
        inscriptionMetadataAccount: inscriptionMetadataAccount[0],
      })
    : null;

  // ---- Group A: setup builders, packed greedily by tx size ----

  // A1: create + mint the NFT (mint keypair co-signs silently).
  const createBuilder = (createV1(umi, {
    mint,
    name: `Chaincard: ${card.name}`,
    uri: "", // data lives in the inscription, not offchain json
    sellerFeeBasisPoints: percentAmount(0),
    tokenStandard: TokenStandard.NonFungible,
  }) as TransactionBuilder).add(
    mintV1(umi, {
      mint: mint.publicKey,
      tokenStandard: TokenStandard.NonFungible,
      amount: 1,
    })
  );

  // A2+: inscription setup, packed as tightly as size allows.
  let setup = initializeFromMint(umi, {
    mintAccount: mint.publicKey,
  }) as TransactionBuilder;
  if (FEE_WALLET) {
    setup = setup.add(
      transferSol(umi, {
        destination: publicKey(FEE_WALLET),
        amount: sol(FEE_SOL + (bg ? BG_FEE_SOL : 0)),
      })
    );
  }
  setup = setup.add(
    initializeAssociatedInscription(umi, {
      inscriptionAccount: inscriptionAccount[0],
      inscriptionMetadataAccount,
      associationTag: AVATAR_TAG,
    })
  );
  if (bg) {
    setup = setup.add(
      initializeAssociatedInscription(umi, {
        inscriptionAccount: inscriptionAccount[0],
        inscriptionMetadataAccount,
        associationTag: BG_TAG,
      })
    );
  }
  setup = setup
    .add(
      allocate(umi, {
        inscriptionAccount: inscriptionAccount[0],
        inscriptionMetadataAccount,
        associatedTag: null,
        targetSize: jsonBytes.length,
      })
    )
    .add(
      allocate(umi, {
        inscriptionAccount: avatarAccount[0],
        inscriptionMetadataAccount,
        associatedTag: AVATAR_TAG,
        targetSize: avatar.bytes.length,
      })
    );
  if (bg && bgAccount) {
    setup = setup.add(
      allocate(umi, {
        inscriptionAccount: bgAccount[0],
        inscriptionMetadataAccount,
        associatedTag: BG_TAG,
        targetSize: bg.bytes.length,
      })
    );
  }

  // Placeholder blockhash for size measurement while splitting.
  const placeholder = {
    blockhash: "11111111111111111111111111111111",
    lastValidBlockHeight: 0,
  };
  const setupParts = setup
    .setBlockhash(placeholder)
    .unsafeSplitByTransactionSize(umi);

  // ---- Group B: writeData chunk jobs (one chunk per tx) ----
  const writeJobs: WriteJob[] = [
    ...chunkJobs(umi, jsonBytes, {
      inscriptionAccount: inscriptionAccount[0],
      inscriptionMetadataAccount,
      associatedTag: null,
    }, "card json"),
    ...chunkJobs(umi, avatar.bytes, {
      inscriptionAccount: avatarAccount[0],
      inscriptionMetadataAccount,
      associatedTag: AVATAR_TAG,
    }, "avatar"),
    ...(bg && bgAccount
      ? chunkJobs(umi, bg.bytes, {
          inscriptionAccount: bgAccount[0],
          inscriptionMetadataAccount,
          associatedTag: BG_TAG,
        }, "background")
      : []),
  ];

  // ---- Group C: registry claim ----
  const claimBuilder = transactionBuilder().add({
    instruction: fromWeb3JsInstruction(
      claimIx(
        new PublicKey(wallet.publicKey.toBase58()),
        card.name,
        new PublicKey(mint.publicKey.toString()),
        new PublicKey(cfg.feeWallet)
      )
    ),
    signers: [umi.identity],
    bytesCreatedOnChain: 0,
  });

  // ---- Build everything on one fresh blockhash ----
  const blockhash = await umi.rpc.getLatestBlockhash({
    commitment: "confirmed",
  });

  const setupTxs: UmiTransaction[] = [
    createBuilder.setBlockhash(blockhash).build(umi),
    ...setupParts.map((b) => b.setBlockhash(blockhash).build(umi)),
  ];
  const writeTxs: UmiTransaction[] = writeJobs.map((j) =>
    j.build().setBlockhash(blockhash).build(umi)
  );
  const claimTx = claimBuilder.setBlockhash(blockhash).build(umi);

  // Mint keypair co-signs the create tx silently.
  setupTxs[0] = await mint.signTransaction(setupTxs[0]);

  // ---- One wallet popup for everything ----
  onProgress("Approve once in your wallet (signs all transactions)...");
  const all = [...setupTxs, ...writeTxs, claimTx];
  const signed = await umi.identity.signAllTransactions(all);
  const signedSetup = signed.slice(0, setupTxs.length);
  const signedWrites = signed.slice(
    setupTxs.length,
    setupTxs.length + writeTxs.length
  );
  const signedClaim = signed[signed.length - 1];

  // ---- Send group A sequentially, confirming each ----
  const stageNames = [
    "NFT create/mint",
    ...setupParts.map((_, i) => `inscription setup ${i + 1}/${setupParts.length}`),
  ];
  for (let i = 0; i < signedSetup.length; i++) {
    onProgress(`Sending ${stageNames[i]}...`);
    try {
      await sendAndConfirm(umi, signedSetup[i], blockhash);
    } catch (e: any) {
      throw new Error(
        `mint failed at stage "${stageNames[i]}": ${errMsg(e)}` +
          (i > 0
            ? " (mint may be partially complete; funds for later steps were not spent)"
            : "")
      );
    }
  }

  // ---- Send group B in parallel, retry failures ----
  onProgress(`Writing ${writeJobs.length} data chunks in parallel...`);
  let pending = signedWrites.map((tx, i) => ({ tx, job: writeJobs[i] }));
  let attempt = 0;
  while (pending.length > 0) {
    const results = await Promise.allSettled(
      pending.map((p) => sendAndConfirm(umi, p.tx, blockhash))
    );
    const failed = pending.filter((_, i) => results[i].status === "rejected");
    if (failed.length === 0) break;
    attempt++;
    if (attempt > 2) {
      const first = results.find(
        (r): r is PromiseRejectedResult => r.status === "rejected"
      );
      throw new Error(
        `mint incomplete: ${failed.length} data chunk(s) failed after retries ` +
          `(${errMsg(first?.reason)}). The NFT minted but its inscription data ` +
          `is partial; retrying the mint with the same name will not work, ` +
          `contact support.`
      );
    }
    // Retry needs a re-sign on a fresh blockhash (one extra popup).
    onProgress(
      `${failed.length} chunk(s) failed, retrying (approve in wallet)...`
    );
    const fresh = await umi.rpc.getLatestBlockhash({ commitment: "confirmed" });
    const rebuilt = failed.map((f) =>
      f.job.build().setBlockhash(fresh).build(umi)
    );
    const resigned = await umi.identity.signAllTransactions(rebuilt);
    pending = resigned.map((tx, i) => ({ tx, job: failed[i].job }));
    // Subsequent sends confirm against the fresh blockhash.
    blockhash.blockhash = fresh.blockhash;
    blockhash.lastValidBlockHeight = fresh.lastValidBlockHeight;
  }

  // ---- Send group C: the name claim ----
  onProgress("Claiming name on-chain...");
  try {
    await sendAndConfirm(umi, signedClaim, blockhash);
  } catch (e: any) {
    const msg = errMsg(e);
    if (msg.includes("already in use") || msg.includes("0x0")) {
      throw new ClaimFailedError(
        "name was claimed by someone else mid-mint (card minted, name not registered)",
        mint.publicKey.toString()
      );
    }
    if (msg.toLowerCase().includes("block height exceeded") ||
        msg.toLowerCase().includes("blockhash not found")) {
      throw new ClaimFailedError(
        `card minted, but the name claim expired before it could land. ` +
          `The claim can be retried from the same wallet: ${msg}`,
        mint.publicKey.toString()
      );
    }
    throw new ClaimFailedError(
      `name claim failed (card minted though): ${msg}`,
      mint.publicKey.toString()
    );
  }

  return {
    mint: mint.publicKey.toString(),
    inscription: inscriptionAccount[0].toString(),
  };
}

function chunkJobs(
  umi: Umi,
  data: Uint8Array,
  accounts: {
    inscriptionAccount: any;
    inscriptionMetadataAccount: any;
    associatedTag: string | null;
  },
  label: string
): WriteJob[] {
  const total = Math.ceil(data.length / CHUNK);
  const jobs: WriteJob[] = [];
  for (let i = 0; i < total; i++) {
    const offset = i * CHUNK;
    const slice = data.slice(offset, offset + CHUNK);
    jobs.push({
      label: `${label} chunk ${i + 1}/${total}`,
      build: () =>
        writeData(umi, {
          inscriptionAccount: accounts.inscriptionAccount,
          inscriptionMetadataAccount: accounts.inscriptionMetadataAccount,
          associatedTag: accounts.associatedTag,
          offset,
          value: slice,
        }) as TransactionBuilder,
    });
  }
  return jobs;
}

async function sendAndConfirm(
  umi: Umi,
  tx: UmiTransaction,
  blockhash: BlockhashWithExpiryBlockHeight
) {
  const signature = await umi.rpc.sendTransaction(tx, {
    commitment: "confirmed",
  });
  const res = await umi.rpc.confirmTransaction(signature, {
    strategy: { type: "blockhash", ...blockhash },
    commitment: "confirmed",
  });
  if (res.value.err) {
    throw new Error(`transaction failed: ${JSON.stringify(res.value.err)}`);
  }
  return signature;
}

function errMsg(e: any): string {
  return String(e?.message ?? e ?? "unknown error");
}
