function toRecord(document) {
  return {
    scanId: String(document._id),
    createdAt: new Date(document.createdAt).toISOString(),
    sessionId: document.sessionId,
    sourceType: document.sourceType,
    score: document.score,
    categoryIds: [...document.categoryIds]
  };
}

export class MongoScanStore {
  constructor(ScanModel, mongoose) {
    this.kind = "mongodb";
    this.ScanModel = ScanModel;
    this.mongoose = mongoose;
  }

  async create(record) {
    const document = await this.ScanModel.create(record);
    return toRecord(document);
  }

  async list(sessionId, limit) {
    const documents = await this.ScanModel.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return documents.map(toRecord);
  }

  async delete(scanId, sessionId) {
    if (!this.mongoose.isValidObjectId(scanId)) return false;
    const result = await this.ScanModel.deleteOne({ _id: scanId, sessionId });
    return result.deletedCount === 1;
  }

  async close() {
    await this.mongoose.disconnect();
  }
}
