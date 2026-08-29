// Shared card schema + size limits, used client-side and server-side.

export const MAX_AVATAR_BYTES = 35_000; // inscribed webp avatar cap
export const MAX_JSON_BYTES = 12_000; // inscribed card json cap
export const MAX_TOTAL_BYTES = 50_000; // whole payload target

import { THEME_IDS } from "./themes";

export const NAME_RE = /^[a-z0-9][a-z0-9-_]{1,31}$/;

export type CardLinks = {
  x?: string;
  telegram?: string;
  site?: string;
  wallets?: string[]; // extra addresses to display
};

export type SolCard = {
  v: 1;
  name: string; // handle, lowercase
  displayName: string;
  bio: string;
  links: CardLinks;
  theme?: string; // optional card color theme id, see lib/themes.ts
};

export function validateCard(card: SolCard): string | null {
  if (card.v !== 1) return "unsupported version";
  if (!NAME_RE.test(card.name)) return "name must be 2-32 chars, a-z 0-9 - _";
  if (!card.displayName || card.displayName.length > 64)
    return "display name required, max 64 chars";
  if (card.bio.length > 500) return "bio max 500 chars";
  if (card.theme !== undefined && !THEME_IDS.includes(card.theme))
    return "unknown theme";
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
