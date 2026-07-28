# Cation draw keeper

Runs the weekly draw for one PrizePool: when the draw window is open it commits
a hashed random seed, waits a few ledgers, then reveals to pick and pay the
winner. Verified live on testnet (commit → reveal → winner paid, epoch advanced).

## Run once
```bash
npm install
POOL_ID=<C…pool> KEEPER_SECRET=<S…admin> npm run draw
```
If the draw is not yet due it prints how many ledgers remain and exits 0, so it
is safe to run on any schedule.

## Env
| var | required | default |
|-----|----------|---------|
| `POOL_ID` | yes | — |
| `KEEPER_SECRET` | yes | — |
| `RPC_URL` | no | testnet RPC |
| `NETWORK_PASSPHRASE` | no | testnet |
| `COMMIT_REVEAL_GAP` | no | 3 ledgers |

## Schedule it (weekly)
The draw interval is on-chain (`draw_interval`, ~7 days for the app instance),
so a daily or hourly cron is fine — the keeper no-ops until the window opens.

GitHub Actions example (`.github/workflows/draw.yml`):
```yaml
name: cation-draw
on:
  schedule:
    - cron: "0 * * * *"   # hourly; the keeper no-ops until the draw is due
  workflow_dispatch:
jobs:
  draw:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22" }
      - run: cd keeper && npm ci
      - run: cd keeper && npm run draw
        env:
          POOL_ID: ${{ secrets.POOL_ID }}
          KEEPER_SECRET: ${{ secrets.KEEPER_SECRET }}
```

## Notes
- Randomness is commit-reveal (MVP). It trusts the keeper not to grind the seed;
  mainnet moves to VRF-Soroban (PRD §7.4).
- The keeper key is the pool admin. On mainnet, move admin to a multisig and run
  the keeper with a restricted keeper role.
