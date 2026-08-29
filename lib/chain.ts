// Server-side chain reads: fetch inscription bytes for a mint straight
// from the inscription accounts (no offchain metadata involved).

import {
  createUmi,
} from "@metaplex-foundation/umi-bundle-defaults";
import {
  mplInscription,
  findMintInscriptionPda,
  findInscriptionMetadataPda,
  findAssociatedInscriptionPda,
} from "@metaplex-foundation/mpl-inscription";
import { publicKey } from "@metaplex-foundation/umi";
import type { SolCard } from "./card";

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const AVATAR_TAG = "avatar";
const BG_TAG = "bg";

export type OnChainCard = {
  card: SolCard;
  avatarBase64: string | null; // data URL friendly
  bgBase64: string | null; // optional background image
  mint: string;
  inscription: string;
};

export async function fetchCardByMint(
  mintStr: string
): Promise<OnChainCard | null> {
  const umi = createUmi(RPC_URL).use(mplInscription());
  const mint = publicKey(mintStr);

  const inscriptionAccount = findMintInscriptionPda(umi, { mint });
  const inscriptionMetadataAccount = findInscriptionMetadataPda(umi, {
    inscriptionAccount: inscriptionAccount[0],
  });

  const jsonAcc = await umi.rpc.getAccount(inscriptionAccount[0]);
  if (!jsonAcc.exists) return null;

  let card: SolCard;
  try {
    card = JSON.parse(new TextDecoder().decode(jsonAcc.data));
  } catch {
    return null;
  }

  let avatarBase64: string | null = null;
  try {
    const avatarPda = findAssociatedInscriptionPda(umi, {
      associated_tag: AVATAR_TAG,
      inscriptionMetadataAccount: inscriptionMetadataAccount[0],
    });
    const avatarAcc = await umi.rpc.getAccount(avatarPda[0]);
    if (avatarAcc.exists && avatarAcc.data.length > 0) {
      avatarBase64 = Buffer.from(avatarAcc.data).toString("base64");
    }
  } catch {
    // no avatar inscribed, fine
  }

  let bgBase64: string | null = null;
  try {
    const bgPda = findAssociatedInscriptionPda(umi, {
      associated_tag: BG_TAG,
      inscriptionMetadataAccount: inscriptionMetadataAccount[0],
    });
    const bgAcc = await umi.rpc.getAccount(bgPda[0]);
    if (bgAcc.exists && bgAcc.data.length > 0) {
      bgBase64 = Buffer.from(bgAcc.data).toString("base64");
    }
  } catch {
    // no background inscribed, fine (older cards)
  }

  return {
    card,
    avatarBase64,
    bgBase64,
    mint: mintStr,
    inscription: inscriptionAccount[0].toString(),
  };
}
