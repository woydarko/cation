"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Notif = { epoch: number; won: boolean; amount?: string; ts: string };
type Store = { processed: number | undefined; read: number; list: Notif[] };

const key = (addr: string) => `cation.notif.${addr}`;

function load(addr: string): Store {
  if (typeof window === "undefined") return { processed: undefined, read: 0, list: [] };
  try {
    const raw = localStorage.getItem(key(addr));
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    /* ignore */
  }
  return { processed: undefined, read: 0, list: [] };
}
const save = (addr: string, s: Store) => localStorage.setItem(key(addr), JSON.stringify(s));

/** Bell that announces each draw result to the connected saver. Derived
 * client-side from on-chain draw history; wins always notify, losses notify
 * while the user has a deposit. State is kept per address in localStorage. */
export default function NotificationBell({ address }: { address: string }) {
  const [store, setStore] = useState<Store>(() => load(address));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Reload store when the address changes.
  useEffect(() => setStore(load(address)), [address]);

  const poll = useCallback(async () => {
    try {
      const [h, s] = await Promise.all([
        fetch("/api/history", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { draws: [] })),
        fetch(`/api/state?user=${address}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      ]);
      const draws: { epoch: number; winner: string; amount: string; at: string }[] = h.draws ?? [];
      const hasDeposit = s?.user ? BigInt(s.user.balance) > 0n : false;

      setStore((prev) => {
        const firstRun = prev.processed === undefined;
        const asc = [...draws].sort((a, b) => a.epoch - b.epoch);
        const maxEpoch = asc.length ? asc[asc.length - 1].epoch : prev.processed ?? 0;
        const list = [...prev.list];
        const seen = new Set(list.map((n) => n.epoch));
        for (const d of asc) {
          if (prev.processed !== undefined && d.epoch <= prev.processed) continue;
          if (seen.has(d.epoch)) continue;
          const won = d.winner === address;
          if (won) list.push({ epoch: d.epoch, won: true, amount: d.amount, ts: d.at });
          else if (!firstRun && hasDeposit) list.push({ epoch: d.epoch, won: false, ts: d.at });
        }
        list.sort((a, b) => b.epoch - a.epoch);
        const next: Store = {
          processed: typeof maxEpoch === "number" ? maxEpoch : prev.processed,
          read: prev.read,
          list: list.slice(0, 30),
        };
        save(address, next);
        return next;
      });
    } catch {
      /* offline / rpc hiccup */
    }
  }, [address]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, [poll]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const unread = store.list.filter((n) => n.epoch > store.read).length;

  const toggle = () => {
    const opening = !open;
    setOpen(opening);
    if (opening && store.list.length) {
      const read = store.list[0].epoch; // newest
      const next = { ...store, read };
      setStore(next);
      save(address, next);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative grid place-items-center w-9 h-9 rounded-full border-2 border-ink-12 hover:border-volt transition-colors"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-white text-[11px] font-bold grid place-items-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="card absolute left-0 mt-2 w-72 p-2 z-50 max-h-96 overflow-y-auto">
          <p className="px-3 py-2 font-semibold text-sm">Notifications</p>
          {store.list.length === 0 ? (
            <p className="px-3 py-6 text-center text-ink-60 text-sm">
              No draws yet. Results show up here after each daily draw.
            </p>
          ) : (
            <ul className="flex flex-col">
              {store.list.map((n) => (
                <li key={n.epoch} className="px-3 py-2.5 rounded-xl hover:bg-cloud">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: n.won ? "var(--zap)" : "var(--ink-12)" }}
                    />
                    <span className="font-semibold text-sm">
                      {n.won ? "You won the pot!" : "Not lucky this time"}
                    </span>
                  </div>
                  <p className="text-ink-60 text-xs mt-0.5 pl-4">
                    Draw #{n.epoch} completed
                    {n.won && n.amount ? `. You got ${fmt(n.amount)} USDC.` : "."}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function fmt(stroops: string): string {
  return `$${(Number(BigInt(stroops)) / 1e7).toLocaleString("en-US", { maximumFractionDigits: 7 })}`;
}
