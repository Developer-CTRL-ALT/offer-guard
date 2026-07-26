# OfferGuard submission checklist

Do not submit until every hard-gate item is complete.

## 1. Product completion

- [ ] The project is identified as **OfferGuard** in the app, README, repository,
  video, and submission form.
- [ ] Participation is individual, the work is original, and OfferGuard matches
  the idea registered for the event.
- [ ] The primary category is **Web Apps** everywhere it is requested.
- [ ] The frontend opens without an error and is usable on desktop and mobile.
- [ ] The backend health endpoint returns successfully in production.
- [ ] `whatsapp`, `email`, `sms`, and `job_portal` analyses all work.
- [ ] Results show `score`, `level`, headline, summary, findings, safe signals,
  actions, and statistics.
- [ ] The UI never presents a result as definitive proof of fraud or safety.
- [ ] Recent summaries load for the current browser session.
- [ ] Deleting a summary works and remains deleted after refresh.
- [ ] Loading, empty-input, validation, server-error, and no-history states are
  understandable.

## 2. Privacy and safety release gate

- [ ] The full submitted text is never stored in MongoDB Atlas.
- [ ] A unique sentinel sentence submitted during testing does not appear in the
  stored document or the history API response.
- [ ] Request-body logging is disabled in production.
- [ ] `inputText` is used only in the immediate analyze response and is excluded
  from persistence.
- [ ] No `.env`, API credential, MongoDB URI, password, or private key is
  committed or visible in the video.
- [ ] Production uses HTTPS.
- [ ] Atlas uses a dedicated least-privilege application user.
- [ ] CORS permits the deployed frontend origin and does not rely on the local
  development origin.
- [ ] The app warns users not to paste unnecessary identity, banking, or password
  data.

## 3. Automated and manual verification

- [ ] Frontend tests pass with `npm test`.
- [ ] Frontend lint passes with `npm run lint`.
- [ ] Production frontend build passes with `npm run build`.
- [ ] Backend tests pass from `server/` with `npm test`.
- [ ] Safe, mixed-signal, and strong-risk fixtures produce sensible,
  explainable differences.
- [ ] Empty, malformed, and oversized requests fail safely.
- [ ] `GET /api/health` works in production.
- [ ] `POST /api/analyze` works in production.
- [ ] `GET /api/scans?sessionId=<id>&limit=6` returns only that session's
  summaries.
- [ ] `DELETE /api/scans/:id?sessionId=<id>` rejects a non-matching session and
  deletes a matching summary.
- [ ] No console errors or failed network requests remain during the happy path.
- [ ] Primary actions are keyboard accessible and visible at narrow viewport
  widths.

## 4. Public GitHub repository

- [ ] The repository is public.
- [ ] The repository URL opens while signed out and in a clean incognito window.
- [ ] The default branch contains the final code and the latest submission
  commit.
- [ ] `README.md`, `docs/demo-script.md`,
  `docs/submission-checklist.md`, and `docs/architecture.md` render correctly on
  GitHub.
- [ ] The README includes the problem, solution, primary category, MERN stack,
  setup, environment variable names, API routes, privacy model, limitations,
  tests, deployment plan, and AI-tool disclosure.
- [ ] Repository setup commands were tested from a fresh clone.
- [ ] `node_modules`, build output, local databases, logs, and environment files
  are excluded.
- [ ] Git history contains no secret. Removing a secret only from the latest
  commit is insufficient; rotate it and remove it from history.
- [ ] The repository has a clear final commit message and no unrelated starter
  text presented as project documentation.

## 5. Live deployment

- [ ] The production frontend URL is added to the README and submission form.
- [ ] The production API uses `MONGODB_URI`, `PORT`, and the deployed
  `CORS_ORIGIN`.
- [ ] The frontend was built with `NEXT_PUBLIC_API_URL` set to the production
  API origin.
- [ ] No production request calls `localhost`.
- [ ] The frontend, backend, and Atlas cluster are awake and available before
  judging.
- [ ] The first analysis after a cold start completes acceptably.
- [ ] Refreshing a frontend route does not produce a host-level 404.
- [ ] The live site has a meaningful page title and favicon.

### Mandatory incognito live-site check

- [ ] Open a new incognito window with no existing local storage.
- [ ] Load the exact submitted frontend URL.
- [ ] Analyze one suspicious fictional sample.
- [ ] Confirm the score, `level`, evidence, and actions render.
- [ ] Refresh and confirm the recent summary reloads.
- [ ] Delete that summary and refresh again.
- [ ] Test at least one narrow mobile viewport.
- [ ] Open the browser network panel and confirm there are no CORS, mixed-content,
  or `localhost` failures.

## 6. Demo video

- [ ] The final recording is between 3 and 5 minutes.
- [ ] It follows the required topics in
  [demo-script.md](demo-script.md): introduction, category, problem, user,
  solution, differentiation, live demo, architecture, privacy, limitations,
  development process, AI-tool disclosure, tests, and future scope.
- [ ] It uses fictional data and shows no secrets or personal information.
- [ ] The score, findings, and actions are readable.
- [ ] Narration calls OfferGuard a risk screener, not a fraud detector.
- [ ] Audio is clear and the recording has no long loading waits or dead time.
- [ ] The final video is uploaded as public or unlisted, according to the
  submission rules.
- [ ] The video URL opens and plays while signed out and in incognito mode.
- [ ] The final video URL is added to the README and submission form.

## 7. Submission form

- [ ] Project name is exactly **OfferGuard**.
- [ ] Primary category is **Web Apps**.
- [ ] Problem and solution descriptions match the working MVP.
- [ ] MongoDB Atlas, Express, React, and Node.js are listed accurately.
- [ ] AI-tool use is disclosed accurately: OpenAI Codex assisted development;
  there is no runtime AI model or AI API key.
- [ ] Public GitHub, live application, and demo video URLs are copied from their
  canonical pages without truncation.
- [ ] Participant and contact information are complete and spelled consistently.
- [ ] Every required field is complete.
- [ ] A final preview or screenshot of the completed form is saved before
  submission.
- [ ] Submission confirmation is saved after submitting.

## Hard blockers

Any one of these should stop submission until resolved:

- Private or inaccessible GitHub repository
- Broken or authentication-gated live application
- Inaccessible video or video outside the required duration
- Frontend calling localhost or failing production CORS
- Exposed credential or secret
- Full submitted message persisted or included in history
- Analyze flow that crashes or returns no explainable evidence
- Claim that OfferGuard definitively detects fraud
- Missing required submission field or mismatched URL
