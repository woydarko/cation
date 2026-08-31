import WaveBackground from "@/components/WaveBackground";
import StepRow from "@/components/StepRow";
import Footer from "@/components/Footer";
import ConnectCta from "@/components/ConnectCta";
import Reveal from "@/components/Reveal";

export default function Landing() {
  return (
    <>
      <WaveBackground />
      <main className="flex-1 relative z-10">
        {/* Hand + phone mockup, right side of the hero. Rotates in from the
            right frame on load (hand-enter). Desktop only; below xl the hero
            is text-only so the copy never collides with it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/tangan.png"
          alt="A hand holding a phone showing a Cation win notification"
          className="hand-enter hidden xl:block absolute right-0 top-[4vh] w-[52vw] max-w-[860px] pointer-events-none select-none z-10"
          style={{
            // Fade the lower forearm into nothing so the cropped edge of the
            // PNG never shows as a hard cut.
            WebkitMaskImage: "linear-gradient(to bottom, #000 62%, transparent 88%)",
            maskImage: "linear-gradient(to bottom, #000 62%, transparent 88%)",
          }}
        />
        {/* Hero (left-aligned, tall) */}
        <section className="relative z-10 min-h-[86vh] max-w-7xl mx-auto w-full px-6 pt-10 pb-20 text-left flex flex-col items-start justify-center">
          <Reveal delay={0}>
            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.03em] leading-[1.02] mb-5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Save money.
              <br />
              Win the interest.
              <br />
              <span className="text-volt">Never lose a cent.</span>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="text-lg text-ink-60 max-w-lg mb-8">
              Cation pools everyone&apos;s interest into a daily prize on Stellar.
              Your deposit stays yours, always.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="flex flex-wrap items-center justify-start gap-3">
              <ConnectCta variant="primary">Start saving</ConnectCta>
              <a href="/how-it-works" className="btn inline-flex px-6 py-4 text-lg bg-white border-2 border-ink-12 text-ink shadow-[var(--shadow-lift)] hover:border-volt hover:shadow-md transition-colors">
                See how
              </a>
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
            <p className="eyebrow mb-4">— The idea</p>
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

          {/* How it works — reference-style feature cards */}
          <section id="how" className="max-w-6xl mx-auto w-full px-6 py-16">
            <div className="text-center mb-12">
              <p className="eyebrow mb-4">— How it works</p>
              <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Three steps, no jargon.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5 items-stretch">
              <StepRow delay={0} decor="waves" icon="＋" accent="var(--volt)" tag="Step 01" label="Get in"
                title="Deposit USDC" body="Add any amount and get tickets. Your money works on Blend and stays yours." />
              <StepRow delay={100} decor="dots" icon="↑" accent="var(--mint)" tag="Step 02" label="Grow"
                title="Earn together" body="Everyone's interest piles into one prize. Save more, keep it longer, better odds." />
              <StepRow delay={200} decor="chevron" icon="★" accent="var(--coral)" tag="Step 03" label="Payout"
                title="Win the pot" body="One winner takes the interest daily. Didn't win? Your money hasn't moved." />
            </div>
          </section>

          {/* Assurances — full-bleed lavender block, reference-style cards */}
          <section style={{ background: "color-mix(in srgb, var(--volt) 12%, #fff)" }}>
           <div className="max-w-6xl mx-auto w-full px-6 py-20">
            <div className="text-center mb-12">
              <p className="eyebrow mb-4">— Why it&apos;s safe</p>
              <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Built to be safe and open.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5 items-stretch">
              <StepRow delay={0} decor="dashes" icon="↓" accent="var(--mint)" tag="No-loss" label="Safety"
                title="Principal protected" body="You only ever risk the interest, never the money you put in." />
              <StepRow delay={100} decor="waves" icon="↺" accent="var(--volt)" tag="Liquid" label="Freedom"
                title="Withdraw anytime" body="Take your money out whenever you want, unless you chose to lock it." />
              <StepRow delay={200} decor="dots" icon="✓" accent="var(--coral)" tag="On-chain" label="Trust"
                title="Verifiable draws" body="Odds and winners are on-chain. Check the math, don't take our word." />
            </div>
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


