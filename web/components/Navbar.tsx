"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Wordmark from "./Wordmark";
import NotificationBell from "./NotificationBell";
import { useWallet } from "./WalletProvider";

export default function Navbar() {
  const { address, connect, disconnect } = useWallet();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-cloud/80 border-b-2 border-ink-12">
        <div className="max-w-5xl mx-auto w-full px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: logo */}
        <Wordmark />

        {/* Right: how it works, dashboard, notif, address
            (from the right edge: address, notif, dashboard, how it works) */}
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link href="/how-it-works" className="hidden sm:block text-ink-60 hover:text-ink font-medium text-sm">
            How it works
          </Link>
          {address ? (
            <>
              <Link href="/app" className="text-ink-60 hover:text-ink font-medium text-sm">
                Dashboard
              </Link>
              <NotificationBell address={address} />
              <div className="relative" ref={ref}>
                <button
                  onClick={() => setMenu((m) => !m)}
                  className="tabular text-sm rounded-full border-2 border-ink-12 px-3 py-1.5 hover:border-volt transition-colors"
                >
                  {address.slice(0, 4)}…{address.slice(-4)}
                </button>
                {menu && (
                  <div className="card absolute right-0 mt-2 w-52 p-2 z-50">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(address);
                        setMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-cloud text-sm font-medium"
                    >
                      Copy address
                    </button>
                    <button
                      onClick={() => {
                        disconnect();
                        setMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-cloud text-sm font-medium text-coral"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button onClick={connect} className="btn btn-primary px-4 py-2 text-sm">
              Connect wallet
            </button>
          )}
        </nav>
        </div>
      </header>
      {/* spacer so fixed header doesn't cover page content — ponytail: hardcoded 61px matches header (py-3 + h-9 bell + border); if header height changes, update here or switch to JS-measured height */}
      <div className="h-[61px] shrink-0" aria-hidden />
    </>
  );
}
