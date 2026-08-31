import Link from "next/link";
import { SiteHeader } from "./components/SiteHeader";
import { MarqueeBar } from "./components/MarqueeBar";

export default function NotFound() {
  return (
    <>
      <SiteHeader active="" />
      <main className="wrap notfound-wrap">
        <h1 className="section-title display">Nothing here yet.</h1>
        <p className="section-sub">
          This name isn&apos;t claimed, or the page doesn&apos;t exist.
        </p>
        <div className="notfound-actions">
          <Link href="/#builder" className="brut-btn">
            Claim this name
          </Link>
          <Link href="/market" className="brut-btn notfound-secondary">
            Browse the market
          </Link>
        </div>
      </main>
      <MarqueeBar />
    </>
  );
}
