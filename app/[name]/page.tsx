import { notFound } from "next/navigation";
import { lookupName } from "../../lib/names";
import { fetchCardByMint } from "../../lib/chain";

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

  return (
    <main>
      <div className="card-view">
        {avatarBase64 && (
          <img
            className="avatar"
            src={`data:image/webp;base64,${avatarBase64}`}
            alt={card.displayName}
          />
        )}
        <h1>{card.displayName}</h1>
        <p className="handle">@{card.name}</p>
        {card.bio && <p className="bio">{card.bio}</p>}
        <div className="links">
          {card.links?.x && <a href={card.links.x}>X / Twitter</a>}
          {card.links?.telegram && <a href={card.links.telegram}>Telegram</a>}
          {card.links?.site && <a href={card.links.site}>Website</a>}
          {card.links?.wallets?.map((w) => (
            <span className="wallet" key={w}>
              {w}
            </span>
          ))}
        </div>
      </div>
      <p className="muted chain-note">
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
  );
}
