import type { Metadata } from "next";
import { Space_Mono, Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { ToastProvider } from "@/components/Toast";
import Navbar from "@/components/Navbar";
import ExtensionErrorGuard from "@/components/ExtensionErrorGuard";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Data font (amounts, odds, countdown) - PRD §6.1.
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Display face (headings) - characterful grotesque.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Body face - clean, warm grotesque.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Cation · save money, win the interest",
  description:
    "Cation pools everyone's interest into a daily prize on Stellar. Your deposit stays yours. Never lose a cent.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceMono.variable} ${bricolage.variable} ${figtree.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Swallow errors thrown by browser extensions (chrome-extension://)
            so the dev overlay does not surface their bugs. Runs before the Next
            runtime so its capture-phase listener wins. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){function x(s){return typeof s==='string'&&(s.indexOf('chrome-extension://')>-1||s.indexOf('Cannot create proxy with a non-object')>-1);}window.addEventListener('error',function(e){var st=e&&e.error&&e.error.stack;if(x(e.message)||x(e.filename)||x(st)){e.stopImmediatePropagation();e.preventDefault();}},true);window.addEventListener('unhandledrejection',function(e){var r=(e&&e.reason)||{};if(x(r.message)||x(r.stack)){e.stopImmediatePropagation();e.preventDefault();}},true);})();",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ExtensionErrorGuard />
        <WalletProvider>
          <ToastProvider>
            <Navbar />
            {children}
          </ToastProvider>
        </WalletProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
