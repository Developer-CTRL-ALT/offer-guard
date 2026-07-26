import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeOffer,
  getRiskCategories,
  levelForScore
} from "../src/analyzer.js";

test("the engine exposes exactly eight distinct risk categories", () => {
  const categories = getRiskCategories();
  assert.equal(categories.length, 8);
  assert.equal(new Set(categories.map(({ id }) => id)).size, 8);
  assert.ok(categories.every(({ cap }) => cap > 0));
});

test("analysis is deterministic and every evidence span is exact", () => {
  const text =
    "URGENT: You are already selected without an interview. Pay registration fee of Rs 2500 via UPI today. Send your OTP on WhatsApp.";
  const first = analyzeOffer(text);
  const second = analyzeOffer(text);

  assert.deepEqual(first, second);
  assert.ok(first.score >= 75);
  assert.equal(first.level, "critical");
  assert.ok(first.findings.length >= 4);

  for (const finding of first.findings) {
    for (const evidence of finding.evidence) {
      assert.equal(text.slice(evidence.start, evidence.end), evidence.text);
      assert.ok(evidence.start >= 0);
      assert.ok(evidence.end > evidence.start);
    }
  }
});

test("score is capped at 100 even when many categories trigger", () => {
  const text = [
    "Act now, limited slots and offer expires today.",
    "You are already selected without an interview and can earn 50000 daily easy.",
    "Pay registration fee of Rs 5000 via UPI.",
    "Send your OTP, password, CVV and Aadhaar.",
    "Contact us on Telegram only at fake.recruiter@gmail.com.",
    "Join immediately; no experience required.",
    "Download https://bit.ly/fake and install offer.apk.",
    "Bring a blank cheque and submit original certificates for a training bond."
  ].join(" ");
  const result = analyzeOffer(text);
  assert.equal(result.score, 100);
  assert.equal(result.level, "critical");
  assert.equal(result.stats.categoriesTriggered, 8);
  assert.ok(result.stats.uncappedScore > 100);
});

test("safe signals are strings and do not erase independent risk evidence", () => {
  const text =
    "There are no recruitment fees. Our interview process has a technical assessment. Verify on the official website. However, send your OTP now.";
  const result = analyzeOffer(text);
  assert.ok(result.safeSignals.length >= 3);
  assert.ok(result.safeSignals.every((signal) => typeof signal === "string"));
  assert.ok(
    result.findings.some((finding) => finding.id === "sensitive_information")
  );
});

test("protective no-fee language is not treated as a payment demand", () => {
  const result = analyzeOffer(
    "Our interview process includes a technical assessment. We will never ask you to pay a recruitment fee."
  );

  assert.ok(
    !result.findings.some((finding) => finding.id === "fees_and_payments")
  );
  assert.ok(result.safeSignals.some((signal) => /not be charged a fee/i.test(signal)));
});

test("protective privacy language is not treated as a sensitive-data request", () => {
  const result = analyzeOffer(
    "Do not share your OTP with a recruiter. We will never ask you to provide banking details."
  );

  assert.ok(
    !result.findings.some((finding) => finding.id === "sensitive_information")
  );
});

test("a genuine request after protective language remains detectable", () => {
  const result = analyzeOffer(
    "We will never ask you to pay a fee. However, send your OTP now."
  );

  assert.ok(
    result.findings.some((finding) => finding.id === "sensitive_information")
  );
});

test("a normal message remains low risk and still recommends due diligence", () => {
  const result = analyzeOffer(
    "Thank you for applying to the junior developer role. Our interview process includes a screening call and technical assessment."
  );
  assert.equal(result.level, "low");
  assert.ok(result.score < 25);
  assert.match(result.actions[0], /due diligence/i);
});

test("actions are tailored to the detected categories", () => {
  const result = analyzeOffer(
    "Pay the registration fee today via UPI and download offer.exe."
  );
  assert.ok(result.actions.some((action) => /do not pay/i.test(action)));
  assert.ok(result.actions.some((action) => /do not open/i.test(action)));
});

test("score boundaries map to the required levels", () => {
  assert.equal(levelForScore(0), "low");
  assert.equal(levelForScore(24), "low");
  assert.equal(levelForScore(25), "caution");
  assert.equal(levelForScore(49), "caution");
  assert.equal(levelForScore(50), "high");
  assert.equal(levelForScore(74), "high");
  assert.equal(levelForScore(75), "critical");
  assert.equal(levelForScore(100), "critical");
});
