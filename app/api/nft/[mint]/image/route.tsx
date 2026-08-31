import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { fetchCardByMint } from "../../../../../lib/chain";

// Card image for the NFT metadata: a simple rendered business card so the
// collectible looks like the actual chaincard in wallets.
// Inscribed images are webp, which satori (the OG renderer) cannot decode,
// so they are transcoded to png data-URIs first.

export const dynamic = "force-dynamic";

async function toPngDataUri(b64: string): Promise<string | null> {
  try {
    const png = await sharp(Buffer.from(b64, "base64")).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { mint: string } }
) {
  const data = await fetchCardByMint(params.mint);
  if (!data) {
    return new Response("not found", { status: 404 });
  }
  const { card, avatarBase64, bgBase64 } = data;
  const avatar = avatarBase64 ? await toPngDataUri(avatarBase64) : null;
  const bg = bgBase64 ? await toPngDataUri(bgBase64) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0d10",
          position: "relative",
        }}
      >
        {bg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg}
            alt=""
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.55,
            }}
          />
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            backgroundColor: "rgba(13,13,16,0.82)",
            border: "3px solid #39ff88",
            borderRadius: 18,
            padding: "44px 54px",
            maxWidth: 900,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
            {avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                width={160}
                height={160}
                style={{
                  borderRadius: 16,
                  border: "3px solid #39ff88",
                  objectFit: "cover",
                }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 64,
                  color: "#39ff88",
                  fontWeight: 700,
                }}
              >
                @{card.name}
              </div>
              {card.displayName && (
                <div style={{ display: "flex", fontSize: 36, color: "#ffffff" }}>
                  {card.displayName}
                </div>
              )}
            </div>
          </div>
          {card.bio && (
            <div
              style={{
                display: "flex",
                fontSize: 28,
                color: "#c9c9d4",
                marginTop: 28,
                maxWidth: 780,
              }}
            >
              {card.bio.slice(0, 140)}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#39ff88",
              marginTop: 30,
              letterSpacing: 2,
            }}
          >
            CHAINCARD.FUN · MINTED ON SOLANA
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
