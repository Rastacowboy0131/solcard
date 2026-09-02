import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { lookupName } from "../../lib/names";
import { shortKey } from "../../lib/registry";
import { fetchCardByMint } from "../../lib/chain";
import { SiteHeader } from "../components/SiteHeader";
import { MarqueeBar } from "../components/MarqueeBar";
import { BusinessCard, BizSocial } from "../components/BusinessCard";
import { DownloadCard } from "../components/DownloadCard";
import { MarketPanel } from "../components/MarketPanel";
import { themeVars } from "../../lib/themes";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { name: string };
}) {
  const name = params.name.toLowerCase();
  return {
    title: `${name} | Chaincard`,
    description: `chaincard/${name}: an on-chain business card on Solana, inscribed forever.`,
    twitter: {
      card: "summary_large_image",
      title: `${name} | Chaincard`,
      description: `chaincard/${name}: an on-chain business card on Solana.`,
    },
  };
}

export default async function CardPage({
  params,
}: {
  params: { name: string };
}) {
  const entry = await lookupName(params.name);
  if (!entry) notFound();

  const placeholderMint = entry.mint === "11111111111111111111111111111111";
  const data = placeholderMint ? null : await fetchCardByMint(entry.mint);
  if (!data) {
    // name is registered but no card minted yet (reserved names)
    return (
      <>
        <SiteHeader active="" />
        <main className="wrap notfound-wrap">
          <h1 className="section-title display">chaincard/{params.name.toLowerCase()}</h1>
          <p className="section-sub">
            This name is claimed and secured on-chain. The card hasn&apos;t been
            published yet.
          </p>
          <p className="chain-note">
            Owner:{" "}
            <a href={`https://explorer.solana.com/address/${entry.owner}`}>
              {shortKey(entry.owner)}
            </a>
          </p>
          {entry.onChain && entry.listingState === 1 && (
            <MarketPanel
              name={params.name.toLowerCase()}
              owner={entry.owner}
              listingState={entry.listingState}
              listingPrice={entry.listingPrice}
            />
          )}
        </main>
        <MarqueeBar />
      </>
    );
  }

  const { card, avatarBase64, bgBase64, bgMime, mint, inscription } = data;
  const bgSrc = bgBase64 ? `data:${bgMime};base64,${bgBase64}` : undefined;

  const socials: BizSocial[] = [];
  if (card.links?.site) socials.push({ kind: "globe", href: card.links.site });
  if (card.links?.x) socials.push({ kind: "x", href: card.links.x });
  if (card.links?.telegram)
    socials.push({ kind: "telegram", href: card.links.telegram });
  if (card.links?.pump) socials.push({ kind: "pump", href: card.links.pump });
  if (card.links?.fomo) socials.push({ kind: "fomo", href: card.links.fomo });

  const bio = card.bio
    ? `${card.displayName}. ${card.bio}`
    : `${card.displayName}.`;

  return (
    <>
      <SiteHeader active="" />
      <main
        className={`card-page${bgSrc ? " has-bg" : ""}`}
        style={{
          ...themeVars(card.theme),
          ...(bgSrc
            ? ({ "--page-bg-image": `url(${bgSrc})` } as CSSProperties)
            : {}),
        }}
      >
        <BusinessCard
          handle={card.name}
          bio={bio}
          avatarSrc={
            avatarBase64
              ? `data:image/webp;base64,${avatarBase64}`
              : undefined
          }
          socials={socials}
          address={mint}
          wallets={card.links?.wallets}
          theme={card.theme}
          bgSrc={bgSrc}
          colors={card.colors}
        />
        <DownloadCard handle={card.name} />
        {entry.onChain && (
          <MarketPanel
            name={params.name.toLowerCase()}
            owner={entry.owner}
            listingState={entry.listingState}
            listingPrice={entry.listingPrice}
          />
        )}
        <p className="chain-note">
          Owner:{" "}
          {entry.onChain ? (
            <a
              href={`https://explorer.solana.com/address/${entry.owner}`}
            >
              {shortKey(entry.owner)}
            </a>
          ) : (
            <>{shortKey(entry.owner)} (legacy index, unclaimed on-chain)</>
          )}
        </p>
        <p className="chain-note">
          Read live from Solana.{" "}
          <a
            href={`https://explorer.solana.com/address/${inscription}`}
          >
            inscription
          </a>{" "}
          ·{" "}
          <a href={`https://explorer.solana.com/address/${mint}`}>
            mint
          </a>
        </p>
      </main>
      <MarqueeBar />
    </>
  );
}
