"use client";

// Client-side marketplace txs: list, delist, buy. Same pattern as claim.ts,
// built and sent through the connected wallet, fee wallet read live from
// the config PDA.

import { WalletAdapter } from "@solana/wallet-adapter-base";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import {
  buyIx,
  delistIx,
  fetchConfig,
  fetchNameRecord,
  getConnection,
  listIx,
} from "./registry";

async function sendIxs(
  wallet: WalletAdapter,
  ixs: TransactionInstruction[],
  label: string
): Promise<string> {
  if (!wallet.publicKey) throw new Error("wallet not connected");
  const conn = getConnection();
  const tx = new Transaction().add(...ixs);
  tx.feePayer = wallet.publicKey;
  const { blockhash, lastValidBlockHeight } =
    await conn.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  const signature = await wallet.sendTransaction(tx, conn);
  const res = await conn.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );
  if (res.value.err) {
    throw new Error(`${label} tx failed: ${JSON.stringify(res.value.err)}`);
  }
  return signature;
}

export async function listNameOnChain(
  wallet: WalletAdapter,
  name: string,
  priceLamports: number
): Promise<{ signature: string }> {
  if (!wallet.publicKey) throw new Error("wallet not connected");
  if (!Number.isFinite(priceLamports) || priceLamports <= 0)
    throw new Error("price must be greater than 0");
  const signature = await sendIxs(
    wallet,
    [listIx(wallet.publicKey, name, Math.floor(priceLamports))],
    "list"
  );
  return { signature };
}

export async function delistNameOnChain(
  wallet: WalletAdapter,
  name: string
): Promise<{ signature: string }> {
  if (!wallet.publicKey) throw new Error("wallet not connected");
  const signature = await sendIxs(
    wallet,
    [delistIx(wallet.publicKey, name)],
    "delist"
  );
  return { signature };
}

// Buy: re-read the listing right before building so expected_price matches
// the live on-chain price (front-run protection is enforced by the program).
export async function buyNameOnChain(
  wallet: WalletAdapter,
  name: string
): Promise<{ signature: string; pricePaid: number }> {
  if (!wallet.publicKey) throw new Error("wallet not connected");
  const conn = getConnection();
  const [rec, cfg] = await Promise.all([
    fetchNameRecord(conn, name),
    fetchConfig(conn),
  ]);
  if (!rec) throw new Error("name not found on-chain");
  if (rec.listingState !== 1) throw new Error("this name is not listed");
  if (!cfg) throw new Error("registry config not found on this cluster");
  if (rec.owner === wallet.publicKey.toBase58())
    throw new Error("you already own this name");

  const signature = await sendIxs(
    wallet,
    [
      buyIx(
        wallet.publicKey,
        name,
        rec.listingPrice,
        new PublicKey(rec.owner),
        new PublicKey(cfg.feeWallet)
      ),
    ],
    "buy"
  );
  return { signature, pricePaid: rec.listingPrice };
}

export function formatSol(lamports: number): string {
  const sol = lamports / 1e9;
  return sol >= 1
    ? sol.toLocaleString("en-US", { maximumFractionDigits: 4 })
    : sol.toLocaleString("en-US", { maximumFractionDigits: 6 });
}
