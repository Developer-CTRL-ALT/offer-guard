import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the OfferGuard product shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Check an offer · OfferGuard<\/title>/i);
  assert.match(html, /Before you trust the offer/);
  assert.match(html, /Inspect a message/);
  assert.match(html, /Evidence, not guesswork/);
  assert.match(html, /OfferGuard is a decision-support tool/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("renders an accessible no-script product description", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /job offers and recruiter messages/i);
  assert.match(html, /aria-label="OfferGuard home"/i);
  assert.match(html, /id="page-title"/i);
  assert.match(html, /id="scan-title"/i);
});
