import Footer from "@/components/Footer";
import ConnectCta from "@/components/ConnectCta";
import { PRIZE_POOL_ID } from "@/lib/config";

export const metadata = {
  title: "How it works · Cation",
  description:
    "How Cation stays fair: keep your deposit, win the interest, and check every draw on-chain. With a plain example.",
};

const EXPLORER = `https://stellar.expert/explorer/testnet/contract/${PRIZE_POOL_ID}`;

export default function HowItWorks() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="max-w-3xl mx-auto w-full px-6 pt-16 pb-12 text-center">
        <p className="text-volt font-semibold mb-3">How it works</p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-5" style={{ fontFamily: "var(--font-display)" }}>
          Fair by design.
          <br />
          All on-chain.
        </h1>
        <p className="text-lg sm:text-xl text-ink-60 leading-relaxed max-w-xl mx-auto">
          You only risk the interest, never the cash you put in. The pot, your
          odds, and every draw live on-chain, so you can check them yourself.
        </p>
      </section>

      {/* Flow diagram */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-14">
        <div className="card p-6 overflow-x-auto">
          <FlowDiagram />
          <p className="text-center text-ink-60 text-sm mt-4">
            Your deposit never goes into the pot. Only the interest does. Take
            your deposit out whenever you want.
          </p>
        </div>
      </section>

      {/* Explanation */}
      <section className="max-w-5xl mx-auto w-full px-6 grid gap-5 md:grid-cols-2">
        <Explain
          accent="var(--mint)"
          title="You keep your money"
          body="Your USDC goes into Blend and keeps earning. The contract can only ever pay out the interest, never your deposit. The math always adds up to exactly what people put in, and you can pull your money out any time."
        />
        <Explain
          accent="var(--zap)"
          title="The prize is the interest"
          body="Everyone's USDC earns interest on Blend, a lending app on Stellar. As it earns, the pool grows past what people put in. That extra bit is the prize. More savers and more time make it bigger."
        />
        <Explain
          accent="var(--coral)"
          title="How a winner is picked"
          body="You get tickets for how much you save and how long you keep it in, so a last-minute deposit can't take over. Once a day at 00:00 UTC, one winner is picked at random, weighted by tickets. Today that randomness runs on commit-reveal; on mainnet it moves to VRF, which no one can rig."
        />
        <Explain
          accent="var(--volt)"
          title="Check it yourself"
          body="Your odds are just your tickets divided by everyone's tickets. Every deposit, withdrawal, and draw is written on-chain. The contract is open, so you can look up the pot, the winners, and every payout."
        />
      </section>

      {/* Case study */}
      <section className="max-w-5xl mx-auto w-full px-6 py-16">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-center" style={{ fontFamily: "var(--font-display)" }}>
          A plain example
        </h2>
        <p className="text-ink-60 text-center mb-8 max-w-md mx-auto leading-relaxed">
          Two people save. One draw a day. Nobody loses their money.
        </p>

        <div className="grid gap-5 md:grid-cols-2 mb-5">
          <SaverCard name="Alice" deposit="$100" held="10 days" tickets="1,000" odds="40%" />
          <SaverCard name="Bob" deposit="$300" held="5 days" tickets="1,500" odds="60%" />
        </div>

        <div className="card p-6 sm:p-8">
          <ol className="space-y-5">
            <Step n="1" title="Tickets come from amount and time">
              Alice: 100 × 10 = <b className="tabular text-ink">1,000</b>. Bob: 300 × 5 ={" "}
              <b className="tabular text-ink">1,500</b>. Together that is{" "}
              <b className="tabular text-ink">2,500</b> tickets.
            </Step>
            <Step n="2" title="Odds are your share of the tickets">
              Alice has <b className="tabular text-ink">1,000 of 2,500</b>, so 40%. Bob has{" "}
              <b className="tabular text-ink">1,500 of 2,500</b>, so 60%.
            </Step>
            <Step n="3" title="The pot is only the interest">
              Their $400 earns interest on Blend. Say it made{" "}
              <b className="tabular text-ink">$2</b> since the last draw. The pot is that{" "}
              <b className="tabular text-ink">$2</b>, not the $400.
            </Step>
            <Step n="4" title="One winner, picked by tickets">
              Bob is more likely at 60%, but Alice can still win. Say Bob wins. He gets the{" "}
              <b className="tabular text-ink">$2</b> straight to his wallet.
            </Step>
            <Step n="5" title="Nobody loses">
              Alice still has her <b className="tabular text-ink">$100</b>. Bob still has his{" "}
              <b className="tabular text-ink">$300</b>. The pot resets and starts filling up for
              tomorrow.
            </Step>
          </ol>
        </div>

        <p className="text-center mt-8">
          <a
            href={EXPLORER}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-volt font-semibold hover:underline"
          >
            See the contract on Stellar Expert ↗
          </a>
        </p>
      </section>

      {/* CTA band (same treatment as the landing) */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-16">
        <div className="cta-band relative overflow-hidden rounded-[var(--radius-card)] p-10 sm:p-16 text-center text-white">
          <div className="cta-glow cta-glow-zap" aria-hidden />
          <div className="cta-glow cta-glow-coral" aria-hidden />
          <div className="cta-dots" aria-hidden />
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-3" style={{ fontFamily: "var(--font-display)" }}>
              Ready to save?
            </h2>
            <p className="text-white/85 mb-8 text-lg max-w-md">
              Connect a Stellar wallet and you are in today&apos;s draw.
            </p>
            <ConnectCta variant="white">Start saving</ConnectCta>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function FlowDiagram() {
  const nodes = [
    { x: 10, fill: "var(--volt)", text: "#fff", l1: "You deposit", l2: "USDC" },
    { x: 214, fill: "#fff", text: "var(--ink)", border: "var(--volt)", l1: "It earns on Blend", l2: "interest builds up" },
    { x: 418, fill: "var(--zap)", text: "var(--ink)", l1: "Pot is the interest", l2: "grows every day" },
    { x: 622, fill: "var(--coral)", text: "#fff", l1: "One draw a day", l2: "00:00 UTC" },
    { x: 826, fill: "var(--mint)", text: "var(--ink)", l1: "One winner", l2: "takes the pot" },
  ];
  const W = 184;
  const Y = 40;
  const H = 92;
  return (
    <svg viewBox="0 0 1020 172" className="w-full min-w-[760px]" role="img" aria-label="Cation flow: deposit, earns on Blend, pot, daily draw, winner">
      {nodes.map((n, i) => (
        <g key={i}>
          <rect x={n.x} y={Y} width={W} height={H} rx={18} fill={n.fill} stroke={n.border ?? "transparent"} strokeWidth={n.border ? 2 : 0} />
          <text x={n.x + W / 2} y={Y + 40} textAnchor="middle" fill={n.text} fontSize="16" fontWeight="700" fontFamily="var(--font-display)">
            {n.l1}
          </text>
          <text x={n.x + W / 2} y={Y + 64} textAnchor="middle" fill={n.text} fontSize="13" opacity="0.8" fontFamily="var(--font-body)">
            {n.l2}
          </text>
          {i < nodes.length - 1 && (
            <path d={`M ${n.x + W + 2} ${Y + H / 2} L ${n.x + W + 18} ${Y + H / 2}`} stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" markerEnd="url(#arrow)" opacity="0.4" />
          )}
        </g>
      ))}
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--ink)" opacity="0.4" />
        </marker>
      </defs>
      <text x="102" y="158" textAnchor="middle" fill="var(--ink)" opacity="0.55" fontSize="12" fontFamily="var(--font-body)">
        your deposit stays yours
      </text>
    </svg>
  );
}

function Explain({ accent, title, body }: { accent: string; title: string; body: string }) {
  return (
    <div className="card p-6 sm:p-7 h-full">
      <div className="w-10 h-10 rounded-2xl mb-4" style={{ background: accent }} />
      <h3 className="font-bold text-xl mb-2 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h3>
      <p className="text-ink-60 leading-relaxed text-[15px]">{body}</p>
    </div>
  );
}

function SaverCard({
  name,
  deposit,
  held,
  tickets,
  odds,
}: {
  name: string;
  deposit: string;
  held: string;
  tickets: string;
  odds: string;
}) {
  return (
    <div className="card p-6">
      <h3 className="font-bold text-xl mb-4 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        {name}
      </h3>
      <dl className="grid grid-cols-2 gap-y-3 text-sm">
        <dt className="text-ink-60">Deposit</dt>
        <dd className="tabular text-right font-semibold">{deposit}</dd>
        <dt className="text-ink-60">Held for</dt>
        <dd className="tabular text-right font-semibold">{held}</dd>
        <dt className="text-ink-60">Tickets</dt>
        <dd className="tabular text-right font-semibold">{tickets}</dd>
        <dt className="text-ink-60">Odds</dt>
        <dd className="tabular text-right font-bold text-volt">{odds}</dd>
      </dl>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="tabular shrink-0 w-8 h-8 rounded-full bg-volt-12 text-volt font-bold grid place-items-center">
        {n}
      </span>
      <div>
        <p className="font-semibold text-ink mb-1">{title}</p>
        <p className="text-ink-60 leading-relaxed">{children}</p>
      </div>
    </li>
  );
}
