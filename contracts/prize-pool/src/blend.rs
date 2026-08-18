//! Blend yield-source interface.
//!
//! Two implementations, selected at compile time:
//!
//! * `cfg(test)`  — a custody stub: the contract just holds the USDC itself and
//!   "value" is its own token balance. This lets the no-loss / pot / draw
//!   invariants run in native unit tests without a deployed Blend pool
//!   (deploying Blend in host tests is impossible on Windows: its cdylib
//!   exceeds the PE 65535 export-symbol limit).
//!
//! * `cfg(not(test))` — the real Blend calls via the generated pool client
//!   (`crate::blend_pool`, imported from the on-chain pool wasm spec). This is
//!   what ships to wasm/testnet. Supplier-only, request_type Supply(0) /
//!   Withdraw(1); never borrows, never posts collateral (PRD threat model).
//!
//! NOTE: the real path's cross-contract auth (authorizing the pool to pull our
//! USDC on supply) can only be verified on testnet — it is exercised at build
//! step 4, not by native tests.

use soroban_sdk::{Address, Env};

const BLEND_SUPPLY: u32 = 0;
const BLEND_WITHDRAW: u32 = 1;
/// Blend b_rate is fixed-point scaled by 1e12 (SCALAR_12).
const SCALAR_12: i128 = 1_000_000_000_000;

// ---- real Blend (wasm / testnet) ------------------------------------------

/// Current USDC value of the pool's Blend supply position = bTokens * b_rate.
#[cfg(not(test))]
pub fn value(env: &Env, blend_pool: &Address, usdc: &Address, this: &Address) -> i128 {
    let pool = crate::blend_pool::Client::new(env, blend_pool);
    let idx = usdc_reserve_index(&pool, usdc);
    let btokens = pool.get_positions(this).supply.get(idx).unwrap_or(0);
    if btokens == 0 {
        return 0;
    }
    let b_rate = pool.get_reserve(usdc).data.b_rate;
    btokens.saturating_mul(b_rate) / SCALAR_12
}

/// Supply `amount` USDC into Blend. The contract must authorize the pool to
/// pull its USDC (the transfer is a sub-invocation the pool makes on our
/// behalf), then submit a Supply request.
#[cfg(not(test))]
pub fn supply(env: &Env, blend_pool: &Address, usdc: &Address, this: &Address, amount: i128) {
    use soroban_sdk::{
        auth::{ContractContext, InvokerContractAuthEntry, SubContractInvocation},
        vec, IntoVal, Symbol,
    };
    env.authorize_as_current_contract(vec![
        env,
        InvokerContractAuthEntry::Contract(SubContractInvocation {
            context: ContractContext {
                contract: usdc.clone(),
                fn_name: Symbol::new(env, "transfer"),
                args: (this.clone(), blend_pool.clone(), amount).into_val(env),
            },
            sub_invocations: vec![env],
        }),
    ]);
    let pool = crate::blend_pool::Client::new(env, blend_pool);
    let reqs = vec![
        env,
        crate::blend_pool::Request {
            address: usdc.clone(),
            amount,
            request_type: BLEND_SUPPLY,
        },
    ];
    pool.submit(this, this, this, &reqs);
}

/// Redeem `amount` USDC out of Blend back into this contract.
#[cfg(not(test))]
pub fn redeem(env: &Env, blend_pool: &Address, usdc: &Address, this: &Address, amount: i128) {
    use soroban_sdk::vec;
    let pool = crate::blend_pool::Client::new(env, blend_pool);
    let reqs = vec![
        env,
        crate::blend_pool::Request {
            address: usdc.clone(),
            amount,
            request_type: BLEND_WITHDRAW,
        },
    ];
    pool.submit(this, this, this, &reqs);
}

#[cfg(not(test))]
fn usdc_reserve_index(pool: &crate::blend_pool::Client, usdc: &Address) -> u32 {
    let list = pool.get_reserve_list();
    for i in 0..list.len() {
        if list.get(i).unwrap() == *usdc {
            return i;
        }
    }
    // USDC must be a reserve in the configured pool.
    panic!("usdc not a reserve in blend pool")
}

// ---- custody stub (native tests) ------------------------------------------

#[cfg(test)]
pub fn value(env: &Env, _blend_pool: &Address, usdc: &Address, this: &Address) -> i128 {
    soroban_sdk::token::Client::new(env, usdc).balance(this)
}

#[cfg(test)]
pub fn supply(_env: &Env, _blend_pool: &Address, _usdc: &Address, _this: &Address, _amount: i128) {
    // no-op: USDC already sits in this contract after transfer_from
}

#[cfg(test)]
pub fn redeem(_env: &Env, _blend_pool: &Address, _usdc: &Address, _this: &Address, _amount: i128) {
    // no-op: USDC never left this contract in the custody model
}
