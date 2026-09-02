import { ImageResponse } from "next/og";
import { lookupName } from "../../lib/names";
import { fetchCardByMint } from "../../lib/chain";
import { getTheme } from "../../lib/themes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "Chaincard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: { name: string };
}) {
  const name = params.name.toLowerCase();

  let state: "card" | "claimed" | "unknown" = "unknown";
  let displayName = "chaincard";
  let bio = "";
  let themeId: string | undefined;

  try {
    const entry = await lookupName(name);
    if (entry) {
      state = "claimed";
      displayName = name;
      if (entry.mint !== "11111111111111111111111111111111") {
        const data = await fetchCardByMint(entry.mint);
        if (data) {
          state = "card";
          displayName = data.card.displayName || name;
          bio = data.card.bio || "";
          themeId = data.card.theme;
        }
      }
    }
  } catch {
    // render fallback rather than throwing
  }

  const t = getTheme(themeId);
  const isCard = state === "card";
  const page = isCard ? t.page : "#f4f0e5";
  const cardBg = isCard ? t.card : "#f8f4e9";
  const ink = isCard ? t.ink : "#050505";
  const accent = isCard ? t.accent : "#b7f72a";
  const accent2 = isCard ? t.accent2 : "#7c57e8";
  const accent2Text = isCard ? t.accent2Text : "#f8f4e9";

  const subtitle =
    state === "card"
      ? bio.length > 90
        ? bio.slice(0, 87) + "..."
        : bio
      : state === "claimed"
      ? "Claimed on-chain. Card not published yet."
      : "On-chain business cards on Solana, inscribed forever.";

  const bigName =
    state === "unknown" ? "CHAINCARD" : displayName.toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: page,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 1040,
            height: 480,
            background: cardBg,
            border: `8px solid ${ink}`,
            boxShadow: `18px 18px 0 ${ink}`,
            padding: "56px 64px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                background: accent2,
                color: accent2Text,
                fontSize: 30,
                fontWeight: 700,
                padding: "10px 22px",
                border: `4px solid ${ink}`,
                boxShadow: `6px 6px 0 ${ink}`,
              }}
            >
              chaincard/{name}
            </div>
            {state !== "unknown" && (
              <div
                style={{
                  display: "flex",
                  background: accent,
                  color: ink,
                  fontSize: 26,
                  fontWeight: 700,
                  padding: "10px 20px",
                  border: `4px solid ${ink}`,
                  boxShadow: `6px 6px 0 ${ink}`,
                }}
              >
                ON-CHAIN
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 48,
              fontSize: bigName.length > 14 ? 84 : 112,
              fontWeight: 900,
              color: ink,
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {bigName}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 32,
              fontSize: 32,
              fontWeight: 700,
              color: ink,
              opacity: 0.85,
              maxWidth: 900,
            }}
          >
            {subtitle}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 40,
              right: 56,
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: ink,
            }}
          >
            chaincard.fun
          </div>
        </div>
      </div>
    ),
    size
  );
}
