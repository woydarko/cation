# Cation — Beta Feedback Form

Build this in Google Forms. Recreate each question below using the listed
question type.

**Make it anonymous:** Settings (gear icon) → tab "Responses" → turn OFF
"Collect email addresses". Also leave "Limit to 1 response" OFF (that would
force sign-in). The two address fields at the end are optional and only used
for the raffle reward and to verify real usage.

Google Forms question types used below:
- "Short answer"  = one-line text
- "Paragraph"     = multi-line text
- "Linear scale"  = numbered slider (set the range + end labels)

**Form title:** Cation Beta — Tell us what's broken

**Description (top of form):**
> Thanks for trying Cation. This is a real beta, so we want the honest version,
> not the polite one. Blunt, specific criticism helps us more than praise.
> It takes about 3 minutes and is fully anonymous. As a thank-you, at the end of
> the month we'll raffle a $USDG reward to ONE random person who left feedback
> and a wallet address. One winner, drawn at random — leave your address in the
> last question to enter.

---

## Section 1 — Did it make sense?

**Q1. In one sentence, what do you think Cation actually does?**
Type: Short answer (required)
*(Tests whether the product explains itself. Wrong answers are the point.)*

**Q2. How clearly did you understand how it works?**
Type: Linear scale 1–5 (1 = totally lost, 5 = crystal clear)

**Q3. What was the single most confusing moment while using it?**
Type: Paragraph (required)

---

## Section 2 — Did you trust it?

**Q4. "You can never lose your deposit." While using the app, how much did you
actually believe that?**
Type: Linear scale 1–5 (1 = didn't buy it, 5 = fully believed it)

**Q5. Why did you give that score?**
Type: Paragraph (required)

**Q6. What felt sketchy, unclear, or too-good-to-be-true? Be blunt.**
Type: Paragraph

---

## Section 3 — Would you actually use it?

**Q7. If this were live with real money today, what would stop you from
depositing?**
Type: Paragraph (required)

**Q8. Compared to just holding your USDC or using a normal savings app, why
would you (or why wouldn't you) use Cation?**
Type: Paragraph

**Q9. How likely are you to recommend Cation to a friend?**
Type: Linear scale 0–10 (0 = never, 10 = definitely)

---

## Section 4 — Fix it

**Q10. What is the ONE thing you'd change, add, or remove first?**
Type: Paragraph (required)

**Q11. Anything else? Give us the harshest honest feedback you've got — we'd
rather hear it now than after launch.**
Type: Paragraph

---

## Section 5 — Reward (optional, still anonymous if left blank)

**Q12. Want to enter the raffle? Drop your EVM wallet address on the Robinhood
network (0x…) here.**
Type: Short answer (optional)
*(At the end of the month we draw ONE random address from everyone who entered
and send them the $USDG reward. Entering is optional — leave this blank to stay
fully anonymous and skip the raffle. Must be an EVM address on the Robinhood
network, format 0x…)*
Validation (Google Forms): on this question click ⋮ (three dots) → "Response
validation" → "Regular expression" → "Matches" → pattern `^0x[a-fA-F0-9]{40}$`
→ error text "Enter a valid 0x… EVM address". Keep the question NOT required so
people can skip the raffle.

**Q13. Your Stellar testnet address (G…) so we can confirm you actually tried
the app.**
Type: Short answer (optional)
*(Optional. Helps us match feedback to real on-chain usage for the 10-user
proof. Not shared publicly.)*
