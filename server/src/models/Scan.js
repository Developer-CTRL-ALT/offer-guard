import mongoose from "mongoose";
import { RISK_CATEGORY_IDS } from "../analyzer.js";

const scanSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      maxlength: 100,
      index: true
    },
    sourceType: {
      type: String,
      required: true,
      enum: ["whatsapp", "email", "sms", "job_portal"]
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    categoryIds: [
      {
        type: String,
        enum: RISK_CATEGORY_IDS
      }
    ]
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    strict: "throw"
  }
);

scanSchema.index({ sessionId: 1, createdAt: -1 });

export const Scan =
  mongoose.models.OfferGuardScan ||
  mongoose.model("OfferGuardScan", scanSchema);
