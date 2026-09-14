# Update Slide Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 10 new menu items to the `SlideMenuBar` and create corresponding route/page stubs.

**Architecture:** Update `SlideMenuBar.js` to include new nav-items. Create dummy `page.js` files for each new path to avoid 404 errors.

**Tech Stack:** Next.js (App Router), React, Lucide-react (icons).

## Global Constraints

- Menu items must be accessible to all users.
- Use `lucide-react` for icons.
- Maintain existing styling and `activeTab` logic.

---

### Task 1: Create Page Stubs
**Files:**
- Create: `src/app/operator/page.js`
- Create: `src/app/charts/page.js`
- Create: `src/app/map/page.js`
- Create: `src/app/calibration/page.js`
- Create: `src/app/sensors/page.js`
- Create: `src/app/sensor-models/page.js`
- Create: `src/app/metrics/page.js`
- Create: `src/app/metric-categories/page.js`
- Create: `src/app/measurements/page.js`
- Create: `src/app/locations/page.js`

- [ ] **Step 1: Create each file with a basic component**
Example content for each:
```javascript
export default function Page() {
  return <div>Страница в разработке</div>;
}
```

### Task 2: Update SlideMenuBar.js
**Files:**
- Modify: `src/app/components/SlideMenuBar.js`

- [ ] **Step 1: Update navigation items to include new entries**

Add these buttons to the `nav` section. I will select appropriate icons from `lucide-react`.

- [ ] **Step 2: Commit**
```bash
git add src/app/.../page.js src/components/SlideMenuBar.js
git commit -m "feat: add new items to slide menu and create page stubs"
```
