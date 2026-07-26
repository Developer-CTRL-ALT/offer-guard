import { randomUUID } from "node:crypto";

function clone(record) {
  return {
    ...record,
    categoryIds: [...record.categoryIds]
  };
}

export class MemoryScanStore {
  constructor() {
    this.kind = "memory";
    this.records = new Map();
  }

  async create(record) {
    const stored = {
      scanId: randomUUID(),
      createdAt: new Date().toISOString(),
      sessionId: record.sessionId,
      sourceType: record.sourceType,
      score: record.score,
      categoryIds: [...record.categoryIds]
    };
    this.records.set(stored.scanId, stored);
    return clone(stored);
  }

  async list(sessionId, limit) {
    return [...this.records.values()]
      .filter((record) => record.sessionId === sessionId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map(clone);
  }

  async delete(scanId, sessionId) {
    const record = this.records.get(scanId);
    if (!record || record.sessionId !== sessionId) return false;
    return this.records.delete(scanId);
  }

  async close() {}
}
