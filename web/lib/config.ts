// Network + contract wiring. Testnet only for the Level 4 MVP.
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

// Deployed PrizePool (Circle USDC + active Blend pool). Keeper draws daily at 00:00 UTC.
export const PRIZE_POOL_ID =
  "CA2R26QQEXNMQ6CXFINDKPKTEDUWV6E3OWSHPMEO62PSNOYR2QZ4QILW";

// Circle official USDC on testnet. Claim via https://faucet.circle.com/
export const USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
// Active Blend pool (status 0) with Circle USDC as a reserve.
export const BLEND_POOL = "CDCCWAQCFXSJOWTYQRI4NPBVGC3NQDR3626MLOEAWLHXUECCASSW5ZPX";

export const USDC_CODE = "USDC";
// Circle's official testnet USDC issuer (public). Overridable via env for other networks.
export const USDC_ISSUER =
  process.env.NEXT_PUBLIC_USDC_ISSUER ??
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export const USDC_DECIMALS = 7;
export const LEDGER_SECONDS = 5; // approx ledger close time on Stellar

// Anonymous beta feedback form (Google Forms). Enters a monthly $USDG raffle.
export const FEEDBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfGVy1i2Nh0uQni2akNtCSQ_gsmgT0oPM9xbidhPcg2ynTiIA/viewform";
