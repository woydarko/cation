# Cation

**Save money, win the interest, never lose a cent.**

Cation is a no-loss prize-linked savings dApp on Stellar. Everyone's USDC is
pooled and supplied to [Blend](https://www.blend.capital/) for yield. Once a
week that yield goes to one winner via a provably fair draw. Non-winners keep
every cent of principal and can withdraw anytime — unless they chose to lock.

Full spec: [cation-prd.md](cation-prd.md). This is the **Level 4 (Green Belt)
MVP**: testnet only, single pool, weekly draw, 10 real users.

## Differentiator
On-chain **commitment lock**: a saver can lock a deposit for 3–90 days,
enforced by their smart account, not by app rules. Early exit is allowed for a
penalty, and the penalty flows into the prize pot.

## Repo layout
```
contracts/prize-pool   Soroban contract (Rust) — accounting, Blend, draw, lock
web/                   Next.js frontend (landing + pool app) — working
keeper/                weekly commit/reveal draw job — working
docs/                  BUILD.md, setup, threat notes
cation-prd.md          product requirements
```

## Status
| Step | What | State |
|------|------|-------|
| 0 | Repo scaffold | done |
| 1 | Contract core (deposit/withdraw/pot/tickets) | done, 6 tests green |
| 2 | Lock + early-exit penalty | done (in contract) |
| 3 | Commit-reveal draw | done (in contract) |
| — | Real Blend wiring (`submit`/`get_positions`/`b_rate`) | done, compiles to wasm; runtime verified on testnet |
| 4 | Deploy testnet | done: deployed + initialized. **Full loop incl. draw verified live** vs real Blend — deposit→supply, time-weighted tickets, pot=yield, withdraw→redeem, commit-reveal draw (winner paid yield-only, principal intact), no-loss. See [docs/TESTNET.md](docs/TESTNET.md). |
| 5 | Wallet + frontend | **working**: Next.js app (landing + pool home), live chain reads, deposit + withdraw via Freighter/xBull/Lobstr. Stellar Wallets Kit wired, mobile responsive (375px+) with loading skeletons and toasts. |
| 6 | History via events | draw history reads on-chain `draw` events via RPC `getEvents` (`/app/history`, `/api/history`) — no Mercury needed for the MVP. |
| — | Draw history + win reveal | **working**: history page + scratch-card win reveal; verified live (keeper drew, connected wallet won → reveal fired). |
| — | Polish | loading skeletons, success/error toasts, mobile pass (375px), odds clamped to 100%. |
| 7 | Keeper cron | **working**: SDK keeper commits+reveals when the draw window opens; ran a full autonomous draw on testnet (winner paid, epoch advanced). Cron-ready ([keeper/README.md](keeper/README.md)). |
| 8 | E2E + 10 users | pending |

## Testnet deployment
Active stack (our own Blend deploy so USDC is mintable — full detail in
[docs/TESTNET.md](docs/TESTNET.md)):
- PrizePool (active): `CC5JEG6QSEETBZKPSUIWEGSPOT63Z7QVBVP4CXGH2MXB5O5CBV323IZ6`
- USDC (mintable, issuer = `cation-admin`): `CASWO3VWUS5LQNESTAOL2FJPPPCEV6BT27UVBED2JUYNSRV5QNEB2KKI`
- Blend pool: `CAYFESJVBO2OLTRYGYDS46MLDKONFYCRSE4HEJ3D75LCIDHF63RA22LY`
- Admin/keeper/issuer key: alias `cation-admin`
- Params: draw_interval 120960 ledgers (~7d), penalty 500 bps (5%)
- Config: [config/testnet.env](config/testnet.env) · deploy: [scripts/deploy-testnet.sh](scripts/deploy-testnet.sh)
- Live: `https://cation.vercel.app` (Vercel, testnet) · Explorer: `https://stellar.expert/explorer/testnet/contract/CC5JEG6QSEETBZKPSUIWEGSPOT63Z7QVBVP4CXGH2MXB5O5CBV323IZ6`

## Level 4 (Green Belt) — production checklist
- [x] Production MVP (contract + web + keeper) on Stellar testnet, 6 snapshot tests green
- [x] Stable frontend (Next.js 16, Tailwind, mobile responsive, skeletons/toasts/error boundaries)
- [x] Navbar fixed, landing CTA `bg-white` visible, `Under the hood` removed, footer `Stellar + Blend` only (passkeys removed)
- [x] Monitoring: Vercel Analytics + Speed Insights (web/lib/analytics) + GH Actions keeper cron
- [x] `public` repo, 15+ commits (see log), contract deployed `CC5JEG...`
- [ ] 10 real users + wallet interaction proofs (collect via /app faucet, export `api/history` screenshots)
- [ ] User feedback (form → sheet, summary in `docs/FEEDBACK.md`)
- [ ] Demo video (2-3 min) + screenshots (landing, mobile, app, analytics)
- Remaining to hand in: `Live demo link`, `Demo video link`, `Proof 10 wallets`, `Feedback summary` — see `docs/SUBMISSION.md`

## Decisions locked
- Tickets: full time-weighted, `weight = amount × ledgers_held`, weighted-avg start on top-up.
- Lock: 3–90 days, strict on-chain + early exit with flat-% penalty → pot.
- Randomness: commit-reveal (MVP), VRF-Soroban later.
- Yield: Blend, supplier-only, vanilla fixed-USDC pool.
- Indexer: Mercury (Zephyr program); fallback RPC `getEvents` + Postgres.

## Build & test
Contract — see [docs/BUILD.md](docs/BUILD.md):
```bash
cargo test -p prize-pool
```
Frontend (needs `web/.env.local` with `CATION_ADMIN_SECRET` +
`NEXT_PUBLIC_USDC_ISSUER` for the faucet):
```bash
cd web && npm run dev
```
Landing at `/`, pool app at `/app`. Connect creates a local testnet keypair,
funds it via friendbot, and mints test USDC; deposit/withdraw hit the deployed
contract. Regenerate contract bindings after a redeploy:
`stellar contract bindings typescript --network testnet --id <ID> --output-dir web/packages/prize-pool-client --overwrite`.
