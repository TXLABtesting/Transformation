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

### How to hand this to the in-progress Claude Code session
Give it **this `CHANGELOG.md` plus the refreshed `AI Transformation Portal.dc.html`**, and tell it: "These are incremental design changes on top of what you've built — apply each behavior, using the .dc.html as the reference for exact copy, layout, and logic. Don't rebuild; diff against your current implementation." The `.dc.html` is the source of truth for any ambiguity.
