# User Feedback Summary

Feedback collected from beta testers via a Google Form during the Cation
testnet beta. Testers connected a wallet, explored the app, and in most cases
deposited test USDC before answering. This is a running summary and is updated
as more responses arrive.

**Responses so far:** 2 (target: 10)
**Collection window:** started 2026-08-23
**NPS so far:** 8 and 10 (avg 9)
**Form:** optional wallet fields used only for the $USDG raffle and to match
feedback to real on-chain usage.

---

## Who tested it
- 2 developer-type users, crypto-aware.
- Reached through direct share (WhatsApp / dev contacts).

## What landed well
- The core idea is understood. One tester described it almost perfectly on
  their own: "a no-loss savings game where users deposit USDC to join
  yield-generated lotteries without risking their initial principal."
- The UI reads as clean and polished (both testers said so unprompted).
- Deposit and withdraw feel straightforward, which made "your funds stay
  accessible" believable (drove one of the trust scores up to 4/5).

## Where people got confused or stuck
- How the yield is actually generated and where the deposited funds go. Both
  testers raised this independently. It is the single strongest signal.
- How the draw odds are calculated and why they update/stay low after a
  deposit (the time-weighted ticket mechanic was not obvious).

## Trust and doubts
- This is the main gap. Trust scores were 3/5 and 4/5.
- Quote: "For a platform handling real money, good UI isn't enough. I need to
  immediately understand where my money goes, how the yield is generated, what
  can go wrong, and how I get my money back."
- Both cited the lack of smart-contract audits and a mainnet track record as a
  blocker for depositing real money.

## Top requested changes
1. Add a clear "How your yield is generated + the risks" section right inside
   the main deposit flow, not buried on another page. (Both testers.)
2. Show a breakdown of how the prize yield is produced (Blend supply, bRate).
3. Improve error handling on wallet disconnection.

## What we changed based on feedback
- Not yet actioned (feedback is fresh). Planned, in priority order:
  - A short "where your money goes + risks" explainer surfaced in the deposit
    step, linking to the fuller /how-it-works page.
  - An odds tooltip explaining the time-weighted ticket formula on the
    dashboard.
  - Harden wallet-disconnect handling in the app.

## Still open (not yet addressed)
- Smart-contract audit and any mainnet track record (out of scope for the
  testnet MVP, but noted as the top adoption blocker).
- In-flow yield/risk explainer and odds tooltip (see planned changes above).
- Wallet-disconnect error handling.

---

## On-chain usage (10-wallet proof)
Testers who shared a Stellar address, matched to on-chain activity. Verify on
Stellar Expert (contract `CD6HCV2ZMD7KEWAISBNAUNJPQONAK3PMUDZZDIXA3WUZTHVIAUMXJAPE`).

| # | Stellar address (G…) | Action on-chain | Feedback? |
|---|---|---|---|
| 1 | GBUJJIYNPOC57O6CIFKFOBLPNTS6I5IYNGO5XQY7DAIPQ6JCU7ZBV7LN | 3 deposits + 1 withdraw | yes (NPS 10) |
| 2 | GC4LVPOA3DVMQYBCPKWJ7I73MTX26C2VEVAYSBXWYP4G3CRFMPXFEMZJ | connected/explored (no deposit found) | yes (NPS 8) |
| 3 | GCJM…7J7U | deposit ~$12,387 | not yet |
| 4 | GCUF…XJ6T | deposit ~$8,849 | not yet |
| 5 | GBFX…MHXQ | deposit ~$1,782 | not yet |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |
| 10 | | | |

Unique wallets that have interacted on-chain so far: 4 (rows 1, 3, 4, 5).
Row 2 submitted feedback but no deposit was found on-chain.

## Raffle
$USDG reward (5 USDG on the Robinhood network) raffled to ONE random entrant at
end of month. Entries so far (EVM addresses):
- 0x9aDF0C31B2f2331b1759889b4143Ad24Dca2490d
