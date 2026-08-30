"use client";

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
  PixelApe,
} from "./icons";
import type { CSSProperties } from "react";
import { useRef, useCallback } from "react";
import { themeVars, getTheme, isPremium } from "../../lib/themes";
import type { CardColors } from "../../lib/card";

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
  demoAvatar = false,
  theme,
  bgSrc,
  colors,
}: {
  handle: string;
  bio: string;
  avatarSrc?: string;
  socials: BizSocial[];
  address: string;
  wallets?: string[];
  demoAvatar?: boolean;
  theme?: string;
  bgSrc?: string;
  colors?: CardColors;
}) {
  // lime-highlight first word of bio
  const bioWords = bio.trim().split(/\s+/);
  const first = bioWords.shift() ?? "";
  const rest = bioWords.join(" ");

  const shortAddr =
    address.length > 12
      ? `${address.slice(0, 4)}...${address.slice(-4)}`
      : address;

  const premium = isPremium(theme);
  const tiltRef = useRef<HTMLDivElement>(null);

  const onTiltMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el) return;
    if (typeof window !== "undefined") {
      if (!window.matchMedia("(pointer: fine)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    }
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    const max = 3.5; // degrees, keep it subtle
    el.style.transform = `perspective(1100px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
  }, []);

  const onTiltLeave = useCallback(() => {
    const el = tiltRef.current;
    if (el) el.style.transform = "";
  }, []);

  return (
    <div
      className={`card-stage${bgSrc ? " has-bg" : ""}${premium ? " premium-theme" : ""}`}
      style={themeVars(theme)}
    >
      <div
        className="card-tilt"
        ref={tiltRef}
        onMouseMove={onTiltMove}
        onMouseLeave={onTiltLeave}
      >
      <div
        className="biz-card"
        style={
          colors?.card
            ? ({ background: colors.card } as CSSProperties)
            : undefined
        }
      >
        {bgSrc && (
          <div className="card-face-bg" aria-hidden>
            <img src={bgSrc} alt="" />
            <div
              className="card-face-tint"
              style={{ background: getTheme(theme).page, opacity: 0.8 }}
            />
          </div>
        )}
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
              <span
                className="biz-handle"
                style={
                  colors?.name
                    ? ({ color: colors.name } as CSSProperties)
                    : undefined
                }
              >
                @{handle}
              </span>
              <SolanaMark className="biz-solmark" />
            </div>
            <hr className="biz-rule" />
          </div>
        </div>
        <p
          className="biz-bio"
          style={
            colors?.bio ? ({ color: colors.bio } as CSSProperties) : undefined
          }
        >
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
              <button
                type="button"
                className="wallet"
                key={w}
                title={w}
                onClick={() => {
                  if (typeof navigator !== "undefined") {
                    navigator.clipboard?.writeText(w).catch(() => {});
                  }
                }}
              >
                <span className="wallet-chain">SOL</span>
                <span className="wallet-addr">
                  {w.length > 14 ? `${w.slice(0, 5)}...${w.slice(-5)}` : w}
                </span>
                <CopyIcon />
              </button>
            ))}
          </div>
        )}
        <hr className="biz-divider" />
        <div className="biz-foot">
          <button
            type="button"
            className="biz-addr"
            title={address}
            onClick={() => {
              if (typeof navigator !== "undefined") {
                navigator.clipboard?.writeText(address).catch(() => {});
              }
            }}
          >
            CHAINCARD:{shortAddr.toUpperCase()} <CopyIcon />
          </button>
          <span className="biz-minted">Minted on Solana</span>
        </div>
        <div className="biz-dots" />
      </div>
      </div>
    </div>
  );
}
