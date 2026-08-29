import {
  GlobeIcon,
  XIcon,
  DiscordIcon,
  DotsIcon,
  MediumIcon,
  GitHubIcon,
  CopyIcon,
  TelegramIcon,
  SolanaMark,
  TickMarks,
  PixelApe,
} from "./icons";
import { themeVars } from "../../lib/themes";

export type BizSocial = {
  kind: "globe" | "x" | "discord" | "dots" | "medium" | "github" | "telegram";
  href?: string;
};

const SOCIAL_ICONS: Record<BizSocial["kind"], (s: number) => JSX.Element> = {
  globe: (s) => <GlobeIcon size={s} />,
  x: (s) => <XIcon size={s} />,
  discord: (s) => <DiscordIcon size={s} />,
  dots: (s) => <DotsIcon size={s} />,
  medium: (s) => <MediumIcon size={s} />,
  github: (s) => <GitHubIcon size={s} />,
  telegram: (s) => <TelegramIcon size={s} />,
};

export function BusinessCard({
  handle,
  bio,
  avatarSrc,
  socials,
  address,
  wallets,
  stickers = true,
  demoAvatar = false,
  theme,
}: {
  handle: string;
  bio: string;
  avatarSrc?: string;
  socials: BizSocial[];
  address: string;
  wallets?: string[];
  stickers?: boolean;
  demoAvatar?: boolean;
  theme?: string;
}) {
  // lime-highlight first word of bio
  const bioWords = bio.trim().split(/\s+/);
  const first = bioWords.shift() ?? "";
  const rest = bioWords.join(" ");

  const shortAddr =
    address.length > 12
      ? `${address.slice(0, 4)}...${address.slice(-4)}`
      : address;

  return (
    <div className="card-stage" style={themeVars(theme)}>
      <div className="biz-card">
        <div className="biz-top">
          <div className="biz-avatar">
            {avatarSrc ? (
              <img src={avatarSrc} alt={handle} />
            ) : demoAvatar ? (
              <PixelApe />
            ) : (
              <SolanaMark />
            )}
          </div>
          <div className="biz-id">
            <div className="biz-handle-row">
              <span className="biz-handle">@{handle}</span>
              <SolanaMark className="biz-solmark" />
            </div>
            <hr className="biz-rule" />
          </div>
        </div>
        <p className="biz-bio">
          <span className="hl">{first}</span> {rest}
        </p>
        <div className="biz-socials">
          {socials.map((s, i) => {
            const cls = `biz-social${i % 2 === 0 ? " purple" : ""}`;
            const icon = SOCIAL_ICONS[s.kind](20);
            return s.href ? (
              <a key={i} className={cls} href={s.href} target="_blank" rel="noreferrer">
                {icon}
              </a>
            ) : (
              <span key={i} className={cls}>{icon}</span>
            );
          })}
        </div>
        {wallets && wallets.length > 0 && (
          <div className="biz-wallets">
            {wallets.map((w) => (
              <span className="wallet" key={w}>{w}</span>
            ))}
          </div>
        )}
        <hr className="biz-divider" />
        <div className="biz-foot">
          <span className="biz-addr">
            SOLCARD:{shortAddr.toUpperCase()} <CopyIcon />
          </span>
          <span className="biz-minted">Minted on Solana</span>
        </div>
        <div className="biz-dots" />
      </div>
      {stickers && (
        <>
          <div className="sticker-deleted">
            Can&apos;t be deleted
            <div className="sticker-ticks"><TickMarks /></div>
          </div>
          <div className="sticker-onchain">100% On-Chain</div>
        </>
      )}
    </div>
  );
}
