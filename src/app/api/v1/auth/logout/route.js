import { NextResponse } from 'next/server';
import { destroySession, getSession, serializeSessionCookie, handleApiError } from '@/utils/auth';

export async function POST() {
  try {
    const session = await getSession();
    destroySession(session?.id);
    const response = new NextResponse(null, { status: 204 });
    serializeSessionCookie(response, '', 0);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
