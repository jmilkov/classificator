function parseNumber(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return num;
}

function parseIdList(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .filter((item) => /^\d+$/.test(item));
}

export const config = {
  port: parseNumber(process.env.PORT, 3000),
  ssoEnabled: false,
  appLogin: 'api_voice',
  appPass: 'api_voice123',
  defaultMediaTypeId: parseNumber(process.env.CALL_MEDIA_TYPE_ID, 5),
  defaultPageSize: parseNumber(process.env.DEFAULT_PAGE_SIZE, 20),
  maxPageSize: parseNumber(process.env.MAX_PAGE_SIZE, 100),
  anchorStep: parseNumber(process.env.ANCHOR_STEP, 10),
  anchorTtlSeconds: parseNumber(process.env.ANCHOR_TTL_SECONDS, 1800),
  defaultMaster: process.env.DEFAULT_MASTER === '1',
  defaultArea: process.env.DEFAULT_AREA || '',
  defaultAreas: parseIdList(process.env.DEFAULT_AREAS),
  alertLevel1Regex: process.env.ALERT_LEVEL1_REGEX || '',
  alertLevel2Regex: process.env.ALERT_LEVEL2_REGEX || '',
  alertLevel3Regex: process.env.ALERT_LEVEL3_REGEX || '',
  alertDeviceRegex: process.env.ALERT_DEVICE_REGEX || '',
  maxStatsRecords: parseNumber(process.env.MAX_STATS_RECORDS, 50000),
  statsEventGapSeconds: parseNumber(process.env.STATS_EVENT_GAP_SECONDS, 3600)
};
