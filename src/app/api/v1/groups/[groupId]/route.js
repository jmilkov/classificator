import { NextResponse } from 'next/server';
import { getSession, handleApiError } from '@/utils/auth';

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error('AUTH_REQUIRED');
    }

    if (session.role !== 'admin') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only administrators can edit groups' } }, { status: 403 });
    }

    return NextResponse.json({ error: { code: 'NOT_SUPPORTED', message: 'Groups management is not available' } }, { status: 400 });
  } catch (error) {
    console.error('[PUT /api/v1/groups/[groupId] Error]', error);
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error('AUTH_REQUIRED');
    }

    if (session.role !== 'admin') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only administrators can delete groups' } }, { status: 403 });
    }

    return NextResponse.json({ error: { code: 'NOT_SUPPORTED', message: 'Groups management is not available' } }, { status: 400 });
  } catch (error) {
    console.error('[DELETE /api/v1/groups/[groupId] Error]', error);
    return handleApiError(error);
  }
}