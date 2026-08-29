"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  SolCard,
  validateCard,
  MAX_AVATAR_BYTES,
  MAX_BG_BYTES,
  MAX_TOTAL_BYTES,
  NAME_RE,
} from "../lib/card";
import { compressAvatar, compressBg } from "../lib/compress";
import { mintCard, BG_FEE_SOL } from "../lib/inscribe";
import { THEMES, THEME_IDS, DEFAULT_THEME_ID } from "../lib/themes";
import { SiteHeader } from "./components/SiteHeader";
import { MarqueeBar } from "./components/MarqueeBar";
import { BusinessCard } from "./components/BusinessCard";
import {
  GlobeIcon,
  LockIcon,
  BoltIcon,
  SparkleIcon,
  ArrowRightIcon,
  TickMarks,
} from "./components/icons";

export default function Home() {
  const { wallet, publicKey, connected } = useWallet();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [x, setX] = useState("");
  const [telegram, setTelegram] = useState("");
  const [site, setSite] = useState("");
  const [wallets, setWallets] = useState("");
  const [theme, setTheme] = useState(DEFAULT_THEME_ID);
  const [avatar, setAvatar] = useState<{
    bytes: Uint8Array;
    mime: string;
    preview: string;
  } | null>(null);
  const [bg, setBg] = useState<{
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
    ...(theme !== DEFAULT_THEME_ID ? { theme } : {}),
  });

  const jsonSize = new TextEncoder().encode(JSON.stringify(buildCard())).length;
  const totalSize =
    jsonSize + (avatar?.bytes.length ?? 0) + (bg?.bytes.length ?? 0);

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

  const onBgFile = useCallback(
    async (f: File | undefined) => {
      setError("");
      if (!f) return;
      try {
        // Budget: json + avatar + bg must stay under MAX_TOTAL_BYTES.
        // Bg steps down first; avatar is untouched unless space is impossible.
        const used = jsonSize + (avatar?.bytes.length ?? 0);
        const cap = Math.max(
          4_000,
          Math.min(MAX_BG_BYTES, MAX_TOTAL_BYTES - used - 500)
        );
        const out = await compressBg(f, cap);
        const b64 = btoa(String.fromCharCode(...out.bytes));
        setBg({ ...out, preview: `data:${out.mime};base64,${b64}` });
      } catch (e: any) {
        setError(e.message || "background compression failed");
      }
    },
    [avatar, jsonSize]
  );

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
      const res = await mintCard(wallet.adapter, card, avatar, setStatus, bg);
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
    <>
      <SiteHeader active="home" />

      <main>
        <section className="wrap hero-grid">
          <div>
            <h1 className="hero-h1 display">
              Your Name.
              <br />
              On Chain.
              <br />
              <span className="tickline">
                <span className="hero-ticks"><TickMarks /></span>
                Forever.
              </span>
            </h1>
            <div className="hero-badge">On-Chain Business Cards on Solana.</div>
            <div>
              <a href="#builder" className="brut-btn hero-cta">
                <SparkleIcon size={30} /> Mint 0.15 SOL <ArrowRightIcon size={34} />
              </a>
            </div>
            <div className="feature-row">
              <div className="feature">
                <div className="feature-icon"><GlobeIcon size={28} /></div>
                <div>
                  <h3>Decentralized</h3>
                  <p>No central servers.</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-icon"><LockIcon size={28} /></div>
                <div>
                  <h3>Permanent</h3>
                  <p>Can&apos;t be deleted.</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-icon"><BoltIcon size={28} /></div>
                <div>
                  <h3>Fast</h3>
                  <p>Built on Solana.</p>
                </div>
              </div>
            </div>
          </div>

          <BusinessCard
            handle="degenkev"
            bio="GM. degen, designer, and on-chain explorer."
            socials={[
              { kind: "globe" },
              { kind: "x" },
              { kind: "discord" },
              { kind: "medium" },
              { kind: "github" },
            ]}
            address="7XK3mockmockmockQ9ZF"
            demoAvatar
            theme={theme}
            bgSrc={bg?.preview}
          />
        </section>

        <MarqueeBar />

        <section className="wrap" id="builder">
          <h2 className="section-title">Build Your Card</h2>
          <p className="section-sub">
            Inscribed on Solana devnet. Forever. (v1)
          </p>

          <div className="panel">
            <div className="field">
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
              <label>
                Background image (optional, compressed to ~{MAX_BG_BYTES / 1000}kb webp, +{BG_FEE_SOL} SOL)
              </label>
              <div className="row">
                {bg && (
                  <>
                    <img src={bg.preview} className="bg-preview" alt="" />
                    <span className="muted">
                      {bg.bytes.length.toLocaleString()} bytes
                    </span>
                    <button
                      type="button"
                      className="brut-btn btn-remove-bg"
                      onClick={() => setBg(null)}
                    >
                      ✕ Remove
                    </button>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onBgFile(e.target.files?.[0])}
                />
              </div>
            </div>

            <div className="field">
              <label>Card theme</label>
              <div className="theme-row">
                {THEME_IDS.map((id) => {
                  const t = THEMES[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`theme-chip${theme === id ? " selected" : ""}`}
                      onClick={() => setTheme(id)}
                      title={t.label}
                      style={{ background: t.card, color: t.ink, borderColor: t.ink }}
                    >
                      <span className="chip-top">
                        <i style={{ background: t.accent }} />
                        <i style={{ background: t.accent2 }} />
                        <i style={{ background: t.page }} />
                      </span>
                      <span className="chip-label">{t.label}</span>
                    </button>
                  );
                })}
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

            <button className="brut-btn" onClick={onMint} disabled={minting || !connected}>
              {minting ? "Minting..." : "✦ Mint card on devnet →"}
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
        </section>
      </main>

      <MarqueeBar />
    </>
  );
}
