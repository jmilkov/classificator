import { NextResponse } from 'next/server';
import { config } from '@/config';
import { ZabbixClient } from '@/services/zabbixClient';
import { AlertService } from '@/services/alertService';
import { getSession, anchorStore, handleApiError } from '@/utils/auth';

function createAlertService(session) {
  let zabbixClient;
  if (config.zabbixToken) {
    zabbixClient = new ZabbixClient({ token: config.zabbixToken });
  } else if (config.zabbixUser && config.zabbixPassword) {
    zabbixClient = new ZabbixClient({ login: config.zabbixUser, password: config.zabbixPassword, token: '' });
  } else {
    zabbixClient = new ZabbixClient({ login: session.login, password: session.password, token: '' });
  }
  return new AlertService({ zabbixClient, anchorStore });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error('AUTH_REQUIRED');
    }

    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error('[GET /api/v1/groups Error]', error);
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error('AUTH_REQUIRED');
    }

    if (session.role !== 'admin') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only administrators can manage groups' } }, { status: 403 });
    }

    return NextResponse.json({ error: { code: 'NOT_SUPPORTED', message: 'Groups management is not available' } }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/v1/groups Error]', error);
    return handleApiError(error);
  }
}