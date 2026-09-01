import Link from "next/link";
import { readPoolState, type PoolState } from "@/lib/server/contract";
import { readDrawHistory, type DrawRecord } from "@/lib/server/events";
import { formatUsdc } from "@/lib/format";
import { PRIZE_POOL_ID, BLEND_POOL, USDC_SAC } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Pool · Cation",
  description: "Live, on-chain transparency for the Cation prize pool.",
};

const CONTRACT = "https://stellar.expert/explorer/testnet/contract/";

export default async function PoolPage() {
  let state: PoolState | null = null;
  let draws: DrawRecord[] = [];
  try {
    [state, draws] = await Promise.all([readPoolState(), readDrawHistory()]);
  } catch {
    // fall through to the empty state below
  }

  const paid = draws.reduce((sum, d) => sum + BigInt(d.amount), 0n).toString();
  const penaltyPct = state ? (state.penaltyBps / 100).toString() : "—";

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/app" className="text-ink-60 text-2xl leading-none" aria-label="Back">
          ‹
        </Link>
        <h1 className="font-bold text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          Pool
        </h1>
      </div>

      {!state ? (
        <div className="card p-6 text-center text-ink-60">
          Couldn&apos;t read the pool right now. Refresh in a moment.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Headline numbers */}
          <div className="grid grid-cols-2 gap-4">
            <Metric wide label="Total saved (TVL)" value={`$${formatUsdc(state.totalPrincipal)}`} accent />
            <Metric label="Current prize pot" value={`$${formatUsdc(state.pot, 7)}`} />
            <Metric label="Draws held" value={String(state.epoch)} />
          </div>

          {/* Recent prizes — bounded by the RPC event window (~12h), so this is
              a rolling recent figure, not the all-time total (which is `epoch`
              draws). ponytail: all-time payout needs an indexer. */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
                Recent prizes
              </h2>
              <Link href="/app/history" className="text-volt font-semibold text-sm hover:underline">
                All draws
              </Link>
            </div>
            {draws.length > 0 ? (
              <>
                <p className="tabular text-3xl font-bold text-volt" style={{ fontFamily: "var(--font-data)" }}>
                  ${formatUsdc(paid, 7)}
                </p>
                <p className="text-ink-60 text-sm mt-1">
                  Paid across {draws.length} {draws.length === 1 ? "draw" : "draws"} in the
                  last few hours. Every cent is yield from Blend — never anyone&apos;s deposit.
                </p>
              </>
            ) : (
              <p className="text-ink-60 text-sm mt-1">
                No draws in the last few hours. {state.epoch} {state.epoch === 1 ? "draw has" : "draws have"}{" "}
                been held in total — see them all in{" "}
                <Link href="/app/history" className="text-volt font-semibold hover:underline">
                  draw history
                </Link>
                .
              </p>
            )}
          </div>

          {/* Parameters */}
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Parameters
            </h2>
            <dl className="text-sm divide-y-2 divide-ink-12">
              <Row k="Draw cadence" v="Daily · 00:00 UTC" />
              <Row k="Early-exit penalty" v={`${penaltyPct}% (into the pot)`} />
              <Row k="Yield source" v="Blend lending pool" />
              <Row k="Asset" v="Circle USDC (testnet)" />
            </dl>
          </div>

          {/* On-chain addresses — verifiable transparency */}
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-1" style={{ fontFamily: "var(--font-display)" }}>
              Verify on-chain
            </h2>
            <p className="text-ink-60 text-sm mb-4">
              Everything above is read live from these contracts. Check them yourself.
            </p>
            <div className="flex flex-col gap-2">
              <AddressRow label="PrizePool" id={PRIZE_POOL_ID} />
              <AddressRow label="Blend pool" id={BLEND_POOL} />
              <AddressRow label="USDC" id={USDC_SAC} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Metric({
  label,
  value,
  accent,
  wide,
}: {
  label: string;
  value: string;
  accent?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`card p-5 min-w-0 ${wide ? "col-span-2" : ""}`}>
      <p className="text-ink-60 text-sm mb-2 truncate">{label}</p>
      <p
        className={`tabular text-2xl font-bold leading-tight truncate ${accent ? "text-volt" : "text-ink"}`}
        style={{ fontFamily: "var(--font-data)" }}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-ink-60">{k}</dt>
      <dd className="font-semibold text-right">{v}</dd>
    </div>
  );
}

function AddressRow({ label, id }: { label: string; id: string }) {
  return (
    <a
      href={`${CONTRACT}${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-xl border-2 border-ink-12 px-4 py-3 hover:border-volt transition-colors group"
    >
      <span className="font-semibold">{label}</span>
      <span className="tabular text-ink-60 text-sm group-hover:text-volt">
        {id.slice(0, 4)}…{id.slice(-4)} ↗
      </span>
    </a>
  );
}
