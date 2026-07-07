# Changelog — delta since the last README handoff

Apply these on top of the current implementation. Each item states the intended behavior; the authoritative source is the refreshed `AI Transformation Portal.dc.html` in this folder. Search the file for the quoted Arabic strings / prop names to locate the exact logic.

## Workflow / roles
- **Funding requires entity approval.** An item can only be funded (or nominated, or shown as fundable) once it has passed the entity-rep gate — i.e. workflow state is `exec` / `launch` / `done`. Committee and ممثل المسار never see or act on `draft` / `ent1` items. Hard-guarded in `fundItem` / `fundSelected` via `isEntityApproved(it)`.
- **Scope + budget are required before submission.** Submitting an item for approval (`ent1`) is blocked unless `scopeOfWork` and `budget` are filled; the wizard bounces the user back to the "نطاق العمل والميزانية" step. Enforced in `fNext` (step 5) and `submitDraft`.
- **Program stepper & item-detail timeline are role-specific:** `coord`/`entity` see 3 steps (collect → entity approval → execution & launch); `ai`/`path` see 2 steps (approval → execution & launch).
- **Detail-view exec/launch bug fix:** the execution checklist, launch-plan checklist, and finish/go-launch actions are now gated on the workflow state (`exec`/`launch`/`done`) — previously gated on stale `step>=5`/`step>=6` thresholds from the old 6-phase flow that never triggered in the current 3-step flow, so those actions silently never rendered.

## Roles recap (unchanged model, for reference)
`coord` (منسق المسار في الجهة) = the only creator/filler; `path` (ممثل المسار) = read-only cross-entity oversight that nominates to the committee; `entity` (ممثل الجهة) = sole gate approver; `ai` (اللجنة الوطنية) = funds via the basket, no gate approvals.

## Detail view = view-only
- The item detail page is **view-only** for item data. Scope/budget are read-only there (`canEditScope=false`).
- For a `draft` opened by `coord`, the footer button reads **"متابعة وإكمال البيانات وإرسالها"** and opens the create wizard (`editItem`) to finish + submit — no inline editing in the detail.
- Execution/launch **tracking** (checklists, mark-done, finish) remains actionable in the detail for `coord` (that's operational progress, not data editing).

## Create wizard (redesign)
- **Numbered stepper (1–5)** with connecting lines, checkmarks on completed steps, current highlighted, click-back to finished steps; plus a **step title + hint** under the stepper.
- Previously-blank **Type** and **Method** screens now have headers ("اختر نوع العنصر", "طريقة الإضافة"); type options have icons.
- **5 steps:** (1) general data, (2) classification/assessment, (3) expected outcomes, (4) **نطاق العمل والميزانية** (scope + budget + attachment; all required except attachment), (5) **خطة التنفيذ والإطلاق**.
- **Attachment field** supports remove (✕) and change/replace once a file is added (`hasScopeFileCreate` / `onRemoveScopeFileCreate`).

## Execution plan (step 5) — quarterly milestones
- 5 fixed quarterly milestones (see README). Card layout: number + name + description on the right, a **gray period pill on the top-left**; the main start/end timeline is **not editable** (predefined).
- Each milestone has **sub-milestones** with **name + start date + end date** (`subs: [{name,start,end}]`); one empty sub-milestone is **open by default** on every milestone, with an "إضافة مرحلة فرعية" button to add more, and ✕ to remove.

## Basket & funding UX
- **Selection model:** committee and ممثل المسار each get a **small checkbox next to the item title** (only on entity-approved items). Selecting ≥1 raises a single navy **bottom action bar** — committee: **تمويل التحول** / تخطي; path: **ترشيح للتحول** / تخطي.
- **Funded state** = compact **"معتمد للتمويل"** chip in the card header (next to the status chip). For the committee it's a button that opens a **cancel-funding modal (required reason)**; the owning entity is notified of the cancellation.
- **Basket drawer:** "العناصر المرشّحة" rows are trimmed (removed the score badge and the "رشّحه:" line). "العناصر المعتمدة" rows show a neutral **funding-source line**: "اعتُمد مباشرة من اللجنة الوطنية" (direct) or "بترشيح من {name} · {stream}".
- **Sticky total footer:** the basket has a clean, always-visible bottom footer **"إجمالي تكلفة التمويل المعتمد"** = sum of funded items' budgets (parsed from the `budget` strings), formatted with `درهم`.

## Dashboard
- **Completion metric** for `entity` and `coord`: a small **"نسبة الإنجاز"** KPI card (percentage) inside the KPI grid — stage-weighted (`draft 0 / ent1 25 / exec 60 / launch 85 / done 100`, averaged over scope).
- **Committee analytics:** added a **"معتمدة للتمويل"** (funded count) stat; the recommendation row sits under a **"تصنيف توصيات التحول الذكي"** heading.
- **Filters:** ممثل المسار now has the **entity filter** (كل الجهات + participating entities). For `ai`/`path` the status filter drops "بحاجة لإجرائي" and "بانتظار الاعتماد".
- **Top countdown** targets the first quarterly execution milestone ("المرحلة الأولى · التقييم والتهيئة", ends 2026-07-31).

## Approval log & copy
- Approval log records only **submission by منسق المسار في الجهة → approval by ممثل الجهة** (no committee-approval entry). ممثل المسار has a display name ("خليفة السويدي") used on nomination attributions.

## Team setup validation
- الاسم الكامل / المسمى الوظيفي / رقم الهاتف are **required** (red `*` after the label text); **البريد الإلكتروني is optional**. Same for added team-member rows.

## New/changed data fields
`items[]`: `nom {by,role,path,at,direct?}`, `funded {by,at,direct}`, `fundCancel {by,at,reason}`, `phases[].period`, `phases[].subs[] {name,start,end}`. Seed version key advanced to `wf8`.

---

## Round 2 — changes since the sections above

- **Funded status now shows inside the item detail.** A "معتمد للتمويل من اللجنة الوطنية" banner appears in the detail body (not just the card), with the source line (`dFunded` / `dFundedText`: direct committee selection vs "بترشيح من {name}"), plus "يبقى التنفيذ من مسؤولية الجهة".
- **Returned-item copy + status.** The reject/request-info banner (card + detail) is relabeled **"ملاحظات ممثل الجهة"** (entity-rep comments) instead of "أُعيد من …", with a comment/speech-bubble icon. A returned item (has `ret`) now shows a distinct amber status chip **"بحاجة إلى تعديل"** instead of "مسودة", so it isn't confused with a fresh draft.
- **Real Excel & PowerPoint export.** The dashboard Excel/PowerPoint buttons now generate actual files client-side: **`.xlsx`** via SheetJS (one row per item: type, title, stream, entity, status, priority, budget, scope, completion %, committee-funded) and **`.pptx`** via PptxGenJS (title slide + one slide per item with a details table and scope). Both libraries are loaded from CDN in the page `<head>` (`xlsx.full.min.js`, `pptxgen.bundle.js`) — **file generation needs internet**; in the target stack use the equivalent server-side or bundled libraries.
- **Launch items are numbered/named** in the create wizard's launch plan: "الإطلاق الأول", "الإطلاق الثاني", … (`launchRows[].numLabel`), incrementing as more are added.
- Minor: sub-milestone remove (✕) button height matches the adjacent input.

## Round 3 — since Round 2
- **Program stepper responsibility labels:** in the National Committee / ممثل المسار (two-step) program stepper, both steps now show **ممثل الجهة** (entity representative) as the responsible party — the committee interfaces with the entity rep for both approval and execution, so the earlier "ممثل المسار" / "منسق المسار في الجهة" labels were replaced.

---

## Round 4 — full system redesign (this session)

A large UI/UX overhaul across every screen. Grouped by area; quoted Arabic
strings are the exact copy to search for. Standing rules applied throughout:
**fewer colours (blue family only; green/amber reserved for status), clearer
data, formal plural Arabic for senior officials, labels regular-weight and
gray while numbers/values are bold dark.**

### Navigation shell (sidebar + header)
- **Sidebar is now a full-height fixed panel pinned to the RIGHT edge of the
  screen** (not a sticky card that matches the content cards). The content
  area reserves its width (`padding-right`) so focus stays inside the page.
  Top of the rail: the **two logos side by side** (UAE crest + AI logo);
  middle: the nav; bottom: a **«دليل الاستخدام»** item (replaces the old
  header «؟» tour button). White/glassy panel, distinct from content.
- **Nav order & hierarchy:** `نظرة عامة` (clean home icon, not the old
  4-square grid) → `الكل` → then **`المشاريع والمبادرات` / `العمليات` /
  `الخدمات` indented as sub-items UNDER `الكل`** (small right border + inset) →
  `مراحل التنفيذ والإطلاق` → `الجهات` (committee only) / `فريق العمل` (entity
  only). Remove the **«القائمة»** heading label.
- **Selected nav state = soft light-blue** (`bg #EAF1FE`, text/icon `#1D4ED8`)
  with a thin blue accent bar on the edge — **not** the old dark navy pill.
  Same light-blue selected treatment for the **header role tabs** (active =
  white card, blue text, subtle shadow), the **stream summary cards**, and the
  **dev-status switcher**.
- **Header:** UAE crest + role-switcher tabs move to the reading start; the
  duplicate crest is removed (it now lives in the sidebar). Countdown + bell on
  the other side.
- **Countdown pill:** quiet light style (white bg, `1px #E7ECF4` border). The
  timer is **labelled segments** — `يوم / ساعة / دقيقة / ثانية` (four stacked
  number+label cells with dividers), not a run-together `hh:mm:ss`. An **ⓘ**
  explains the deadline ("الوقت المتبقي على الموعد النهائي لهذه المرحلة —
  يُرجى استكمال حصر وإدخال جميع المشاريع…"). The tooltip **flips toward
  screen-centre** near the left edge so it isn't clipped; the native `title`
  duplicate is removed.
- **Background:** subtle futuristic soft-blue radial mesh over the light base
  (`background-attachment: fixed`), still within the blue family.

### Overview = view-only dashboard
- **Hero (dark blue gradient):** title + subtitle + a single row of frosted
  **icon stat cards** (`إجمالي المدخلات` / `تم حصرها` / `بانتظار الاعتماد` /
  `قيد التنفيذ` / `تم الإطلاق`). **Removed** the progress ring, the labelled
  distribution bar, and the whole **«آخر الإضافات»** recent-cards block — the
  overview is a dashboard, not a list. `coord` gets an **«إضافة جديدة»** button
  at the hero's top-left.
- **Section labels** above every row: `الأعداد الإجمالية`,
  `الميزانيات التقديرية`; committee: `مؤشرات عامة`,
  `التوزيع على مسارات التحول`, `الميزانية والاستخدام`; portfolio pages:
  `مسارات التحول للذكاء الاصطناعي المساعد`, `ملخص حالة التنفيذ`,
  `القائمة التفصيلية`.
- **Counts-band card redesign:** total number on top, then **always-open,
  labelled sub-sections** with dividers — **`التوزيع حسب المسار`** (per-stream
  breakdown) then **`التوزيع حسب الحالة`** (`غير قابل للتحول` / `قيد التطوير` /
  `تم التطوير` / `تم الإطلاق`). No expand chevron. **The section titles are gray
  + regular weight; the stream/status detail rows are bold dark.** Each card is
  clickable (chevron affordance) → navigates to the matching filtered portfolio
  page.
- **Budgets = donut** (`إجمالي المدخلات` in the centre; two segments —
  execution navy `#16408F`, launch cyan `#27C2F0`, both always visible) beside
  two labelled rows (`ميزانية التنفيذ التقديرية`, `ميزانية الإطلاق التقديرية`).
  Card is width-constrained, not full-bleed. Dropped the "(للاطلاع)" and
  "لا يدخل في التمويل" qualifiers.
- **Committee dashboard:** **removed «متوسط درجة التحول»** and the **entity
  ranking bars**. Order: **`الجهات المشاركة` first**, then `إجمالي المدخلات`,
  then **`مرشح من قبل رؤساء المسارات`** (replaces «بانتظار الاعتماد» — the
  committee only acts on stream-head nominations, not raw submissions), then
  `معتمدة للتمويل`. Distribution pies + budget/utilisation retained.

### Portfolio pages (الكل + type pages)
- Stream summary cards on top (`الكل` first, light-blue active), then the
  **recap StatBand** (`إجمالي المدخلات`, `غير قابل للتحول`, `قيد التطوير`,
  `تم التطوير`, `تم الإطلاق`).
- One **toolbar row** under `القائمة التفصيلية`: status filter, funding filter,
  search, **cards/table view switcher**, `تنزيل التقرير`, and `إضافة جديدة`
  (moved here from beside the page title).
- **Table view** returns and carries the same three approval CTAs (below).
- Status wording: **«مكتمل» → «تم الإطلاق»** everywhere (filter + chips). The
  entity-rep status filter **drops «مسودة»** (drafts are visible to `coord`
  only).

### Stages page (مراحل التنفيذ والإطلاق)
- Four stage cards (`المرحلة الأولى`…`الرابعة`). Each card, top to bottom:
  header (name + period), a gray **«خطة التنفيذ»** box (clickable composition
  links `N من العمليات`… + delivery mini-cards `قيد التطوير` / `تم التطوير` /
  `تم الإطلاق`), a gray **«خطة الإطلاق»** box (lean launch rows named
  `الإطلاق الأول` / `الثاني`… with date, a `N من M أُطلق` progress note that
  becomes a green **«تم الإطلاق»** chip once all included items are launched,
  and edit/delete icons), and the **budget tiles LAST**. The `% أُطلق` progress
  line was removed.
- **`إدارة`** (on خطة التنفيذ) opens a **stage-items manager modal** — tick
  which items belong to the stage; moving an item already assigned to another
  stage triggers an in-app confirm ("نقل بين المراحل") and notifies all
  stakeholders (`stageMove`). **`إدارة الإطلاقات`** opens a **launch-manager
  modal** hosting the full launch editor: `اسم الإطلاق` / `نوع الإطلاق` /
  `التاريخ`, a **«ماذا سيشمل الإطلاق؟»** checklist (per-item budgets shown
  read-only), **`الميزانية التقديرية للتنفيذ` = auto-sum of ticked items**
  (read-only), `الميزانية التقديرية للإطلاق`, and `نطاق العمل (على مستوى
  الإطلاق)`. Launched items show a green **«تم الإطلاق»** chip inside the
  checklist and the read-only launch rows.

### Item detail drawer
- Right-side slide-in. **Sections are stacked (tabs removed)** in three groups:
  البيانات (info grid, funded/returned banners, main card, recommendation),
  التنفيذ والإطلاق (خطة التنفيذ, خطة الإطلاق, نطاق العمل والميزانية, حالة
  التطوير), السجل. **Labels gray, values dark** to separate the two.
- **`حالة التطوير` = a 3-state segmented switcher** (`قيد التطوير` /
  `تم التطوير` / `تم الإطلاق`), light-blue selected; `coord` only can change it,
  others read-only. (An earlier step-timeline version was reverted back to this
  switcher on request.)
- **`الأولوية` shows the drag-ranked order** as a chip: **«الترتيب رقم N»**.
- **Entity approval footer shows all three decisions openly** — **`اعتماد`**
  (green), **`طلب معلومات إضافية`** (written out), **`رفض`** (red **✕** icon) —
  no ⋯ overflow menu, so the rep never feels forced to approve. Same three
  actions on the item **card** and in the **table** row.

### Create wizard
- **Every input is mandatory except the budget.** Each mandatory label gets a
  red **`*`**; each step validates before `التالي` and blocks with
  "نرجو التكرم باستكمال جميع الحقول المطلوبة (المميزة بعلامة *) قبل المتابعة".
- Step 5 label is **«اختر مرحلة التنفيذ»**; the stage dropdown options are shown
  **without the «إطلاق» prefix**.
- Removed the **«نموذج»** suffix inside the AI-models number input and the intro
  paragraph on the scope/budget step.

### Confirmations, copy & misc
- **All `window.confirm` dialogs replaced by designed in-app modals** (kind +
  payload in UI state): launch-all sync, delete item, delete plan, cross-stage
  move — each with title/body and OK/alt/cancel buttons.
- **Rejected items stay visible to `coord`** with the rejection reason shown
  (`ملاحظات ممثل الجهة`).
- **Every "total" label reads «إجمالي المدخلات»** instead of the long
  "إجمالي المشاريع والمبادرات والعمليات والخدمات" (overview tile, counts band,
  recap, committee card, entity card). The budget-donut centre stays «الإجمالي»
  (a money total, not an entry count).
- **الجهات page (committee):** entity cards sorted by volume — `إجمالي المدخلات`,
  mini counts `قيد التطوير` / `تم التطوير` / `تم الإطلاق` / `معتمد للتمويل`,
  estimated budget; click → `الكل` filtered by that entity.
- Rocket icon on the launched hero tile swapped for a cleaner **flag** glyph.
- **Responsive:** the fixed rail collapses to a card above the content below
  ~1100px (nav wraps as pills, `دليل الاستخدام` hidden); stat bands stack with
  row separators; stages/entities grids go single-column; tight 2/3-col grids
  (`form2`/`form3`, delivery mini-cards) reflow; no horizontal scroll at 390 /
  834 / 1440 px.

### Data / backend (for reference — not design copy)
- `items[]` gains a **stage-move marker** (`stageMove {from,to,at,by}`); the
  delivery-status helper excludes `transformability === 'غير قابل'` from
  قيد التطوير/تم التطوير/تم الإطلاق. Launch plans carry a per-plan `scope` and
  an informational `launchBudget`; the plan's execution budget is **derived**
  (sum of attached items' budgets). Full Postgres schema, migrations, and an
  **IT handover doc** (`docs/it-handover.md`) accompany the implementation.

---

### How to hand this to the in-progress Claude Code session
Give it **this `CHANGELOG.md` plus the refreshed `AI Transformation Portal.dc.html`**, and tell it: "These are incremental design changes on top of what you've built — apply each behavior, using the .dc.html as the reference for exact copy, layout, and logic. Don't rebuild; diff against your current implementation." The `.dc.html` is the source of truth for any ambiguity.
