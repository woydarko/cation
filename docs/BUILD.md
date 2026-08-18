# Build & test — PrizePool contract

## Toolchain
- Rust 1.97+, `wasm32v1-none` target (`rustup target add wasm32v1-none`)
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
cargo rustc -p prize-pool --release --target wasm32v1-none --crate-type cdylib
```
Output: `target/wasm32v1-none/release/prize_pool.wasm`

Optimize before deploy:
```bash
stellar contract optimize --wasm target/wasm32v1-none/release/prize_pool.wasm
```

## Deploy (testnet) — done at build step 4
```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/prize_pool.optimized.wasm \
  --network testnet --source <keeper-key>
```
Then `initialize(admin, usdc_sac, blend_pool, draw_interval, penalty_bps)`.

## Toolchain gotchas (Windows)
- **wasm target:** soroban-sdk 25 requires `wasm32v1-none` (not
  `wasm32-unknown-unknown`) on Rust 1.82+. `rustup target add wasm32v1-none`.
- **linker:** native `cargo test` uses LLVM `lld` via `.cargo/config.toml`.
  The default mingw `ld` overflows its DLL export-ordinal table on Soroban
  crates. The lld path there is machine-specific — update it if the toolchain
  moves.
- **ed25519-dalek pin:** pinned to `2.2.0` in Cargo.lock; the resolver
  otherwise picks `3.0.0`, which breaks `soroban-env-host` (rand_core trait
  mismatch). Re-pin after any `cargo update`:
  ```bash
  cargo update -p ed25519-dalek@3.0.0 --precise 2.2.0
  ```

## Blend integration
The pool client is generated from `wasm/blend_pool.wasm` (copied from
`blend-contract-sdk` 2.25) via `contractimport!` in `src/lib.rs`. We do **not**
depend on `blend-contract-sdk` as a crate: it is `crate-type=["cdylib"]`, and
building that cdylib on Windows exceeds the PE 65535 export-symbol limit.
Native tests use a custody stub (`cfg(test)` in `src/blend.rs`); the real
`pool.submit` / `get_positions` / `b_rate` calls compile under `cfg(not(test))`
and are verified on testnet, since Blend cannot be deployed in host tests here.
