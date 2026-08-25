import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
if (typeof window !== "undefined") {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CA2R26QQEXNMQ6CXFINDKPKTEDUWV6E3OWSHPMEO62PSNOYR2QZ4QILW",
    }
};
export const Errors = {
    1: { message: "NotInitialized" },
    2: { message: "AlreadyInitialized" },
    3: { message: "NotAdmin" },
    4: { message: "ZeroAmount" },
    5: { message: "InsufficientBalance" },
    6: { message: "StillLocked" },
    7: { message: "BadLockRange" },
    8: { message: "DrawNotReady" },
    9: { message: "NoCommit" },
    10: { message: "BadReveal" },
    11: { message: "NoSavers" },
    12: { message: "Overflow" },
    13: { message: "PrizeUnclaimed" }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAAERZaWVsZCBhdmFpbGFibGUgdG8gZ2l2ZSBhd2F5ID0gY3VycmVudCBwb29sIHZhbHVlIC0gdG90YWwgcHJpbmNpcGFsLgAAAANwb3QAAAAAAAAAAAEAAAAL",
            "AAAAAAAAARhEZXBvc2l0IFVTREMgYW5kIGVhcm4gdGltZS13ZWlnaHRlZCB0aWNrZXRzLiBPcHRpb25hbCBzdHJpY3QgbG9jazoKYGxvY2tfdW50aWxgIGlzIGFuIGFic29sdXRlIGxlZGdlciwgbXVzdCBzaXQgMy4uPTkwIGRheXMgYWhlYWQsIGFuZCAwCm1lYW5zIG5vIGxvY2suIFRvcHBpbmcgdXAgYW4gZXhpc3RpbmcgcG9zaXRpb24gcmVjb21wdXRlcyB0aGUgd2VpZ2h0ZWQKc3RhcnQgYXMgYW4gYW1vdW50LXdlaWdodGVkIGF2ZXJhZ2Ugc28gZnJlc2ggbW9uZXkgaXMgbm90IG92ZXItY3JlZGl0ZWQuAAAAB2RlcG9zaXQAAAAAAwAAAAAAAAAEZnJvbQAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAKbG9ja191bnRpbAAAAAAABgAAAAA=",
            "AAAAAAAAAP5XaXRoZHJhdyBwcmluY2lwYWwuIElmIHRoZSBwb3NpdGlvbiBpcyBzdGlsbCBsb2NrZWQgYW5kIGBmb3JjZV9lYXJseWAKaXMgZmFsc2UsIHRoaXMgcmVmdXNlcyAoc3RyaWN0IGxvY2spLiBJZiBgZm9yY2VfZWFybHlgIGlzIHRydWUsIGFuCmVhcmx5IGV4aXQgaXMgYWxsb3dlZCBmb3IgYSBwZW5hbHR5IChgcGVuYWx0eV9icHNgKTsgdGhlIHBlbmFsdHkgc3RheXMKaW4gdGhlIHBvb2wgYW5kIHRodXMgZmxvd3MgaW50byB0aGUgcHJpemUgcG90LgAAAAAACHdpdGhkcmF3AAAAAwAAAAAAAAACdG8AAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAALZm9yY2VfZWFybHkAAAAAAQAAAAA=",
            "AAAAAAAAAC5QcmluY2lwYWwgaGVsZCBieSBgdXNlcmAgKGV4Y2x1ZGVzIGFueSB5aWVsZCkuAAAAAAAKYmFsYW5jZV9vZgAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAACw==",
            "AAAAAAAAAIRGdWxsIGNvbmZpZyAoYWRtaW4sIHRva2VucywgZHJhdyBzY2hlZHVsZSwgcGVuYWx0eSwgZXBvY2gpLiBSZWFkIGJ5IHRoZQpVSSB0byByZW5kZXIgdGhlIGNvdW50ZG93biwgY3VycmVudCBlcG9jaCwgYW5kIHBlbmFsdHkgcmF0ZS4AAAAKZ2V0X2NvbmZpZwAAAAAAAAAAAAEAAAfQAAAABkNvbmZpZwAA",
            "AAAAAAAAAENPbmUtdGltZSBzZXR1cC4gYHBlbmFsdHlfYnBzYCA9IGVhcmx5LWV4aXQgcGVuYWx0eSAoZS5nLiA1MDAgPSA1JSkuAAAAAAppbml0aWFsaXplAAAAAAAFAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAACHVzZGNfc2FjAAAAEwAAAAAAAAAKYmxlbmRfcG9vbAAAAAAAEwAAAAAAAAANZHJhd19pbnRlcnZhbAAAAAAAAAQAAAAAAAAAC3BlbmFsdHlfYnBzAAAAAAQAAAAA",
            "AAAAAAAAADpUaGlzIHVzZXIncyBjdXJyZW50IHRpY2tldCB3ZWlnaHQgKGFtb3VudCAqIGxlZGdlcnMgaGVsZCkuAAAAAAAKdGlja2V0c19vZgAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAACw==",
            "AAAAAAAAAUNQYXkgb3V0IHRoZSByZWNvcmRlZCBwcml6ZSB0byB0aGUgd2lubmVyIHRoZSBkcmF3IHBpY2tlZC4gUGVybWlzc2lvbmxlc3M6CmFueW9uZSBjYW4gdHJpZ2dlciBpdCAodGhlIGtlZXBlciBkb2VzLCByaWdodCBhZnRlciByZXZlYWwpLCBhbmQgdGhlIGZ1bmRzCm9ubHkgZXZlciBnbyB0byB0aGF0IHdpbm5lci4gS2VwdCBzZXBhcmF0ZSBmcm9tIHJldmVhbF9kcmF3IHNvIHRoZSB3aW5uZXIKaXMgZml4ZWQgaW4gc3RvcmFnZSBhbmQgdGhlcmVmb3JlIGluIHRoaXMgdHJhbnNhY3Rpb24ncyBmb290cHJpbnQuIE5vLW9wCmlmIHRoZXJlIGlzIG5vdGhpbmcgdG8gcGF5LgAAAAALY2xhaW1fcHJpemUAAAAAAAAAAAEAAAAT",
            "AAAAAAAAADdLZWVwZXIgY29tbWl0cyBoYXNoKHNlZWQpIGJlZm9yZSB0aGUgZHJhdyB3aW5kb3cgb3BlbnMuAAAAAAtjb21taXRfZHJhdwAAAAABAAAAAAAAAAlzZWVkX2hhc2gAAAAAAAPuAAAAIAAAAAA=",
            "AAAAAAAAAMRLZWVwZXIgcmV2ZWFscyB0aGUgc2VlZC4gVGhlIGNvbnRyYWN0IHZlcmlmaWVzIGl0IGhhc2hlcyB0byB0aGUgY29tbWl0LAptaXhlcyBpdCB3aXRoIGxlZGdlciBlbnRyb3B5LCBwaWNrcyBhIHRpY2tldC13ZWlnaHRlZCB3aW5uZXIsIHJlZGVlbXMKT05MWSB0aGUgcG90LCBwYXlzIHRoZSB3aW5uZXIsIGFuZCBhZHZhbmNlcyB0aGUgZXBvY2guAAAAC3JldmVhbF9kcmF3AAAAAAEAAAAAAAAABHNlZWQAAAPuAAAAIAAAAAEAAAAT",
            "AAAAAAAAADtTdW0gb2YgYWxsIHRpY2tldCB3ZWlnaHRzIHJpZ2h0IG5vdyAoZGVub21pbmF0b3IgZm9yIG9kZHMpLgAAAAANdG90YWxfdGlja2V0cwAAAAAAAAAAAAABAAAACw==",
            "AAAAAAAAAClUb3RhbCBwcmluY2lwYWwgcG9vbGVkIGFjcm9zcyBhbGwgc2F2ZXJzLgAAAAAAABR0b3RhbF9wcmluY2lwYWxfdmlldwAAAAAAAAABAAAACw==",
            "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADQAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAAEkFscmVhZHlJbml0aWFsaXplZAAAAAAAAgAAAAAAAAAITm90QWRtaW4AAAADAAAAAAAAAApaZXJvQW1vdW50AAAAAAAEAAAAAAAAABNJbnN1ZmZpY2llbnRCYWxhbmNlAAAAAAUAAAAAAAAAC1N0aWxsTG9ja2VkAAAAAAYAAAAAAAAADEJhZExvY2tSYW5nZQAAAAcAAAAAAAAADERyYXdOb3RSZWFkeQAAAAgAAAAAAAAACE5vQ29tbWl0AAAACQAAAAAAAAAJQmFkUmV2ZWFsAAAAAAAACgAAAAAAAAAITm9TYXZlcnMAAAALAAAAAAAAAAhPdmVyZmxvdwAAAAwAAAAAAAAADlByaXplVW5jbGFpbWVkAAAAAAAN",
            "AAAAAQAAANdBIGRyYXduLWJ1dC11bnBhaWQgcHJpemUuIHJldmVhbF9kcmF3IHJlY29yZHMgdGhpcyAodGhlIHdpbm5lciBpcyBvbmx5IGtub3duCmF0IGV4ZWN1dGlvbiB0aW1lLCBzbyBwYXlpbmcgdGhlcmUgd291bGQgbmVlZCB0aGUgd2lubmVyJ3MgdHJ1c3RsaW5lIGluIHRoZQpmb290cHJpbnQpOyBjbGFpbV9wcml6ZSBwYXlzIGl0IG91dCB3aGVyZSB0aGUgd2lubmVyIGlzIGZpeGVkLgAAAAAAAAAABVByaXplAAAAAAAAAwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAVlcG9jaAAAAAAAAAQAAAAAAAAABndpbm5lcgAAAAAAEw==",
            "AAAAAQAAACZHbG9iYWwgY29uZmlnLCBzZXQgb25jZSBhdCBpbml0aWFsaXplLgAAAAAAAAAAAAZDb25maWcAAAAAAAcAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAKYmxlbmRfcG9vbAAAAAAAEwAAAAAAAAANZHJhd19pbnRlcnZhbAAAAAAAAAQAAAAAAAAABWVwb2NoAAAAAAAABAAAAAAAAAAQbmV4dF9kcmF3X2xlZGdlcgAAAAQAAAAAAAAAC3BlbmFsdHlfYnBzAAAAAAQAAAAAAAAACHVzZGNfc2FjAAAAEw==",
            "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABgAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAAAAAAAAAAAOVG90YWxQcmluY2lwYWwAAAAAAAEAAAAAAAAAB0RlcG9zaXQAAAAAAQAAABMAAAAAAAAAAAAAAAZTYXZlcnMAAAAAAAAAAAAAAAAADVBlbmRpbmdDb21taXQAAAAAAAAAAAAAAAAAAAxQZW5kaW5nUHJpemU=",
            "AAAAAQAAAOVQZXItdXNlciBzYXZpbmdzIHBvc2l0aW9uLgpUaWNrZXRzIGFyZSB0aW1lLXdlaWdodGVkOiB3ZWlnaHQgPSBhbW91bnQgKiAobm93IC0gd2VpZ2h0ZWRfc2luY2UpLgpPbiBhIHRvcC11cCwgYHdlaWdodGVkX3NpbmNlYCBpcyByZWNvbXB1dGVkIGFzIGEgd2VpZ2h0ZWQgYXZlcmFnZSBzbwpmcmVzaCBtb25leSBkb2VzIG5vdCBnZXQgdGhlIHNhbWUgd2VpZ2h0IGFzIG1vbmV5IGhlbGQgYWxsIHdlZWsuAAAAAAAAAAAAAAdEZXBvc2l0AAAAAAMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAKbG9ja191bnRpbAAAAAAABgAAAAAAAAAOd2VpZ2h0ZWRfc2luY2UAAAAAAAY=",
            "AAAAAQAAAEZDb21taXQtcmV2ZWFsIGRyYXcgc3RhdGUuIEtlZXBlciBjb21taXRzIGhhc2goc2VlZCkgdGhlbiByZXZlYWxzIHNlZWQuAAAAAAAAAAAADVBlbmRpbmdDb21taXQAAAAAAAACAAAAAAAAAA1jb21taXRfbGVkZ2VyAAAAAAAABAAAAAAAAAAJc2VlZF9oYXNoAAAAAAAD7gAAACA="]), options);
        this.options = options;
    }
    fromJSON = {
        pot: (this.txFromJSON),
        deposit: (this.txFromJSON),
        withdraw: (this.txFromJSON),
        balance_of: (this.txFromJSON),
        get_config: (this.txFromJSON),
        initialize: (this.txFromJSON),
        tickets_of: (this.txFromJSON),
        claim_prize: (this.txFromJSON),
        commit_draw: (this.txFromJSON),
        reveal_draw: (this.txFromJSON),
        total_tickets: (this.txFromJSON),
        total_principal_view: (this.txFromJSON)
    };
}
