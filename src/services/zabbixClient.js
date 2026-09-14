import { config } from '../config/index.js';

function isVersionLessThan54(versionStr) {
  if (!versionStr || typeof versionStr !== 'string') return false;
  const parts = versionStr.split('.').map(Number);
  const major = parts[0] || 0;
  const minor = parts[1] || 0;
  
  if (major < 5) return true;
  if (major === 5 && minor < 4) return true;
  return false;
}

export class ZabbixClient {
  constructor(options = {}) {
    this.url = config.zabbixUrl;
    this.auth = null;
    this.useApiToken = false;
    this.requestId = 1;
    this.login = options.login ?? config.zabbixUser;
    this.password = options.password ?? config.zabbixPassword;
    this.token = options.token ?? config.zabbixToken;
    this.loginField = null;
    this.version = null;
  }

  async request(method, params = {}, requireAuth = true) {
    if (!this.url) {
      throw new Error('ZABBIX_URL_NOT_CONFIGURED');
    }

    const payload = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.requestId
    };
    this.requestId += 1;

    if (requireAuth) {
      await this.ensureAuth();
    }

    const headers = { 'Content-Type': 'application/json' };
    if (requireAuth && this.useApiToken && this.auth) {
      headers.Authorization = `Bearer ${this.auth}`;
    }

    if (requireAuth && !this.useApiToken) {
      payload.auth = this.auth;
    }

    // Логируем исходящий запрос (маскируем токен/пароль для безопасности, если это user.login)
    const sanitizedPayload = { ...payload };
    if (sanitizedPayload.auth) {
      sanitizedPayload.auth = '***';
    }
    if (method === 'user.login' && sanitizedPayload.params) {
      sanitizedPayload.params = { ...sanitizedPayload.params };
      if (sanitizedPayload.params.password) sanitizedPayload.params.password = '***';
    }

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });


      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error(`[Zabbix API HTTP Error] Status ${response.status}, Body: ${text}`);
        throw new Error(`ZABBIX_HTTP_${response.status}`);
      }

      const body = await response.json();


      if (body.error) {
        console.error(`[Zabbix API Error Details]`, JSON.stringify(body.error));
        const error = new Error('ZABBIX_API_ERROR');
        error.details = body.error;
        throw error;
      }
      return body.result;
    } catch (err) {
      console.error(`[Zabbix Request Failed] Error: ${err.message}`, err);
      throw err;
    }
  }

  async getVersion() {
    if (this.version) {
      return this.version;
    }
    try {
      const version = await this.request('apiinfo.version', {}, false);
      this.version = version;
      return version;
    } catch (err) {
      console.warn(`[Zabbix Client] Failed to fetch version: ${err.message}`);
      return null;
    }
  }

  async ensureAuth() {
    if (this.auth) {
      return;
    }

    const version = await this.getVersion();
    const isLegacy = version ? isVersionLessThan54(version) : false;

    if (this.token) {
      this.useApiToken = !isLegacy;
      this.auth = this.token;
      return;
    }

    if (!this.login || !this.password) {
      throw new Error('ZABBIX_CREDENTIALS_NOT_CONFIGURED');
    }

    const fields = this.loginField
      ? [this.loginField]
      : (isLegacy ? ['user'] : ['user', 'username']);
    let lastError = null;

    for (const field of fields) {
      try {
        const result = await this.request(
          'user.login',
          {
            [field]: this.login,
            password: this.password
          },
          false
        );
        this.useApiToken = !isLegacy && field === 'username';
        this.auth = result;
        this.loginField = field;
        return;
      } catch (error) {
        lastError = error;
        const details = String(error.details?.data || '');
        const invalidField = error.message === 'ZABBIX_API_ERROR' && details.includes(`unexpected parameter "${field}"`);
        if (invalidField && !this.loginField) {
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error('ZABBIX_API_ERROR');
  }

  async getAlerts(params) {
    return this.request('alert.get', params);
  }
}
