# Добавление схемы подключения к датчику Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить возможность загрузки и отображения схемы подключения (в формате изображения) для датчиков в `/connected-sensors`.

**Architecture:** Использование Base64 для передачи изображения внутри `formData`. В UI добавляется поле `<input type="file">`, изображение конвертируется в строку base64 перед сохранением.

**Tech Stack:** React, JavaScript (Base64 conversion).

## Global Constraints
- Сохранить текущий формат API (JSON).
- Работа с фото через `input type="file"`.

---

### Task 1: Обновление UI и логики в `/connected-sensors/page.js`

**Files:**
- Modify: `/home/jm/Документы/git_project/SPK-Graph/src/app/connected-sensors/page.js`

**Interfaces:**
- Produces: Обновленный `formData` с полем `schemaImage` (base64 string).

- [ ] **Step 1: Добавить поле `schemaImage` в начальное состояние `formData`**

```javascript
// Внутри ConnectedSensorsPage
const [formData, setFormData] = useState({ id: '', model: '', categoryId: '', metricIds: [], description: '', schemaImage: '' });
```

- [ ] **Step 2: Добавить input для загрузки файла в модальное окно**

```javascript
// Внутри JSX модального окна, после textarea
<label>Схема подключения:</label>
<input type="file" accept="image/*" capture="environment" onChange={e => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({...formData, schemaImage: reader.result});
    };
    reader.readAsDataURL(file);
  }
}} />
{formData.schemaImage && <img src={formData.schemaImage} style={{ maxWidth: '100px', marginTop: '10px' }} />}
```

- [ ] **Step 3: Обновление отображения в таблице (опционально, если нужно видеть превью)**

(Можно добавить колонку или всплывающее окно при клике).

- [ ] **Step 4: Commit**

```bash
git add src/app/connected-sensors/page.js
git commit -m "feat: add schema upload functionality"
```
