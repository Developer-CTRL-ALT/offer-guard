# OfferGuard

OfferGuard is a privacy-conscious web application that screens job and internship
messages for common scam indicators. It produces an explainable risk score,
shows the evidence behind each finding, highlights reassuring signals, and gives
the user practical verification steps.

**Primary category:** Web Apps
**Stack:** MongoDB Atlas, Express, React, and Node.js (MERN), with Next.js
components compiled by vinext/Vite for the frontend.

> OfferGuard is a risk-screening and educational tool. It does not determine
> whether an employer or offer is fraudulent, and its output should not replace
> independent verification or professional advice.

## Project links

| Resource | Link |
| --- | --- |
| Live application | `TBD - add the public production URL` |
| Public GitHub repository | [github.com/Developer-CTRL-ALT/offer-guard](https://github.com/Developer-CTRL-ALT/offer-guard) |
| Demo video | `TBD - add the public or unlisted video URL` |

## The problem

Students and early-career applicants often receive job posts, offer emails, and
WhatsApp messages that mix legitimate-looking details with high-pressure
requests, advance fees, sensitive-data requests, or unverifiable claims.
Generic warnings tell users to "be careful" but do not explain which parts of a
message deserve scrutiny.

OfferGuard makes that first safety review faster and easier to understand. It
does not label a sender a scammer. Instead, it identifies observable signals,
explains their effect on the score, and suggests what the user should verify
next.

## What the MVP does

- Accepts a WhatsApp chat, email, SMS, or job-portal listing.
- Scores the text using an explainable, deterministic signal engine.
- Displays a risk `level`, headline, summary, individual findings, safe signals,
  recommended actions, and analysis statistics.
- Preserves a short session history without storing the full submitted text.
- Lets a user delete a saved scan summary from their current browser session.
- Includes clear limitations and avoids definitive fraud claims.

## How it works

1. The React client sends the text, source type, and a browser-generated
   `sessionId` to the Express API.
2. The API validates the request and evaluates the text against weighted risk
   and safety indicators.
3. The API returns the result, including the submitted `inputText`, in the
   current response so the client can render it immediately.
4. MongoDB Atlas receives only the derived scan summary needed for recent
   history. The full submitted message and transient `inputText` are excluded
   from the stored record.
5. The client presents the score together with evidence and safer next steps.

See [Architecture](docs/architecture.md) for component, data-flow, privacy, and
deployment details.

## Local setup

### Prerequisites

- Node.js 22.13 or newer
- npm
- A MongoDB Atlas cluster and least-privilege database user for production
  persistence (local development can run with temporary in-memory history)

### 1. Install dependencies

```bash
git clone https://github.com/Developer-CTRL-ALT/offer-guard.git
cd offer-guard
npm install
cd server
npm install
cd ..
```

### 2. Configure the frontend

Create `.env.local` in the repository root:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
```

`NEXT_PUBLIC_API_URL` is intentionally public because it is the browser-visible
base URL of the API. Do not put secrets in any `NEXT_PUBLIC_*` variable.

### 3. Configure the backend

Create `server/.env`:

```dotenv
MONGODB_URI=mongodb+srv://<database-user>:<database-password>@<cluster-host>/offerguard
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

Keep `server/.env` out of version control. In MongoDB Atlas, allow the
development machine's network access and grant the application user only the
permissions it needs.

OfferGuard does not require an AI API key. Runtime analysis is performed by the
server-side explainable scoring engine.

### 4. Start both services

Start the backend in one terminal:

```bash
cd server
npm run dev
```

Start the frontend in a second terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend calls the API
at [http://localhost:4000](http://localhost:4000).

## API

All routes are relative to `NEXT_PUBLIC_API_URL`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Report API status and the active storage type. |
| `POST` | `/api/analyze` | Analyze one submitted text and return an explainable result. |
| `GET` | `/api/scans?sessionId=<id>&limit=6` | Retrieve recent derived scan summaries for one browser session. |
| `DELETE` | `/api/scans/:id?sessionId=<id>` | Delete one saved summary belonging to that browser session. |

### Analyze request

```json
{
  "text": "Paste the job or internship message here.",
  "sourceType": "email",
  "sessionId": "browser-generated-session-id"
}
```

`sourceType` must be one of `whatsapp`, `email`, `sms`, or `job_portal`.

### Analyze success response

```json
{
  "success": true,
  "data": {
    "scanId": "generated-scan-id",
    "createdAt": "2026-07-25T10:00:00.000Z",
    "sourceType": "email",
    "inputText": "Paste the job or internship message here.",
    "score": 72,
    "level": "high",
    "headline": "Several signals need verification",
    "summary": "Review the evidence before sharing information or paying money.",
    "findings": [],
    "safeSignals": [],
    "actions": [],
    "stats": {}
  }
}
```

The example values are illustrative. `inputText` is returned transiently by the
analysis endpoint but is never written to MongoDB Atlas.

## Privacy model

- The full submitted message is processed in request memory and is never
  persisted to MongoDB Atlas.
- Production request logging must not record request bodies.
- Stored history contains only derived results, such as score, level, source
  type, triggered indicators, statistics, timestamp, and the pseudonymous
  `sessionId`.
- A `sessionId` supports browser-local history; it is not authentication and
  must not be treated as an account-security boundary.
- The delete endpoint removes a derived summary when the supplied session ID
  matches it.
- Production traffic must use HTTPS, secrets must remain server-side, and
  database access should use least privilege.

Avoid pasting Aadhaar numbers, banking details, passwords, or other unnecessary
sensitive data into any screening tool.

## Scoring and limitations

OfferGuard combines weighted textual signals and safe signals into a bounded
score. The API is the source of truth for the score and `level`; the frontend
only renders the returned explanation.

The result has important limitations:

- Text patterns can produce false positives and false negatives.
- Scammers can change wording to avoid known indicators.
- Legitimate employers can use informal language or unusual processes.
- OfferGuard does not verify company registration, sender identity, domain
  ownership, or the existence of a vacancy.
- A low score is not a guarantee of safety, and a high score is not proof of
  fraud.

Users should independently verify the employer through an official website,
contact details obtained independently of the message, and trusted reporting
channels.

## Tests and quality checks

Run the frontend checks from the repository root:

```bash
npm test
npm run lint
npm run build
```

Run the backend tests from `server/`:

```bash
npm test
```

The verification set should cover:

- Strong-risk, mixed-signal, safe, empty, malformed, and oversized inputs.
- Stable scoring and evidence for known indicator fixtures.
- Validation of `sourceType`, `text`, and `sessionId`.
- Health, analyze, history, and delete API behavior.
- The rule that no stored MongoDB document contains the full submitted text.
- CORS behavior for the configured `CORS_ORIGIN`.
- Responsive rendering and keyboard-accessible primary actions.

## Deployment plan

1. Deploy the React frontend to a public HTTPS host and set
   `NEXT_PUBLIC_API_URL` to the production API origin.
2. Deploy the Express server to a Node.js host, set `PORT`, `MONGODB_URI`, and
   `CORS_ORIGIN`, and configure `/api/health` as the platform health check.
3. Use MongoDB Atlas with a dedicated least-privilege user, TLS, and an
   appropriately restricted network policy.
4. Verify the complete analyze, history, and delete flow from a clean incognito
   session before recording the demo and submitting.

When `MONGODB_URI` is omitted, the API uses temporary in-memory history for
local demos. If a configured MongoDB connection fails, startup fails instead of
silently losing production data. A production health check is ready for this
project only when it reports `storage: "mongodb"`.

## AI tools used during development

OpenAI Codex was used as a development assistant for ideation, implementation
support, code review, test planning, and documentation. Generated suggestions
were reviewed and verified against the working application. OfferGuard does not
send submitted job or internship messages to a runtime AI model and requires no
AI API key.

## Submission resources

- [3-5 minute demo script](docs/demo-script.md)
- [Submission checklist](docs/submission-checklist.md)
- [Architecture and privacy design](docs/architecture.md)
