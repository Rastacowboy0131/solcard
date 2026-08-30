"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

export function SiteHeader({ active = "home" }: { active?: string }) {
  const { connected } = useWallet();
  return (
    <header className="site-header wrap">
      <Link href="/" className="logo-link">
        <img src="/logo.png" alt="Chaincard logo" className="logo-icon" />
        <span className="wordmark">Chaincard</span>
      </Link>
      <nav className="site-nav">
        <Link href="/" className={active === "home" ? "active" : ""}>Home</Link>
        <Link href="/market" className={active === "market" ? "active" : ""}>Market</Link>
        {connected && (
          <Link href="/mycards" className={active === "mycards" ? "active" : ""}>My Cards</Link>
        )}
        <a href="/#builder">Mint</a>
        <Link href="/docs" className={active === "docs" ? "active" : ""}>Docs</Link>
        <a href="/docs#about">About</a>
      </nav>
      <div className="header-spacer" />
      <div className="header-wallet">
        <WalletMultiButton>Connect Wallet</WalletMultiButton>
      </div>
    </header>
  );
}
