import type { Metadata } from "next";
import { SiteHeader } from "../components/SiteHeader";
import { MarqueeBar } from "../components/MarqueeBar";

export const metadata: Metadata = {
  title: "Docs | Chaincard",
  description:
    "How Chaincard works: on-chain business cards on Solana. Minting, verification, marketplace, customization.",
};

const PROGRAM_ID =
  process.env.NEXT_PUBLIC_REGISTRY_PROGRAM_ID ||
  "4SpRPoj6MV6o2g6yYBuJwdE8kvxZ83gxEoLfwDYAnNsw";

export default function DocsPage() {
  return (
    <>
      <SiteHeader active="docs" />
      <main className="docs-page">
        <section className="wrap">
          <h1 className="section-title">Docs</h1>
          <p className="section-sub">
            Everything you need to know about Chaincard, no whitepaper required.
          </p>

          <div className="panel docs-panel" id="what">
            <h2 className="docs-h2">What is Chaincard?</h2>
            <p>
              Chaincard is an on-chain business card on Solana. You claim a
              name, design a card (avatar, bio, links, colors, background), and
              the whole thing gets inscribed directly on chain. Not a link to a
              server. Not IPFS. The actual bytes live on Solana, forever.
            </p>
            <p>
              If this website disappeared tomorrow, your card would still exist
              and anyone could read it straight from the chain.
            </p>
          </div>

          <div className="panel docs-panel" id="minting">
            <h2 className="docs-h2">How minting works</h2>
            <ol className="docs-list">
              <li>
                <strong>Claim a name.</strong> Names are registered in an
                on-chain registry program. One wallet per name, first come
                first served. The claim fee is <strong>0.15 SOL</strong>.
              </li>
              <li>
                <strong>Build your card.</strong> Pick a theme, set your
                display name, bio, and links, tweak colors, upload a background.
              </li>
              <li>
                <strong>Inscribe it.</strong> Your card data is written to the
                chain in chunks. Bigger cards (like GIF backgrounds) take a few
                more transactions, but it all ends up on chain.
              </li>
            </ol>
            <p>
              Once inscribed, the card is permanent. There is no delete button,
              because there is no server to delete it from.
            </p>
          </div>

          <div className="panel docs-panel" id="verify">
            <h2 className="docs-h2">Verify a card without this site</h2>
            <p>
              Trust, but verify. Every name maps to a deterministic address (a
              PDA) that anyone can derive from just the name and the program
              id. In plain language: given a name like{" "}
              <code>degenkev</code>, there is exactly one spot on the chain
              where its record can live, and you can compute that spot
              yourself.
            </p>
            <p className="docs-tech">The technical bit:</p>
            <pre className="docs-code">{`PDA = findProgramAddress(
  seeds = ["name", "<yourname>"],
  programId = ${PROGRAM_ID}
)`}</pre>
            <p>
              The name record stores the owner wallet and the mint of the
              inscribed card. Look up either address on{" "}
              <a
                href={`https://solscan.io/account/${PROGRAM_ID}`}
                target="_blank"
                rel="noreferrer"
              >
                solscan
              </a>{" "}
              (Solana mainnet) and you can confirm ownership and read the card
              data with zero help from us.
            </p>
          </div>

          <div className="panel docs-panel" id="marketplace">
            <h2 className="docs-h2">The marketplace</h2>
            <ul className="docs-list">
              <li>
                <strong>List:</strong> the name owner sets a price in SOL. The
                listing lives in the same on-chain record, no escrow server.
              </li>
              <li>
                <strong>Delist:</strong> the owner can pull a listing any time
                before it sells.
              </li>
              <li>
                <strong>Buy:</strong> pay the listed price and the name (and
                its card) transfers to your wallet. A{" "}
                <strong>2.5% fee</strong> comes out of the sale.
              </li>
            </ul>
            <p>
              Buys are protected against front-running: the price you confirm
              is the price you pay. If the seller changes the listing between
              your click and your transaction landing, the buy fails instead of
              charging you a different amount.
            </p>
            <p>
              <strong>Heads up:</strong> selling the card NFT on an external
              marketplace (Magic Eden, OpenSea, etc.) does <strong>not</strong>{" "}
              transfer the name. The name registry tracks its own owner, so a
              buyer there gets the card artifact while the name keeps resolving
              to you. Trade names here, through the marketplace, so the name
              and card move together.
            </p>
          </div>

          <div className="panel docs-panel" id="customization">
            <h2 className="docs-h2">Customization</h2>
            <ul className="docs-list">
              <li>
                <strong>Backgrounds:</strong> upload an image, or an animated
                GIF up to 100kb. Yes, animated, yes, on chain.
              </li>
              <li>
                <strong>Colors:</strong> set your name color, bio color, and
                card color, from the site palette or a full custom picker.
              </li>
              <li>
                <strong>Themes:</strong> pick a base theme and override
                whatever you want on top.
              </li>
            </ul>
          </div>

          <div className="panel docs-panel" id="faq">
            <h2 className="docs-h2">FAQ</h2>
            <dl className="docs-faq">
              <dt>Can cards be deleted?</dt>
              <dd>
                No. Once inscribed, the data is on chain permanently. Think
                before you mint.
              </dd>
              <dt>What happens if the site goes down?</dt>
              <dd>
                Nothing happens to your card. All data is on chain; the site is
                just a viewer. Anyone can rebuild a reader from the program id.
              </dd>
              <dt>Who owns a name?</dt>
              <dd>
                One wallet per name. The owner can transfer it by listing it on
                the marketplace, where anyone can buy it.
              </dd>
            </dl>
          </div>

          <div className="panel docs-panel" id="about">
            <h2 className="docs-h2">About</h2>
            <p>
              Chaincard exists because business cards die in drawers and
              link-in-bio pages die with their startups. A name and a card that
              live on Solana do not depend on anyone keeping a server bill
              paid.
            </p>
            <p>
              Live on Solana mainnet. Program id:{" "}
              <code className="docs-break">{PROGRAM_ID}</code>
            </p>
            <p>
              <a href="/#builder" className="brut-btn">
                Mint yours
              </a>
            </p>
          </div>
        </section>
      </main>
      <MarqueeBar />
    </>
  );
}
