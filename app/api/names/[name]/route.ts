import { NextRequest, NextResponse } from "next/server";
import { lookupName } from "../../../../lib/names";

export async function GET(
  _req: NextRequest,
  { params }: { params: { name: string } }
) {
  const entry = await lookupName(params.name);
  if (!entry) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(entry);
}
