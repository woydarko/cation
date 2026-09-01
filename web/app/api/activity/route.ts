import { NextRequest, NextResponse } from "next/server";
import { readUserActivity } from "@/lib/server/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  if (!user) {
    return NextResponse.json({ error: "missing user" }, { status: 400 });
  }
  try {
    const activity = await readUserActivity(user);
    return NextResponse.json({ activity }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "activity read failed" },
      { status: 502 }
    );
  }
}
