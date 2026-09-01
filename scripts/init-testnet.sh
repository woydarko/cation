#!/usr/bin/env bash
# Initialize the deployed PrizePool. Requires USDC_SAC, BLEND_POOL, PRIZE_POOL_ID
# set in config/testnet.env.
set -euo pipefail
cd "$(dirname "$0")/.."
source config/testnet.env

: "${PRIZE_POOL_ID:?set PRIZE_POOL_ID in config/testnet.env}"
: "${USDC_SAC:?set USDC_SAC (testnet USDC Stellar Asset Contract)}"
: "${BLEND_POOL:?set BLEND_POOL (Blend testnet pool address)}"

ADMIN_ADDR=$(stellar keys address "$ADMIN_KEY")

echo "==> initialize PrizePool $PRIZE_POOL_ID"
stellar contract invoke \
  --id "$PRIZE_POOL_ID" --network "$NETWORK" --source "$ADMIN_KEY" -- \
  initialize \
  --admin "$ADMIN_ADDR" \
  --usdc_sac "$USDC_SAC" \
  --blend_pool "$BLEND_POOL" \
  --draw_period "$DRAW_PERIOD_SECONDS" \
  --penalty_bps "$PENALTY_BPS"

echo "done. admin=$ADMIN_ADDR"
