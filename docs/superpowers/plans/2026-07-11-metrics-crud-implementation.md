# Implementation Plan: Metrics and Metric Categories CRUD

**Goal:** Create and integrate CRUD interfaces for managing "Metrics" and "Metric Categories" based on JSON file storage.

**Architecture:**
- Backend: REST API endpoints for CRUD operations on JSON files.
- Frontend: Table-based management components with modal forms.
- Data Storage: `public/config/metrics.json` and `public/config/metric_categories.json`.

**Tech Stack:** React, Next.js (App Router), standard fetch API.

## Global Constraints
- Storage: `public/config/` as `.json` files.
- UI: Reusable standard components.
- Naming: Consistent with existing `ConfigManagement.js`.

---

### Task 1: Backend API for Categories

**Files:**
- Create: `src/app/api/v1/metric-categories/list/route.js`
- Create: `src/app/api/v1/metric-categories/save/route.js`
- Create: `src/app/api/v1/metric-categories/delete/route.js`

**Interfaces:**
- Produces: `/api/v1/metric-categories/list`, `/api/v1/metric-categories/save`, `/api/v1/metric-categories/delete`

- [ ] **Step 1: Implement `list/route.js`**
Read `public/config/metric_categories.json` and return the array.

- [ ] **Step 2: Implement `save/route.js`**
Accept POST with `{id, name, description}`, update the JSON file.

- [ ] **Step 3: Implement `delete/route.js`**
Accept DELETE with `id`, update the JSON file.

- [ ] **Step 4: Commit**
```bash
git add src/app/api/v1/metric-categories/
git commit -m "feat: add API endpoints for metric-categories"
```

### Task 2: Backend API for Metrics

**Files:**
- Create: `src/app/api/v1/metrics/list/route.js`
- Create: `src/app/api/v1/metrics/save/route.js`
- Create: `src/app/api/v1/metrics/delete/route.js`

**Interfaces:**
- Produces: `/api/v1/metrics/list`, `/api/v1/metrics/save`, `/api/v1/metrics/delete`

- [ ] **Step 1: Implement `list/route.js`**
Read `public/config/metrics.json` and return the array.

- [ ] **Step 2: Implement `save/route.js`**
Accept POST with `{id, name, categoryId, description}`, update the JSON file.

- [ ] **Step 3: Implement `delete/route.js`**
Accept DELETE with `id`, update the JSON file.

- [ ] **Step 4: Commit**
```bash
git add src/app/api/v1/metrics/
git commit -m "feat: add API endpoints for metrics"
```

### Task 3: Frontend Component: Metric Categories Management

**Files:**
- Create: `src/components/MetricCategoriesManagement.js`
- Modify: `src/app/metric-categories/page.js`

- [ ] **Step 1: Implement `MetricCategoriesManagement.js`**
Use `ConfigManagement.js` as template, replacing file logic with fetch calls to the new categories API.

- [ ] **Step 2: Connect to `page.js`**
Update `src/app/metric-categories/page.js` to render the new component.

- [ ] **Step 3: Commit**
```bash
git add src/components/MetricCategoriesManagement.js src/app/metric-categories/page.js
git commit -m "feat: add MetricCategoriesManagement UI"
```

### Task 4: Frontend Component: Metrics Management

**Files:**
- Create: `src/components/MetricsManagement.js`
- Modify: `src/app/metrics/page.js`

- [ ] **Step 1: Implement `MetricsManagement.js`**
Use `ConfigManagement.js` as template. Implement form logic that fetches categories for the dropdown.

- [ ] **Step 2: Connect to `page.js`**
Update `src/app/metrics/page.js` to render the new component.

- [ ] **Step 3: Commit**
```bash
git add src/components/MetricsManagement.js src/app/metrics/page.js
git commit -m "feat: add MetricsManagement UI"
```
