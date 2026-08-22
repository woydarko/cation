import Link from "next/link";
import Wordmark from "./Wordmark";
import { FEEDBACK_URL } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="relative z-10 bg-white border-t-2 border-ink-12 mt-24">
      <div className="max-w-5xl mx-auto w-full px-6 py-12 grid gap-8 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="text-ink-60 mt-3 max-w-xs leading-relaxed">
            No-loss prize savings on Stellar. Save money, win the interest, never
            lose a cent.
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            ["Open the app", "/app"],
            ["Past draws", "/app/history"],
            ["Give feedback, win $USDG", FEEDBACK_URL],
          ]}
        />
        <FooterCol
          title="Built on"
          links={[
            ["Stellar", "https://stellar.org"],
            ["Blend Capital", "https://blend.capital"],
          ]}
        />
      </div>
      <div className="max-w-5xl mx-auto w-full px-6 pb-10 flex flex-wrap items-center justify-between gap-3 text-ink-60 text-sm">
        <span>Testnet preview · not financial advice.</span>
        <span className="tabular">© {new Date().getFullYear()} Cation</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-semibold mb-3">{title}</p>
      <ul className="flex flex-col gap-2">
        {links.map(([label, href]) => {
          const external = href.startsWith("http");
          return (
            <li key={label}>
              {external ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-60 hover:text-volt transition-colors"
                >
                  {label}
                </a>
              ) : (
                <Link href={href} className="text-ink-60 hover:text-volt transition-colors">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
