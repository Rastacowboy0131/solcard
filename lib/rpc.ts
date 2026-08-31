// Shared RPC retry helpers. The public devnet RPC rate limits aggressively
// (429 "connection rate limits exceeded"), so every RPC call in the app
// goes through withRetry429: exponential backoff + jitter, ~1s 2s 4s 8s cap.

export const MAX_RETRIES = 5;

export type RetryProgress = (msg: string) => void;

function errMsg(e: any): string {
  return e?.message || String(e);
}

export function is429(e: any): boolean {
  const m = errMsg(e).toLowerCase();
  return (
    m.includes("429") ||
    m.includes("rate limit") ||
    m.includes("rate limits exceeded") ||
    m.includes("too many requests")
  );
}

/** Retry fn on 429 with exponential backoff + jitter. */
export async function withRetry429<T>(
  fn: () => Promise<T>,
  onProgress?: RetryProgress
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (e: any) {
      if (!is429(e)) throw e;
      lastErr = e;
      if (i === MAX_RETRIES - 1) break;
      const backoff = Math.min(1000 * 2 ** i, 8000);
      const wait = backoff + Math.floor(Math.random() * 400);
      onProgress?.(
        "Devnet RPC is rate limiting, retrying in " +
          Math.round(wait / 1000) +
          "s..."
      );
      await sleep(wait);
    }
  }
  throw lastErr;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Turn raw RPC errors (especially final 429s) into a human message. */
export function friendlyRpcError(e: any, label: string): string {
  if (is429(e)) {
    return (
      `${label} failed: the RPC kept rate limiting us even after ` +
      "several retries. Wait a minute and try again."
    );
  }
  return e?.message || `${label} failed`;
}
