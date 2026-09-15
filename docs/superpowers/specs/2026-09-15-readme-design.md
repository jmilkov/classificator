# README.md — Design Document

## Назначение

Создать профессиональный README.md на русском языке для проекта Classificator.

## Целевая аудитория

Разработчики, DevOps-инженеры, новые участники проекта.

## Содержание (по разделам)

### 1. О проекте

Classificator — веб-приложение для управления приборами: метрики, измерения, HW-ревизии, подключённые сенсоры, места установок.

### 2. Стек технологий

- **Runtime:** Node.js 20
- **Фреймворк:** Next.js 16 (App Router)
- **Язык:** JavaScript (ES Modules)
- **UI:** React 19, Recharts (графики), PrismJS (подсветка кода)
- **Обработка изображений:** Sharp
- **Сообщения:** MQTT
- **Виртуализация:** Docker, Docker Compose
- **API-клиент:** Axios
- **Даты:** date-fns
- **Конфигурация:** dotenv

### 3. Быстрый старт

- Клонирование репозитория
- Установка зависимостей (`npm install`)
- Настройка `.env` (переменные из docker-compose.yml и src/config/index.js)
- Запуск dev-сервера (`npm run dev`)
- Сборка и запуск через Docker (`docker compose up`)

### 4. Архитектура и структура папок

Дерево каталогов с описанием:

```
.
├── .agents/              # Конфигурация агентов Kilo
├── public/
│   ├── config/           # JSON-конфигурации (сенсоры, метрики и т.д.)
│   └── uploads/          # Загруженные файлы
├── scripts/
│   └── increment-version.sh  # Автоинкремент версии при сборке
├── src/
│   ├── app/
│   │   ├── api/v1/       # REST API (Next.js Route Handlers)
│   │   │   ├── auth/         # Аутентификация (login, logout, me)
│   │   │   ├── config/       # Конфигурация приложения
│   │   │   ├── measurements/ # Измерения (CRUD)
│   │   │   ├── metrics/      # Метрики (CRUD)
│   │   │   ├── metric-categories/ # Категории метрик (CRUD)
│   │   │   ├── connected-sensors/ # Подключаемые сенсоры (CRUD)
│   │   │   ├── hw-revision/  # HW-ревизии (CRUD)
│   │   │   └── json-parser/  # Парсинг JSON
│   │   ├── page.js          # Главная страница
│   │   ├── layout.js        # Корневой layout
│   │   ├── globals.css      # Глобальные стили
│   │   └── <page>/page.js   # Страницы: config, sensors, measurements и т.д.
│   ├── components/       # React-компоненты
│   ├── config/           # Серверная конфигурация (env → config object)
│   ├── services/         # Бизнес-логика
│   └── utils/            # Утилиты (API-клиент, аутентификация)
├── Dockerfile            # Многостадийная сборка
├── docker-compose.yml    # Локальный запуск
├── next.config.mjs       # Next.js конфигурация
├── jsconfig.json         # Пути для импортов (@/ → src/)
└── package.json
```

### 5. Тестирование

- Секция-заглушка: указать, что тесты запускаются командой (будет добавлено при настройке тестового фреймворка).

## Ограничения

- README пишется на русском языке
- Учитывается TDD-подход (секция тестирования сигнализирует о необходимости настройки)
- Файл перезаписывает существующий README.md