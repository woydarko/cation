#!/usr/bin/env bash
# Build, optimize, and deploy the PrizePool contract to Stellar testnet.
# Prereqs: stellar CLI, wasm32v1-none target. Idempotent-ish: re-run to redeploy.
set -euo pipefail
cd "$(dirname "$0")/.."
source config/testnet.env

WASM=target/wasm32v1-none/release/prize_pool.wasm
OPT=target/wasm32v1-none/release/prize_pool.optimized.wasm

echo "==> ensure admin key '$ADMIN_KEY' exists and is funded"
if ! stellar keys ls | grep -qx "$ADMIN_KEY"; then
  stellar keys generate "$ADMIN_KEY" --network "$NETWORK" --fund
else
  stellar keys fund "$ADMIN_KEY" --network "$NETWORK" || true
fi

echo "==> build wasm"
cargo rustc -p prize-pool --release --target wasm32v1-none --crate-type cdylib
echo "==> optimize"
stellar contract optimize --wasm "$WASM"

echo "==> deploy"
ID=$(stellar contract deploy --wasm "$OPT" --network "$NETWORK" --source "$ADMIN_KEY")
echo "PRIZE_POOL_ID=$ID"
echo "   -> update config/testnet.env with this id, then run scripts/init-testnet.sh"
