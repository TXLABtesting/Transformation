# Handoff: AI Transformation Portal (المنصة الحكومية لتخطيط ومتابعة مشروع الذكاء الاصطناعي المساعد)

## Overview
An Arabic, right-to-left (RTL) government portal to **collect, review, and track AI-transformation candidates** (projects, initiatives, operations, services) submitted by government entities, move them through an **approval workflow**, score each for **AI-transformation potential**, and let a national committee **fund** selected items. The goal: decide what can be "agentified" (automated with AI agents) and manage delivery from intake to launch.

Fully interactive prototype with browser persistence (localStorage) and a mock UAE PASS login. A **role switcher** at the top of the dashboard previews the four profiles.

## About the Design Files
The bundle is a **design reference authored in HTML** — one Design Component (`AI Transformation Portal.dc.html`) plus its runtime (`support.js`). It demonstrates intended look, copy, data model, and behavior — **not production code to ship directly**. Recreate it in the target codebase's stack (React/Next, Vue, …) using that stack's patterns, component library, form/validation, and state management. If no stack exists, React + react-hook-form + zod is a good default.

> **Reading the source:** markup lives between `<x-dc>…</x-dc>`; behavior lives in `class Component extends DCLogic { renderVals(){…} }`. `{{ x }}` are data holes filled by `renderVals()`; `<sc-if>` / `<sc-for>` are conditional/loop tags. You don't need this runtime in your target — read it as "template + a view-model function."

## Fidelity
**High-fidelity.** Final Arabic copy, colors, spacing, typography (Cairo), and interactions are intended as shown. RTL is mandatory (`dir="rtl"`, Arabic labels). Recreate pixel-close using your own primitives.

---

## ⭐ Roles & Permissions — the heart of the app (four profiles)
The app now runs an **entity-approves + committee-funds** model. In the prototype, `coord` is internally **aliased to `path`** for shared data-entry logic while kept distinct for display: `rawRole` = the real role, `role` = the aliased logic role. **In a clean rebuild, model these as four real, separate roles** using the matrix below.

| Role (Arabic) | Key | Scope | Create items? | Fills data? | Approves gates? | Funding role |
|---|---|---|---|---|---|---|
| **منسق المسار في الجهة** (Stream Coordinator) | `coord` | **Own entity, own stream** | ✅ **Only role that can** | ✅ **Yes — the filler** (scope/budget, execution, launch, fixes returns) | No | — |
| **ممثل المسار** (Stream Representative) | `path` | **Own stream across ALL entities** | No | **No — read-only oversight** | No | **Nominates** items to the committee (same checkbox UI) |
| **ممثل الجهة** (Entity Representative) | `entity` | Whole entity (all its streams) | No | No | ✅ **Yes — the ONLY approver** | Receives funding + cancellation notices for its items |
| **اللجنة الوطنية** (National Committee) | `ai` | **Everything, all entities, all streams** | No | No | **No (removed)** | **Funds** items (approves/adds to basket); can cancel funding with a reason |

Key rules:
- **`coord` is the data-entry role.** Every edit-granting affordance (fill CTAs, scope/budget editing, execution & launch checklists, the "returned for edits" banner, clearing FYIs) is `coord`-only.
- **`path` is read-only oversight.** It sees its stream across all entities but edits nothing. It can **nominate** items to the committee's basket.
- **`entity` is the sole gate approver** (`ent1`). The old committee gate is gone.
- **`ai` (committee) no longer approves workflow gates.** Its job is the **funding basket**.
- The **AI transformation score** is shown to the committee only.

## Visibility rules (who sees what)
- **`coord`**: its own entity's stream items in **all** states (draft → done).
- **`entity`**: its entity's items, minus drafts (sees `ent1` pending-approval items to act on).
- **`ai` (committee)** and **`path`**: only items **already approved by the entity rep** — i.e. `exec` / `launch` / `done`. They **cannot see** drafts or `ent1` (pending entity approval) items. (Pending-entity items are visible only to `coord` and the acting `entity`.)
- **`path`** and **`ai`** both have an **entity filter** (`كل الجهات` + each participating entity) on the dashboard, since they span entities.

## Streams / Paths (5, predefined)
| Path (Arabic) | id | Allowed types |
|---|---|---|
| بناء القدرات والتدريب | `capacity` | project, initiative |
| تقنيات الذكاء الاصطناعي والبيانات | `tech` | project, initiative |
| العمليات والدعم المؤسسي | `ops` | project, initiative, **operation** |
| العمل الحكومي الاستراتيجي | `strategy` | project, initiative |
| الخدمات | `services` | project, initiative, **service** |

Every path allows **project** + **initiative** (identical fields, different label). **operation** only in `ops`; **service** only in `services`.

## Approval Workflow (state machine — simplified)
Each item has a workflow state `wf`:

`draft` → `ent1` (بانتظار اعتماد ممثل الجهة) → `exec` → `launch` → `done`

- **The committee gate was removed.** Legacy `pm1`/`pm2` states are coerced to `exec` in `wfOf()` so old data isn't stranded — do not reintroduce them.
- `entity` approval on `ent1` advances straight to `exec`. `canActOn(item)` is true only for `entity` at `ent1`.
- **Approval log** (detail view) records only: submission by **منسق المسار في الجهة** → approval by **ممثل الجهة**. No committee-approval entry anywhere.
- Reject / request-info opens a **required-comment modal**; the item returns to the coordinator (status "أُعيد") and can't advance until re-approved.
- Every submission passes an **AI review** (`window.claude.complete` with heuristic fallback) before reaching the approver.
- Seed version key: `aitp_state.seedV === 'wf6'` (bump to reseed `items`).

## 🧺 Funding & Basket (committee) + Nomination (path)
The committee funds items instead of approving gates. Two participants, one shared selection UX.

**Selection UX (both `ai` and `path`):** a **small checkbox next to each item's title** (only on entity-approved items). Selecting one or more raises a **single fixed bottom bar** (navy) with a count and two buttons:
- **`ai`** → **تمويل التحول** (fund the selected) / **تخطي** (clear).
- **`path`** → **ترشيح للتحول** (nominate the selected to the committee) / **تخطي**.

**Data model (per item):**
- `nom` — nomination `{ by, role, path, at, direct? }`. Set when `path` nominates, or synthesized (`direct:true`) when the committee funds an un-nominated item.
- `funded` — `{ by:'اللجنة الوطنية', at, direct }`. Present ⇒ committee covers the transformation cost.
- `fundCancel` — `{ by, at, reason }`. Set when the committee cancels funding (funding is cleared).

**Funded status:** shown as a compact **معتمد للتمويل** chip in the card header (next to the workflow-status chip), green. For the committee the chip is a **button that opens the "cancel funding" modal** (a required reason; the entity is then notified). For other roles it's a static chip.

**Basket drawer (header السلة button, for `ai` and `path`):** right-side drawer, two tabs:
- **`ai`** — *العناصر المرشّحة* (`nom && !funded`, each showing **رشّحه: {nominator}** with **اعتماد التمويل** / **رفض**) and *العناصر المعتمدة* (`funded`).
- **`path`** — *ترشيحاتي* (their pending nominations, with سحب) and *العناصر المعتمدة* (their nominations that got funded).
- Header badge = count of pending nominations.

**Notifications:**
- Item funded → owning **entity**: "ستتكفّل اللجنة الوطنية بتكلفة تحويل هذا العنصر · يبقى التنفيذ من مسؤولية الجهة". Nominator (**path**): "اعتمدت اللجنة الوطنية تمويل ترشيحك".
- Funding cancelled → owning **entity**: "أُلغي تمويل اللجنة الوطنية لهذا العنصر · السبب: …".

**Key methods:** `toggleFundSel`, `clearFundSel`, `fundSelected`, `nominateSelected`, `commitSelection` (dispatches fund vs nominate by role), `fundItem`, `toggleFund`, `declineNom`, `withdrawNom`, `openCancelFund`/`confirmCancelFund`.

## Program stepper & detail timeline (role-specific)
The dashboard **program stepper** and the item **detail-view timeline** adapt to the role:
- **`coord`** (and `entity`): **3 steps** — (1) حصر واختيار أولويات التحول الذكي → (2) اعتماد ممثل الجهة لأولويات التحول → (3) تنفيذ واختبار التحول والإطلاق. Responsibilities: منسق المسار في الجهة / ممثل الجهة / منسق المسار في الجهة.
- **`ai`** and **`path`**: **2 steps** — (1) اعتماد اختيار أولويات التحول الذكي → (2) تنفيذ واختبار التحول والإطلاق.

The top-banner **countdown** targets the **first quarterly execution milestone** ("المرحلة الأولى · التقييم والتهيئة", ends 2026-07-31); color escalates green→amber→red as it nears.

## Item Types & Fields
Four types: `project`, `initiative`, `operation`, `service`; Arabic titles.

**Project / Initiative** (identical, label differs): name, description, expected outputs, expected outcomes, target AI-transformation % (`targetPct`), expected AI models (`aiModels`, int), expected impact, end date, status, path + transformation assessment.

**Operation**: `opType`, `subActivities`, automation level, automation % (slider), automation system, usage intensity + transformation assessment.

**Service**: main/sub service, classification, shared? (yes/no), automation level & %, system, usage intensity, transformability, readiness, transform priority, impact, complexity, path, notes.

**Transformation assessment (all)**: priority, complexity, rank (drag-drop reorder), transformability (قابل كلياً/جزئياً/غير قابل), transform priority, readiness % (slider), impact.

## Create Wizard (5 steps — `coord` only)
Driven by `fStep` 1→5; sub-stepper shows 5 pills; primary button reads "التالي" until step 5, then "مراجعة ذكية" (AI review) → submit.
1. **بيانات …** — general info (type-specific header fields).
2. **التصنيف والأولوية / تقييم التحول** — classification, priority, rank, transformation & automation assessment.
3. **النتائج المتوقعة** — outcomes, target %, expected AI models, impact, end date.
4. **نطاق العمل والميزانية** — detailed scope (`scopeOfWork`), estimated budget (`budget`), attachment (`scopeFile`). *(All required except the attachment.)*
5. **خطة التنفيذ والإطلاق** — merged step:
   - **Quarterly execution plan** (`phases`): **5 fixed ~3-month milestones**, each with name, period label, description, prefilled start/end dates, and an **"إضافة مرحلة فرعية"** to add/remove sub-milestones (`subs: [{name, date}]`):
     1. التقييم والتهيئة · يونيو–يوليو 2026 · 2026-06-01→2026-07-31
     2. إطلاق الدفعة الأولى · يوليو–نوفمبر 2026 · 2026-07-15→2026-11-30
     3. إطلاق الدفعة الثانية · ديسمبر 2026–فبراير 2027 · 2026-12-01→2027-02-28
     4. إطلاق الدفعة الثالثة · مارس–مايو 2027 · 2027-03-01→2027-05-31
     5. إطلاق الدفعة الرابعة · يونيو–أغسطس 2027 · 2027-06-01→2027-08-31
   - **Launch plan** (`launches`): one or more launch milestones (title, type, date, description), ticked complete at the launch stage.

## Transformation Recommendation Score
1–5 per item, shown to the committee as a **percentage** (score/5×100). Weighted: **Impact 25% · Feasibility/transformability 20% · Readiness 15% · Usage intensity 15% · Priority 10% · Automation opportunity 10% · Complexity-ease 5%** (+ small bonus for high manual rank; capped at 5). Buckets: **موصى به 100%** (≥4.2), **قائمة الانتظار** (2.0–4.19), **غير موصى به** (<2.0).

## Dashboards
- **`coord` / `entity`**: KPI strip (projects/initiatives/operations/services), cards, path rail (entity), program stepper, notifications.
- **`ai` (committee)**: analytics header — row of 5 stats (**الجهات المشاركة · إجمالي العناصر · بانتظار الاعتماد · معتمدة للتمويل · متوسط درجة التحول**), then a titled row **"تصنيف توصيات التحول الذكي"** (موصى به / قائمة الانتظار / غير موصى به). Entity + stream + type + status filters.
- **Cards**: type pill, workflow-status chip, `معتمد للتمويل` chip when funded, title (with selection checkbox for `ai`/`path`), 2-line description; `entity` pending items show اعتماد + ⋯ menu (رفض / طلب معلومات); `coord` shows the fill CTA.

## Form Validation
- **Team setup (بيانات ممثل الجهة):** الاسم الكامل, المسمى الوظيفي, رقم الهاتف are **required** (red `*` after the label text); **البريد الإلكتروني is optional**. Same rule for added team-member rows.
- Email fields valid-email; phone `type=tel` numeric.
- Numbers only for %/counts/budget (0–100 where applicable; budget currency-formatted).
- Required: item name, description, expected outcomes, scope, budget; reject/request-info comment; cancel-funding reason; a delayed execution item needs a new end date + reason.

## State Management
localStorage key `aitp_state` (`seedV: 'wf6'`). Core state:
- `role` (coord/path/entity/ai), `myPath`, `entityName`, `setup`.
- `items[]` — each: `id, type, path, title, desc, wf, ret, approval, priority, complexity, rank, impact, transformability, readiness, transformPriority, automationPct, automationSystem, usageIntensity, expectedOutputs, expectedOutcomes, targetPct, aiModels, endDate, status, scopeOfWork, budget, scopeFile, phases[] (each with subs[]), launches[], execChecklist[], log[], fyi, nom, funded, fundCancel` (+ service/operation-specific fields).
- `programPhases[]`, `programStep`.
- `ui` — modal/panel flags (`modalOpen, detailId, teamOpen, deadlinesOpen, rankOpen, notifOpen, profileOpen, basketOpen, basketTab, fundSel[], cancelFund, dViewStep, stepFilter, entFilter, filter, activePath, view`, create-wizard `fStep`, `draft`), `toastMsg`.

`wf` is the source of truth for gate status; `nom`/`funded`/`fundCancel` for the basket. All views derive from these so the four profiles stay in sync.

## Design Tokens
- **Primary blue**: `#2E74EE → #1F5FE0`; accent `#2563EB`; navy banners `#0B2A66 → #123f93`; navy chrome/bars `#0F1F3D`.
- **Funded/approved green**: `#0B8A4B` on `#E3F6EC`.
- **Basket teal** (nomination accents): `#0E7C86` / `#12A0AC` on `#DCF3F5`.
- **Neutrals**: text `#13213C`/`#33405A`; muted `#54627B`/`#8A97AD`/`#9AA6BC`; borders `#E7ECF4`/`#DCE3EE`; surfaces `#fff`/`#F7F9FD`/`#F1F4F9`; page bg `#EEF2F9`.
- **Status**: reject/red `#C0303B`/`#D23B45`; pending/amber `#B45309`.
- **Radius**: cards 16px, inner 13–14px, chips 999px, inputs 11px. **Type**: Cairo 400–900.

## Assets
`assets/uae-crest.png` (emblem), `assets/logo.png` (project logo), `assets/uaepass-finger.png` (UAE PASS icon). Icons are inline SVGs; the basket uses a shopping-basket glyph.

## Files
- `AI Transformation Portal.dc.html` — full design (template + logic). **Source of truth.**
- `support.js` — DC runtime (reference only; not needed in the target stack).
- `assets/` — logos + UAE PASS icon.

## Notes for the developer
- RTL + Arabic throughout; keep exact copy.
- Recreate the **role permission matrix**, the **`wf` state machine**, and the **funding/nomination/basket** model faithfully — they define the app.
- Model the four roles as **real, separate roles** (the `coord → path` aliasing is a prototype shortcut).
- The "AI review" step calls `window.claude.complete` with a heuristic fallback — wire to your own LLM endpoint or keep the heuristic.
