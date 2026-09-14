import crypto from 'node:crypto';
import { config } from '../config/index.js';
import { decodeCursor, encodeCursor } from '../utils/cursor.js';

const LEVEL1_RE = new RegExp(config.alertLevel1Regex || 'уровень\\s*1|ноль\\s+поста|0\\s*[-–]\\s*поста', 'i');
const LEVEL2_RE = new RegExp(config.alertLevel2Regex || 'уровень\\s*2|(?<![а-яёА-ЯЁ])НЯ(?![а-яёА-ЯЁ])|неблагоприятное\\s+явление|неопасное\\s+явление', 'i');
const LEVEL3_RE = new RegExp(config.alertLevel3Regex || 'уровень\\s*3|(?<![а-яёА-ЯЁ])ОЯ(?![а-яёА-ЯЁ])|(?<!не)опасное\\s+явление', 'i');
const DEVICE_RE = new RegExp(config.alertDeviceRegex || 'СПК[\\s_-]*([\\d.,]+)', 'i');

function parseAlertSubject(subject) {
  if (!subject) return { level: null, deviceId: null };
  const dev = DEVICE_RE.exec(subject);
  let level = null;
  if (LEVEL1_RE.test(subject)) level = 1;
  else if (LEVEL2_RE.test(subject)) level = 2;
  else if (LEVEL3_RE.test(subject)) level = 3;
  return {
    level,
    deviceId: dev ? dev[1].replace(/[\s,]/g, '') : null
  };
}

function eventName(subject) {
  if (!subject) return '';
  let s = String(subject);
  s = s.replace(/^\s*внимание[\s,:.!-]*/i, '');
  s = s.replace(DEVICE_RE, '');
  s = s.replace(/,/g, ' — ');
  s = s.replace(/(?:\s*—\s*){2,}/g, ' — ');
  s = s.replace(/\s+/g, ' ').trim();
  return s.replace(/^[\s—-]+/, '').replace(/[\s—-]+$/, '').trim();
}

function compareCallsAsc(a, b) {
  if (a.clock !== b.clock) {
    return a.clock - b.clock;
  }
  const idA = BigInt(a.alertid);
  const idB = BigInt(b.alertid);
  if (idA === idB) {
    return 0;
  }
  return idA < idB ? -1 : 1;
}

function dateLocalYMD(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDateRange(from, to) {
  const start = new Date(from);
  const end = new Date(to);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function toUnix(iso) {
  if (!iso) {
    return undefined;
  }
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    throw new Error('INVALID_DATE');
  }
  return Math.floor(ms / 1000);
}

function compareDesc(a, b) {
  const clockA = Number(a.clock);
  const clockB = Number(b.clock);
  if (clockA !== clockB) {
    return clockB - clockA;
  }
  const idA = BigInt(a.alertid);
  const idB = BigInt(b.alertid);
  if (idA === idB) {
    return 0;
  }
  return idA > idB ? -1 : 1;
}

function isAfterCursor(item, cursor) {
  const itemClock = Number(item.clock);
  if (itemClock < cursor.clock) {
    return true;
  }
  if (itemClock > cursor.clock) {
    return false;
  }
  return BigInt(item.alertid) < BigInt(cursor.alertid);
}

function normalizePhone(value) {
  if (!value) {
    return '';
  }
  return String(value).replace(/\D/g, '');
}

function matchesSendto(itemSendto, querySendto) {
  if (!querySendto) {
    return true;
  }
  const needlePhone = normalizePhone(querySendto);
  if (needlePhone) {
    return normalizePhone(itemSendto).includes(needlePhone);
  }
  return String(itemSendto || '').toLowerCase().includes(String(querySendto).toLowerCase());
}

export class AlertService {
  constructor({ zabbixClient, anchorStore }) {
    this.zabbixClient = zabbixClient;
    this.anchorStore = anchorStore;
  }

  buildFilterKey({ groupId, from, to, mediatypeid, sendto, status, text, limit }) {
    const keyPayload = {
      groupId,
      from: from || null,
      to: to || null,
      mediatypeid,
      sendto: sendto || null,
      status: status ?? null,
      text: text || null,
      limit
    };
    return crypto.createHash('sha1').update(JSON.stringify(keyPayload)).digest('hex');
  }

  async listAlerts(groupId, query) {
    if (Array.isArray(config.defaultAreas) && config.defaultAreas.length > 0) {
      const allowedGroupIds = new Set(config.defaultAreas);
      if (!allowedGroupIds.has(String(groupId))) {
        return {
          meta: {
            page: 1,
            pageSize: Math.min(Math.max(Number(query.limit) || config.defaultPageSize, 1), config.maxPageSize),
            from: query.from || null,
            to: query.to || null,
            hasNext: false,
            cursor: query.cursor || null,
            nextCursor: null,
            paginationMode: 'hybrid-cursor',
            anchorStep: this.anchorStore.anchorStep
          },
          data: []
        };
      }
    }

    const limit = Math.min(Math.max(Number(query.limit) || config.defaultPageSize, 1), config.maxPageSize);
    const page = Math.max(Number(query.page) || 1, 1);
    const from = query.from || undefined;
    const to = query.to || undefined;
    const rawMediatypeId = query.mediatypeid;
    const parsedMediatypeId = rawMediatypeId === undefined ? NaN : Number(rawMediatypeId);
    const mediatypeid = Number.isFinite(parsedMediatypeId)
      ? parsedMediatypeId
      : (config.defaultMediaTypeId > 0 ? config.defaultMediaTypeId : undefined);
    const sendto = query.sendto || undefined;
    const status = query.status === undefined ? undefined : Number(query.status);
    const text = query.text || undefined;

    const filterKey = this.buildFilterKey({
      groupId,
      from,
      to,
      mediatypeid: mediatypeid ?? null,
      sendto,
      status,
      text,
      limit
    });

    let cursor = decodeCursor(query.cursor || '');
    if (!cursor && page > 1) {
      cursor = await this.resolveCursorForPage({ page, filterKey, groupId, from, to, mediatypeid, sendto, status, text, limit });
    }

    const result = await this.fetchPage({ groupId, from, to, mediatypeid, sendto, status, text, limit, cursor });

    const data = result.items.map((item) => ({
      id: String(item.alertid),
      clock: Number(item.clock),
      time: new Date(Number(item.clock) * 1000).toISOString(),
      phone: item.sendto,
      subject: item.subject,
      status: Number(item.status),
      mediatypeid: Number(item.mediatypeid)
    }));

    if (result.nextCursorPayload && page % this.anchorStore.anchorStep === 0) {
      await this.anchorStore.set(filterKey, page + 1, result.nextCursorPayload);
    }

    return {
      meta: {
        page,
        pageSize: limit,
        from: from || null,
        to: to || null,
        hasNext: result.hasNext,
        cursor: query.cursor || null,
        nextCursor: result.nextCursor,
        paginationMode: 'hybrid-cursor',
        anchorStep: this.anchorStore.anchorStep
      },
      data
    };
  }

  async resolveCursorForPage(params) {
    const { page, filterKey } = params;
    const step = this.anchorStore.anchorStep;
    const anchorPage = Math.floor((page - 1) / step) * step + 1;
    let cursor = null;
    let currentPage = 1;

    if (anchorPage > 1) {
      const cached = await this.anchorStore.get(filterKey, anchorPage);
      if (cached) {
        cursor = cached;
        currentPage = anchorPage;
      }
    }

    while (currentPage < page) {
      const pageData = await this.fetchPage({ ...params, cursor });
      if (!pageData.nextCursorPayload) {
        return cursor;
      }
      cursor = pageData.nextCursorPayload;
      currentPage += 1;

      if (currentPage % step === 1) {
        await this.anchorStore.set(filterKey, currentPage, cursor);
      }
    }

    return cursor;
  }

  async getStats(groupId, query) {
    if (Array.isArray(config.defaultAreas) && config.defaultAreas.length > 0) {
      const allowedGroupIds = new Set(config.defaultAreas);
      if (!allowedGroupIds.has(String(groupId))) {
        throw new Error('GROUP_NOT_ALLOWED');
      }
    }

    const from = query.from || undefined;
    const to = query.to || undefined;
    const rawMediatypeId = query.mediatypeid;
    const parsedMediatypeId = rawMediatypeId === undefined ? NaN : Number(rawMediatypeId);
    const mediatypeid = Number.isFinite(parsedMediatypeId)
      ? parsedMediatypeId
      : (config.defaultMediaTypeId > 0 ? config.defaultMediaTypeId : undefined);
    const sendto = query.sendto || undefined;
    const status = query.status === undefined ? undefined : Number(query.status);
    const text = query.text || undefined;
    const pageSize = config.maxPageSize;
    const maxRecords = config.maxStatsRecords;

    let allItems = [];
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const result = await this.fetchPage({ groupId, from, to, mediatypeid, sendto, status, text, limit: pageSize, cursor });
      allItems = allItems.concat(result.items);
      if (allItems.length > maxRecords) {
        throw new Error('STATS_TOO_MANY_RECORDS');
      }
      hasMore = result.hasNext;
      cursor = result.nextCursorPayload;
    }

    const gapSeconds = config.statsEventGapSeconds;
    const devicesSeen = new Set();
    let unparsedCount = 0;

    // Группируем распознанные звонки по `deviceId|level`
    const groups = new Map();
    for (const item of allItems) {
      const { level, deviceId } = parseAlertSubject(item.subject);
      if (level === null || deviceId === null) {
        unparsedCount += 1;
        continue;
      }
      devicesSeen.add(deviceId);
      const key = `${deviceId}|${level}`;
      let bucket = groups.get(key);
      if (!bucket) {
        bucket = [];
        groups.set(key, bucket);
      }
      bucket.push({ clock: Number(item.clock), alertid: String(item.alertid), deviceId, level, subject: item.subject });
    }

    // В каждой группе сворачиваем подряд идущие звонки в события по разрыву во времени:
    // пока разрыв между соседними звонками <= gapSeconds — одно событие, иначе новое.
    const events = [];
    for (const calls of groups.values()) {
      calls.sort(compareCallsAsc);
      let current = null;
      let prevClock = null;
      for (const call of calls) {
        if (current && call.clock - prevClock <= gapSeconds) {
          current.end = call.clock;
          current.count += 1;
        } else {
          current = {
            deviceId: call.deviceId,
            level: call.level,
            start: call.clock,
            end: call.clock,
            count: 1,
            name: eventName(call.subject)
          };
          events.push(current);
        }
        prevClock = call.clock;
      }
    }

    events.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      if (a.deviceId !== b.deviceId) return a.deviceId < b.deviceId ? -1 : 1;
      return a.level - b.level;
    });

    // Дневные счётчики и сводка строятся из событий (по дню начала события)
    const daily = {};
    const summary = { level1: 0, level2: 0, level3: 0 };
    for (const ev of events) {
      const date = dateLocalYMD(ev.start);
      if (!daily[date]) daily[date] = { level1: 0, level2: 0, level3: 0 };
      daily[date][`level${ev.level}`] += 1;
      summary[`level${ev.level}`] += 1;
    }

    const totalUniqueEvents = summary.level1 + summary.level2 + summary.level3;

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    let dailyArray;
    if (fromDate && toDate && !Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
      const range = buildDateRange(from, to);
      dailyArray = range.map((date) => ({
        date,
        level1: daily[date]?.level1 ?? 0,
        level2: daily[date]?.level2 ?? 0,
        level3: daily[date]?.level3 ?? 0
      }));
    } else {
      dailyArray = Object.keys(daily).sort().map((date) => ({
        date,
        ...daily[date]
      }));
    }

    return {
      meta: {
        groupId: String(groupId),
        from: from || null,
        to: to || null,
        totalCallsProcessed: allItems.length,
        totalUniqueEvents,
        unparsedCount
      },
      summary,
      daily: dailyArray,
      events,
      posts: [...devicesSeen].sort()
    };
  }

  async fetchPage({ groupId, from, to, mediatypeid, sendto, status, text, limit, cursor }) {
    const params = {
      output: ['alertid', 'clock', 'sendto', 'subject', 'status', 'mediatypeid'],
      groupids: String(groupId),
      sortfield: ['clock', 'alertid'],
      sortorder: 'DESC',
      limit: limit + 1
    };

    if (mediatypeid !== undefined) {
      params.mediatypeids = [mediatypeid];
    }

    const fromUnix = toUnix(from);
    const toUnixValue = toUnix(to);
    if (fromUnix !== undefined) {
      params.time_from = fromUnix;
    }
    if (toUnixValue !== undefined) {
      params.time_till = toUnixValue;
    }
    if (cursor) {
      params.time_till = cursor.clock;
    }
    if (status !== undefined) {
      params.filter = { ...(params.filter || {}), status };
    }
    if (text) {
      params.search = { subject: text };
      params.searchByAny = true;
    }

    let items = await this.zabbixClient.getAlerts(params);

    if (sendto) {
      items = items.filter((item) => matchesSendto(item.sendto, sendto));
    }

    items = items.sort(compareDesc);

    if (cursor) {
      items = items.filter((item) => isAfterCursor(item, cursor));
    }

    const hasNext = items.length > limit;
    const pageItems = hasNext ? items.slice(0, limit) : items;
    const tail = pageItems[pageItems.length - 1];
    const nextCursorPayload = tail
      ? { clock: Number(tail.clock), alertid: String(tail.alertid) }
      : null;

    return {
      hasNext,
      items: pageItems,
      nextCursorPayload,
      nextCursor: nextCursorPayload ? encodeCursor(nextCursorPayload) : null
    };
  }
}
