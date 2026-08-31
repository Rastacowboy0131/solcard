"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";

function isWalletAddress(s: string): boolean {
  try {
    return new PublicKey(s).toBytes().length === 32;
  } catch {
    return false;
  }
}

export function HeaderSearch() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const search = async () => {
    const query = q.trim();
    if (!query || busy) return;
    setBusy(true);
    setMsg("");
    try {
      if (isWalletAddress(query)) {
        const res = await fetch(`/api/owner/${query}`);
        const data = await res.json();
        const cards = data.cards || [];
        if (cards.length > 0) {
          window.location.href = `/${cards[0].name}`;
          return;
        }
        setMsg("no card found");
      } else {
        const res = await fetch(`/api/names/${query.toLowerCase()}`);
        if (res.ok) {
          window.location.href = `/${query.toLowerCase()}`;
          return;
        }
        setMsg("not found");
      }
    } catch {
      setMsg("search failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="header-search">
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setMsg(""); }}
        onKeyDown={(e) => e.key === "Enter" && search()}
        placeholder="find a card"
        className="header-search-input"
        aria-label="Find a card by name or wallet"
      />
      <button
        type="button"
        className="brut-btn header-search-btn"
        onClick={search}
        disabled={busy || !q.trim()}
      >
        {busy ? "..." : "Search"}
      </button>
      {msg && <span className="header-search-msg">{msg}</span>}
    </div>
  );
}
