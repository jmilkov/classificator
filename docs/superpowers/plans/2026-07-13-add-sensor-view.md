# Добавление режима просмотра датчика Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить возможность просмотра детальной информации о датчике (название, фото, метрики) через новое модальное окно.

**Architecture:** Добавление состояния `viewingSensor` и нового модального окна просмотра, которое открывается по клику на кнопку «Просмотр» в списке датчиков.

**Tech Stack:** React (useState).

## Global Constraints
- Использовать существующие компоненты для модальных окон.
- Отображать информацию: модель, фото (schemaImage), список метрик.

---

### Task 1: Обновление `/src/app/connected-sensors/page.js`

**Files:**
- Modify: `/home/jm/Документы/git_project/SPK-Graph/src/app/connected-sensors/page.js`

**Interfaces:**
- Produces: Новое состояние `viewingSensor` и JSX для модального окна просмотра.

- [ ] **Step 1: Добавить состояние `viewingSensor`**

```javascript
// Внутри ConnectedSensorsPage
const [viewingSensor, setViewingSensor] = useState(null);
```

- [ ] **Step 2: Добавить кнопку «Просмотр» в таблицу**

```javascript
// Внутри map(s => ...), в блоке действий:
<button className="btn ghost" onClick={() => setViewingSensor(s)}>Просмотр</button>
```

- [ ] **Step 3: Создать модальное окно просмотра**

```javascript
// Перед закрывающим </div> внутри return:
{viewingSensor && (
  <div className="modal-overlay">
    <div className="modal-box" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '400px' }}>
      <h2>{viewingSensor.model}</h2>
      {viewingSensor.schemaImage && <img src={viewingSensor.schemaImage} style={{ maxWidth: '100%', borderRadius: '8px' }} />}
      <div>
        <strong>Метрики:</strong> {viewingSensor.metricIds.map(id => {
          const m = metrics.find(met => met.id === id);
          return m ? getMetricDisplay(m) : id;
        }).join(', ')}
      </div>
      <button className="btn primary" onClick={() => setViewingSensor(null)}>Закрыть</button>
    </div>
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/connected-sensors/page.js
git commit -m "feat: add sensor view mode"
```
