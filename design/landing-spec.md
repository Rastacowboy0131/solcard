# SolCard landing, chosen mockup spec (Rasta pick, 2026-08-27)

Mockup image: design/landing-mockup-chosen.png (brutalist paper/neo-brutalism style)
Style: off-white paper texture, black ink, purple + lime accents, hard offset shadows, condensed block type. Rendered as a fake browser-chrome frame (solcard.xyz address bar) but the real site should implement the inner page, keep the aesthetic.

## Palette
- Paper background: #F4F0E5 / #F7F3E8 (with subtle speckle/noise texture overlay, multiply blend)
- Black ink: #050505
- Purple accent: #7C57E8 / #7E58E8
- Lime accent: #B7F72A / #B9F72C
- Off-white card fill: #F8F4E9
- Solana gradient bars in logo: #9D5BFF -> #33C3E6 -> #4FEB95

## Type
- Display/headline: ultra-heavy condensed (Anton / Archivo Black class), uppercase, tight line-height ~0.86, negative letter-spacing
- Labels/buttons/badges: heavy monospace (Roboto Mono / Space Mono bold), uppercase, letter-spacing 1.5-2px
- Wordmark "SolCard": 900 weight geometric sans, ~96px, letter-spacing -5px

## Header
- Logo: black square (~107x93) with 3 slanted Solana gradient bars + "SolCard" wordmark
- Nav: HOME (active: purple #7C57E8 rectangle bg, no border), EXPLORE, DOCS, ABOUT. Condensed 900 uppercase ~32px
- CONNECT WALLET button top right: lime fill, 5px black border, hard shadow 13px 13px 0 #050505, ~340x79

## Hero left
- Headline, 3 lines, each ends with a period:
  YOUR NAME.
  ON CHAIN.
  FOREVER.
  ~172px, line-height 0.86, letter-spacing -6px, black
- Hand-drawn tick marks (3 radiating strokes, 5px, rounded caps) left of FOREVER
- Purple badge below: "ON-CHAIN BUSINESS CARDS ON SOLANA." purple fill, 4px black border, 10px 10px hard shadow, mono 900 ~28px, ~590x51
- Mint CTA: "✦ MINT 0.15 SOL →" lime fill, 5px black border, hard shadow 20px 19px, ~714x96, mono 900 ~60px, sparkle icon left (44px + 19px small), thick right arrow (52px, 7px stroke)
- Feature row (3 items, 2px black vertical separators, 55x55 icon boxes w/ 3px border):
  - globe icon, DECENTRALIZED / No central servers.
  - lock icon, PERMANENT / Can't be deleted.
  - bolt icon, FAST / Built on Solana.
  Titles mono 900 ~21px uppercase, subs mono ~14px

## Business card component (right)
- Off-white #F8F4E9, 6px black border, hard shadow ~18px 24px, chamfered/notched top-left corner (clip-path polygon)
- Anatomy:
  - Pixel-art avatar in purple-framed square (mockup: pixel ape, purple beanie/shades)
  - Username "@degenkev" large serif/mono, Solana mark to its right
  - Horizontal rule under username
  - Bio: "GM." highlighted with lime background chip, then "degen, designer, and on-chain explorer." mono
  - Social icon buttons row: 5 square buttons, 3px black borders, hard mini-shadows, alternating purple/white fills: globe, X, Discord, Medium(dots), GitHub
  - Dashed divider near bottom
  - Address line: "SOLCARD:7XK3...Q9ZF" with copy icon, dotted pattern bottom-left
  - Right-aligned label: "MINTED ON SOLANA" in purple mono small caps
- Sticker top-right overlapping card: "CAN'T BE DELETED" purple rotated (~-8deg) rectangle, black border, hard shadow, with hand-drawn tick accents
- Bottom-right: lime oval badge "100% ON-CHAIN" rotated (~-12deg), black border, black hand-drawn underline

## Bottom marquee bar
- Full-width purple #7C57E8 bar, black top border, height ~70px
- Contents: "TRUE OWNERSHIP" in black chip w/ white text, then "BUILT FOR THE CULTURE", "OWN YOUR IDENTITY" black uppercase, vertical bar separators, globe icon, 3 small squares (black, lime, white) far right

## Build notes
- Follow TOOLS.md mockup rules: this spec is step 1; build section by section; screenshot + vision-compare before shipping
- Static layout: consider mockup-as-scene technique for the marketing hero, but card pages and builder need real HTML (dynamic data), so implement the design system in CSS for those
