"use client";

// Client-side claim: builds and sends the registry claim tx through the
// connected wallet. Payer becomes the on-chain owner and pays the fee
// (read live from the config PDA) to the fee wallet.

import { WalletAdapter } from "@solana/wallet-adapter-base";
import { PublicKey, Transaction } from "@solana/web3.js";
import { claimIx, fetchConfig, getConnection } from "./registry";
import { friendlyRpcError, withRetry429, RetryProgress } from "./rpc";

export async function claimNameOnChain(
  wallet: WalletAdapter,
  name: string,
  mint: string,
  onProgress?: RetryProgress
): Promise<{ signature: string }> {
  if (!wallet.publicKey) throw new Error("wallet not connected");
  const conn = getConnection();
  try {
    const cfg = await fetchConfig(conn);
    if (!cfg) throw new Error("registry config not found on this cluster");

    const ix = claimIx(
      wallet.publicKey,
      name,
      new PublicKey(mint),
      new PublicKey(cfg.feeWallet)
    );
    const tx = new Transaction().add(ix);
    tx.feePayer = wallet.publicKey;
    const { blockhash, lastValidBlockHeight } = await withRetry429(
      () => conn.getLatestBlockhash("confirmed"),
      onProgress
    );
    tx.recentBlockhash = blockhash;

    const signature = await wallet.sendTransaction(tx, conn);
    const res = await withRetry429(
      () =>
        conn.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        ),
      onProgress
    );
    if (res.value.err) {
      throw new Error(`claim tx failed: ${JSON.stringify(res.value.err)}`);
    }
    return { signature };
  } catch (e: any) {
    throw new Error(friendlyRpcError(e, "claim"));
  }
}
