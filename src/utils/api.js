async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body?.error?.code || 'REQUEST_FAILED')
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export function fetchMe() {
  return requestJson('/api/v1/auth/me')
}

export function login(loginValue, password) {
  return requestJson('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login: loginValue, password })
  })
}

export function logout() {
  return requestJson('/api/v1/auth/logout', { method: 'POST' })
}

export function fetchConfig() {
  return requestJson('/api/v1/config')
}

export function updateConfig(data) {
  return requestJson('/api/v1/config', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export function fetchStats(groupId, params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, String(v))
  })
  return requestJson(`/api/v1/groups/${groupId}/stats?${query}`)
}

export function fetchAlerts(groupId, params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  return requestJson(`/api/v1/groups/${groupId}/alerts?${query.toString()}`)
}