import type { CSSProperties } from "react";

// Card color themes. Brutalist palettes, hard contrast.
// The card CSS consumes these via CSS variables scoped to .card-stage
// (and the surrounding page), so one component serves all themes.

export type CardTheme = {
  id: string;
  label: string;
  /** page / stage background behind the card */
  page: string;
  /** card face background */
  card: string;
  /** ink: text, borders, shadows */
  ink: string;
  /** primary accent (lime role: highlight, on-chain sticker, buttons) */
  accent: string;
  /** secondary accent (purple role: avatar bg, socials, deleted sticker) */
  accent2: string;
  /** icon/text color used on top of accent2 */
  accent2Text: string;
  /** "Minted on Solana" label color, must read on the card bg */
  minted: string;
  /** sticker outline ring */
  stickerOutline: string;
};

export const THEMES: Record<string, CardTheme> = {
  paper: {
    id: "paper",
    label: "Paper",
    page: "#f4f0e5",
    card: "#f8f4e9",
    ink: "#050505",
    accent: "#b7f72a",
    accent2: "#7c57e8",
    accent2Text: "#f8f4e9",
    minted: "#7c57e8",
    stickerOutline: "#ffffff",
  },
  midnight: {
    id: "midnight",
    label: "Midnight",
    page: "#0b0b12",
    card: "#15151f",
    ink: "#f2f2f8",
    accent: "#b7f72a",
    accent2: "#2b2b3d",
    accent2Text: "#f2f2f8",
    minted: "#b7f72a",
    stickerOutline: "#050508",
  },
  grape: {
    id: "grape",
    label: "Grape",
    page: "#2a1548",
    card: "#7c57e8",
    ink: "#0d0518",
    accent: "#b7f72a",
    accent2: "#e9dfff",
    accent2Text: "#2a1548",
    minted: "#1b0e30",
    stickerOutline: "#1b0e30",
  },
  acid: {
    id: "acid",
    label: "Acid",
    page: "#9be411",
    card: "#c8fb4b",
    ink: "#0a0f02",
    accent: "#f8f4e9",
    accent2: "#7c57e8",
    accent2Text: "#f8f4e9",
    minted: "#7c57e8",
    stickerOutline: "#0a0f02",
  },
  blood: {
    id: "blood",
    label: "Blood",
    page: "#120404",
    card: "#1d0808",
    ink: "#f3e6e0",
    accent: "#ff3131",
    accent2: "#3a0e0e",
    accent2Text: "#f3e6e0",
    minted: "#ff3131",
    stickerOutline: "#000000",
  },
};

export const DEFAULT_THEME_ID = "paper";
export const THEME_IDS = Object.keys(THEMES);

export function getTheme(id?: string): CardTheme {
  return THEMES[id ?? ""] ?? THEMES[DEFAULT_THEME_ID];
}

/** CSS variable overrides for a theme, spread onto the card stage or page. */
export function themeVars(id?: string): CSSProperties {
  const t = getTheme(id);
  return {
    "--paper": t.page,
    "--paper2": t.card,
    "--ink": t.ink,
    "--lime": t.accent,
    "--purple": t.accent2,
    "--accent2-text": t.accent2Text,
    "--minted": t.minted,
    "--sticker-outline": t.stickerOutline,
  } as CSSProperties;
}
