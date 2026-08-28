#![cfg(test)]
use crate::{PrizePool, PrizePoolClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token, Address, Bytes, BytesN, Env,
};

struct Setup {
    env: Env,
    pool: PrizePoolClient<'static>,
    usdc: Address,
    #[allow(dead_code)]
    admin: Address,
}

fn setup(penalty_bps: u32, draw_interval: u32) -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);

    let usdc = env.register_stellar_asset_contract_v2(admin.clone());
    let usdc_addr = usdc.address();
    let blend_pool = Address::generate(&env); // unused in custody model

    let pool_addr = env.register(PrizePool, ());
    let pool = PrizePoolClient::new(&env, &pool_addr);
    pool.initialize(
        &admin,
        &usdc_addr,
        &blend_pool,
        &draw_interval,
        &penalty_bps,
    );

    Setup {
        env,
        pool,
        usdc: usdc_addr,
        admin,
    }
}

fn mint(s: &Setup, to: &Address, amount: i128) {
    token::StellarAssetClient::new(&s.env, &s.usdc).mint(to, &amount);
}

fn deposit(s: &Setup, user: &Address, amount: i128, lock_until: u64) {
    mint(s, user, amount);
    token::Client::new(&s.env, &s.usdc).approve(
        user,
        &s.pool.address,
        &amount,
        &(s.env.ledger().sequence() + 100_000),
    );
    s.pool.deposit(user, &amount, &lock_until);
}

/// Simulate Blend yield accruing: pool value rises above total principal.
fn accrue_yield(s: &Setup, amount: i128) {
    token::StellarAssetClient::new(&s.env, &s.usdc).mint(&s.pool.address, &amount);
}

fn bal(s: &Setup, a: &Address) -> i128 {
    token::Client::new(&s.env, &s.usdc).balance(a)
}

#[test]
fn deposit_then_full_withdraw_is_no_loss() {
    let s = setup(0, 10);
    let u = Address::generate(&s.env);
    deposit(&s, &u, 100, 0);

    assert_eq!(s.pool.balance_of(&u), 100);
    assert_eq!(s.pool.pot(), 0); // no yield yet

    s.pool.withdraw(&u, &100, &false);
    assert_eq!(s.pool.balance_of(&u), 0);
    assert_eq!(bal(&s, &u), 100); // principal fully returned
}

#[test]
fn draw_pays_only_yield_principal_intact() {
    let s = setup(0, 10);
    let a = Address::generate(&s.env);
    let b = Address::generate(&s.env);
    deposit(&s, &a, 100, 0);
    deposit(&s, &b, 300, 0);

    accrue_yield(&s, 40); // pot = 40
    assert_eq!(s.pool.pot(), 40);

    // advance past the draw window and hold time for tickets
    s.env.ledger().with_mut(|l| l.sequence_number += 20);

    let seed = BytesN::from_array(&s.env, &[7u8; 32]);
    let seed_hash = s
        .env
        .crypto()
        .sha256(&Bytes::from_array(&s.env, &[7u8; 32]))
        .to_bytes();
    s.pool.commit_draw(&seed_hash);
    let winner = s.pool.reveal_draw(&seed);

    // reveal records the prize but does not pay yet (winner claims separately)
    assert_eq!(bal(&s, &winner), 0);

    let paid_to = s.pool.claim_prize();
    assert_eq!(paid_to, winner);
    // winner got the full pot, pot now empty, principals untouched
    assert_eq!(bal(&s, &winner), 40);
    assert_eq!(s.pool.pot(), 0);
    assert_eq!(s.pool.balance_of(&a), 100);
    assert_eq!(s.pool.balance_of(&b), 300);
}

#[test]
fn cannot_draw_again_with_unclaimed_prize() {
    let s = setup(0, 10);
    let a = Address::generate(&s.env);
    deposit(&s, &a, 100, 0);
    accrue_yield(&s, 40);
    s.env.ledger().with_mut(|l| l.sequence_number += 20);

    let seed = BytesN::from_array(&s.env, &[7u8; 32]);
    let seed_hash = s
        .env
        .crypto()
        .sha256(&Bytes::from_array(&s.env, &[7u8; 32]))
        .to_bytes();
    s.pool.commit_draw(&seed_hash);
    s.pool.reveal_draw(&seed);

    // a second draw before claiming the first prize is rejected
    s.env.ledger().with_mut(|l| l.sequence_number += 20);
    s.pool.commit_draw(&seed_hash);
    assert!(s.pool.try_reveal_draw(&seed).is_err());

    // after claiming, the next draw works
    s.pool.claim_prize();
    assert_eq!(bal(&s, &a), 40);
}

#[test]
#[should_panic] // StillLocked
fn strict_lock_blocks_early_withdraw() {
    let s = setup(500, 10);
    let u = Address::generate(&s.env);
    let lock_until = s.env.ledger().sequence() as u64 + 3 * 17_280 + 100;
    deposit(&s, &u, 100, lock_until);
    s.pool.withdraw(&u, &100, &false); // no force -> panic
}

#[test]
fn early_exit_penalty_flows_to_pot() {
    let s = setup(500, 10); // 5% penalty
    let u = Address::generate(&s.env);
    let lock_until = s.env.ledger().sequence() as u64 + 3 * 17_280 + 100;
    deposit(&s, &u, 100, lock_until);

    s.pool.withdraw(&u, &100, &true); // force early exit
    assert_eq!(bal(&s, &u), 95); // got 95, penalty 5 withheld
    assert_eq!(s.pool.balance_of(&u), 0);
    assert_eq!(s.pool.pot(), 5); // penalty became pot
}

#[test]
fn bad_lock_range_rejected() {
    let s = setup(0, 10);
    let u = Address::generate(&s.env);
    mint(&s, &u, 100);
    token::Client::new(&s.env, &s.usdc).approve(
        &u,
        &s.pool.address,
        &100,
        &(s.env.ledger().sequence() + 100_000),
    );
    // only 1 day out -> below 3-day minimum
    let too_short = s.env.ledger().sequence() as u64 + 17_280;
    let r = s.pool.try_deposit(&u, &100, &too_short);
    assert!(r.is_err());
}

#[test]
fn sum_principal_invariant_holds() {
    let s = setup(0, 10);
    let a = Address::generate(&s.env);
    let b = Address::generate(&s.env);
    deposit(&s, &a, 100, 0);
    deposit(&s, &b, 250, 0);
    s.pool.withdraw(&a, &40, &false);
    // total_principal == 60 + 250 == 310, and pot stays 0 (no yield)
    assert_eq!(s.pool.balance_of(&a), 60);
    assert_eq!(s.pool.balance_of(&b), 250);
    assert_eq!(s.pool.pot(), 0);
}
