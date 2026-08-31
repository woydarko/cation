import WaveBackground from "@/components/WaveBackground";
import InfoCard from "@/components/InfoCard";
import Footer from "@/components/Footer";
import ConnectCta from "@/components/ConnectCta";
import Reveal from "@/components/Reveal";

export default function Landing() {
  return (
    <>
      <WaveBackground />
      <main className="flex-1 relative z-10">
        {/* Hero (centered, tall) */}
        <section className="relative z-10 min-h-[86vh] max-w-3xl mx-auto w-full px-6 pt-10 pb-20 text-center flex flex-col items-center justify-center">
          <Reveal delay={0}>
            <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink-12 bg-white/70 backdrop-blur px-4 py-1.5 text-sm font-semibold text-ink-60 mb-6">
              <span className="spark text-volt">✦</span>
              No-loss savings · daily prize on Stellar
            </span>
          </Reveal>
          <Reveal delay={90}>
            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.03em] leading-[1.02] mb-5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Save money.
              <br />
              Win the <span className="mark-zap">interest</span>.
              <br />
              <span className="text-volt">Never lose a cent.</span>
            </h1>
          </Reveal>
          <Reveal delay={170}>
            <p className="text-lg text-ink-60 max-w-lg mb-8">
              Cation pools everyone&apos;s interest into a daily prize on Stellar.
              Your deposit stays yours, always.
            </p>
          </Reveal>
          <Reveal delay={250}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <ConnectCta variant="primary">Start saving</ConnectCta>
              <a href="/how-it-works" className="btn inline-flex px-6 py-4 text-lg bg-white border-2 border-ink-12 text-ink shadow-[var(--shadow-lift)] hover:border-volt hover:shadow-md transition-colors">
                See how
              </a>
            </div>
          </Reveal>
          <Reveal delay={330}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-ink-60">
              {["Your deposit stays yours", "Withdraw anytime", "On-chain, verifiable"].map((c) => (
                <span key={c} className="rounded-full bg-white border-[1.5px] border-ink-12 px-3 py-1">
                  {c}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Smooth fade from the wave into the solid section below. */}
        <div className="relative z-10 h-40 bg-gradient-to-b from-transparent to-cloud pointer-events-none" />

        {/* Everything below the hero sits on a solid background so the wave
            only shows behind the hero and body copy stays readable. */}
        <div className="relative z-10 bg-cloud">
          {/* About (centered) */}
          <section className="max-w-3xl mx-auto w-full px-6 py-20 text-center">
            <p className="text-volt font-semibold mb-3">The idea</p>
            <h2
              className="text-3xl sm:text-4xl font-bold leading-tight mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              A savings account where the prize is the interest, not your deposit.
            </h2>
            <div className="text-ink-60 text-lg leading-relaxed space-y-4 max-w-2xl mx-auto">
              <p>
                Prize-linked saving has been around for years. Cation puts it
                on-chain and out in the open. Everyone&apos;s USDC is pooled and
                earns interest on Blend, and every day that interest goes to one
                saver in a draw you can check.
              </p>
              <p>
                You can also lock a deposit until a date you choose. Your own smart
                account holds you to it, which helps for goals you don&apos;t want
                to touch early.
              </p>
            </div>
          </section>

          {/* How it works (centered, unified cards) */}
          <section id="how" className="max-w-5xl mx-auto w-full px-6 py-16 text-center">
            <p className="text-volt font-semibold mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-10" style={{ fontFamily: "var(--font-display)" }}>
              Three steps, no jargon.
            </h2>
            <div className="grid gap-5 md:grid-cols-3 items-stretch">
              <Reveal delay={0} className="h-full"><InfoCard badge="1" accent="var(--volt)" title="Deposit USDC" body="Add any amount and get tickets. Your money goes to work on Blend and stays yours." /></Reveal>
              <Reveal delay={100} className="h-full"><InfoCard badge="2" accent="var(--zap)" title="Earn together" body="Everyone's interest piles into one prize. The more you save and the longer you keep it in, the better your odds." /></Reveal>
              <Reveal delay={200} className="h-full"><InfoCard badge="3" accent="var(--coral)" title="Win the pot" body="Every day one winner takes the interest. Did not win? Your money has not moved." /></Reveal>
            </div>
          </section>

          {/* Assurances (centered, same card) */}
          <section className="max-w-5xl mx-auto w-full px-6 py-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-10" style={{ fontFamily: "var(--font-display)" }}>
              Built to be safe and open.
            </h2>
            <div className="grid gap-5 sm:grid-cols-3 items-stretch">
              <Reveal delay={0} className="h-full"><InfoCard badge="&darr;" accent="var(--mint)" title="No-loss by design" body="You only ever risk the interest, never the money you put in." /></Reveal>
              <Reveal delay={100} className="h-full"><InfoCard badge="&#8635;" accent="var(--volt)" title="Withdraw anytime" body="Take your money out whenever you want, unless you locked it." /></Reveal>
              <Reveal delay={200} className="h-full"><InfoCard badge="&#10003;" accent="var(--coral)" title="Verifiable draws" body="Odds and winners are on-chain. Check the math, do not take our word." /></Reveal>
            </div>
          </section>

          {/* CTA band */}
          <section className="max-w-5xl mx-auto w-full px-6 py-8">
            <div className="cta-band relative overflow-hidden rounded-[var(--radius-card)] p-10 sm:p-16 text-center text-white">
              <div className="cta-glow cta-glow-zap" aria-hidden />
              <div className="cta-glow cta-glow-coral" aria-hidden />
              <div className="cta-dots" aria-hidden />
              <div className="relative z-10 flex flex-col items-center">
                <h2 className="text-3xl sm:text-5xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
                  Start saving in a minute.
                </h2>
                <p className="text-white/85 mb-8 text-lg max-w-md">
                  Connect your Stellar wallet and join today&apos;s draw.
                </p>
                <ConnectCta variant="white">Open the app</ConnectCta>
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </main>
    </>
  );
}


