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

export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error('AUTH_REQUIRED');
    }

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    const { groupId } = await params;

    const payload = await createAlertService(session).getStats(groupId, query);
    return NextResponse.json(payload);
  } catch (error) {
    const { groupId } = await params;
    console.error(`[GET /api/v1/groups/${groupId}/stats Error]`, error);
    return handleApiError(error);
  }
}