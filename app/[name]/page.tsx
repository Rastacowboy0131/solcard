import { notFound } from "next/navigation";
import { lookupName } from "../../lib/names";
import { fetchCardByMint } from "../../lib/chain";
import { SiteHeader } from "../components/SiteHeader";
import { MarqueeBar } from "../components/MarqueeBar";
import { BusinessCard, BizSocial } from "../components/BusinessCard";

export const dynamic = "force-dynamic";

export default async function CardPage({
  params,
}: {
  params: { name: string };
}) {
  const entry = await lookupName(params.name);
  if (!entry) notFound();

  const data = await fetchCardByMint(entry.mint);
  if (!data) notFound();

  const { card, avatarBase64, mint, inscription } = data;

  const socials: BizSocial[] = [];
  if (card.links?.site) socials.push({ kind: "globe", href: card.links.site });
  if (card.links?.x) socials.push({ kind: "x", href: card.links.x });
  if (card.links?.telegram)
    socials.push({ kind: "telegram", href: card.links.telegram });

  const bio = card.bio
    ? `${card.displayName}. ${card.bio}`
    : `${card.displayName}.`;

  return (
    <>
      <SiteHeader active="" />
      <main className="card-page">
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
        />
        <p className="chain-note">
          Read live from Solana devnet.{" "}
          <a
            href={`https://explorer.solana.com/address/${inscription}?cluster=devnet`}
          >
            inscription
          </a>{" "}
          ·{" "}
          <a href={`https://explorer.solana.com/address/${mint}?cluster=devnet`}>
            mint
          </a>
        </p>
      </main>
      <MarqueeBar />
    </>
  );
}
