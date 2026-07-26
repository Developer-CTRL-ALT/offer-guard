import "dotenv/config";
import { createApp } from "./app.js";
import { createScanStore } from "./store/index.js";

const port = Number.parseInt(process.env.PORT || "4000", 10);
const store = await createScanStore();
const app = createApp({ store });
const server = app.listen(port, () => {
  console.info(`OfferGuard API listening on http://localhost:${port}`);
});

async function shutdown(signal) {
  console.info(`${signal} received; closing OfferGuard API.`);
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
