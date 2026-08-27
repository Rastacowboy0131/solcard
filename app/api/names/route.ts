import { NextRequest, NextResponse } from "next/server";
import { claimName } from "../../../lib/names";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { name, mint, owner } = body ?? {};
  if (typeof name !== "string" || typeof mint !== "string" || typeof owner !== "string") {
    return NextResponse.json({ error: "name, mint, owner required" }, { status: 400 });
  }
  const res = await claimName(name, mint, owner);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 409 });
  return NextResponse.json({ ok: true });
}
