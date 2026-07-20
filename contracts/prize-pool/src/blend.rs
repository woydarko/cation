//! Blend yield-source interface.
//!
//! MVP status: this module is the seam where the real Blend pool wiring lands.
//! Right now the contract custodies USDC directly via the SAC and models
//! "supplied value" as its own USDC balance, so the no-loss / pot invariants
//! are exercised in tests without a live Blend deployment.
//!
//! REAL WIRING (contract step, before testnet deploy):
//!   - supply():  call blend_pool.submit(...) to supply USDC, receive bTokens.
//!   - redeem():  call blend_pool.submit(...) to withdraw USDC for bTokens.
//!   - value():   read supplier bToken balance * bRate to get current USDC value.
//! Keep this as supplier-only in a vanilla fixed-USDC pool (see PRD threat model).

use soroban_sdk::{token, Address, Env};

/// USDC currently held by the pool. Under real Blend this becomes
/// bToken_balance * bRate; the yield (value - total_principal) is the pot.
pub fn value(env: &Env, cfg_usdc_sac: &Address, this: &Address) -> i128 {
    token::Client::new(env, cfg_usdc_sac).balance(this)
}

/// Supply USDC to the yield source. No-op in the custody model (USDC already
/// sits in this contract after transfer_from). Real Blend call goes here.
pub fn supply(_env: &Env, _blend_pool: &Address, _amount: i128) {
    // TODO(blend): blend_pool.submit(supply USDC -> bTokens)
}

/// Redeem `amount` USDC from the yield source back into this contract.
/// No-op in the custody model. Real Blend call goes here.
pub fn redeem(_env: &Env, _blend_pool: &Address, _amount: i128) {
    // TODO(blend): blend_pool.submit(withdraw bTokens -> USDC)
}
