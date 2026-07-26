"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";
const SESSION_KEY = "offerguard-session-id";
const MAX_CHARACTERS = 6000;
const MIN_CHARACTERS = 30;

type SourceType = "whatsapp" | "email" | "sms" | "job_portal";
type Tone = "safe" | "caution" | "high" | "critical";

type EvidenceMatch = {
  text: string;
  start: number;
  end: number;
};

type Finding = {
  id: string;
  title: string;
  severity: string;
  points: number;
  whyItMatters: string;
  evidence: EvidenceMatch[];
};

type ScanResult = {
  scanId: string;
  createdAt: string;
  sourceType: string;
  inputText: string;
  score: number;
  level: string;
  headline: string;
  summary: string;
  findings: Finding[];
  safeSignals: string[];
  actions: string[];
  stats: Record<string, number | string>;
};

type HistoryItem = {
  scanId: string;
  createdAt: string;
  sourceType: string;
  score: number;
  level: string;
  headline: string;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: string | { message?: string };
  message?: string;
};

const sourceTypes: Array<{
  value: SourceType;
  label: string;
  hint: string;
}> = [
  { value: "whatsapp", label: "WhatsApp", hint: "Chat" },
  { value: "email", label: "Email", hint: "Mail" },
  { value: "sms", label: "SMS", hint: "Text" },
  { value: "job_portal", label: "Job portal", hint: "Listing" },
];

const samples: Array<{
  id: Tone;
  label: string;
  eyebrow: string;
  sourceType: SourceType;
  text: string;
}> = [
  {
    id: "safe",
    label: "Routine interview",
    eyebrow: "Likely safe",
    sourceType: "email",
    text: `Hi Aisha,

Thank you for speaking with our campus hiring team today. We'd like to invite you to the next interview for the Product Support Intern role at Northstar Labs.

Please choose a time through the scheduling link on our official careers portal. You can also verify the opening at careers.northstarlabs.example using reference NS-1842. We will never ask you to pay a fee or share banking credentials during recruitment.

Regards,
Maya Rao
University Recruiting`,
  },
  {
    id: "caution",
    label: "Urgent shortlist",
    eyebrow: "Needs caution",
    sourceType: "whatsapp",
    text: `Hello, this is Karan from Brightwave HR. Your profile has been shortlisted for a remote data entry position paying ₹45,000 per month. Interviews close tonight, so reply YES in the next 20 minutes to reserve your slot. Please send your Aadhaar card and PAN photo here on WhatsApp for verification. We will share the company details after registration.`,
  },
  {
    id: "critical",
    label: "Refundable deposit",
    eyebrow: "High risk",
    sourceType: "sms",
    text: `CONGRATULATIONS! You are selected without interview for Amazon Work From Home. Salary ₹68,000/month. Pay a refundable ₹7,500 training deposit today to UPI ID fastjob-pay@upi. Do not contact Amazon directly because this is a confidential vendor opening. Send payment screenshot now or your offer will be cancelled.`,
  },
];

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `og-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 11)}`;
}

function toneFor(level: string): Tone {
  const normalized = level.toLowerCase();
  if (normalized.includes("critical") || normalized.includes("danger")) {
    return "critical";
  }
  if (normalized.includes("high")) return "high";
  if (normalized.includes("medium") || normalized.includes("caution")) {
    return "caution";
  }
  return "safe";
}

function severityTone(severity: string): Tone {
  return toneFor(severity);
}

function scoreColor(level: string) {
  const tone = toneFor(level);
  if (tone === "critical") return "#ff725c";
  if (tone === "high") return "#ff9860";
  if (tone === "caution") return "#f3bd5a";
  return "#5bd6a0";
}

function friendlySource(source: string) {
  return (
    sourceTypes.find((item) => item.value === source)?.label ||
    source.replaceAll("_", " ")
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent scan";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function sentenceCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function apiError(payload: ApiEnvelope<unknown> | null, fallback: string) {
  if (typeof payload?.error === "string") return payload.error;
  if (payload?.error && typeof payload.error === "object") {
    return payload.error.message || fallback;
  }
  return payload?.message || fallback;
}

function normalizeActions(actions: ScanResult["actions"] | undefined) {
  return Array.isArray(actions)
    ? actions.filter((action): action is string => typeof action === "string")
    : [];
}

function MatchExcerpt({
  inputText,
  match,
  tone,
}: {
  inputText: string;
  match: EvidenceMatch;
  tone: Tone;
}) {
  let start = Number(match.start);
  let end = Number(match.end);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end <= start ||
    start >= inputText.length
  ) {
    start = match.text ? inputText.indexOf(match.text) : -1;
    end = start >= 0 ? start + match.text.length : -1;
  }

  if (start < 0 || end <= start) {
    return <q className="fallback-quote">{match.text}</q>;
  }

  end = Math.min(end, inputText.length);
  const contextStart = Math.max(0, start - 54);
  const contextEnd = Math.min(inputText.length, end + 54);

  return (
    <q className="evidence-quote">
      {contextStart > 0 && <span aria-hidden="true">…</span>}
      {inputText.slice(contextStart, start)}
      <mark className={`inline-mark tone-${tone}`}>
        {inputText.slice(start, end)}
      </mark>
      {inputText.slice(end, contextEnd)}
      {contextEnd < inputText.length && <span aria-hidden="true">…</span>}
    </q>
  );
}

function HighlightedMessage({
  inputText,
  findings,
}: {
  inputText: string;
  findings: Finding[];
}) {
  const ranges = useMemo(() => {
    const candidates = findings.flatMap((finding) =>
      (finding.evidence || []).map((match) => ({
        start: Number(match.start),
        end: Number(match.end),
        label: finding.title,
        tone: severityTone(finding.severity),
      })),
    );

    return candidates
      .filter(
        (range) =>
          Number.isFinite(range.start) &&
          Number.isFinite(range.end) &&
          range.start >= 0 &&
          range.end > range.start &&
          range.start < inputText.length,
      )
      .sort((a, b) => a.start - b.start || b.end - a.end)
      .reduce<typeof candidates>((accepted, range) => {
        const previous = accepted.at(-1);
        if (previous && range.start < previous.end) return accepted;
        accepted.push({ ...range, end: Math.min(range.end, inputText.length) });
        return accepted;
      }, []);
  }, [findings, inputText]);

  if (!ranges.length) {
    return <p className="message-transcript">{inputText}</p>;
  }

  const fragments: React.ReactNode[] = [];
  let cursor = 0;

  ranges.forEach((range, index) => {
    if (range.start > cursor) {
      fragments.push(inputText.slice(cursor, range.start));
    }
    fragments.push(
      <mark
        className={`transcript-mark tone-${range.tone}`}
        title={range.label}
        key={`${range.start}-${range.end}-${index}`}
      >
        {inputText.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  });

  if (cursor < inputText.length) {
    fragments.push(inputText.slice(cursor));
  }

  return <p className="message-transcript">{fragments}</p>;
}

export function OfferGuardApp() {
  const [sourceType, setSourceType] = useState<SourceType>("whatsapp");
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [deletingScanId, setDeletingScanId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [checkedActions, setCheckedActions] = useState<Set<number>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  const loadHistory = useCallback(async (id: string) => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const response = await fetch(
        `${API_BASE}/api/scans?sessionId=${encodeURIComponent(id)}&limit=6`,
      );
      if (!response.ok) throw new Error("History request failed");

      const payload = (await response.json()) as ApiEnvelope<
        HistoryItem[] | { items?: HistoryItem[]; scans?: HistoryItem[] }
      >;
      const data = payload.data;
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.scans)
            ? data.scans
            : [];
      setHistory(items.slice(0, 6));
    } catch {
      setHistoryError("Recent scans are temporarily unavailable.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(SESSION_KEY);
    const id = stored || createSessionId();
    if (!stored) window.localStorage.setItem(SESSION_KEY, id);
    // Hydration cannot safely read browser storage during the initial render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionId(id);
    void loadHistory(id);
  }, [loadHistory]);

  const validationMessage =
    message.trim().length > 0 && message.trim().length < MIN_CHARACTERS
      ? `Add at least ${MIN_CHARACTERS} characters so there is enough context.`
      : "";

  async function handleScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = message.trim();

    if (input.length < MIN_CHARACTERS) {
      setError(
        input.length
          ? `Please add at least ${MIN_CHARACTERS} characters.`
          : "Paste the complete message you want to check.",
      );
      textareaRef.current?.focus();
      return;
    }

    if (!sessionId) {
      setError("Your private session is still starting. Please try again.");
      return;
    }

    setError("");
    setCopied(false);
    setIsScanning(true);

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          sourceType,
          sessionId,
        }),
      });
      const payload = (await response
        .json()
        .catch(() => null)) as ApiEnvelope<ScanResult> | null;

      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(
          apiError(
            payload,
            "The scan could not be completed. Please try again in a moment.",
          ),
        );
      }

      setResult(payload.data);
      setCheckedActions(new Set());
      void loadHistory(sessionId);
      window.setTimeout(() => {
        resultRef.current?.focus({ preventScroll: true });
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The scan could not be completed. Please try again.",
      );
    } finally {
      setIsScanning(false);
    }
  }

  function loadSample(sample: (typeof samples)[number]) {
    setSourceType(sample.sourceType);
    setMessage(sample.text);
    setResult(null);
    setError("");
    setCopied(false);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function handleNewScan() {
    setMessage("");
    setResult(null);
    setError("");
    setCopied(false);
    setCheckedActions(new Set());
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => textareaRef.current?.focus(), 250);
  }

  async function handleCopyReport() {
    if (!result) return;

    const report = [
      "OFFERGUARD RISK REPORT",
      `${result.score}/100 · ${result.level.toUpperCase()}`,
      result.headline,
      "",
      result.summary,
      "",
      "EVIDENCE",
      ...(result.findings || []).map(
        (finding) =>
          `• ${finding.title} (+${finding.points}): ${finding.whyItMatters}`,
      ),
      "",
      "RECOMMENDED ACTIONS",
      ...normalizeActions(result.actions).map((action) => `□ ${action}`),
      "",
      `Scan ID: ${result.scanId}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Copy was blocked by your browser. Please try again.");
    }
  }

  async function handleDeleteScan(scanId: string) {
    if (!sessionId || deletingScanId) return;
    setDeletingScanId(scanId);
    setHistoryError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/scans/${encodeURIComponent(scanId)}?sessionId=${encodeURIComponent(sessionId)}`,
        { method: "DELETE" },
      );
      const payload = (await response.json().catch(() => null)) as
        | ApiEnvelope<{ deleted: boolean }>
        | null;
      if (!response.ok || !payload?.success) {
        throw new Error(apiError(payload, "The scan could not be deleted."));
      }
      setHistory((current) =>
        current.filter((item) => item.scanId !== scanId),
      );
    } catch (caught) {
      setHistoryError(
        caught instanceof Error
          ? caught.message
          : "The scan could not be deleted.",
      );
    } finally {
      setDeletingScanId("");
    }
  }

  const score = result
    ? Math.max(0, Math.min(100, Math.round(Number(result.score) || 0)))
    : 0;
  const resultTone = result ? toneFor(result.level) : "safe";
  const actions = normalizeActions(result?.actions);
  const findings = Array.isArray(result?.findings) ? result.findings : [];
  const safeSignals = Array.isArray(result?.safeSignals)
    ? result.safeSignals.filter(
        (signal): signal is string => typeof signal === "string",
      )
    : [];
  const stats = result?.stats ? Object.entries(result.stats).slice(0, 4) : [];

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="#scan-workspace" aria-label="OfferGuard home">
          <span className="brand-mark" aria-hidden="true">
            OG
          </span>
          <span className="brand-name">OfferGuard</span>
        </a>
        <div className="header-status">
          <span className="status-dot" aria-hidden="true" />
          <span>Private browser session</span>
        </div>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">Message forensics / Student safety</p>
          <h1 id="page-title">
            Before you trust the offer,{" "}
            <span className="accent-text">test the message.</span>
          </h1>
          <p className="hero-intro">
            OfferGuard finds pressure tactics, payment demands, and identity
            gaps—then shows the exact words behind every warning.
          </p>
        </div>
        <div className="hero-proof" aria-label="How OfferGuard works">
          <span className="proof-index">01</span>
          <div>
            <strong>Evidence, not guesswork.</strong>
            <p>
              Each score is tied to language you can inspect and actions you can
              take.
            </p>
          </div>
        </div>
      </section>

      <div className="workspace-grid" id="scan-workspace">
        <div className="primary-column">
          <section className="panel scan-panel" aria-labelledby="scan-title">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">New analysis</p>
                <h2 id="scan-title">Inspect a message</h2>
              </div>
              <span className="step-label">Step 1 of 1</span>
            </div>

            <form onSubmit={handleScan} noValidate>
              <fieldset className="source-fieldset">
                <legend>Where did you receive it?</legend>
                <div className="source-tabs" role="group">
                  {sourceTypes.map((source) => (
                    <button
                      aria-pressed={sourceType === source.value}
                      className={`source-tab ${
                        sourceType === source.value ? "active" : ""
                      }`}
                      key={source.value}
                      onClick={() => setSourceType(source.value)}
                      type="button"
                    >
                      <span>{source.label}</span>
                      <small>{source.hint}</small>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="sample-row">
                <span className="sample-label">Try an example</span>
                <div className="sample-buttons">
                  {samples.map((sample) => (
                    <button
                      className={`sample-button sample-${sample.id}`}
                      key={sample.id}
                      onClick={() => loadSample(sample)}
                      type="button"
                    >
                      <span className="sample-dot" aria-hidden="true" />
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="message-label" htmlFor="offer-message">
                Message or job listing
                <span>Paste the complete text for a more reliable scan.</span>
              </label>
              <div
                className={`textarea-shell ${
                  validationMessage ? "has-warning" : ""
                }`}
              >
                <textarea
                  aria-describedby={`message-help message-count${validationMessage ? " message-validation" : ""}`}
                  aria-invalid={Boolean(validationMessage)}
                  id="offer-message"
                  maxLength={MAX_CHARACTERS}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Paste the recruiter message, email, SMS, or job listing here…"
                  ref={textareaRef}
                  rows={10}
                  value={message}
                />
                <div className="textarea-meta">
                  <span id="message-help">
                    Names and contact details are not stored in scan history.
                  </span>
                  <span
                    className={
                      message.length > MAX_CHARACTERS * 0.9
                        ? "count-warning"
                        : ""
                    }
                    id="message-count"
                  >
                    {message.length.toLocaleString("en-IN")} /{" "}
                    {MAX_CHARACTERS.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              {validationMessage && (
                <p className="validation-hint" id="message-validation">
                  {validationMessage}
                </p>
              )}

              {error && (
                <div className="error-banner" role="alert">
                  <span className="error-symbol" aria-hidden="true">
                    !
                  </span>
                  <div>
                    <strong>We couldn&apos;t finish that scan.</strong>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <div className="scan-footer">
                <div className="privacy-note">
                  <span className="privacy-icon" aria-hidden="true">
                    ◇
                  </span>
                  <span>
                    <strong>Browser-local history</strong>
                    Linked to an anonymous ID saved on this browser.
                  </span>
                </div>
                <button
                  className="primary-button"
                  disabled={
                    isScanning ||
                    !sessionId ||
                    message.trim().length < MIN_CHARACTERS
                  }
                  type="submit"
                >
                  {isScanning ? (
                    <>
                      <span className="button-spinner" aria-hidden="true" />
                      Inspecting signals
                    </>
                  ) : (
                    <>
                      Scan this offer
                      <span aria-hidden="true">↗</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {result && (
            <section
              className={`result-panel tone-${resultTone}`}
              ref={resultRef}
              aria-labelledby="result-title"
              tabIndex={-1}
            >
              <div className="result-topline">
                <div className="result-id">
                  <span>Analysis complete</span>
                  <code>#{result.scanId.slice(0, 8)}</code>
                </div>
                <span>{formatDate(result.createdAt)}</span>
              </div>

              <div className="verdict-grid">
                <div
                  className="score-ring"
                  style={{
                    background: `conic-gradient(${scoreColor(
                      result.level,
                    )} ${score * 3.6}deg, rgba(255,255,255,.08) 0deg)`,
                  }}
                  aria-label={`Risk score ${score} out of 100`}
                  role="img"
                >
                  <div className="score-ring-inner">
                    <strong>{score}</strong>
                    <span>/ 100</span>
                  </div>
                </div>
                <div className="verdict-copy">
                  <span className={`risk-pill tone-${resultTone}`}>
                    <span aria-hidden="true" />
                    {result.level} risk
                  </span>
                  <h2 id="result-title">{result.headline}</h2>
                  <p>{result.summary}</p>
                </div>
              </div>

              <div className="result-actions">
                <button
                  className="secondary-button"
                  onClick={handleCopyReport}
                  type="button"
                >
                  <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
                  {copied ? "Report copied" : "Copy report"}
                </button>
                <button
                  className="ghost-button"
                  onClick={handleNewScan}
                  type="button"
                >
                  New scan <span aria-hidden="true">↗</span>
                </button>
              </div>

              {stats.length > 0 && (
                <dl className="stats-strip">
                  {stats.map(([label, value]) => (
                    <div key={label}>
                      <dt>{sentenceCase(label)}</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="result-section">
                <div className="result-section-heading">
                  <div>
                    <p className="section-kicker">Why it scored this way</p>
                    <h3>Evidence found</h3>
                  </div>
                  <span className="count-badge">{findings.length}</span>
                </div>

                {findings.length ? (
                  <div className="findings-list">
                    {findings.map((finding, index) => {
                      const findingTone = severityTone(finding.severity);
                      return (
                        <article
                          className={`finding-card tone-${findingTone}`}
                          key={finding.id || `${finding.title}-${index}`}
                        >
                          <div className="finding-index" aria-hidden="true">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <div className="finding-body">
                            <div className="finding-title-row">
                              <div>
                                <span className="severity-label">
                                  {finding.severity}
                                </span>
                                <h4>{finding.title}</h4>
                              </div>
                              <span className="points-badge">
                                +{finding.points} pts
                              </span>
                            </div>
                            <p>{finding.whyItMatters}</p>
                            {!!finding.evidence?.length && (
                              <div className="match-stack">
                                {finding.evidence.slice(0, 3).map((match, i) => (
                                  <MatchExcerpt
                                    inputText={result.inputText}
                                    key={`${match.start}-${match.end}-${i}`}
                                    match={match}
                                    tone={findingTone}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-evidence">
                    <span aria-hidden="true">✓</span>
                    <p>
                      No strong scam patterns were found in the supplied text.
                    </p>
                  </div>
                )}
              </div>

              {findings.some((finding) => finding.evidence?.length) && (
                <details className="transcript-details">
                  <summary>
                    <span>
                      <strong>View highlighted message</strong>
                      <small>Exact phrases used in this score</small>
                    </span>
                    <span className="summary-plus" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <HighlightedMessage
                    findings={findings}
                    inputText={result.inputText}
                  />
                </details>
              )}

              <div className="result-lower-grid">
                <section className="actions-card" aria-labelledby="actions-title">
                  <div className="mini-card-heading">
                    <span className="mini-icon" aria-hidden="true">
                      ✓
                    </span>
                    <div>
                      <p className="section-kicker">Next steps</p>
                      <h3 id="actions-title">Protect yourself</h3>
                    </div>
                  </div>
                  {actions.length ? (
                    <div className="checklist">
                      {actions.map((action, index) => (
                        <label
                          className={`check-row ${
                            checkedActions.has(index) ? "checked" : ""
                          }`}
                          key={`${action}-${index}`}
                        >
                          <input
                            checked={checkedActions.has(index)}
                            onChange={() =>
                              setCheckedActions((current) => {
                                const next = new Set(current);
                                if (next.has(index)) next.delete(index);
                                else next.add(index);
                                return next;
                              })
                            }
                            type="checkbox"
                          />
                          <span className="custom-check" aria-hidden="true">
                            ✓
                          </span>
                          <span>{action}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="mini-empty">
                      Continue through official company channels and keep a copy
                      of the conversation.
                    </p>
                  )}
                </section>

                <section
                  className="safe-signals-card"
                  aria-labelledby="safe-signals-title"
                >
                  <div className="mini-card-heading">
                    <span className="mini-icon safe" aria-hidden="true">
                      +
                    </span>
                    <div>
                      <p className="section-kicker">Balance check</p>
                      <h3 id="safe-signals-title">Safer signals</h3>
                    </div>
                  </div>
                  {safeSignals.length ? (
                    <ul className="safe-signal-list">
                      {safeSignals.map((signal, index) => (
                        <li key={`${signal}-${index}`}>
                          <span aria-hidden="true">✓</span>
                          {signal}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mini-empty">
                      No independently reassuring signals were identified.
                      Verify the employer through its official website.
                    </p>
                  )}
                </section>
              </div>
            </section>
          )}
        </div>

        <aside className="side-column" aria-label="Scan support">
          <section className="panel history-panel" aria-labelledby="history-title">
            <div className="panel-heading compact">
              <div>
                <p className="section-kicker">This device</p>
                <h2 id="history-title">Recent scans</h2>
              </div>
              <span className="history-count">{history.length}/6</span>
            </div>

            <div className="history-list" aria-live="polite">
              {historyLoading ? (
                <>
                  <div className="history-skeleton" />
                  <div className="history-skeleton short" />
                  <span className="sr-only">Loading recent scans</span>
                </>
              ) : historyError && !history.length ? (
                <div className="history-empty history-error" role="status">
                  <span className="error-symbol" aria-hidden="true">
                    !
                  </span>
                  <strong>History unavailable</strong>
                  <p>{historyError}</p>
                  <button
                    className="history-retry"
                    onClick={() => void loadHistory(sessionId)}
                    type="button"
                  >
                    Try again
                  </button>
                </div>
              ) : history.length ? (
                history.map((item) => {
                  const itemTone = toneFor(item.level);
                  const itemScore = Math.max(
                    0,
                    Math.min(100, Math.round(Number(item.score) || 0)),
                  );
                  return (
                    <article className="history-item" key={item.scanId}>
                      <div
                        className={`history-score tone-${itemTone}`}
                        aria-label={`${itemScore} risk score`}
                      >
                        {itemScore}
                      </div>
                      <div className="history-copy">
                        <div className="history-meta">
                          <span>{friendlySource(item.sourceType)}</span>
                          <time dateTime={item.createdAt}>
                            {formatDate(item.createdAt)}
                          </time>
                        </div>
                        <h3>{item.headline || `${item.level} risk scan`}</h3>
                      </div>
                      <button
                        aria-label={`Delete ${friendlySource(item.sourceType)} scan from ${formatDate(item.createdAt)}`}
                        className="history-delete"
                        disabled={deletingScanId === item.scanId}
                        onClick={() => void handleDeleteScan(item.scanId)}
                        title="Delete this scan"
                        type="button"
                      >
                        {deletingScanId === item.scanId ? "…" : "×"}
                      </button>
                    </article>
                  );
                })
              ) : (
                <div className="history-empty">
                  <span className="empty-radar" aria-hidden="true">
                    <i />
                  </span>
                  <strong>No scans yet</strong>
                  <p>Your six most recent results will appear here.</p>
                </div>
              )}
            </div>

            {historyError && history.length > 0 && (
              <p className="history-inline-error" role="status">
                {historyError}
              </p>
            )}

            <p className="history-privacy">
              <span aria-hidden="true">◇</span>
              History keeps scores, not message content.
            </p>
          </section>

          <section className="method-card" aria-labelledby="method-title">
            <p className="section-kicker">Reading the score</p>
            <h2 id="method-title">Signal scale</h2>
            <div className="scale-track" aria-hidden="true">
              <span className="scale-safe" />
              <span className="scale-caution" />
              <span className="scale-high" />
              <span className="scale-critical" />
            </div>
            <dl className="scale-labels">
              <div>
                <dt>
                  <span className="legend-dot safe" />
                  0–24
                </dt>
                <dd>Low</dd>
              </div>
              <div>
                <dt>
                  <span className="legend-dot caution" />
                  25–49
                </dt>
                <dd>Caution</dd>
              </div>
              <div>
                <dt>
                  <span className="legend-dot high" />
                  50–74
                </dt>
                <dd>High</dd>
              </div>
              <div>
                <dt>
                  <span className="legend-dot critical" />
                  75–100
                </dt>
                <dd>Critical</dd>
              </div>
            </dl>
            <p className="method-note">
              A low score is not a guarantee. Verify the company, role, and
              recruiter using contact details you find independently.
            </p>
          </section>

          <div className="help-card">
            <span className="help-number">!</span>
            <div>
              <strong>Never pay to get hired.</strong>
              <p>
                Legitimate employers do not require deposits, gift cards, or
                crypto transfers to release an offer.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <footer className="site-footer">
        <div>
          <span className="brand-mark small" aria-hidden="true">
            OG
          </span>
          <p>
            OfferGuard is a decision-support tool, not a guarantee of
            legitimacy.
          </p>
        </div>
        <p className="footer-note">Built for safer first jobs.</p>
      </footer>
    </main>
  );
}
