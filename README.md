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
web/                   Next.js frontend (landing + pool app)   [step 5]
keeper/                weekly commit/reveal draw job            [step 7]
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
| — | Real Blend wiring (replaces custody stub in `blend.rs`) | TODO |
| 4 | Deploy testnet | next |
| 5 | Passkey wallet + frontend | pending |
| 6 | Mercury/Zephyr indexer | pending |
| 7 | Keeper cron | pending |
| 8 | E2E + 10 users | pending |

## Decisions locked
- Tickets: full time-weighted, `weight = amount × ledgers_held`, weighted-avg start on top-up.
- Lock: 3–90 days, strict on-chain + early exit with flat-% penalty → pot.
- Randomness: commit-reveal (MVP), VRF-Soroban later.
- Yield: Blend, supplier-only, vanilla fixed-USDC pool.
- Indexer: Mercury (Zephyr program); fallback RPC `getEvents` + Postgres.

## Build & test
See [docs/BUILD.md](docs/BUILD.md).
```bash
cargo test -p prize-pool
```
