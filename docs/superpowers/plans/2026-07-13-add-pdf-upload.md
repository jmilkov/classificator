# Добавление загрузки PDF-инструкций Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить возможность загрузки и скачивания PDF-инструкций для датчиков.

**Architecture:** Использование Base64 для хранения PDF внутри `formData` (как и для изображений). В UI добавляется поле для загрузки PDF и ссылка на скачивание в режиме просмотра.

**Tech Stack:** React, JavaScript.

## Global Constraints
- Использовать текущий формат API (JSON).
- PDF файлы хранятся как Base64 строки в поле `manualPdf`.

---

### Task 1: Обновление `/src/app/connected-sensors/page.js`

**Files:**
- Modify: `/home/jm/Документы/git_project/SPK-Graph/src/app/connected-sensors/page.js`

**Interfaces:**
- Produces: Новое поле `manualPdf` в объектах датчиков.

- [ ] **Step 1: Обновить `formData` (добавить `manualPdf`)**

```javascript
// Внутри ConnectedSensorsPage
const [formData, setFormData] = useState({ id: '', model: '', categoryId: '', metricIds: [], description: '', schemaImage: '', manualPdf: '' });
```

- [ ] **Step 2: Добавить поле загрузки PDF в модальное окно редактирования**

```javascript
// Внутри модального окна редактирования
<label>Инструкция (PDF):</label>
<input type="file" accept="application/pdf" onChange={e => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({...formData, manualPdf: reader.result});
    };
    reader.readAsDataURL(file);
  }
}} />
{formData.manualPdf && <span>Файл выбран.</span>}
```

- [ ] **Step 3: Добавить ссылку на скачивание в модальное окно просмотра**

```javascript
// Внутри модального окна просмотра
{viewingSensor.manualPdf && (
  <a href={viewingSensor.manualPdf} download={`${viewingSensor.model}_manual.pdf`} className="btn ghost">
    Скачать инструкцию
  </a>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/connected-sensors/page.js
git commit -m "feat: add pdf manual upload"
```
