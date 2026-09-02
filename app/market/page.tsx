"use client";

// Marketplace browse page: all currently listed names, sortable, each
// linking to its card page. Data comes from /api/market (server decodes
// the listed name PDAs).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";
import { MarqueeBar } from "../components/MarqueeBar";
import { formatSol } from "../../lib/market";
import { shortKey } from "../../lib/registry";

type Listing = {
  name: string;
  owner: string;
  mint: string;
  priceLamports: number;
  ts: number;
};

type Sort = "price-asc" | "price-desc" | "name";

export default function MarketPage() {
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<Sort>("price-asc");

  useEffect(() => {
    let alive = true;
    fetch("/api/market")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.error) setError(j.error);
        else setListings(j.listings || []);
      })
      .catch((e) => alive && setError(e.message || "failed to load listings"));
    return () => {
      alive = false;
    };
  }, []);

  const sorted = useMemo(() => {
    if (!listings) return null;
    const copy = [...listings];
    if (sort === "price-asc")
      copy.sort((a, b) => a.priceLamports - b.priceLamports);
    else if (sort === "price-desc")
      copy.sort((a, b) => b.priceLamports - a.priceLamports);
    else copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy;
  }, [listings, sort]);

  return (
    <>
      <SiteHeader active="market" />
      <main className="wrap market-page">
        <h1 className="section-title">Marketplace</h1>
        <p className="section-sub">
          Names listed for sale on-chain. 2.5% fee on every sale.
        </p>

        <div className="market-sort-row">
          <SortBtn
            label="Price ↑"
            active={sort === "price-asc"}
            onClick={() => setSort("price-asc")}
          />
          <SortBtn
            label="Price ↓"
            active={sort === "price-desc"}
            onClick={() => setSort("price-desc")}
          />
          <SortBtn
            label="Name A-Z"
            active={sort === "name"}
            onClick={() => setSort("name")}
          />
        </div>

        {error && <div className="error">{error}</div>}
        {!error && !sorted && <p className="muted">Loading listings...</p>}
        {sorted && sorted.length === 0 && (
          <div className="panel market-empty">
            <p style={{ margin: 0 }}>
              Nothing listed right now. Own a name? Open your card page and
              hit <strong>List for sale</strong>.
            </p>
          </div>
        )}

        {sorted && sorted.length > 0 && (
          <div className="market-grid">
            {sorted.map((l) => (
              <Link
                key={l.name}
                href={`/${encodeURIComponent(l.name)}`}
                className="market-item"
              >
                <div className="market-item-name display">{l.name}.sol</div>
                <div className="market-item-price">
                  {formatSol(l.priceLamports)} SOL
                </div>
                <div className="market-item-owner muted">
                  seller {shortKey(l.owner)}
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

function SortBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`sort-btn${active ? " active" : ""}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
