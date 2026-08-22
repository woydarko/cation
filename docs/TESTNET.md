# Testnet deployment & validation

## USDC

Cation uses Circle official testnet USDC (`USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`, SAC `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`). Users claim it themselves at https://faucet.circle.com/ . There is no internal mint.

## Live addresses (Circle USDC, deployed 2026-08-22)
| Thing | Address |
|-------|---------|
| PrizePool (Circle) | `CCH4D3UDFBESA7EXY7SPCZTM5CLJQGGOSO4B4XWBFSJCDUY5HRUSXKEB` |
| USDC (Circle, testnet) | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |
| Blend pool (CationCircle) | `CAVWW7H5OAG6KT5XZVAUJC5VQGUNWMQRLG5J64QU6C2GOBQFAWWXBL74` |
| Admin / keeper key | alias `cation-admin` |

USDC has 7 decimals; reserve index 3 in the pool. bRate > 1 (yield accrues).

## Faucet: get test USDC

1. Create and fund a testnet account: `stellar keys generate <user> --network testnet --fund`
2. Add trustline: `stellar tx new change-trust --source <user> --network testnet --line "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"`
3. Claim at https://faucet.circle.com/ (connect wallet, select testnet). The app's `Get test USDC` button links there.

No admin mint is needed.

## Deposit flow (what the frontend will call)
```bash
# user approves the pool to pull USDC, then deposits
stellar contract invoke --id $USDC_SAC --source <user> -- approve \
  --from <user> --spender $PRIZE_POOL_ID --amount 1000000000 --expiration_ledger <ledger+100000>
stellar contract invoke --id $PRIZE_POOL_ID --source <user> -- deposit \
  --from <user> --amount 1000000000 --lock_until 0
```

## Validated live (2026-08-19)
Full no-loss loop confirmed on-chain against real Blend:
- **deposit 100 USDC** → contract `transfer_from` + Blend `supply` (minted
  ~999999938 bTokens). The `authorize_as_current_contract` sub-invocation that
  lets the pool pull our USDC **works** (the one path unit tests can't cover).
- `balance_of` = 100 USDC, `tickets_of` = amount × ledgers held (time-weighted).
- `pot` = live Blend value − principal = **5 stroops** and rising (real yield).
- **withdraw 40 USDC** → Blend `redeem` (burned ~399999969 bTokens) → 40 USDC
  back to the user; `balance_of` = 60 USDC. No-loss holds.

### Draw (commit-reveal) — verified live
On a short-interval instance (`draw_interval=20`,
`CBH52SBNJSDEBLJHXPXVE4R3VGDDOOMW5M63YBKMII3W4JM7GRKGGDZD`) with two depositors:
- `commit_draw(sha256(seed))` then `reveal_draw(seed)` — hash check passed.
- Winner picked by ticket weight; `draw` event `{winner, amount=198, epoch=1}`.
- Blend `redeem` pulled **only** the 198-stroop yield; both 100-USDC principals
  stayed whole; winner's wallet rose by exactly 198. Epoch advanced.

**Keeper gotcha:** the `stellar` CLI parses an all-decimal-digit BytesN arg as a
number (rejecting it), so a hex seed/hash needs at least one a–f digit on the
CLI. The keeper (step 7) will use the SDK and pass raw 32-byte values, so this
is a CLI-only quirk — noted so nobody loses time on it.

Also: `reveal_draw` mutates state, but pass `--send=yes` explicitly when
invoking via CLI — a bare invoke may stop at simulation.

## Passkey smart wallet (frontend)
The app's primary sign-in is a passkey smart wallet via `passkey-kit`:
- `walletWasmHash` = the canonical smart-wallet wasm already installed on
  testnet (`fdefad64…`).
- Deploys + fees are sponsored by a throwaway testnet keypair `cation-sponsor`
  (secret in `web/.env.local` as `NEXT_PUBLIC_SPONSOR_SECRET`). This makes the
  loop gasless with no external relayer. On mainnet this moves server-side.
- The passkey signs each op's smart-wallet auth entry (`kit.sign`); the sponsor
  signs the envelope and submits. Smart wallets are contracts, so they hold the
  USDC SAC with **no trustline** — the faucet mints straight to the C-address.
- WebAuthn (Face ID / security key) can only be exercised on a real device, not
  in a headless browser. A local-keypair "dev wallet" (funded via friendbot +
  faucet) is the fallback used for automated in-browser verification.

## Reproducing the Blend stack
`blend-utils` (cloned to scratchpad): set `.env` `ADMIN`=cation-admin secret,
`WHALE`=a funded key secret, then `npx tsc && node
lib/v2/testing-scripts/mock-example.js testnet`. Addresses land in its
`testnet.contracts.json`. cation-admin persists in the stellar keys store, so
USDC stays mintable across sessions.
