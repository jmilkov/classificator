const CURSOR_VERSION = 1;

export function encodeCursor(payload) {
  const normalized = {
    v: CURSOR_VERSION,
    clock: Number(payload.clock),
    alertid: String(payload.alertid)
  };
  return Buffer.from(JSON.stringify(normalized), 'utf8').toString('base64url');
}

export function decodeCursor(value) {
  if (!value) {
    return null;
  }
  let decoded;
  try {
    const raw = Buffer.from(value, 'base64url').toString('utf8');
    decoded = JSON.parse(raw);
  } catch (error) {
    throw new Error('INVALID_CURSOR');
  }

  if (decoded.v !== CURSOR_VERSION) {
    throw new Error('INVALID_CURSOR');
  }

  const clock = Number(decoded.clock);
  const alertid = String(decoded.alertid || '');
  if (!Number.isFinite(clock) || clock <= 0 || !alertid) {
    throw new Error('INVALID_CURSOR');
  }

  return { clock, alertid };
}
