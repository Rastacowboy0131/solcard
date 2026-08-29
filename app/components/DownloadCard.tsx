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
      // render at 2x with breathing room so the rotated stickers
      // that overflow the card stage aren't clipped
      const pad = 90;
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#f4efe6",
        width: node.offsetWidth + pad * 2,
        height: node.offsetHeight + pad * 2,
        style: { transform: `translate(${pad}px, ${pad}px)`, margin: "0" },
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
