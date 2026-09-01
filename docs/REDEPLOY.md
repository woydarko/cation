# Redeploy: switch to 00:00 UTC daily draws

The draw is now gated on wall-clock time (`draw_period` = 86,400s → daily at
00:00 UTC, no drift). That is a contract-interface change, so it needs a fresh
deploy. **A new deploy is a new contract address** — the current pool's
deposits, pot, and draw history stay on the old contract. Do this before the
next onboarding push so testers land on the new pool.

All commands run from the repo root. The admin/keeper identity is `cation-admin`
(see `config/testnet.env`).

## 1. Build the optimized wasm

```bash
stellar contract build
stellar contract optimize --wasm target/wasm32v1-none/release/prize_pool.wasm
```

## 2. Deploy

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/prize_pool.optimized.wasm \
  --source cation-admin --network testnet
```

Copy the printed contract id (`C…`) — call it `NEW_POOL_ID`.

## 3. Point everything at the new id

- `config/testnet.env` → set `PRIZE_POOL_ID=NEW_POOL_ID`
- `web/lib/config.ts` → set `PRIZE_POOL_ID` to `NEW_POOL_ID`
- GitHub repo secret `POOL_ID` → `NEW_POOL_ID` (the draw workflow reads it)

## 4. Initialize

```bash
bash scripts/init-testnet.sh
```

This calls `initialize` with `--draw_period 86400`, anchoring the first draw to
the next 00:00 UTC.

## 5. Verify the schedule

```bash
stellar contract invoke --id "$NEW_POOL_ID" --network testnet \
  --source cation-admin -- get_config
```

`next_draw_ts` should equal the next UTC-midnight as a unix timestamp
(`date -u -d "tomorrow 00:00" +%s`, or `python -c "import time;print((int(time.time())//86400+1)*86400)"`).

## 6. Bindings

The TypeScript bindings in `web/packages/prize-pool-client` are already
regenerated for the new interface and committed. Only regenerate them if you
change the contract again:

```bash
stellar contract bindings typescript \
  --wasm target/wasm32v1-none/release/prize_pool.wasm \
  --output-dir web/packages/prize-pool-client --overwrite
( cd web/packages/prize-pool-client && npm install && npm run build )
```

## 7. Redeploy the web app

Push, then let Vercel rebuild (or run the manual `deploy` workflow). The
frontend now reads the new pool; the `/app/pool` page should show TVL 0 until
testers deposit.

## Notes

- The keeper account (`cation-admin`) is already funded and holds the admin
  auth; no key changes needed.
- Old pool funds are not lost — they remain withdrawable on the old contract id
  via its Stellar Expert page — but the app no longer points there.
