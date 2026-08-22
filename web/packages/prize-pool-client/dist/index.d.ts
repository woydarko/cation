import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions } from "@stellar/stellar-sdk/contract";
import type { u32, u64, i128 } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const networks: {
    readonly testnet: {
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CCH4D3UDFBESA7EXY7SPCZTM5CLJQGGOSO4B4XWBFSJCDUY5HRUSXKEB";
    };
};
export declare const Errors: {
    1: {
        message: string;
    };
    2: {
        message: string;
    };
    3: {
        message: string;
    };
    4: {
        message: string;
    };
    5: {
        message: string;
    };
    6: {
        message: string;
    };
    7: {
        message: string;
    };
    8: {
        message: string;
    };
    9: {
        message: string;
    };
    10: {
        message: string;
    };
    11: {
        message: string;
    };
    12: {
        message: string;
    };
};
/**
 * Global config, set once at initialize.
 */
export interface Config {
    admin: string;
    blend_pool: string;
    draw_interval: u32;
    epoch: u32;
    next_draw_ledger: u32;
    penalty_bps: u32;
    usdc_sac: string;
}
export type DataKey = {
    tag: "Config";
    values: void;
} | {
    tag: "TotalPrincipal";
    values: void;
} | {
    tag: "Deposit";
    values: readonly [string];
} | {
    tag: "Savers";
    values: void;
} | {
    tag: "PendingCommit";
    values: void;
};
/**
 * Per-user savings position.
 * Tickets are time-weighted: weight = amount * (now - weighted_since).
 * On a top-up, `weighted_since` is recomputed as a weighted average so
 * fresh money does not get the same weight as money held all week.
 */
export interface Deposit {
    amount: i128;
    lock_until: u64;
    weighted_since: u64;
}
/**
 * Commit-reveal draw state. Keeper commits hash(seed) then reveals seed.
 */
export interface PendingCommit {
    commit_ledger: u32;
    seed_hash: Buffer;
}
export interface Client {
    /**
     * Construct and simulate a pot transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Yield available to give away = current pool value - total principal.
     */
    pot: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Deposit USDC and earn time-weighted tickets. Optional strict lock:
     * `lock_until` is an absolute ledger, must sit 3..=90 days ahead, and 0
     * means no lock. Topping up an existing position recomputes the weighted
     * start as an amount-weighted average so fresh money is not over-credited.
     */
    deposit: ({ from, amount, lock_until }: {
        from: string;
        amount: i128;
        lock_until: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Withdraw principal. If the position is still locked and `force_early`
     * is false, this refuses (strict lock). If `force_early` is true, an
     * early exit is allowed for a penalty (`penalty_bps`); the penalty stays
     * in the pool and thus flows into the prize pot.
     */
    withdraw: ({ to, amount, force_early }: {
        to: string;
        amount: i128;
        force_early: boolean;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a balance_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Principal held by `user` (excludes any yield).
     */
    balance_of: ({ user }: {
        user: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a get_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Full config (admin, tokens, draw schedule, penalty, epoch). Read by the
     * UI to render the countdown, current epoch, and penalty rate.
     */
    get_config: (options?: MethodOptions) => Promise<AssembledTransaction<Config>>;
    /**
     * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * One-time setup. `penalty_bps` = early-exit penalty (e.g. 500 = 5%).
     */
    initialize: ({ admin, usdc_sac, blend_pool, draw_interval, penalty_bps }: {
        admin: string;
        usdc_sac: string;
        blend_pool: string;
        draw_interval: u32;
        penalty_bps: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a tickets_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * This user's current ticket weight (amount * ledgers held).
     */
    tickets_of: ({ user }: {
        user: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a commit_draw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Keeper commits hash(seed) before the draw window opens.
     */
    commit_draw: ({ seed_hash }: {
        seed_hash: Buffer;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a reveal_draw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Keeper reveals the seed. The contract verifies it hashes to the commit,
     * mixes it with ledger entropy, picks a ticket-weighted winner, redeems
     * ONLY the pot, pays the winner, and advances the epoch.
     */
    reveal_draw: ({ seed }: {
        seed: Buffer;
    }, options?: MethodOptions) => Promise<AssembledTransaction<string>>;
    /**
     * Construct and simulate a total_tickets transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Sum of all ticket weights right now (denominator for odds).
     */
    total_tickets: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a total_principal_view transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Total principal pooled across all savers.
     */
    total_principal_view: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        pot: (json: string) => AssembledTransaction<bigint>;
        deposit: (json: string) => AssembledTransaction<null>;
        withdraw: (json: string) => AssembledTransaction<null>;
        balance_of: (json: string) => AssembledTransaction<bigint>;
        get_config: (json: string) => AssembledTransaction<Config>;
        initialize: (json: string) => AssembledTransaction<null>;
        tickets_of: (json: string) => AssembledTransaction<bigint>;
        commit_draw: (json: string) => AssembledTransaction<null>;
        reveal_draw: (json: string) => AssembledTransaction<string>;
        total_tickets: (json: string) => AssembledTransaction<bigint>;
        total_principal_view: (json: string) => AssembledTransaction<bigint>;
    };
}
