"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { shortKey } from "../../lib/registry";

type Found = { name: string; owner: string; mint: string };

function isWalletAddress(s: string): boolean {
  try {
    return new PublicKey(s).toBytes().length === 32;
  } catch {
    return false;
  }
}

export function CardSearch() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Found[] | null>(null);
  const [notFound, setNotFound] = useState<string>("");

  const search = async () => {
    const query = q.trim();
    if (!query || busy) return;
    setBusy(true);
    setResults(null);
    setNotFound("");
    try {
      if (isWalletAddress(query)) {
        const res = await fetch(`/api/owner/${query}`);
        const data = await res.json();
        const cards: Found[] = data.cards || [];
        if (cards.length > 0) setResults(cards);
        else setNotFound("No chaincard found for this wallet.");
      } else {
        const res = await fetch(`/api/names/${query.toLowerCase()}`);
        if (res.ok) {
          window.location.href = `/${query.toLowerCase()}`;
          return;
        }
        setNotFound("No chaincard with that name.");
      }
    } catch {
      setNotFound("Search failed, try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="wrap" id="search">
      <h2 className="section-title">Find a Card</h2>
      <p className="section-sub">
        Search by handle or paste a wallet address.
      </p>
      <div className="panel card-search-panel">
        <div className="row card-search-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="satoshi or wallet address"
            className="card-search-input"
          />
          <button
            type="button"
            className="brut-btn"
            onClick={search}
            disabled={busy || !q.trim()}
          >
            {busy ? "Searching..." : "Search"}
          </button>
        </div>
        {notFound && <div className="muted card-search-msg">{notFound}</div>}
        {results && (
          <ul className="card-search-results">
            {results.map((c) => (
              <li key={c.name}>
                <a href={`/${c.name}`} className="card-search-hit">
                  <span className="hit-name">chaincard/{c.name}</span>
                  <span className="muted">owner {shortKey(c.owner)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
