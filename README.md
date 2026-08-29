# Chaincard

On-chain business cards on Solana. Card data (json) and avatar (webp) are inscribed directly on-chain via Metaplex Inscriptions, attached to an NFT you own. No IPFS, no arweave, no offchain metadata: the card lives in Solana account data.

Devnet v1. No custom program: uses mpl-token-metadata for the NFT and mpl-inscription for the data.

## How it works

1. You fill out the card form (handle, display name, bio, links, pfp).
2. The pfp is compressed client-side (canvas downscale + webp, binary-searched quality) to fit under 35kb; whole payload capped at 50kb.
3. Mint flow (all from your connected wallet, devnet):
   - createV1 + mintV1: mints the NFT.
   - initializeFromMint: creates the mint inscription account, plus a 0.15 SOL fee transfer to FEE_WALLET in the same tx.
   - initializeAssociatedInscription("avatar"): account for the image bytes.
   - allocate + writeData chunks (800 bytes/tx) for both json and avatar.
4. The card page fetches the inscription accounts straight from the RPC, parses the json, and renders the avatar from the inscribed bytes.
5. Name -> mint mapping is a local JSON index (`data/names.json`) populated at mint time through `/api/names`. v2 moves this on-chain (PDA registry keyed by name hash, or SNS integration).

## Run

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_FEE_WALLET to a real devnet address
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000, connect Phantom or Solflare set to **devnet**, get devnet SOL (`solana airdrop 2 <addr> -u devnet` or faucet.solana.com). Mint costs the 0.15 SOL fee plus inscription rent (roughly 0.3-0.5 SOL for a full-size card, rent scales with bytes).

Cards render at `/<handle>`.

## Env

- `NEXT_PUBLIC_RPC_URL`: devnet RPC (default public devnet; use a Helius/Triton devnet endpoint for reliability, the write flow sends many txs).
- `NEXT_PUBLIC_FEE_WALLET`: where the mint fee goes. Placeholder in .env.example, set your own.
- `NEXT_PUBLIC_FEE_SOL`: fee amount, default 0.15.

## Size caps

Enforced client-side (compression + validation before mint) and server-side (`/api/names` validates name/mint formats; card json is validated by shared `lib/card.ts` schema). Note the inscription itself is written by the user's wallet, so on-chain size is naturally bounded by what the user pays rent for; the caps are UX guardrails.

## Known limitations / TODOs

- **Name mapping is off-chain (v1).** `data/names.json` is server-local: it does not survive redeploys on ephemeral hosts and is trust-me. v2: on-chain name registry (PDA per name, owner-gated) or SNS subdomains.
- **Name registration is not atomic with mint.** If the API call fails after mint, the card exists but has no name. Add a reclaim flow.
- **Premium names**: reserved/short handles with higher fee tiers.
- **Edit / re-inscribe flow**: mpl-inscription supports clearData + writeData, wire an owner-gated edit page.
- **OG images**: generate a social preview image per card (vercel/og or satori) from on-chain data.
- **Many sequential txs**: write chunks are sent one-by-one; batch multiple writeData ixs per tx and parallelize confirmation to cut mint time.
- **Devnet only.** Mainnet needs: fee wallet finalized, a **tested owner exit path for collected fees confirmed before launch**, RPC provider, and the on-chain name registry.

## Not tested

Wallet transaction flow needs a real browser wallet; build passes and reads compile, but the end-to-end mint has not been executed here.
