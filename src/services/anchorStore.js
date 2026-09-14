import { config } from '../config/index.js';

export class AnchorStore {
  constructor() {
    this.available = false;
    this.anchorStep = config.anchorStep;
    this.ttlSeconds = config.anchorTtlSeconds;
    this.client = null;
  }

  getCacheKey(filterKey) {
    return `call-log:anchors:${filterKey}`;
  }

  async get(filterKey, page) {
    return null;
  }

  async set(filterKey, page, cursorPayload) {
    // no-op
  }
}
