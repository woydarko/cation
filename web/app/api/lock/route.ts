import { NextRequest, NextResponse } from "next/server";
import { readLockStatus } from "@/lib/server/contract";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  if (!user) {
    return NextResponse.json({ error: "missing user" }, { status: 400 });
  }
  try {
    const locked = await readLockStatus(user);
    return NextResponse.json({ locked }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "lock read failed" },
      { status: 502 }
    );
  }
}
