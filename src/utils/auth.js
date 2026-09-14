import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { config } from '@/config';
import { AnchorStore } from '@/services/anchorStore';

const SESSION_COOKIE = 'call_log_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60;

// Глобальное состояние сессий (в оперативной памяти)
if (!global.sessions) {
  global.sessions = new Map();
}
const sessions = global.sessions;

if (!global.anchorStore) {
  global.anchorStore = new AnchorStore();
}
const anchorStore = global.anchorStore;

export function createSession(login, password, extra = {}) {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    login,
    password,
    ...extra,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000
  });
  return sessionId;
}

export function destroySession(sessionId) {
  if (sessionId) {
    sessions.delete(sessionId);
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return null;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  session.expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  return { id: sessionId, ...session };
}

export function serializeSessionCookie(response, value, maxAgeSeconds = SESSION_TTL_SECONDS) {
  if (maxAgeSeconds <= 0) {
    response.cookies.set(SESSION_COOKIE, '', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 0,
      expires: new Date(0)
    });
  } else {
    response.cookies.set(SESSION_COOKIE, value, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: maxAgeSeconds
    });
  }
}

export async function verifyCredentials(login, password) {
  if (login === config.appLogin && password === config.appPass) {
    return { role: 'admin' };
  }
  throw new Error('INVALID_CREDENTIALS');
}

export function handleApiError(error) {
  console.error('[API Error]', error);
  const code = error.message || 'INTERNAL_ERROR';
  const clientErrors = new Set(['INVALID_CURSOR', 'INVALID_DATE', 'STATS_TOO_MANY_RECORDS', 'GROUP_NOT_ALLOWED', 'INVALID_CREDENTIALS_PAYLOAD']);
  const authErrors = new Set(['AUTH_REQUIRED', 'INVALID_CREDENTIALS']);
  const status = authErrors.has(code) ? 401 : clientErrors.has(code) ? 400 : 500;
  return NextResponse.json(
    {
      error: {
        code,
        message: 'Request failed',
        details: error.details || null
      }
    },
    { status }
  );
}

export { anchorStore };
