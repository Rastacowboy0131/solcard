import { NextResponse } from "next/server";
import { fetchListings, getConnection } from "../../../lib/registry";

// All currently listed names, decoded server-side so clients get one small
// json payload instead of doing getProgramAccounts + history walks in the
// browser. Cached briefly to keep RPC usage sane.

export const dynamic = "force-dynamic";

let cache: { at: number; body: unknown } | null = null;
const TTL_MS = 15_000;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.body);
  }
  try {
    const listings = await fetchListings(getConnection());
    const body = { listings };
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "failed to fetch listings" },
      { status: 502 }
    );
  }
}
