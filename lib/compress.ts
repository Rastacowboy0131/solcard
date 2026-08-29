// Canvas-based avatar compression: downscale + webp, binary-search quality
// until the result fits under maxBytes.

export async function compressAvatar(
  file: File,
  maxBytes: number
): Promise<{ bytes: Uint8Array; mime: string }> {
  const img = await loadImage(file);
  // Cards are small; 256px square is plenty.
  for (const size of [256, 192, 128, 96, 64]) {
    const canvas = drawSquare(img, size);
    const blob = await bestQualityUnder(canvas, maxBytes);
    if (blob) {
      const buf = new Uint8Array(await blob.arrayBuffer());
      return { bytes: buf, mime: blob.type };
    }
  }
  throw new Error("could not compress avatar under size cap");
}

// Background image compression: keep aspect ratio, step widths down and
// binary-search webp quality until under maxBytes.
export async function compressBg(
  file: File,
  maxBytes: number
): Promise<{ bytes: Uint8Array; mime: string }> {
  const img = await loadImage(file);
  for (const width of [800, 640, 480, 360, 280, 200]) {
    const canvas = drawScaled(img, width);
    const blob = await bestQualityUnder(canvas, maxBytes);
    if (blob) {
      const buf = new Uint8Array(await blob.arrayBuffer());
      return { bytes: buf, mime: blob.type };
    }
  }
  throw new Error("could not compress background under size cap");
}

function drawScaled(img: HTMLImageElement, width: number): HTMLCanvasElement {
  const w = Math.min(width, img.width);
  const h = Math.max(1, Math.round((img.height / img.width) * w));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("invalid image"));
    };
    img.src = url;
  });
}

function drawSquare(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  return canvas;
}

async function bestQualityUnder(
  canvas: HTMLCanvasElement,
  maxBytes: number
): Promise<Blob | null> {
  let lo = 0.2;
  let hi = 0.92;
  let best: Blob | null = null;
  for (let i = 0; i < 7; i++) {
    const q = (lo + hi) / 2;
    const blob = await toBlob(canvas, "image/webp", q);
    if (!blob) return null;
    if (blob.size <= maxBytes) {
      best = blob;
      lo = q;
    } else {
      hi = q;
    }
  }
  return best;
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
