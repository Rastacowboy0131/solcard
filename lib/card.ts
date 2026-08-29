// Shared card schema + size limits, used client-side and server-side.

export const MAX_AVATAR_BYTES = 35_000; // inscribed webp avatar cap
export const MAX_BG_BYTES = 15_000; // inscribed webp background image cap
export const MAX_JSON_BYTES = 12_000; // inscribed card json cap
export const MAX_TOTAL_BYTES = 50_000; // whole payload target
// Animated GIF backgrounds skip recompression (recompression kills animation),
// so they get their own byte cap. On-chain inscription writes 800-byte chunks,
// one tx each: 100kb is already ~125 txs, anything bigger is not sane to mint.
export const MAX_GIF_BG_BYTES = 100_000;
export const MAX_TOTAL_BYTES_GIF =
  MAX_TOTAL_BYTES - MAX_BG_BYTES + MAX_GIF_BG_BYTES;

import { THEME_IDS } from "./themes";

export const NAME_RE = /^[a-z0-9][a-z0-9-_]{1,31}$/;

export type CardLinks = {
  x?: string;
  telegram?: string;
  site?: string;
  wallets?: string[]; // extra addresses to display
};

export type CardColors = {
  /** handle / name text color */
  name?: string;
  /** bio / body text color */
  bio?: string;
};

export type SolCard = {
  v: 1;
  name: string; // handle, lowercase
  displayName: string;
  bio: string;
  links: CardLinks;
  theme?: string; // optional card color theme id, see lib/themes.ts
  colors?: CardColors; // optional text color overrides (hex)
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function validateCard(card: SolCard): string | null {
  if (card.v !== 1) return "unsupported version";
  if (!NAME_RE.test(card.name)) return "name must be 2-32 chars, a-z 0-9 - _";
  if (!card.displayName || card.displayName.length > 64)
    return "display name required, max 64 chars";
  if (card.bio.length > 500) return "bio max 500 chars";
  if (card.theme !== undefined && !THEME_IDS.includes(card.theme))
    return "unknown theme";
  if (card.colors !== undefined) {
    for (const [k, v] of Object.entries(card.colors)) {
      if (v !== undefined && !HEX_RE.test(v))
        return `${k} color must be a #rrggbb hex value`;
    }
  }
  const { x, telegram, site, wallets } = card.links ?? {};
  for (const [k, v] of Object.entries({ x, telegram, site })) {
    if (v && v.length > 200) return `${k} link too long`;
  }
  if (wallets && (wallets.length > 5 || wallets.some((w) => w.length > 50)))
    return "max 5 wallets, 50 chars each";
  const bytes = new TextEncoder().encode(JSON.stringify(card)).length;
  if (bytes > MAX_JSON_BYTES) return "card json too large";
  return null;
}
