# OfferGuard 3-5 minute demo script

Target length: approximately 4 minutes 20 seconds.

Before recording:

- Use the deployed production application, not localhost.
- Close notifications and unrelated tabs.
- Increase browser zoom enough for the score and findings to be readable.
- Prepare one suspicious example and one comparatively reassuring example.
- Confirm the live site, API, history, and delete flow in an incognito window.
- Never show `.env` files, credentials, private messages, or real personal data.

## 0:00-0:20 - Introduction and category

**On screen:** OfferGuard landing page and project name.

**Say:**

"Hi, this is OfferGuard, my submission in the Web Apps category. OfferGuard is
an explainable job and internship offer risk screener built with MongoDB Atlas,
Express, React, and Node.js. The React interface uses Next.js components compiled
with vinext and Vite."

## 0:20-0:50 - Problem and target user

**On screen:** The input panel and source-type choices.

**Say:**

"Students and early-career applicants often receive recruitment messages that
look convincing but contain pressure tactics, advance-fee requests, or requests
for sensitive information. Existing advice usually says to be careful without
showing exactly what to inspect. My target user needs a fast first review that
is understandable and actionable."

## 0:50-1:10 - Solution and differentiation

**On screen:** Briefly point to the score, evidence, safe-signal, and action
areas.

**Say:**

"OfferGuard does not make a black-box fraud verdict. It shows a risk score and
level, the specific signals that affected the result, any reassuring signals,
and concrete verification steps. It is intentionally a risk-screening and
education tool, not a definitive fraud detector."

## 1:10-2:20 - Live suspicious-message analysis

**On screen:** Select `whatsapp`, paste the prepared fictional example, and run
the analysis.

Suggested fictional sample:

> Congratulations! You are selected immediately for a remote data internship.
> Pay a refundable Rs 4,500 security fee today to reserve your laptop. Send your
> Aadhaar and bank details on WhatsApp. No interview is required.

**Say while the result loads:**

"I will screen a fictional WhatsApp offer. The message is sent to my Express
API together with its source type and a browser session identifier."

**When the result appears:**

"The result is explainable. Instead of only showing a number, OfferGuard
identifies the fee request, sensitive-data request, and unusual hiring
claim. Each finding explains why it matters, and the action list tells the user
to avoid payment, stop sharing data, and verify the role through independently
obtained official contact details."

Show the score, `level`, two or three findings, and actions. Do not describe the
sender as a confirmed scammer.

## 2:20-2:45 - Contrast and session controls

**On screen:** Select the built-in **Routine interview** sample, analyze it, then
show recent scan summaries and delete one.

**Say:**

"A more complete post with an official application route and no payment or
sensitive-data request produces a different explanation. Recent results are
available for this browser session, and the user can delete an individual
summary."

Avoid saying that the lower-scoring example is guaranteed safe.

## 2:45-3:15 - Technical architecture

**On screen:** Show the architecture diagram in `docs/architecture.md`.

**Say:**

"The React frontend runs separately from a Node and Express API. A deterministic
server-side engine evaluates weighted risk and safe signals, so every result can
be traced to reviewable rules. MongoDB Atlas stores only derived scan summaries
for recent history. The API exposes health, analyze, history, and delete
endpoints."

## 3:15-3:40 - Privacy, safety, and limitations

**On screen:** Show the privacy statement in the application or README.

**Say:**

"The full submitted message is handled transiently and is never persisted to
MongoDB. We also avoid request-body logging. OfferGuard cannot verify an
employer, sender identity, or domain ownership, so false positives and false
negatives remain possible. A low score is not a guarantee, and a high score is
not proof of fraud."

## 3:40-4:05 - Development process and AI-tool disclosure

**On screen:** Public repository, test section, or a successful test run.

**Say:**

"I used OpenAI Codex during development for ideation, implementation support,
review, test planning, and documentation, and I verified its suggestions
against the working application. There is no runtime AI dependency or AI API
key. My tests cover scoring fixtures, API validation, session filtering,
deletion, frontend rendering, and the privacy rule that full submitted text is
excluded from persisted records and history responses."

## 4:05-4:20 - Close and future direction

**On screen:** Return to the finished results view, then briefly show the public
repository and live URL.

**Say:**

"Next, OfferGuard could add independently sourced domain and company
verification while preserving evidence and privacy. Today, the MVP already
turns a confusing offer into clear signals and safer next steps. Thank you."

## Recording acceptance check

- Final duration is between 3 and 5 minutes.
- The video states the project name, Web Apps category, problem, users, solution,
  differentiator, MERN stack, architecture, live functionality, privacy model,
  limitations, tests, AI-tool use, and future scope.
- Text and cursor movements are readable at normal playback speed.
- Audio is clear and contains no long pauses.
- No secret, personal information, or real suspicious message is visible.
- The video link opens without authentication in an incognito window.
