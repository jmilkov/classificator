import { NextResponse } from 'next/server';
import { createSession, destroySession, getSession, serializeSessionCookie, verifyCredentials, handleApiError } from '@/utils/auth';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    if (!rawBody) {
       console.error('[auth/login error] Empty request body');
       throw new Error('INVALID_CREDENTIALS_PAYLOAD');
    }
    
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
       console.error('[auth/login error] Could not parse JSON:', rawBody);
       throw new Error('INVALID_CREDENTIALS_PAYLOAD');
    }

    const login = String(body?.login || '').trim();
    const password = String(body?.password || '');

    if (!login || !password) {
      console.error('[auth/login error] Missing login or password');
      throw new Error('INVALID_CREDENTIALS_PAYLOAD');
    }

    const { role } = await verifyCredentials(login, password);

    const session = await getSession();
    if (session?.id) {
      destroySession(session.id);
    }

    const sessionId = createSession(login, password, { role });

    const response = NextResponse.json({ user: { login, role, groupId: null } });
    serializeSessionCookie(response, sessionId);
    return response;
  } catch (error) {
    if (
      error.message === 'ZABBIX_API_ERROR' ||
      error.message === 'ZABBIX_HTTP_401' ||
      error.message === 'ZABBIX_HTTP_403' ||
      error.message === 'INVALID_CREDENTIALS'
    ) {
      return handleApiError(new Error('INVALID_CREDENTIALS'));
    }
    return handleApiError(error);
  }
}