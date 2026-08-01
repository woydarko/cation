// Network + contract wiring. Testnet only for the Level 4 MVP.
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

// Deployed PrizePool (app instance). Small on-chain interval (720 ledgers) so
// the draw window is always open; the keeper cron draws daily at 00:00 UTC,
// which is the real cadence. The UI counts down to the next 00:00 UTC.
export const PRIZE_POOL_ID =
  "CBYVO73FY7TEWETJ7KCCVXREJOXFPEJEKIXCHUGHJFUCN4OJSGSZ66EH";

// Our controllable Blend stack, so USDC is mintable for onboarding.
export const USDC_SAC = "CASWO3VWUS5LQNESTAOL2FJPPPCEV6BT27UVBED2JUYNSRV5QNEB2KKI";
export const BLEND_POOL = "CAYFESJVBO2OLTRYGYDS46MLDKONFYCRSE4HEJ3D75LCIDHF63RA22LY";

export const USDC_CODE = "USDC";
export const USDC_ISSUER = process.env.NEXT_PUBLIC_USDC_ISSUER ?? "";

export const USDC_DECIMALS = 7;
export const LEDGER_SECONDS = 5; // approx ledger close time on Stellar
