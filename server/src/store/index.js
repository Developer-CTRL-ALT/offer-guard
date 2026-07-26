import { MemoryScanStore } from "./memoryScanStore.js";

export async function createScanStore({
  mongoUri = process.env.MONGODB_URI,
  logger = console
} = {}) {
  if (!mongoUri) {
    logger.info?.("OfferGuard storage: in-memory fallback");
    return new MemoryScanStore();
  }

  try {
    const [{ default: mongoose }, { Scan }, { MongoScanStore }] =
      await Promise.all([
        import("mongoose"),
        import("../models/Scan.js"),
        import("./mongoScanStore.js")
      ]);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    logger.info?.("OfferGuard storage: MongoDB");
    return new MongoScanStore(Scan, mongoose);
  } catch (error) {
    logger.error?.(
      `MongoDB connection failed (${error.message}). Refusing to start with volatile storage.`
    );
    throw error;
  }
}

export { MemoryScanStore } from "./memoryScanStore.js";
