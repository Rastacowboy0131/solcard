import { NextResponse } from "next/server";

// Names are now claimed on-chain through the registry program; the server
// no longer writes a local index. Kept as a stub so old clients get a
// clear error instead of a 404.
export async function POST() {
  return NextResponse.json(
    { error: "names are claimed on-chain now, update the app" },
    { status: 410 }
  );
}
