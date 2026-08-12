import { NextRequest, NextResponse } from "next/server";
import { readPoolState } from "@/lib/server/contract";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user") ?? undefined;
  try {
    const state = await readPoolState(user || undefined);
    return NextResponse.json(state, {
      headers: { "cache-control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "read failed" },
      { status: 502 }
    );
  }
}
