# Build & test — PrizePool contract

## Toolchain
- Rust 1.97+, `wasm32-unknown-unknown` target (`rustup target add wasm32-unknown-unknown`)
- Stellar CLI 25+ (`stellar --version`)

## Test (native)
```bash
cargo test -p prize-pool
```

The lib is declared `crate-type = ["rlib"]` (not `cdylib`). Reason: on the
Windows GNU toolchain, linking the contract as a host DLL trips a mingw
`ld` bug — `export ordinal too large` — because the cdylib exports the full
symbol table. Native tests only need the rlib, so we omit cdylib here and add
it back only for the wasm build below.

## Build wasm (for deploy)
```bash
cargo rustc -p prize-pool --release --target wasm32-unknown-unknown --crate-type cdylib
```
Output: `target/wasm32-unknown-unknown/release/prize_pool.wasm`

Optimize before deploy:
```bash
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/prize_pool.wasm
```

## Deploy (testnet) — done at build step 4
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/prize_pool.optimized.wasm \
  --network testnet --source <keeper-key>
```
Then `initialize(admin, usdc_sac, blend_pool, draw_interval, penalty_bps)`.

## Dependency pin
`ed25519-dalek` is pinned to `2.2.0` (Cargo.lock). The resolver otherwise
picks `3.0.0`, which breaks `soroban-env-host 22.1.3` (rand_core trait
mismatch). Re-pin after any `cargo update`:
```bash
cargo update -p ed25519-dalek@3.0.0 --precise 2.2.0
```
