# Технический отчёт: Classificator

**Версия:** 1.23.12  
**Дата отчёта:** 15.09.2026  
**Стек:** Next.js 16 (App Router) · React 19 · Docker · JSON-файлы  

---

## 1. Реализованный функционал

### 1.1. API-эндпоинты (REST, 22 шт.)

| Модуль | Эндпоинт | Методы | Статус |
|--------|----------|--------|--------|
| **Auth** | `/api/v1/auth/login` | POST | ✅ |
| | `/api/v1/auth/logout` | POST | ✅ |
| | `/api/v1/auth/me` | GET | ✅ |
| **Config** | `/api/v1/config` | GET, POST | ✅ (POST — заглушка) |
| **Metrics** | `/api/v1/metrics/list` | GET | ✅ |
| | `/api/v1/metrics/save` | POST | ✅ |
| | `/api/v1/metrics/delete` | DELETE | ✅ |
| **Metric Categories** | `/api/v1/metric-categories/list` | GET | ✅ |
| | `/api/v1/metric-categories/save` | POST | ✅ |
| | `/api/v1/metric-categories/delete` | DELETE | ✅ |
| **Measurements** | `/api/v1/measurements/list` | GET | ✅ |
| | `/api/v1/measurements/save` | POST | ✅ |
| | `/api/v1/measurements/delete` | DELETE | ✅ |
| **HW Revision** | `/api/v1/hw-revision/list` | GET | ✅ |
| | `/api/v1/hw-revision/save` | POST | ✅ |
| | `/api/v1/hw-revision/delete` | DELETE | ✅ |
| **Connected Sensors** | `/api/v1/connected-sensors/list` | GET | ✅ |
| | `/api/v1/connected-sensors/save` | POST | ✅ |
| | `/api/v1/connected-sensors/delete` | DELETE | ✅ |
| | `/api/v1/connected-sensors/upload` | POST, DELETE | ✅ |
| **JSON Parser** | `/api/v1/json-parser/files` | GET | ✅ |
| | `/api/v1/json-parser/analyze` | POST | ✅ |

**Прокси:** `/api/sensors/:path*` → `http://localhost:3001` (Next.js rewrite)

### 1.2. UI-страницы и компоненты

| Маршрут | Компонент | Описание | Статус |
|---------|-----------|----------|--------|
| `/` | Главная | Приветствие + отображение пользователя | ✅ |
| `/metrics` | `MetricsManagement` (296 строк) | CRUD метрик: таблица, сортировка, фильтры по категории, поиск, модальное редактирование, проверка дубликатов префиксов, кнопка "Копия", автоформирование префикса из категории + измерения | ✅ |
| `/metric-categories` | `MetricCategoriesManagement` (118 строк) | CRUD категорий метрик | ✅ |
| `/measurements` | `MeasurementsManagement` (157 строк) | CRUD измерений: поиск, сортировка по колонкам, проверка уникальности префикса на сервере | ✅ |
| `/hw-revision` | `SensorModelsManagement` (121 строка) | CRUD HW-ревизий | ✅ |
| `/connected-sensors` | Встроенная страница (328 строк) | CRUD сенсоров: фильтрация по категории, загрузка/удаление схем и PDF, просмотр файлов, связь с метриками | ✅ |
| `/config` | `ConfigManagement` (180 строк) | Редактор JSON-файлов с PrismJS | ✅ |
| `/sensors` | Заглушка | "Приборы в разработке" | ❌ |
| `/locations` | Заглушка | "Места установок в разработке" | ❌ |

### 1.3. Инфраструктурные модули

| Модуль | Файл | Описание |
|--------|------|----------|
| Auth server | `src/utils/auth.js` | In-memory сессии (Map), TTL 12ч, UUID, httpOnly cookie, хардкодные credentials |
| Auth client | `src/utils/api.js` | fetch-обёртка для login/logout/me/config |
| Config | `src/config/index.js` | Парсинг env-переменных в типизированный объект |
| AnchorStore | `src/services/anchorStore.js` | Заглушка кэширования пагинации (get → null, set → noop) |
| Layout | `src/app/layout.js` | Корневой layout с DashboardLayout |
| Sidebar | `src/components/SlideMenuBar.js` | Выдвижная навигация (7 пунктов для admin), адаптив под мобильные |
| Login | `src/components/LoginScreen.js` | Форма входа |
| CSS | `src/app/globals.css` (941 строка) | Полный дизайн: sidebar, модалки, таблицы, фильтры, адаптив |
| Docker | `Dockerfile` + `docker-compose.yml` | Multi-stage сборка, PM2, standalone output, порт 3082 |

---

## 2. Статус тестирования

### 2.1. Покрытие тестами

**Тесты отсутствуют полностью.** Ни одного тестового файла (*.test.*, *.spec.*, `__tests__/`) в проекте нет. Фреймворк тестирования не установлен.

### 2.2. Анализ в контексте TDD

Проект декларирует следование TDD (README.md), однако:

- **Unit-тесты:** Ни один модуль (`auth.js`, `config/index.js`, `anchorStore.js`) не покрыт.
- **API-тесты:** Ни один из 22 эндпоинтов не имеет интеграционных тестов.
- **UI-тесты:** Ни один React-компонент не имеет тестов.
- **Тестовая инфраструктура:** В `devDependencies` отсутствуют jest, vitest, playwright, cypress или аналоги.

**Вывод:** TDD не реализован. Тестовая инфраструктура находится на нулевом уровне.

### 2.3. Критические узлы, требующие тестов

1. **Аутентификация** (`auth.js`) — сессии, валидация credentials, TTL, cookie
2. **CRUD-операции** — чтение/запись JSON-файлов, конкурентный доступ
3. **Уникальность префиксов** — проверки на серверной стороне для measurements, categories, hw-revision
4. **Удаление файлов** — каскадное удаление при удалении connected-sensor
5. **UI-компоненты** — корректность отображения данных, модальные окна, фильтрация
6. **Загрузка файлов** — валидация типов, безопасность имён

---

## 3. Производительность и логика

### 3.1. Персистентность данных

**Хранение:** JSON-файлы в `public/config/` (8 файлов). Никакой базы данных нет.

**Проблемный паттерн — read-write без блокировок:**
```javascript
// Типовой CRUD (metrics/save/route.js)
const data = JSON.parse(fs.readFileSync(path, 'utf8')); // read
data.push(newItem);
fs.writeFileSync(path, JSON.stringify(data, null, 2));   // write
```

При конкурентных запросах возможна **потеря данных** (race condition). В продакшене с несколькими одновременными запросами save/delete одно изменение перезатрёт другое.

### 3.2. Асинхронные операции

- Все CRUD-эндпоинты используют **синхронные** `fs.readFileSync` / `fs.writeFileSync`. Это блокирует event loop, хотя при малых объёмах данных (сотни записей) влияние незаметно.
- Загрузка файлов — асинхронная (multipart), сохранение через `fs.writeFileSync`.
- Клиентские запросы к API через `fetch` — асинхронные с `async/await`.
- На странице connected-sensors — параллельная загрузка трёх списков через `Promise.all`.

### 3.3. Аутентификация

- **In-memory сессии:** `global.sessions` (Map). Сессии хранятся в памяти процесса и теряются при перезапуске сервера.
- **TTL:** 12 часов, продлевается при каждом запросе `getSession()`.
- **Credentials:** Хардкодные `api_voice` / `api_voice123` в `src/config/index.js`.
- **Cookie:** httpOnly, sameSite: lax, без Secure-флага (работает по HTTP).

**Риски:** отсутствие Redis/БД для сессий, хардкодный пароль, нет поддержки SSO.

### 3.4. Связи между сущностями

Данные связаны через ID (категории → метрики → измерения). Валидация целостности ссылок не выполняется:
- Можно удалить категорию, на которую ссылаются метрики
- Можно удалить метрику, на которую ссылаются сенсоры
- Можно удалить измерение, на которое ссылаются метрики

### 3.5. Пагинация

Заглушка — `AnchorStore` не реализован. Все list-эндпоинты возвращают полные массивы. При росте данных это приведёт к проблемам с памятью и временем ответа.

---

## 4. Текущие ограничения и баги

### 4.1. Критические

| Проблема | Описание | Файл |
|----------|----------|------|
| Race condition | Синхронное чтение-запись JSON без блокировок теряет данные при конкурентном доступе | Все CRUD-роуты |
| Нет тестов | Проект без какого-либо тестового покрытия | — |
| Хардкод пароля | `api_voice123` в конфиге, нет смены через env без редактирования кода | `src/config/index.js:12-13` |
| Нет валидации схемы | `connected_sensors` хранит `schemaImage` (строка) и `schemaImages` (массив) — дублирование формата | `connected_sensors.json` |
| Потеря сессий при рестарте | In-memory хранилище без Persistence | `src/utils/auth.js` |

### 4.2. Средней важности

| Проблема | Описание | Файл |
|----------|----------|------|
| anchorStore — заглушка | Пагинация не работает, get() возвращает null | `src/services/anchorStore.js` |
| POST /api/v1/config — заглушка | Возвращает `{ success: true }`, не сохраняет данные | `src/app/api/v1/config/route.js` |
| Нет Secure-флага cookie | Сессионная cookie без `Secure` — передаётся по HTTP | `src/utils/auth.js` |
| Нет защиты от XSS | JSON-редактор ConfigManagement рендерит пользовательский ввод | `src/components/ConfigManagement.js` |
| Нет каскадного удаления | Удаление категории/измерения не проверяет связанные метрики | Все delete-роуты |
| Смешение форматов | `schemaImage` (строка) и `schemaImages` (массив) — обе используются | `connected_sensors.json` |
| `sensors`, `locations` | Страницы-заглушки "в разработке" | `src/app/sensors/page.js`, `src/app/locations/page.js` |

### 4.3. Технический долг

| Проблема | Описание |
|----------|----------|
| Нет TypeScript | Проект на чистом JS, что затрудняет рефакторинг и типизацию |
| ESM + CommonJS | `type: module` в package.json, но зависимости mixed |
| Нет менеджера миграций | JSON-схема данных не версионируется |
| Docker не оптимален | Копирование всех node_modules в финальный образ |
| Нет CI/CD | В проекте нет GitHub Actions или аналогичного пайплайна |
| Нет линтинга тестов | ESLint настроен только для next |
| Нет переменных окружения для пароля | Пароль зашит в исходный код, хотя docker-compose передаёт другие переменные |
| Мобильная sidebar | Нативная адаптация для мобильных есть, но кнопка открытия (menu-trigger-btn) не вызывается — в `DashboardLayout` отсутствует обработчик |

### 4.4. Что требует оптимизации в следующих спринтах

1. **Миграция на БД** — замена JSON-файлов на SQLite/PostgreSQL с Prisma ORM
2. **Реализация AnchorStore** — кэширование пагинации через Redis или in-memory LRU
3. **Тестовая инфраструктура** — Vitest + React Testing Library + Playwright
4. **Управление сессиями** — Redis или httpOnly JWT вместо in-memory Map
5. **Валидация ввода** — Zod или Joi для схем API-запросов
6. **Каскадные удаления** — проверка ссылочной целостности
7. **CI/CD пайплайн** — lint → test → build → deploy
8. **Страницы "Приборы" и "Места установок"** — завершение реализации
9. **Безопасность** — secure cookie, XSS-защита JSON-редактора, env-переменная для пароля
10. **Асинхронизация CRUD** — замена `readFileSync`/`writeFileSync` на асинхронные аналоги с блокировкой файлов

---

## Резюме

Classificator — функциональное SPA для классификации метрик и приборов с REST API и JSON-персистентностью. **22 эндпоинта** и **6 полноценных UI-разделов** реализованы и работают. Проект находится в активной разработке: 2 страницы-заглушки, отсутствие тестов, хардкодные credentials, race condition в CRUD-операциях и заглушка пагинации — основные точки роста.

**Сильные стороны:** чистая архитектура, единый стиль кода, полноценный UI с модальными окнами, фильтрацией и сортировкой, адаптивный дизайн, Docker-инфраструктура.

**Слабые стороны:** отсутствие тестов, синхронный I/O, отсутствие БД, незащищённые конкурентные записи, хардкодные секреты.
