import cors from "cors";
import express from "express";
import {
  analyzeOffer,
  headlineForLevel,
  levelForScore
} from "./analyzer.js";

const SOURCE_TYPES = new Set(["whatsapp", "email", "sms", "job_portal"]);

function apiError(status, code, message, details) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

function requiredText(value, field, maxLength) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw apiError(400, "VALIDATION_ERROR", `${field} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw apiError(
      400,
      "VALIDATION_ERROR",
      `${field} must be at most ${maxLength} characters.`
    );
  }
  return trimmed;
}

function parseLimit(value) {
  if (value === undefined) return 10;
  if (!/^\d+$/.test(String(value))) {
    throw apiError(400, "VALIDATION_ERROR", "limit must be a positive integer.");
  }
  return Math.min(50, Math.max(1, Number(value)));
}

function historyItem(record) {
  const level = levelForScore(record.score);
  return {
    scanId: record.scanId,
    createdAt: record.createdAt,
    sourceType: record.sourceType,
    score: record.score,
    level,
    headline: headlineForLevel(level),
    categoryIds: [...record.categoryIds]
  };
}

function corsOptions(originConfig) {
  if (!originConfig || originConfig === "*") return { origin: true };
  const allowed = new Set(
    originConfig
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
  return {
    origin(origin, callback) {
      if (!origin || allowed.has(origin)) return callback(null, true);
      return callback(apiError(403, "CORS_DENIED", "Origin is not allowed."));
    }
  };
}

export function createApp({ store, corsOrigin = process.env.CORS_ORIGIN } = {}) {
  if (!store) throw new TypeError("createApp requires a scan store.");

  const app = express();
  app.disable("x-powered-by");
  app.use(cors(corsOptions(corsOrigin)));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_request, response) => {
    response.json({
      success: true,
      data: {
        status: "ok",
        storage: store.kind,
        timestamp: new Date().toISOString()
      }
    });
  });

  app.post("/api/analyze", async (request, response, next) => {
    try {
      const text = requiredText(request.body?.text, "text", 20_000);
      const sessionId = requiredText(
        request.body?.sessionId,
        "sessionId",
        100
      );
      const sourceType = request.body?.sourceType;
      if (!SOURCE_TYPES.has(sourceType)) {
        throw apiError(
          400,
          "VALIDATION_ERROR",
          "sourceType must be one of: whatsapp, email, sms, job_portal."
        );
      }

      const analysis = analyzeOffer(text);
      const record = await store.create({
        sessionId,
        sourceType,
        score: analysis.score,
        categoryIds: analysis.findings.map((finding) => finding.id)
      });

      response.status(201).json({
        success: true,
        data: {
          scanId: record.scanId,
          createdAt: record.createdAt,
          sourceType,
          inputText: text,
          ...analysis
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/scans", async (request, response, next) => {
    try {
      const sessionId = requiredText(
        request.query?.sessionId,
        "sessionId",
        100
      );
      const limit = parseLimit(request.query?.limit);
      const records = await store.list(sessionId, limit);
      const scans = records.map(historyItem);
      response.json({
        success: true,
        data: {
          scans,
          count: scans.length
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/scans/:id", async (request, response, next) => {
    try {
      const scanId = requiredText(request.params?.id, "scan id", 100);
      const sessionId = requiredText(
        request.query?.sessionId,
        "sessionId",
        100
      );
      const deleted = await store.delete(scanId, sessionId);
      if (!deleted) {
        throw apiError(
          404,
          "SCAN_NOT_FOUND",
          "Scan was not found for this session."
        );
      }
      response.json({
        success: true,
        data: { scanId, deleted: true }
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((_request, _response, next) => {
    next(apiError(404, "NOT_FOUND", "Route not found."));
  });

  app.use((error, _request, response, _next) => {
    void _next;
    const status =
      Number.isInteger(error.status) && error.status >= 400
        ? error.status
        : error.type === "entity.too.large"
          ? 413
          : 500;
    const code =
      error.code ||
      (status === 413 ? "PAYLOAD_TOO_LARGE" : "INTERNAL_SERVER_ERROR");
    response.status(status).json({
      success: false,
      error: {
        code,
        message:
          status === 500 ? "The request could not be completed." : error.message,
        ...(error.details ? { details: error.details } : {})
      }
    });
  });

  return app;
}
