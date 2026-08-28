#![no_std]

//! Cation PrizePool — no-loss prize-linked savings on Soroban.
//!
//! Loop: deposit USDC -> supplied to Blend for yield -> weekly commit-reveal
//! draw pays ONLY the accrued yield to one ticket-weighted winner -> principal
//! is always fully withdrawable (minus any active lock).
//!
//! Invariants (see PRD 7.5):
//!   I1  payout <= pot()                         draw never touches principal
//!   I2  sum(user principal) == total_principal
//!   I3  a non-winner can always withdraw full principal (minus active lock)

mod blend;
mod types;

#[cfg(test)]
mod test;

/// Generated client + types for the Blend pool, from its on-chain wasm spec.
/// Used by `blend.rs` in the real (non-test) path. Importing here keeps the
/// generated code in this rlib crate (no cdylib, so no Windows DLL export-cap).
#[allow(clippy::too_many_arguments)]
mod blend_pool {
    soroban_sdk::contractimport!(file = "wasm/blend_pool.wasm");
}

use soroban_sdk::{
    contract, contractimpl, panic_with_error, token, vec, Address, Bytes, BytesN, Env, Vec,
};
use types::{Config, DataKey, Deposit, Error, PendingCommit, Prize};

/// ~5s ledgers => one day of ledgers. Used for lock-range validation.
const LEDGERS_PER_DAY: u64 = 17_280;
const MIN_LOCK_LEDGERS: u64 = 3 * LEDGERS_PER_DAY; // 3 days
const MAX_LOCK_LEDGERS: u64 = 90 * LEDGERS_PER_DAY; // 90 days
const BPS_DENOM: i128 = 10_000;

#[contract]
pub struct PrizePool;

#[contractimpl]
impl PrizePool {
    /// One-time setup. `penalty_bps` = early-exit penalty (e.g. 500 = 5%).
    pub fn initialize(
        env: Env,
        admin: Address,
        usdc_sac: Address,
        blend_pool: Address,
        draw_interval: u32,
        penalty_bps: u32,
    ) {
        if env.storage().instance().has(&DataKey::Config) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        admin.require_auth();
        let next_draw_ledger = env.ledger().sequence() + draw_interval;
        let cfg = Config {
            admin,
            usdc_sac,
            blend_pool,
            draw_interval,
            next_draw_ledger,
            penalty_bps,
            epoch: 0,
        };
        env.storage().instance().set(&DataKey::Config, &cfg);
        env.storage()
            .instance()
            .set(&DataKey::TotalPrincipal, &0i128);
        env.storage()
            .instance()
            .set(&DataKey::Savers, &Vec::<Address>::new(&env));
    }

    /// Deposit USDC and earn time-weighted tickets. Optional strict lock:
    /// `lock_until` is an absolute ledger, must sit 3..=90 days ahead, and 0
    /// means no lock. Topping up an existing position recomputes the weighted
    /// start as an amount-weighted average so fresh money is not over-credited.
    pub fn deposit(env: Env, from: Address, amount: i128, lock_until: u64) {
        from.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, Error::ZeroAmount);
        }
        let cfg = Self::config(&env);
        let now = env.ledger().sequence() as u64;

        if lock_until != 0 {
            let span = lock_until.saturating_sub(now);
            if span < MIN_LOCK_LEDGERS || span > MAX_LOCK_LEDGERS {
                panic_with_error!(&env, Error::BadLockRange);
            }
        }

        // Pull USDC from the user into this contract, then supply to Blend.
        let this = env.current_contract_address();
        token::Client::new(&env, &cfg.usdc_sac).transfer_from(&this, &from, &this, &amount);
        blend::supply(&env, &cfg.blend_pool, &cfg.usdc_sac, &this, amount);

        // Merge into any existing position with a weighted-average start.
        let key = DataKey::Deposit(from.clone());
        let dep = match env.storage().persistent().get::<_, Deposit>(&key) {
            Some(old) => {
                let new_amount = old
                    .amount
                    .checked_add(amount)
                    .unwrap_or_else(|| panic_with_error!(&env, Error::Overflow));
                let weighted_since =
                    weighted_avg_start(&env, old.amount, old.weighted_since, amount, now);
                let lock = core::cmp::max(old.lock_until, lock_until); // extend-only
                Deposit {
                    amount: new_amount,
                    weighted_since,
                    lock_until: lock,
                }
            }
            None => {
                Self::push_saver(&env, &from);
                Deposit {
                    amount,
                    weighted_since: now,
                    lock_until,
                }
            }
        };
        env.storage().persistent().set(&key, &dep);

        let total: i128 = Self::total_principal(&env)
            .checked_add(amount)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Overflow));
        env.storage()
            .instance()
            .set(&DataKey::TotalPrincipal, &total);

        env.events().publish(
            (soroban_sdk::symbol_short!("deposit"), from),
            (amount, lock_until),
        );
    }

    /// Withdraw principal. If the position is still locked and `force_early`
    /// is false, this refuses (strict lock). If `force_early` is true, an
    /// early exit is allowed for a penalty (`penalty_bps`); the penalty stays
    /// in the pool and thus flows into the prize pot.
    pub fn withdraw(env: Env, to: Address, amount: i128, force_early: bool) {
        to.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, Error::ZeroAmount);
        }
        let cfg = Self::config(&env);
        let now = env.ledger().sequence() as u64;
        let key = DataKey::Deposit(to.clone());
        let mut dep: Deposit = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::InsufficientBalance));
        if amount > dep.amount {
            panic_with_error!(&env, Error::InsufficientBalance);
        }

        let mut penalty: i128 = 0;
        if dep.lock_until != 0 && now < dep.lock_until {
            if !force_early {
                panic_with_error!(&env, Error::StillLocked);
            }
            penalty = amount
                .checked_mul(cfg.penalty_bps as i128)
                .unwrap_or_else(|| panic_with_error!(&env, Error::Overflow))
                / BPS_DENOM;
        }
        let payout = amount - penalty; // penalty retained in pool -> pot

        // Reduce accounting first (checks-effects-interactions).
        dep.amount -= amount;
        if dep.amount == 0 {
            env.storage().persistent().remove(&key);
            Self::remove_saver(&env, &to);
        } else {
            env.storage().persistent().set(&key, &dep);
        }
        let total = Self::total_principal(&env) - amount;
        env.storage()
            .instance()
            .set(&DataKey::TotalPrincipal, &total);

        // Redeem only the user's payout; the penalty stays supplied as yield.
        let this = env.current_contract_address();
        blend::redeem(&env, &cfg.blend_pool, &cfg.usdc_sac, &this, payout);
        token::Client::new(&env, &cfg.usdc_sac).transfer(&this, &to, &payout);

        if penalty > 0 {
            env.events().publish(
                (soroban_sdk::symbol_short!("earlyexit"), to.clone()),
                (amount, penalty),
            );
        }
        env.events()
            .publish((soroban_sdk::symbol_short!("withdraw"), to), (payout,));
    }

    /// Principal held by `user` (excludes any yield).
    pub fn balance_of(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get::<_, Deposit>(&DataKey::Deposit(user))
            .map(|d| d.amount)
            .unwrap_or(0)
    }

    /// Yield available to give away = current pool value - total principal.
    pub fn pot(env: Env) -> i128 {
        let cfg = Self::config(&env);
        let this = env.current_contract_address();
        let value = blend::value(&env, &cfg.blend_pool, &cfg.usdc_sac, &this);
        value - Self::total_principal(&env)
    }

    /// This user's current ticket weight (amount * ledgers held).
    pub fn tickets_of(env: Env, user: Address) -> i128 {
        let now = env.ledger().sequence() as u64;
        env.storage()
            .persistent()
            .get::<_, Deposit>(&DataKey::Deposit(user))
            .map(|d| ticket_weight(&d, now))
            .unwrap_or(0)
    }

    /// Sum of all ticket weights right now (denominator for odds).
    pub fn total_tickets(env: Env) -> i128 {
        let now = env.ledger().sequence() as u64;
        let mut sum: i128 = 0;
        for a in Self::savers(&env).iter() {
            if let Some(d) = env
                .storage()
                .persistent()
                .get::<_, Deposit>(&DataKey::Deposit(a))
            {
                sum += ticket_weight(&d, now);
            }
        }
        sum
    }

    /// Full config (admin, tokens, draw schedule, penalty, epoch). Read by the
    /// UI to render the countdown, current epoch, and penalty rate.
    pub fn get_config(env: Env) -> Config {
        Self::config(&env)
    }

    /// Total principal pooled across all savers.
    pub fn total_principal_view(env: Env) -> i128 {
        Self::total_principal(&env)
    }

    // ---- draw: commit-reveal --------------------------------------------

    /// Keeper commits hash(seed) before the draw window opens.
    pub fn commit_draw(env: Env, seed_hash: BytesN<32>) {
        let cfg = Self::config(&env);
        cfg.admin.require_auth();
        env.storage().instance().set(
            &DataKey::PendingCommit,
            &PendingCommit {
                seed_hash,
                commit_ledger: env.ledger().sequence(),
            },
        );
    }

    /// Keeper reveals the seed. The contract verifies it hashes to the commit,
    /// mixes it with ledger entropy, picks a ticket-weighted winner, redeems
    /// ONLY the pot, pays the winner, and advances the epoch.
    pub fn reveal_draw(env: Env, seed: BytesN<32>) -> Address {
        let mut cfg = Self::config(&env);
        cfg.admin.require_auth();
        if env.ledger().sequence() < cfg.next_draw_ledger {
            panic_with_error!(&env, Error::DrawNotReady);
        }
        // A prior prize must be paid out before drawing again, or its redeemed
        // funds would be stranded.
        if env.storage().instance().has(&DataKey::PendingPrize) {
            panic_with_error!(&env, Error::PrizeUnclaimed);
        }
        let commit: PendingCommit = env
            .storage()
            .instance()
            .get(&DataKey::PendingCommit)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NoCommit));
        if env
            .crypto()
            .sha256(&Bytes::from_array(&env, &seed.to_array()))
            .to_bytes()
            != commit.seed_hash
        {
            panic_with_error!(&env, Error::BadReveal);
        }

        let winner = Self::pick_winner(&env, &seed);
        let prize = Self::pot(env.clone());
        if prize > 0 {
            // Redeem the yield out of Blend into this contract now (this touches
            // only our own position, so it is in the footprint), and record the
            // prize. Paying the winner is deferred to claim_prize: the winner is
            // chosen from execution-time entropy, so their trustline can't be in
            // this transaction's footprint, but it can in the claim, where the
            // winner is already fixed in storage.
            let this = env.current_contract_address();
            blend::redeem(&env, &cfg.blend_pool, &cfg.usdc_sac, &this, prize);
            env.storage().instance().set(
                &DataKey::PendingPrize,
                &Prize {
                    winner: winner.clone(),
                    amount: prize,
                    epoch: cfg.epoch,
                },
            );
        }

        cfg.epoch += 1;
        cfg.next_draw_ledger = env.ledger().sequence() + cfg.draw_interval;
        env.storage().instance().set(&DataKey::Config, &cfg);
        env.storage().instance().remove(&DataKey::PendingCommit);

        env.events().publish(
            (soroban_sdk::symbol_short!("draw"), winner.clone()),
            (prize, cfg.epoch),
        );
        winner
    }

    /// Pay out the recorded prize to the winner the draw picked. Permissionless:
    /// anyone can trigger it (the keeper does, right after reveal), and the funds
    /// only ever go to that winner. Kept separate from reveal_draw so the winner
    /// is fixed in storage and therefore in this transaction's footprint. No-op
    /// if there is nothing to pay.
    pub fn claim_prize(env: Env) -> Address {
        let cfg = Self::config(&env);
        let prize: Prize = match env.storage().instance().get(&DataKey::PendingPrize) {
            Some(p) => p,
            None => return env.current_contract_address(),
        };
        let this = env.current_contract_address();
        token::Client::new(&env, &cfg.usdc_sac).transfer(&this, &prize.winner, &prize.amount);
        env.storage().instance().remove(&DataKey::PendingPrize);
        env.events().publish(
            (soroban_sdk::symbol_short!("claim"), prize.winner.clone()),
            (prize.amount, prize.epoch),
        );
        prize.winner
    }

    // ---- internal helpers -----------------------------------------------

    fn pick_winner(env: &Env, seed: &BytesN<32>) -> Address {
        let savers = Self::savers(env);
        if savers.is_empty() {
            panic_with_error!(env, Error::NoSavers);
        }
        // Mix revealed seed with ledger entropy the keeper could not know at
        // commit time, then reduce to a u64 for weighted selection.
        let mut buf = Bytes::from_array(env, &seed.to_array());
        buf.extend_from_array(&env.ledger().sequence().to_be_bytes());
        buf.extend_from_array(&env.ledger().timestamp().to_be_bytes());
        let mixed = env.crypto().sha256(&buf).to_array();
        let mut r: u128 = 0;
        for i in 0..16 {
            r = (r << 8) | mixed[i] as u128;
        }

        let now = env.ledger().sequence() as u64;
        let total = Self::total_tickets(env.clone());
        if total <= 0 {
            // No weight yet: fall back to a uniform pick over savers.
            let idx = (r % savers.len() as u128) as u32;
            return savers.get(idx).unwrap();
        }
        let mut target = (r % total as u128) as i128;
        for a in savers.iter() {
            if let Some(d) = env
                .storage()
                .persistent()
                .get::<_, Deposit>(&DataKey::Deposit(a.clone()))
            {
                let w = ticket_weight(&d, now);
                if target < w {
                    return a;
                }
                target -= w;
            }
        }
        savers.get(0).unwrap() // unreachable if accounting is consistent
    }

    fn config(env: &Env) -> Config {
        env.storage()
            .instance()
            .get(&DataKey::Config)
            .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized))
    }

    fn total_principal(env: &Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalPrincipal)
            .unwrap_or(0)
    }

    fn savers(env: &Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::Savers)
            .unwrap_or_else(|| vec![env])
    }

    fn push_saver(env: &Env, a: &Address) {
        let mut s = Self::savers(env);
        s.push_back(a.clone());
        env.storage().instance().set(&DataKey::Savers, &s);
    }

    fn remove_saver(env: &Env, a: &Address) {
        let s = Self::savers(env);
        let mut out = Vec::new(env);
        for x in s.iter() {
            if x != *a {
                out.push_back(x);
            }
        }
        env.storage().instance().set(&DataKey::Savers, &out);
    }
}

/// Ticket weight = principal * ledgers held. Never negative.
fn ticket_weight(d: &Deposit, now: u64) -> i128 {
    let held = now.saturating_sub(d.weighted_since) as i128;
    d.amount.saturating_mul(held)
}

/// Amount-weighted average of two holding start ledgers.
/// new_since = (a_amt*a_since + b_amt*b_since) / (a_amt + b_amt)
fn weighted_avg_start(env: &Env, a_amt: i128, a_since: u64, b_amt: i128, b_since: u64) -> u64 {
    let num = (a_amt as u128)
        .checked_mul(a_since as u128)
        .and_then(|x| x.checked_add((b_amt as u128).checked_mul(b_since as u128)?))
        .unwrap_or_else(|| panic_with_error!(env, Error::Overflow));
    let den = (a_amt + b_amt) as u128;
    (num / den) as u64
}
