# Testnet deployment & validation

## Why we run our own Blend stack
The official Blend testnet USDC (`CAQCF…`) is a classic-asset SAC whose issuer
we do not control, so we cannot mint it for users. Cation needs to hand test
USDC to onboarding users (PRD §4.1 faucet, §11), so we deployed our own Blend
stack with `blend-utils`, where **USDC is issued by our admin key
(`cation-admin`)** and is freely mintable.

## Live addresses (our stack)
| Thing | Address |
|-------|---------|
| PrizePool (active) | `CC5JEG6QSEETBZKPSUIWEGSPOT63Z7QVBVP4CXGH2MXB5O5CBV323IZ6` |
| USDC (mintable, issuer = cation-admin) | `CASWO3VWUS5LQNESTAOL2FJPPPCEV6BT27UVBED2JUYNSRV5QNEB2KKI` |
| Blend pool | `CAYFESJVBO2OLTRYGYDS46MLDKONFYCRSE4HEJ3D75LCIDHF63RA22LY` |
| Admin / keeper / issuer key | alias `cation-admin` |

USDC has 7 decimals; reserve index 3 in the pool. bRate > 1 (yield accrues).

## Faucet: mint test USDC to a user
A user account first needs an XLM balance and a USDC trustline, then admin mints:
```bash
ISSUER=$(stellar keys address cation-admin)
stellar keys generate <user> --network testnet --fund
stellar tx new change-trust --source <user> --network testnet --line "USDC:$ISSUER"
stellar contract invoke --id $USDC_SAC --network testnet --source cation-admin \
  -- mint --to $(stellar keys address <user>) --amount 1000000000   # 100 USDC
```
(This is the flow the in-app faucet helper automates for the 10-user push.)

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
