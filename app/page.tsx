"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  SolCard,
  validateCard,
  MAX_AVATAR_BYTES,
  MAX_TOTAL_BYTES,
  NAME_RE,
} from "../lib/card";
import { compressAvatar } from "../lib/compress";
import { mintCard } from "../lib/inscribe";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton
    ),
  { ssr: false }
);

export default function Home() {
  const { wallet, publicKey, connected } = useWallet();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [x, setX] = useState("");
  const [telegram, setTelegram] = useState("");
  const [site, setSite] = useState("");
  const [wallets, setWallets] = useState("");
  const [avatar, setAvatar] = useState<{
    bytes: Uint8Array;
    mime: string;
    preview: string;
  } | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [minting, setMinting] = useState(false);
  const [result, setResult] = useState<{ mint: string; name: string } | null>(
    null
  );

  const onFile = useCallback(async (f: File | undefined) => {
    setError("");
    if (!f) return;
    try {
      const out = await compressAvatar(f, MAX_AVATAR_BYTES);
      const b64 = btoa(String.fromCharCode(...out.bytes));
      setAvatar({ ...out, preview: `data:${out.mime};base64,${b64}` });
    } catch (e: any) {
      setError(e.message || "image compression failed");
    }
  }, []);

  const buildCard = (): SolCard => ({
    v: 1,
    name: name.toLowerCase().trim(),
    displayName: displayName.trim(),
    bio: bio.trim(),
    links: {
      ...(x.trim() ? { x: x.trim() } : {}),
      ...(telegram.trim() ? { telegram: telegram.trim() } : {}),
      ...(site.trim() ? { site: site.trim() } : {}),
      ...(wallets.trim()
        ? { wallets: wallets.split(",").map((w) => w.trim()).filter(Boolean) }
        : {}),
    },
  });

  const jsonSize = new TextEncoder().encode(JSON.stringify(buildCard())).length;
  const totalSize = jsonSize + (avatar?.bytes.length ?? 0);

  async function onMint() {
    setError("");
    setResult(null);
    const card = buildCard();
    const err = validateCard(card);
    if (err) return setError(err);
    if (!avatar) return setError("upload a profile picture");
    if (totalSize > MAX_TOTAL_BYTES)
      return setError(`payload too large (${totalSize} bytes, max ${MAX_TOTAL_BYTES})`);
    if (!wallet?.adapter || !publicKey) return setError("connect a wallet");

    // check name availability first
    const check = await fetch(`/api/names/${card.name}`);
    if (check.ok) return setError("name already taken");

    setMinting(true);
    try {
      const res = await mintCard(wallet.adapter, card, avatar, setStatus);
      setStatus("Registering name...");
      const reg = await fetch("/api/names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: card.name,
          mint: res.mint,
          owner: publicKey.toBase58(),
        }),
      });
      if (!reg.ok) {
        const j = await reg.json().catch(() => ({}));
        throw new Error(j.error || "name registration failed (card minted though)");
      }
      setStatus("");
      setResult({ mint: res.mint, name: card.name });
    } catch (e: any) {
      setError(e.message || "mint failed");
      setStatus("");
    } finally {
      setMinting(false);
    }
  }

  return (
    <main className="container">
      <div className="hero">
        <h1>
          Sol<span>Card</span>
        </h1>
        <p>Your business card, inscribed on Solana. Forever. (devnet v1)</p>
      </div>

      <div className="panel">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>Build your card</strong>
          <WalletMultiButton />
        </div>

        <div className="field" style={{ marginTop: "1rem" }}>
          <label>Profile picture (compressed to ~{MAX_AVATAR_BYTES / 1000}kb webp)</label>
          <div className="row">
            {avatar && (
              <img src={avatar.preview} className="avatar-preview" alt="" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>
        </div>

        <div className="field">
          <label>Handle (your card URL: solcard/&lt;handle&gt;)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase())}
            placeholder="satoshi"
            maxLength={32}
          />
          {name && !NAME_RE.test(name) && (
            <div className="error">2-32 chars: a-z, 0-9, -, _</div>
          )}
        </div>

        <div className="field">
          <label>Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Satoshi Nakamoto"
            maxLength={64}
          />
        </div>

        <div className="field">
          <label>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What you do, in a few lines"
            maxLength={500}
          />
        </div>

        <div className="field">
          <label>X / Twitter</label>
          <input value={x} onChange={(e) => setX(e.target.value)} placeholder="https://x.com/you" />
        </div>
        <div className="field">
          <label>Telegram</label>
          <input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/you" />
        </div>
        <div className="field">
          <label>Website</label>
          <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://you.xyz" />
        </div>
        <div className="field">
          <label>Wallets to display (comma separated, max 5)</label>
          <input value={wallets} onChange={(e) => setWallets(e.target.value)} placeholder="addr1, addr2" />
        </div>

        <div className="muted" style={{ marginBottom: "1rem" }}>
          Payload: {totalSize.toLocaleString()} / {MAX_TOTAL_BYTES.toLocaleString()} bytes.
          Mint fee: {process.env.NEXT_PUBLIC_FEE_SOL || "0.15"} SOL + inscription rent.
        </div>

        <button className="btn" onClick={onMint} disabled={minting || !connected}>
          {minting ? "Minting..." : "Mint card on devnet"}
        </button>

        {status && <div className="muted" style={{ marginTop: "0.5rem" }}>{status}</div>}
        {error && <div className="error">{error}</div>}
        {result && (
          <div className="success">
            Minted! Mint: {result.mint}. View your card at{" "}
            <a href={`/${result.name}`}>/{result.name}</a>
          </div>
        )}
      </div>
    </main>
  );
}
