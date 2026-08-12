import { NextResponse } from "next/server";
import { readDrawHistory } from "@/lib/server/events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const draws = await readDrawHistory();
    return NextResponse.json({ draws }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "history read failed" },
      { status: 502 }
    );
  }
}
