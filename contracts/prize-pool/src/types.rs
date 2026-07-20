use soroban_sdk::{contracterror, contracttype, Address, BytesN};

/// Global config, set once at initialize.
#[contracttype]
#[derive(Clone)]
pub struct Config {
    pub admin: Address,
    pub usdc_sac: Address,     // USDC Stellar Asset Contract
    pub blend_pool: Address,   // Blend pool the USDC is supplied to
    pub draw_interval: u32,    // ledgers between draws
    pub next_draw_ledger: u32, // ledger when next draw becomes eligible
    pub penalty_bps: u32,      // early-exit penalty, basis points (500 = 5%)
    pub epoch: u32,            // current draw epoch
}

/// Per-user savings position.
/// Tickets are time-weighted: weight = amount * (now - weighted_since).
/// On a top-up, `weighted_since` is recomputed as a weighted average so
/// fresh money does not get the same weight as money held all week.
#[contracttype]
#[derive(Clone)]
pub struct Deposit {
    pub amount: i128,           // principal held, in USDC stroops
    pub weighted_since: u64,    // effective start ledger for weighting
    pub lock_until: u64,        // 0 = no lock, else ledger before which strict-locked
}

/// Commit-reveal draw state. Keeper commits hash(seed) then reveals seed.
#[contracttype]
#[derive(Clone)]
pub struct PendingCommit {
    pub seed_hash: BytesN<32>,
    pub commit_ledger: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Config,
    TotalPrincipal,
    Deposit(Address),
    Savers,          // Vec<Address> iterated at draw time
    PendingCommit,
}

#[contracterror]
#[derive(Clone, Copy, PartialEq, Debug)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAdmin = 3,
    ZeroAmount = 4,
    InsufficientBalance = 5,
    StillLocked = 6,        // strict lock, no early exit requested
    BadLockRange = 7,       // lock outside 3d..90d
    DrawNotReady = 8,
    NoCommit = 9,
    BadReveal = 10,         // revealed seed does not match committed hash
    NoSavers = 11,
    Overflow = 12,
}
