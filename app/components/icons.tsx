export function GlobeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3.5 9h17M3.5 15h17" />
    </svg>
  );
}

export function LockIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <rect x="5" y="10.5" width="14" height="9.5" fill="currentColor" stroke="none" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  );
}

export function BoltIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2z" />
    </svg>
  );
}

export function SparkleIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1c.7 5.5 3 9.3 11 11-8 1.7-10.3 5.5-11 11-.7-5.5-3-9.3-11-11 8-1.7 10.3-5.5 11-11z" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square">
      <path d="M3 12h17M13 4.5 20.5 12 13 19.5" />
    </svg>
  );
}

export function XIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.2l7.3-8.3L1 2h6.5l4.4 5.9L18.9 2zm-1.1 18h1.7L7.6 3.9H5.7L17.8 20z" />
    </svg>
  );
}

export function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.2a18 18 0 0 0-5.5 0L8.7 3a19.8 19.8 0 0 0-5 1.4C.9 9.1.2 13.6.6 18a20 20 0 0 0 6 3l1.3-2.1c-.7-.3-1.4-.6-2-1l.5-.4a14.3 14.3 0 0 0 12.2 0l.5.4c-.7.4-1.4.7-2.1 1L18.3 21a20 20 0 0 0 6-3c.5-5.2-.7-9.6-4-13.6zM8.7 15.3c-1.2 0-2.1-1-2.1-2.3s.9-2.3 2.1-2.3 2.2 1 2.1 2.3c0 1.2-.9 2.3-2.1 2.3zm7.5 0c-1.2 0-2.1-1-2.1-2.3s.9-2.3 2.1-2.3 2.2 1 2.1 2.3c0 1.2-.9 2.3-2.1 2.3z" />
    </svg>
  );
}

export function DotsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2.4" />
      <circle cx="12" cy="12" r="2.4" />
      <circle cx="19" cy="12" r="2.4" />
    </svg>
  );
}

export function MediumIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8.5" cy="12" r="6" />
      <ellipse cx="19" cy="12" rx="3" ry="5.6" />
    </svg>
  );
}

export function GitHubIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1.5A10.5 10.5 0 0 0 8.7 22c.5.1.7-.2.7-.5v-1.9c-3 .7-3.6-1.3-3.6-1.3-.5-1.2-1.2-1.6-1.2-1.6-1-.7 0-.7 0-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.4-.3-4.9-1.2-4.9-5.3 0-1.2.4-2.1 1.1-2.9-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.1a10.4 10.4 0 0 1 5.4 0c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.7 1.1 2.9 0 4.1-2.5 5-4.9 5.3.4.3.7 1 .7 2v3c0 .3.2.6.7.5A10.5 10.5 0 0 0 12 1.5z" />
    </svg>
  );
}

export function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <rect x="8" y="8" width="13" height="13" />
      <path d="M4 16V3h13" />
    </svg>
  );
}

export function TelegramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.9 3.4 2.5 11c-1.1.4-1 1.3-.2 1.6l4.9 1.5 1.9 5.8c.2.7.4.9 1 .9.5 0 .7-.2 1.1-.6l2.6-2.5 4.9 3.6c.9.5 1.5.2 1.8-.8l3.2-15.2c.3-1.3-.4-1.8-1.8-1.9zM8.2 13.8l10.5-6.6c.5-.3 1-.2.6.2l-8.9 8-.4 3.7-1.8-5.3z" />
    </svg>
  );
}

export function SolanaMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 20" width="22" height="18">
      <defs>
        <linearGradient id="solg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9D5BFF" />
          <stop offset="0.5" stopColor="#33C3E6" />
          <stop offset="1" stopColor="#4FEB95" />
        </linearGradient>
      </defs>
      <path fill="url(#solg)" d="M4 0h20l-4 4.5H0L4 0zM0 7.7h20L24 12H4L0 7.7zM4 15.5h20L20 20H0l4-4.5z" />
    </svg>
  );
}

export function PixelApe() {
  // simple pixel-art avatar: ape with purple beanie and shades
  const px = 8; // 12x12 grid at 8px cells = 96
  const grid = [
    "............",
    "..PPPPPPPP..",
    ".PPPPPPPPPP.",
    ".PPPPPPPPPP.",
    "..BBBBBBBB..",
    ".BBKKBBKKBB.",
    ".BBKKBBKKBB.",
    "..BBBBBBBB..",
    "..BTTTTTTB..",
    "..BBTTTTBB..",
    "...BBBBBB...",
    "............",
  ];
  const colors: Record<string, string> = {
    P: "#7C57E8",
    B: "#6b4a2f",
    K: "#050505",
    T: "#c89b6c",
  };
  return (
    <svg width="100%" height="100%" viewBox="0 0 96 96" style={{ display: "block" }}>
      <rect width="96" height="96" fill="#B7F72A" />
      {grid.flatMap((row, y) =>
        row.split("").map((c, x) =>
          colors[c] ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={colors[c]} />
          ) : null
        )
      )}
    </svg>
  );
}

export function TickMarks({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" width="100%" height="100%" fill="none" stroke="#050505" strokeWidth="4" strokeLinecap="round">
      <path d="M6 34 L14 24" />
      <path d="M14 36 L20 24" />
      <path d="M22 37 L25 25" />
    </svg>
  );
}
