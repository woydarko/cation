import Link from "next/link";
import { readDrawHistory, type DrawRecord } from "@/lib/server/events";
import { formatUsdc } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Past draws · Cation",
  description: "Every past Cation draw: winners and prize amounts, on-chain.",
};

export default async function HistoryPage() {
  let draws: DrawRecord[] = [];
  try {
    draws = await readDrawHistory();
  } catch {
    draws = [];
  }

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/app" className="text-ink-60 text-2xl leading-none" aria-label="Back">
          ‹
        </Link>
        <h1 className="font-bold text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          Past draws
        </h1>
      </div>

      {draws.length === 0 ? (
        <div className="card p-6 text-center text-ink-60">
          No draws yet. The first winner shows up here after the next draw.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {draws.map((d) => (
            <li key={d.epoch} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">Draw #{d.epoch}</p>
                <p className="tabular text-ink-60 text-sm">
                  {d.winner.slice(0, 4)}…{d.winner.slice(-4)}
                </p>
              </div>
              <div className="text-right">
                <p className="tabular text-lg font-bold text-volt" style={{ fontFamily: "var(--font-data)" }}>
                  ${formatUsdc(d.amount, 7)}
                </p>
                <p className="text-ink-60 text-xs">{new Date(d.at).toLocaleDateString("en-US")}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
