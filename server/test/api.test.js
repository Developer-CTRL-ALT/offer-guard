import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { MemoryScanStore } from "../src/store/memoryScanStore.js";

async function withServer(run) {
  const store = new MemoryScanStore();
  const app = createApp({ store, corsOrigin: "*" });
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    await run({ baseUrl: `http://127.0.0.1:${port}`, store });
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

async function jsonRequest(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  return { response, body };
}

test("OfferGuard API contract and privacy lifecycle", async () => {
  await withServer(async ({ baseUrl, store }) => {
    const health = await jsonRequest(`${baseUrl}/api/health`);
    assert.equal(health.response.status, 200);
    assert.equal(health.body.success, true);
    assert.equal(health.body.data.storage, "memory");

    const invalid = await jsonRequest(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "Pay a fee",
        sourceType: "telegram",
        sessionId: "session-a"
      })
    });
    assert.equal(invalid.response.status, 400);
    assert.equal(invalid.body.success, false);
    assert.equal(invalid.body.error.code, "VALIDATION_ERROR");

    const originalText =
      "Urgent: pay the registration fee of Rs 5000 via UPI and send your OTP.";
    const analyzed = await jsonRequest(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: originalText,
        sourceType: "whatsapp",
        sessionId: "session-a"
      })
    });

    assert.equal(analyzed.response.status, 201);
    assert.equal(analyzed.body.success, true);
    const data = analyzed.body.data;
    for (const key of [
      "scanId",
      "createdAt",
      "sourceType",
      "inputText",
      "score",
      "level",
      "headline",
      "summary",
      "findings",
      "safeSignals",
      "actions",
      "stats"
    ]) {
      assert.ok(Object.hasOwn(data, key), `missing POST data.${key}`);
    }
    assert.equal(data.inputText, originalText);
    assert.equal(data.sourceType, "whatsapp");
    assert.ok(data.safeSignals.every((signal) => typeof signal === "string"));

    const persisted = store.records.get(data.scanId);
    assert.ok(persisted);
    assert.equal(persisted.sourceType, "whatsapp");
    assert.equal(Object.hasOwn(persisted, "excerpt"), false);
    assert.equal(Object.hasOwn(persisted, "text"), false);
    assert.equal(Object.hasOwn(persisted, "inputText"), false);
    assert.equal(JSON.stringify(persisted).includes(originalText), false);

    await jsonRequest(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "Interview process includes a technical assessment.",
        sourceType: "email",
        sessionId: "session-b"
      })
    });

    const history = await jsonRequest(
      `${baseUrl}/api/scans?sessionId=session-a&limit=10`
    );
    assert.equal(history.response.status, 200);
    assert.equal(history.body.data.count, 1);
    const item = history.body.data.scans[0];
    for (const key of [
      "scanId",
      "createdAt",
      "sourceType",
      "score",
      "level",
      "headline"
    ]) {
      assert.ok(Object.hasOwn(item, key), `missing history item.${key}`);
    }
    assert.equal(Object.hasOwn(item, "inputText"), false);
    assert.equal(Object.hasOwn(item, "text"), false);
    assert.equal(Object.hasOwn(item, "excerpt"), false);
    assert.equal(JSON.stringify(history.body).includes(originalText), false);

    const wrongSessionDelete = await jsonRequest(
      `${baseUrl}/api/scans/${data.scanId}?sessionId=session-b`,
      { method: "DELETE" }
    );
    assert.equal(wrongSessionDelete.response.status, 404);

    const deleted = await jsonRequest(
      `${baseUrl}/api/scans/${data.scanId}?sessionId=session-a`,
      { method: "DELETE" }
    );
    assert.equal(deleted.response.status, 200);
    assert.deepEqual(deleted.body.data, {
      scanId: data.scanId,
      deleted: true
    });

    const emptyHistory = await jsonRequest(
      `${baseUrl}/api/scans?sessionId=session-a&limit=10`
    );
    assert.equal(emptyHistory.body.data.count, 0);
  });
});

test("history validates sessionId and clamps limit", async () => {
  await withServer(async ({ baseUrl }) => {
    const missingSession = await jsonRequest(`${baseUrl}/api/scans`);
    assert.equal(missingSession.response.status, 400);

    const invalidLimit = await jsonRequest(
      `${baseUrl}/api/scans?sessionId=s&limit=nope`
    );
    assert.equal(invalidLimit.response.status, 400);
  });
});
