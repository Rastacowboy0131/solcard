"use client";

// Marketplace controls on a card page. States:
// not connected, connected non-owner (unlisted), owner unlisted (list form),
// owner listed (price + delist), listed by other (price + buy).

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  buyNameOnChain,
  delistNameOnChain,
  formatSol,
  listNameOnChain,
} from "../../lib/market";
import { fetchNameRecord, getConnection, shortKey } from "../../lib/registry";

type Props = {
  name: string;
  owner: string;
  listingState: number;
  listingPrice: number;
};

export function MarketPanel({ name, owner, listingState, listingPrice }: Props) {
  const { wallet, publicKey, connected } = useWallet();

  // Live listing state, refreshed after each tx (server props go stale).
  const [live, setLive] = useState({ owner, listingState, listingPrice });
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ msg: string; sig: string } | null>(
    null
  );

  const refresh = useCallback(async () => {
    try {
      const rec = await fetchNameRecord(getConnection(), name);
      if (rec)
        setLive({
          owner: rec.owner,
          listingState: rec.listingState,
          listingPrice: rec.listingPrice,
        });
    } catch {
      // keep last known state on RPC hiccup
    }
  }, [name]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isOwner =
    connected && publicKey && publicKey.toBase58() === live.owner;
  const listed = live.listingState === 1;

  async function run(
    label: string,
    fn: (onProgress: (msg: string) => void) => Promise<{ signature: string }>,
    doneMsg: string
  ) {
    if (!wallet?.adapter) return;
    setBusy(true);
    setError("");
    setSuccess(null);
    setStatus(`${label}: confirm in wallet, then waiting for Solana...`);
    try {
      const { signature } = await fn((msg) => setStatus(msg));
      setStatus("");
      setSuccess({ msg: doneMsg, sig: signature });
      setPrice("");
      await refresh();
    } catch (e: any) {
      setStatus("");
      setError(e?.message || `${label} failed`);
    } finally {
      setBusy(false);
    }
  }

  function onList() {
    const sol = parseFloat(price);
    if (!Number.isFinite(sol) || sol <= 0)
      return setError("enter a price in SOL greater than 0");
    run(
      "list",
      (p) => listNameOnChain(wallet!.adapter, name, Math.round(sol * 1e9), p),
      `listed ${name}.sol for ${sol} SOL`
    );
  }

  function onDelist() {
    run(
      "delist",
      (p) => delistNameOnChain(wallet!.adapter, name, p),
      `delisted ${name}.sol`
    );
  }

  function onBuy() {
    run(
      "buy",
      (p) => buyNameOnChain(wallet!.adapter, name, p),
      `bought ${name}.sol for ${formatSol(live.listingPrice)} SOL`
    );
  }

  return (
    <div className="panel market-panel">
      <div className="market-head">
        <span className="market-title display">Marketplace</span>
        {listed && (
          <span className="market-price-tag">
            {formatSol(live.listingPrice)} SOL
          </span>
        )}
      </div>

      {!connected && (
        <p className="muted">
          {listed
            ? "This name is for sale. Connect a wallet to buy it."
            : "Connect a wallet to trade this name."}
        </p>
      )}

      {connected && isOwner && !listed && (
        <>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>List for sale (price in SOL)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 1.5"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={busy}
            />
          </div>
          <button className="brut-btn" onClick={onList} disabled={busy}>
            {busy ? "Listing..." : "List for sale"}
          </button>
          <p className="muted" style={{ marginTop: 10 }}>
            2.5% marketplace fee on sale. You keep ownership until someone
            buys.
          </p>
        </>
      )}

      {connected && isOwner && listed && (
        <>
          <p className="muted">
            You listed this name for {formatSol(live.listingPrice)} SOL.
          </p>
          <button className="brut-btn" onClick={onDelist} disabled={busy}>
            {busy ? "Delisting..." : "Delist"}
          </button>
        </>
      )}

      {connected && !isOwner && listed && (
        <>
          <p className="muted">
            Listed by {shortKey(live.owner)}. Price checked on-chain at buy
            time.
          </p>
          <button className="brut-btn" onClick={onBuy} disabled={busy}>
            {busy ? "Buying..." : `Buy for ${formatSol(live.listingPrice)} SOL`}
          </button>
        </>
      )}

      {connected && !isOwner && !listed && (
        <p className="muted">
          Owned by {shortKey(live.owner)}. Not currently for sale.
        </p>
      )}

      {status && (
        <div className="muted" style={{ marginTop: 12 }}>
          {status}
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {success && (
        <div className="success">
          {success.msg}.{" "}
          <a
            href={`https://explorer.solana.com/tx/${success.sig}`}
            target="_blank"
            rel="noreferrer"
          >
            view tx
          </a>
        </div>
      )}
    </div>
  );
}
