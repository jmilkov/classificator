# Classificator API Documentation

Base URL: `/api/v1`

---

## Auth

### POST /api/v1/auth/login

Аутентификация пользователя. Создаёт сессию и устанавливает cookie `call_log_session`.

- **Method:** POST
- **Content-Type:** application/json
- **Auth:** Нет

**Body:**
```json
{
  "login": "api_voice",
  "password": "api_voice123"
}
```

**Success (200):**
```json
{
  "user": {
    "login": "api_voice",
    "role": "admin",
    "groupId": null
  }
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INVALID_CREDENTIALS_PAYLOAD` | 400 | Пустое тело, невалидный JSON, отсутствует login или password |
| `INVALID_CREDENTIALS` | 401 | Неверный login/password |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

### POST /api/v1/auth/logout

Завершение сессии. Удаляет сессию на сервере и очищает cookie.

- **Method:** POST
- **Auth:** Есть (cookie)

**Success (204):** Нет тела ответа.

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `AUTH_REQUIRED` | 401 | Сессия не найдена или истекла |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

### GET /api/v1/auth/me

Возвращает информацию о текущем пользователе. Анонимные запросы не считаются ошибкой — возвращается `user: null`.

- **Method:** GET
- **Auth:** Опционально (cookie)

**Success (200) — authenticated:**
```json
{
  "user": {
    "login": "api_voice",
    "role": "admin",
    "groupId": null
  },
  "authMode": "login",
  "ssoEnabled": false
}
```

**Success (200) — anonymous:**
```json
{
  "user": null,
  "authMode": "none",
  "ssoEnabled": false
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

## Config

### GET /api/v1/config

Возвращает публичную конфигурацию приложения (Zabbix, мастера, зоны).

- **Method:** GET
- **Auth:** Нет

**Success (200):**
```json
{
  "defaultMaster": true,
  "defaultArea": "",
  "defaultAreas": [],
  "zabbixUrl": "",
  "zabbixUser": "",
  "zabbixPassword": ""
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

### POST /api/v1/config

Заглушка для обновления конфигурации. Требует роль admin.

- **Method:** POST
- **Auth:** Есть (cookie), роль `admin`

**Success (200):**
```json
{
  "success": true
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `FORBIDDEN` | 403 | Пользователь не является admin |
| `AUTH_REQUIRED` | 401 | Сессия не найдена или истекла |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

## Metrics

### GET /api/v1/metrics/list

Читает список метрик из `public/config/metrics.json`.

- **Method:** GET
- **Auth:** Нет

**Success (200):**
```json
[
  { "id": "1", "name": "CPU Load", "prefix": "cpu", ... },
  { "id": "2", "name": "Memory Usage", "prefix": "mem", ... }
]
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения файла `metrics.json` |

---

### POST /api/v1/metrics/save

Создаёт или обновляет метрику. Upsert по полю `id`.

- **Method:** POST
- **Content-Type:** application/json
- **Auth:** Нет

**Body:**
```json
{
  "id": "1",
  "name": "CPU Load",
  "prefix": "cpu"
}
```

**Success (200):**
```json
{
  "success": true
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения/записи файла `metrics.json` |

---

### DELETE /api/v1/metrics/delete

Удаляет метрику по `id`.

- **Method:** DELETE
- **Content-Type:** application/json
- **Auth:** Нет

**Body:**
```json
{
  "id": "1"
}
```

**Success (200):**
```json
{
  "success": true
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения/записи файла `metrics.json` |

---

## Metric Categories

### GET /api/v1/metric-categories/list

Читает список категорий метрик из `public/config/metric_categories.json`.

- **Method:** GET
- **Auth:** Нет

**Success (200):**
```json
[
  { "id": "1", "name": "System", "prefix": "sys" }
]
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения файла `metric_categories.json` |

---

### POST /api/v1/metric-categories/save

Создаёт или обновляет категорию метрик. Upsert по полю `id`. Проверяет уникальность `prefix`.

- **Method:** POST
- **Content-Type:** application/json
- **Auth:** Нет

**Body:**
```json
{
  "id": "1",
  "name": "System",
  "prefix": "sys"
}
```

**Success (200):**
```json
{
  "success": true,
  "category": { "id": "1", "name": "System", "prefix": "sys" }
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| 400 | 400 | Категория с таким префиксом уже существует |
| `INTERNAL_ERROR` | 500 | Ошибка чтения/записи файла `metric_categories.json` |

---

### DELETE /api/v1/metric-categories/delete

Удаляет категорию метрик по `id`.

- **Method:** DELETE
- **Content-Type:** application/json
- **Auth:** Нет

**Body:**
```json
{
  "id": "1"
}
```

**Success (200):**
```json
{
  "success": true
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения/записи файла `metric_categories.json` |

---

## Measurements

### GET /api/v1/measurements/list

Читает список измерений из `public/config/measurements.json`. Если файл отсутствует, создаёт пустой массив.

- **Method:** GET
- **Auth:** Нет

**Success (200):**
```json
[
  { "id": "1", "name": "Temperature", "prefix": "temp" }
]
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения файла `measurements.json` |

---

### POST /api/v1/measurements/save

Создаёт или обновляет измерение. Upsert по полю `id`. Проверяет уникальность `prefix`.

- **Method:** POST
- **Content-Type:** application/json
- **Auth:** Нет

**Body:**
```json
{
  "id": "1",
  "name": "Temperature",
  "prefix": "temp"
}
```

**Success (200):**
```json
{
  "success": true,
  "measurement": { "id": "1", "name": "Temperature", "prefix": "temp" }
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| 400 | 400 | Измерение с таким префиксом уже существует |
| `INTERNAL_ERROR` | 500 | Ошибка чтения/записи файла `measurements.json` |

---

### DELETE /api/v1/measurements/delete

Удаляет измерение по `id`.

- **Method:** DELETE
- **Content-Type:** application/json
- **Auth:** Нет

**Body:**
```json
{
  "id": "1"
}
```

**Success (200):**
```json
{
  "success": true
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения/записи файла `measurements.json` |

---

## HW Revision (Sensor Models)

### GET /api/v1/hw-revision/list

Читает список ревизий оборудования из `public/config/hw_revision.json`. Если файл отсутствует, создаёт пустой массив.

- **Method:** GET
- **Auth:** Нет

**Success (200):**
```json
[
  { "id": "1", "name": "v1.0", "prefix": "v1" }
]
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения файла `hw_revision.json` |

---

### POST /api/v1/hw-revision/save

Создаёт или обновляет ревизию оборудования. Upsert по полю `id`. Проверяет уникальность `prefix`.

- **Method:** POST
- **Content-Type:** application/json
- **Auth:** Нет

**Body:**
```json
{
  "id": "1",
  "name": "v1.0",
  "prefix": "v1"
}
```

**Success (200):**
```json
{
  "success": true,
  "model": { "id": "1", "name": "v1.0", "prefix": "v1" }
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| 400 | 400 | Ревизия с таким префиксом уже существует |
| `INTERNAL_ERROR` | 500 | Ошибка чтения/записи файла `hw_revision.json` |

---

### DELETE /api/v1/hw-revision/delete

Удаляет ревизию оборудования по `id`.

- **Method:** DELETE
- **Content-Type:** application/json
- **Auth:** Нет

**Body:**
```json
{
  "id": "1"
}
```

**Success (200):**
```json
{
  "success": true
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения/записи файла `hw_revision.json` |

---

## Connected Sensors

### GET /api/v1/connected-sensors/list

Читает список подключённых сенсоров из `public/config/connected_sensors.json`. Если файл отсутствует, создаёт пустой массив.

- **Method:** GET
- **Auth:** Нет

**Success (200):**
```json
[
  {
    "id": "1",
    "name": "Sensor A",
    "schemaImage": "/uploads/connected-sensors/img.png",
    "manualPdf": "/uploads/connected-sensors/manual.pdf"
  }
]
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения файла `connected_sensors.json` |

---

### POST /api/v1/connected-sensors/save

Создаёт или обновляет сенсор. Upsert по полю `id`.

- **Method:** POST
- **Content-Type:** application/json
- **Auth:** Нет

**Body:**
```json
{
  "id": "1",
  "name": "Sensor A",
  "schemaImage": "/uploads/connected-sensors/img.png",
  "manualPdf": "/uploads/connected-sensors/manual.pdf"
}
```

**Success (200):**
```json
{
  "success": true,
  "sensor": { "id": "1", "name": "Sensor A", ... }
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения/записи файла `connected_sensors.json` |

---

### DELETE /api/v1/connected-sensors/delete

Удаляет сенсор по `id`. Также удаляет прикреплённые файлы (`schemaImage`, `manualPdf`, `schemaImages[]`) из файловой системы.

- **Method:** DELETE
- **Content-Type:** application/json
- **Auth:** Нет

**Body:**
```json
{
  "id": "1"
}
```

**Success (200):**
```json
{
  "success": true
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения/записи файла `connected_sensors.json` |

---

### POST /api/v1/connected-sensors/upload

Загружает файл (схему или PDF) для сенсора.

- **Method:** POST
- **Content-Type:** multipart/form-data
- **Auth:** Нет

**Body (FormData):**
```
file: <binary>
```

**Success (200):**
```json
{
  "success": true,
  "url": "/uploads/connected-sensors/1712345678-image.png",
  "filename": "1712345678-image.png",
  "uploadedAt": "2025-04-01T12:00:00.000Z"
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| 400 | 400 | Файл не предоставлен |
| `INTERNAL_ERROR` | 500 | Ошибка записи файла |

---

### DELETE /api/v1/connected-sensors/upload

Удаляет загруженный файл по имени.

- **Method:** DELETE
- **Content-Type:** application/json
- **Auth:** Нет

**Body:**
```json
{
  "filename": "1712345678-image.png"
}
```

**Success (200):**
```json
{
  "success": true
}
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| 400 | 400 | Имя файла не предоставлено |
| `INTERNAL_ERROR` | 500 | Ошибка удаления файла |

---

## JSON Parser

### GET /api/v1/json-parser/files

Список JSON-файлов в директории `public/uploads/` с метаданными.

- **Method:** GET
- **Auth:** Нет

**Success (200):**
```json
[
  {
    "filename": "data.json",
    "size": 1024,
    "createdAt": "2025-04-01T10:00:00.000Z"
  }
]
```

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения директории `public/uploads` |

---

### POST /api/v1/json-parser/analyze

Парсит один или несколько JSON-файлов из `public/uploads/` и возвращает их содержимое.

- **Method:** POST
- **Content-Type:** application/json
- **Auth:** Нет

**Body:**
```json
{
  "filenames": ["data.json", "config.json"]
}
```

**Success (200):**
```json
[
  { "filename": "data.json", "data": { "key": "value" } },
  { "filename": "config.json", "error": "Invalid JSON" }
]
```

Каждый элемент результата содержит либо `data` (распаршенный JSON), либо `error` (строка с описанием ошибки).

**Errors:**
| Code | Status | Условие |
|------|--------|---------|
| `INTERNAL_ERROR` | 500 | Ошибка чтения файлов |

---

## Proxy (Next.js Rewrite)

### /api/sensors/:path*

Прокси на внешний воркер по адресу `http://localhost:3001`.

- **Method:** Любой (GET/POST/etc.)
- **URL:** `/api/sensors/*`
- **Auth:** Зависит от воркера

Проксируется на: `http://localhost:3001/api/sensors/:path*`

Документация эндпоинтов воркера находится в соответствующем репозитории сервиса `sensors-worker`.

---

## Общие форматы ошибок

Все ошибки возвращаются в едином формате (кроме случаев, где обработчик возвращает строку напрямую):

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Request failed",
    "details": null
  }
}
```

| HTTP Status | Описание |
|-------------|----------|
| 400 | Client error — невалидные данные запроса |
| 401 | Auth error — отсутствует/истекла сессия или неверные учётные данные |
| 403 | Forbidden — недостаточно прав (требуется admin) |
| 500 | Internal server error |