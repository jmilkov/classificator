import { NextResponse } from 'next/server';
import { config } from '@/config';
import { getSession, handleApiError } from '@/utils/auth';

export async function GET() {
  try {
    return NextResponse.json({
      defaultMaster: config.defaultMaster,
      defaultArea: config.defaultArea,
      defaultAreas: config.defaultAreas,
      zabbixUrl: config.zabbixUrl,
      zabbixUser: config.zabbixUser,
      zabbixPassword: config.zabbixPassword
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only administrators can update config' } }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}