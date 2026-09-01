import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




export const Errors = {
  1: {message:"NotInitialized"},
  2: {message:"AlreadyInitialized"},
  3: {message:"NotAdmin"},
  4: {message:"ZeroAmount"},
  5: {message:"InsufficientBalance"},
  6: {message:"StillLocked"},
  7: {message:"BadLockRange"},
  8: {message:"DrawNotReady"},
  9: {message:"NoCommit"},
  10: {message:"BadReveal"},
  11: {message:"NoSavers"},
  12: {message:"Overflow"},
  13: {message:"PrizeUnclaimed"}
}


/**
 * A drawn-but-unpaid prize. reveal_draw records this (the winner is only known
 * at execution time, so paying there would need the winner's trustline in the
 * footprint); claim_prize pays it out where the winner is fixed.
 */
export interface Prize {
  amount: i128;
  epoch: u32;
  winner: string;
}


/**
 * Global config, set once at initialize.
 */
export interface Config {
  admin: string;
  blend_pool: string;
  draw_period: u64;
  epoch: u32;
  next_draw_ts: u64;
  penalty_bps: u32;
  usdc_sac: string;
}

export type DataKey = {tag: "Config", values: void} | {tag: "TotalPrincipal", values: void} | {tag: "Deposit", values: readonly [string]} | {tag: "Savers", values: void} | {tag: "PendingCommit", values: void} | {tag: "PendingPrize", values: void};


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
  pot: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposit USDC and earn time-weighted tickets. Optional strict lock:
   * `lock_until` is an absolute ledger, must sit 3..=90 days ahead, and 0
   * means no lock. Topping up an existing position recomputes the weighted
   * start as an amount-weighted average so fresh money is not over-credited.
   */
  deposit: ({from, amount, lock_until}: {from: string, amount: i128, lock_until: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw principal. If the position is still locked and `force_early`
   * is false, this refuses (strict lock). If `force_early` is true, an
   * early exit is allowed for a penalty (`penalty_bps`); the penalty stays
   * in the pool and thus flows into the prize pot.
   */
  withdraw: ({to, amount, force_early}: {to: string, amount: i128, force_early: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a balance_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Principal held by `user` (excludes any yield).
   */
  balance_of: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Full config (admin, tokens, draw schedule, penalty, epoch). Read by the
   * UI to render the countdown, current epoch, and penalty rate.
   */
  get_config: (options?: MethodOptions) => Promise<AssembledTransaction<Config>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * One-time setup. `penalty_bps` = early-exit penalty (e.g. 500 = 5%).
   */
  initialize: ({admin, usdc_sac, blend_pool, draw_period, penalty_bps}: {admin: string, usdc_sac: string, blend_pool: string, draw_period: u64, penalty_bps: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a tickets_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * This user's current ticket weight (amount * ledgers held).
   */
  tickets_of: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a claim_prize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Pay out the recorded prize to the winner the draw picked. Permissionless:
   * anyone can trigger it (the keeper does, right after reveal), and the funds
   * only ever go to that winner. Kept separate from reveal_draw so the winner
   * is fixed in storage and therefore in this transaction's footprint. No-op
   * if there is nothing to pay.
   */
  claim_prize: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a commit_draw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Keeper commits hash(seed) before the draw window opens.
   */
  commit_draw: ({seed_hash}: {seed_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a reveal_draw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Keeper reveals the seed. The contract verifies it hashes to the commit,
   * mixes it with ledger entropy, picks a ticket-weighted winner, redeems
   * ONLY the pot, pays the winner, and advances the epoch.
   */
  reveal_draw: ({seed}: {seed: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a total_tickets transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Sum of all ticket weights right now (denominator for odds).
   */
  total_tickets: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a total_principal_view transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Total principal pooled across all savers.
   */
  total_principal_view: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAERZaWVsZCBhdmFpbGFibGUgdG8gZ2l2ZSBhd2F5ID0gY3VycmVudCBwb29sIHZhbHVlIC0gdG90YWwgcHJpbmNpcGFsLgAAAANwb3QAAAAAAAAAAAEAAAAL",
        "AAAAAAAAARhEZXBvc2l0IFVTREMgYW5kIGVhcm4gdGltZS13ZWlnaHRlZCB0aWNrZXRzLiBPcHRpb25hbCBzdHJpY3QgbG9jazoKYGxvY2tfdW50aWxgIGlzIGFuIGFic29sdXRlIGxlZGdlciwgbXVzdCBzaXQgMy4uPTkwIGRheXMgYWhlYWQsIGFuZCAwCm1lYW5zIG5vIGxvY2suIFRvcHBpbmcgdXAgYW4gZXhpc3RpbmcgcG9zaXRpb24gcmVjb21wdXRlcyB0aGUgd2VpZ2h0ZWQKc3RhcnQgYXMgYW4gYW1vdW50LXdlaWdodGVkIGF2ZXJhZ2Ugc28gZnJlc2ggbW9uZXkgaXMgbm90IG92ZXItY3JlZGl0ZWQuAAAAB2RlcG9zaXQAAAAAAwAAAAAAAAAEZnJvbQAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAKbG9ja191bnRpbAAAAAAABgAAAAA=",
        "AAAAAAAAAP5XaXRoZHJhdyBwcmluY2lwYWwuIElmIHRoZSBwb3NpdGlvbiBpcyBzdGlsbCBsb2NrZWQgYW5kIGBmb3JjZV9lYXJseWAKaXMgZmFsc2UsIHRoaXMgcmVmdXNlcyAoc3RyaWN0IGxvY2spLiBJZiBgZm9yY2VfZWFybHlgIGlzIHRydWUsIGFuCmVhcmx5IGV4aXQgaXMgYWxsb3dlZCBmb3IgYSBwZW5hbHR5IChgcGVuYWx0eV9icHNgKTsgdGhlIHBlbmFsdHkgc3RheXMKaW4gdGhlIHBvb2wgYW5kIHRodXMgZmxvd3MgaW50byB0aGUgcHJpemUgcG90LgAAAAAACHdpdGhkcmF3AAAAAwAAAAAAAAACdG8AAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAALZm9yY2VfZWFybHkAAAAAAQAAAAA=",
        "AAAAAAAAAC5QcmluY2lwYWwgaGVsZCBieSBgdXNlcmAgKGV4Y2x1ZGVzIGFueSB5aWVsZCkuAAAAAAAKYmFsYW5jZV9vZgAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAACw==",
        "AAAAAAAAAIRGdWxsIGNvbmZpZyAoYWRtaW4sIHRva2VucywgZHJhdyBzY2hlZHVsZSwgcGVuYWx0eSwgZXBvY2gpLiBSZWFkIGJ5IHRoZQpVSSB0byByZW5kZXIgdGhlIGNvdW50ZG93biwgY3VycmVudCBlcG9jaCwgYW5kIHBlbmFsdHkgcmF0ZS4AAAAKZ2V0X2NvbmZpZwAAAAAAAAAAAAEAAAfQAAAABkNvbmZpZwAA",
        "AAAAAAAAAENPbmUtdGltZSBzZXR1cC4gYHBlbmFsdHlfYnBzYCA9IGVhcmx5LWV4aXQgcGVuYWx0eSAoZS5nLiA1MDAgPSA1JSkuAAAAAAppbml0aWFsaXplAAAAAAAFAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAACHVzZGNfc2FjAAAAEwAAAAAAAAAKYmxlbmRfcG9vbAAAAAAAEwAAAAAAAAALZHJhd19wZXJpb2QAAAAABgAAAAAAAAALcGVuYWx0eV9icHMAAAAABAAAAAA=",
        "AAAAAAAAADpUaGlzIHVzZXIncyBjdXJyZW50IHRpY2tldCB3ZWlnaHQgKGFtb3VudCAqIGxlZGdlcnMgaGVsZCkuAAAAAAAKdGlja2V0c19vZgAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAACw==",
        "AAAAAAAAAUNQYXkgb3V0IHRoZSByZWNvcmRlZCBwcml6ZSB0byB0aGUgd2lubmVyIHRoZSBkcmF3IHBpY2tlZC4gUGVybWlzc2lvbmxlc3M6CmFueW9uZSBjYW4gdHJpZ2dlciBpdCAodGhlIGtlZXBlciBkb2VzLCByaWdodCBhZnRlciByZXZlYWwpLCBhbmQgdGhlIGZ1bmRzCm9ubHkgZXZlciBnbyB0byB0aGF0IHdpbm5lci4gS2VwdCBzZXBhcmF0ZSBmcm9tIHJldmVhbF9kcmF3IHNvIHRoZSB3aW5uZXIKaXMgZml4ZWQgaW4gc3RvcmFnZSBhbmQgdGhlcmVmb3JlIGluIHRoaXMgdHJhbnNhY3Rpb24ncyBmb290cHJpbnQuIE5vLW9wCmlmIHRoZXJlIGlzIG5vdGhpbmcgdG8gcGF5LgAAAAALY2xhaW1fcHJpemUAAAAAAAAAAAEAAAAT",
        "AAAAAAAAADdLZWVwZXIgY29tbWl0cyBoYXNoKHNlZWQpIGJlZm9yZSB0aGUgZHJhdyB3aW5kb3cgb3BlbnMuAAAAAAtjb21taXRfZHJhdwAAAAABAAAAAAAAAAlzZWVkX2hhc2gAAAAAAAPuAAAAIAAAAAA=",
        "AAAAAAAAAMRLZWVwZXIgcmV2ZWFscyB0aGUgc2VlZC4gVGhlIGNvbnRyYWN0IHZlcmlmaWVzIGl0IGhhc2hlcyB0byB0aGUgY29tbWl0LAptaXhlcyBpdCB3aXRoIGxlZGdlciBlbnRyb3B5LCBwaWNrcyBhIHRpY2tldC13ZWlnaHRlZCB3aW5uZXIsIHJlZGVlbXMKT05MWSB0aGUgcG90LCBwYXlzIHRoZSB3aW5uZXIsIGFuZCBhZHZhbmNlcyB0aGUgZXBvY2guAAAAC3JldmVhbF9kcmF3AAAAAAEAAAAAAAAABHNlZWQAAAPuAAAAIAAAAAEAAAAT",
        "AAAAAAAAADtTdW0gb2YgYWxsIHRpY2tldCB3ZWlnaHRzIHJpZ2h0IG5vdyAoZGVub21pbmF0b3IgZm9yIG9kZHMpLgAAAAANdG90YWxfdGlja2V0cwAAAAAAAAAAAAABAAAACw==",
        "AAAAAAAAAClUb3RhbCBwcmluY2lwYWwgcG9vbGVkIGFjcm9zcyBhbGwgc2F2ZXJzLgAAAAAAABR0b3RhbF9wcmluY2lwYWxfdmlldwAAAAAAAAABAAAACw==",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADQAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAAEkFscmVhZHlJbml0aWFsaXplZAAAAAAAAgAAAAAAAAAITm90QWRtaW4AAAADAAAAAAAAAApaZXJvQW1vdW50AAAAAAAEAAAAAAAAABNJbnN1ZmZpY2llbnRCYWxhbmNlAAAAAAUAAAAAAAAAC1N0aWxsTG9ja2VkAAAAAAYAAAAAAAAADEJhZExvY2tSYW5nZQAAAAcAAAAAAAAADERyYXdOb3RSZWFkeQAAAAgAAAAAAAAACE5vQ29tbWl0AAAACQAAAAAAAAAJQmFkUmV2ZWFsAAAAAAAACgAAAAAAAAAITm9TYXZlcnMAAAALAAAAAAAAAAhPdmVyZmxvdwAAAAwAAAAAAAAADlByaXplVW5jbGFpbWVkAAAAAAAN",
        "AAAAAQAAANdBIGRyYXduLWJ1dC11bnBhaWQgcHJpemUuIHJldmVhbF9kcmF3IHJlY29yZHMgdGhpcyAodGhlIHdpbm5lciBpcyBvbmx5IGtub3duCmF0IGV4ZWN1dGlvbiB0aW1lLCBzbyBwYXlpbmcgdGhlcmUgd291bGQgbmVlZCB0aGUgd2lubmVyJ3MgdHJ1c3RsaW5lIGluIHRoZQpmb290cHJpbnQpOyBjbGFpbV9wcml6ZSBwYXlzIGl0IG91dCB3aGVyZSB0aGUgd2lubmVyIGlzIGZpeGVkLgAAAAAAAAAABVByaXplAAAAAAAAAwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAVlcG9jaAAAAAAAAAQAAAAAAAAABndpbm5lcgAAAAAAEw==",
        "AAAAAQAAACZHbG9iYWwgY29uZmlnLCBzZXQgb25jZSBhdCBpbml0aWFsaXplLgAAAAAAAAAAAAZDb25maWcAAAAAAAcAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAKYmxlbmRfcG9vbAAAAAAAEwAAAAAAAAALZHJhd19wZXJpb2QAAAAABgAAAAAAAAAFZXBvY2gAAAAAAAAEAAAAAAAAAAxuZXh0X2RyYXdfdHMAAAAGAAAAAAAAAAtwZW5hbHR5X2JwcwAAAAAEAAAAAAAAAAh1c2RjX3NhYwAAABM=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABgAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAAAAAAAAAAAOVG90YWxQcmluY2lwYWwAAAAAAAEAAAAAAAAAB0RlcG9zaXQAAAAAAQAAABMAAAAAAAAAAAAAAAZTYXZlcnMAAAAAAAAAAAAAAAAADVBlbmRpbmdDb21taXQAAAAAAAAAAAAAAAAAAAxQZW5kaW5nUHJpemU=",
        "AAAAAQAAAOVQZXItdXNlciBzYXZpbmdzIHBvc2l0aW9uLgpUaWNrZXRzIGFyZSB0aW1lLXdlaWdodGVkOiB3ZWlnaHQgPSBhbW91bnQgKiAobm93IC0gd2VpZ2h0ZWRfc2luY2UpLgpPbiBhIHRvcC11cCwgYHdlaWdodGVkX3NpbmNlYCBpcyByZWNvbXB1dGVkIGFzIGEgd2VpZ2h0ZWQgYXZlcmFnZSBzbwpmcmVzaCBtb25leSBkb2VzIG5vdCBnZXQgdGhlIHNhbWUgd2VpZ2h0IGFzIG1vbmV5IGhlbGQgYWxsIHdlZWsuAAAAAAAAAAAAAAdEZXBvc2l0AAAAAAMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAKbG9ja191bnRpbAAAAAAABgAAAAAAAAAOd2VpZ2h0ZWRfc2luY2UAAAAAAAY=",
        "AAAAAQAAAEZDb21taXQtcmV2ZWFsIGRyYXcgc3RhdGUuIEtlZXBlciBjb21taXRzIGhhc2goc2VlZCkgdGhlbiByZXZlYWxzIHNlZWQuAAAAAAAAAAAADVBlbmRpbmdDb21taXQAAAAAAAACAAAAAAAAAA1jb21taXRfbGVkZ2VyAAAAAAAABAAAAAAAAAAJc2VlZF9oYXNoAAAAAAAD7gAAACA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    pot: this.txFromJSON<i128>,
        deposit: this.txFromJSON<null>,
        withdraw: this.txFromJSON<null>,
        balance_of: this.txFromJSON<i128>,
        get_config: this.txFromJSON<Config>,
        initialize: this.txFromJSON<null>,
        tickets_of: this.txFromJSON<i128>,
        claim_prize: this.txFromJSON<string>,
        commit_draw: this.txFromJSON<null>,
        reveal_draw: this.txFromJSON<string>,
        total_tickets: this.txFromJSON<i128>,
        total_principal_view: this.txFromJSON<i128>
  }
}