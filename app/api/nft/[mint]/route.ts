import { NextRequest, NextResponse } from "next/server";
import { fetchCardByMint } from "../../../../lib/chain";

// Wallet-facing NFT metadata. createV1's uri points here so the card NFT
// shows up in Phantom/exchanges with a real name, image and link instead
// of a blank collectible.

export const dynamic = "force-dynamic";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://chaincard.fun";

let cache = new Map<string, { at: number; body: unknown }>();
const TTL_MS = 5 * 60_000;

export async function GET(
  _req: NextRequest,
  { params }: { params: { mint: string } }
) {
  const mint = params.mint;
  const hit = cache.get(mint);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json(hit.body);
  }
  try {
    const data = await fetchCardByMint(mint);
    if (!data) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    const { card } = data;
    const body = {
      name: `Chaincard: ${card.name}`,
      symbol: "CARD",
      description:
        (card.bio ? `${card.bio}\n\n` : "") +
        `@${card.name} on Chaincard, a fully on-chain business card inscribed on Solana.`,
      image: `${SITE}/api/nft/${mint}/image`,
      external_url: `${SITE}/${card.name}`,
      attributes: [
        { trait_type: "Name", value: card.name },
        ...(card.displayName
          ? [{ trait_type: "Display Name", value: card.displayName }]
          : []),
      ],
      properties: {
        category: "image",
        files: [
          { uri: `${SITE}/api/nft/${mint}/image`, type: "image/png" },
        ],
      },
    };
    cache.set(mint, { at: Date.now(), body });
    return NextResponse.json(body);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "failed" },
      { status: 502 }
    );
  }
}
