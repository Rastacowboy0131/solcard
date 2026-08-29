"use client";

import { useState } from "react";
import { toPng } from "html-to-image";

export function DownloadCard({ handle }: { handle: string }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    const node = document.querySelector<HTMLElement>(".card-stage");
    if (!node || busy) return;
    setBusy(true);
    try {
      // measure the true bounds including absolutely positioned stickers
      // that overflow the stage box, then pad so nothing clips
      const pad = 100;
      const base = node.getBoundingClientRect();
      let top = base.top, left = base.left, right = base.right, bottom = base.bottom;
      node.querySelectorAll("*").forEach((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        top = Math.min(top, r.top);
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
      });
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#f4efe6",
        width: Math.ceil(right - left) + pad * 2,
        height: Math.ceil(bottom - top) + pad * 2,
        style: {
          transform: `translate(${pad + (base.left - left)}px, ${pad + (base.top - top)}px)`,
          margin: "0",
        },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `solcard-${handle}.png`;
      a.click();
    } catch (e) {
      console.error("card download failed", e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="brut-btn btn-download" onClick={download} disabled={busy}>
      {busy ? "Rendering..." : "Download Card"}
    </button>
  );
}
