import { NextResponse } from 'next/server';
import { getSession, handleApiError } from '@/utils/auth';
import { config } from '@/config';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({
        user: null,
        authMode: 'none',
        ssoEnabled: false
      });
    }

    return NextResponse.json({
      user: { login: session.login, role: session.role || 'user', groupId: null },
      authMode: 'login',
      ssoEnabled: false
    });
  } catch (error) {
    return handleApiError(error);
  }
}