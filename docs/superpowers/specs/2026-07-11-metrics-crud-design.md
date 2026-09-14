# Дизайн справочников: Метрики и Категории метрик

## 1. Обзор
Реализация CRUD-интерфейса для управления справочниками "Метрики" и "Категории метрик" для обеспечения структурированного учета и классификации метрик.

## 2. Структура данных (JSON)

### 2.1. Справочник категорий (`public/config/metric_categories.json`)
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string"
  }
]
```

### 2.2. Справочник метрик (`public/config/metrics.json`)
```json
[
  {
    "id": "string",
    "name": "string",
    "categoryId": "string",
    "description": "string"
  }
]
```

## 3. API
Будут реализованы эндпоинты в `src/app/api/v1/`:
- `GET /api/v1/metrics` / `GET /api/v1/metric-categories`: Получение списка.
- `POST /api/v1/metrics/save` / `POST /api/v1/metric-categories/save`: Создание/Обновление.
- `DELETE /api/v1/metrics/delete?id=...` / `DELETE /api/v1/metric-categories/delete?id=...`: Удаление.

## 4. UI Компоненты
- `MetricCategoriesManagement.js`: Управление категориями (Таблица + Форма).
- `MetricsManagement.js`: Управление метриками (Таблица с выпадающим списком категорий + Форма).

## 5. Взаимодействие
- Использование стандартных компонентов (кнопки, таблицы, модальные окна), аналогичных `ConfigManagement.js`.
- Интеграция в существующее меню `SlideMenuBar.js`.
