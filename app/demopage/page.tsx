import { SiteHeader } from "../components/SiteHeader";
import { MarqueeBar } from "../components/MarqueeBar";
import { BusinessCard, BizSocial } from "../components/BusinessCard";
import { DownloadCard } from "../components/DownloadCard";

export const metadata = {
  title: "solcard.xyz/demopage | SolCard",
  description: "Example SolCard page: what a minted on-chain business card looks like.",
};

export default function DemoPage() {
  const socials: BizSocial[] = [
    { kind: "globe", href: "https://solcard.xyz" },
    { kind: "x", href: "https://x.com/solana" },
    { kind: "telegram", href: "https://t.me/solana" },
    { kind: "github" },
  ];

  return (
    <>
      <SiteHeader active="" />
      <main className="card-page">
        <BusinessCard
          handle="demopage"
          bio="Demo. This is what your minted card page looks like, avatar, bio and links read straight from the chain."
          socials={socials}
          address="Demo1111111111111111111111111111111111111111"
          wallets={["demo.sol", "7XK3...Q9ZF"]}
          demoAvatar
        />
        <DownloadCard handle="demopage" />
        <p className="chain-note">
          Demo preview, not a real inscription. Mint your own on the{" "}
          <a href="/#builder">builder</a> and it lives at solcard.xyz/yourname,
          read live from Solana.
        </p>
      </main>
      <MarqueeBar />
    </>
  );
}
