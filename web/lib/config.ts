// Network + contract wiring. Testnet only for the Level 4 MVP.
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

// Deployed PrizePool (Circle USDC, deployed 2026-08-22). Keeper draws daily at 00:00 UTC.
export const PRIZE_POOL_ID =
  "CCH4D3UDFBESA7EXY7SPCZTM5CLJQGGOSO4B4XWBFSJCDUY5HRUSXKEB";

// Circle official USDC on testnet. Claim via https://faucet.circle.com/
export const USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
export const BLEND_POOL = "CAVWW7H5OAG6KT5XZVAUJC5VQGUNWMQRLG5J64QU6C2GOBQFAWWXBL74";

export const USDC_CODE = "USDC";
export const USDC_ISSUER = process.env.NEXT_PUBLIC_USDC_ISSUER ?? "";

export const USDC_DECIMALS = 7;
export const LEDGER_SECONDS = 5; // approx ledger close time on Stellar
