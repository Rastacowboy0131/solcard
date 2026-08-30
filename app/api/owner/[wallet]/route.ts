import { NextRequest, NextResponse } from "next/server";
import { lookupByOwner } from "../../../../lib/names";

export async function GET(
  _req: NextRequest,
  { params }: { params: { wallet: string } }
) {
  const cards = await lookupByOwner(params.wallet);
  return NextResponse.json({ cards });
}
