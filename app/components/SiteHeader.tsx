"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

export function SiteHeader({ active = "home" }: { active?: string }) {
  return (
    <header className="site-header wrap">
      <Link href="/" className="logo-link">
        <div className="logo-block">
          <span />
          <span />
          <span />
        </div>
        <span className="wordmark">Chaincard</span>
      </Link>
      <nav className="site-nav">
        <Link href="/" className={active === "home" ? "active" : ""}>Home</Link>
        <Link href="/market" className={active === "market" ? "active" : ""}>Market</Link>
        <a href="/#builder">Explore</a>
        <a href="/#builder">Docs</a>
        <a href="/#builder">About</a>
      </nav>
      <div className="header-spacer" />
      <div className="header-wallet">
        <WalletMultiButton>Connect Wallet</WalletMultiButton>
      </div>
    </header>
  );
}
