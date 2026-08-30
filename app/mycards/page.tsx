"use client";

// My Cards: every chaincard owned by the connected wallet, via
// /api/owner/<wallet> (registry memcmp on owner at offset 0).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { SiteHeader } from "../components/SiteHeader";
import { MarqueeBar } from "../components/MarqueeBar";
import { formatSol } from "../../lib/market";

type OwnedCard = {
  name: string;
  owner: string;
  mint: string;
  ts: number;
  listingState: number;
  listingPrice: number;
};

export default function MyCardsPage() {
  const { publicKey, connected } = useWallet();
  const [cards, setCards] = useState<OwnedCard[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!connected || !publicKey) {
      setCards(null);
      return;
    }
    let alive = true;
    setCards(null);
    setError("");
    fetch(`/api/owner/${publicKey.toBase58()}`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.error) setError(j.error);
        else setCards(j.cards || []);
      })
      .catch((e) => alive && setError(e.message || "failed to load cards"));
    return () => {
      alive = false;
    };
  }, [connected, publicKey]);

  return (
    <>
      <SiteHeader active="mycards" />
      <main className="wrap market-page">
        <h1 className="section-title">My Cards</h1>
        <p className="section-sub">
          Chaincards owned by your connected wallet. Devnet.
        </p>

        {!connected && (
          <div className="panel market-empty">
            <p style={{ margin: 0 }}>
              Connect a wallet to see your cards.
            </p>
          </div>
        )}

        {connected && error && <div className="error">{error}</div>}
        {connected && !error && !cards && (
          <p className="muted">Loading your cards...</p>
        )}

        {connected && cards && cards.length === 0 && (
          <div className="panel market-empty">
            <p style={{ margin: 0 }}>
              No cards yet. <a href="/#builder">Mint your first chaincard</a>{" "}
              to get started.
            </p>
          </div>
        )}

        {connected && cards && cards.length > 0 && (
          <div className="market-grid">
            {cards.map((c) => (
              <Link
                key={c.name}
                href={`/${encodeURIComponent(c.name)}`}
                className="market-item"
              >
                <div className="market-item-name display">{c.name}.sol</div>
                <div className="market-item-price">
                  {c.listingState === 1
                    ? `Listed for ${formatSol(c.listingPrice)} SOL`
                    : "Not listed"}
                </div>
                <span className="market-item-cta">View card →</span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <MarqueeBar />
    </>
  );
}
