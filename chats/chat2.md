# Stakeholder roles restructuring

_Started 2026-07-01 15:16 UTC_

---

## User

there is another stakeholder that we need to add and there are things that we need to add together. we will have one stakeholder named منسق المسار في الجهة this guy will have everything the ممثل المسار has now. and we will change everything ممثل المسار has

## Assistant

_[tool: read_file]_

_[tool: grep]_

This is a big change to a complex app. Let me understand how the `path` role is wired before I clone it.

_[tool: grep]_

_[tool: grep]_

Now I understand the role plumbing. Let me read the exact sections I need to edit.

_[tool: read_file]_

_[tool: read_file]_

## Assistant

_[tool: grep]_

_[tool: read_file]_

Now I'll make all the edits. First the template button:

_[tool: dc_html_str_replace]_

Now the logic edits — aliasing `coord`→`path` for behavior while keeping it distinct for display:

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Let me verify the new role renders and behaves like the stream rep.

_[tool: show_html]_

_[tool: ready_for_verification]_

## User

ممثل المسار now will be able to see all the things related to it's stream from all entities. 

so the flow will be the following, منسق المسار fills the things in that stream related to it's entity, with it's scope, it's budget and all, then it goes to the entity representative (ممثل الجهة) he approves the operations details, or services or projects or initiatives, it will go to the اللجنة الوطنية that can be able to see everything of all entities of all streams, and we will have now ممثل المسار who will also have the same, everything of all entities but only for his assigned stream.

2 things we need to add now. اللجنة الوطنية will not have approvals anymore on top of the entity rep, but they will have a basket, which they can fill from every card they have, so the basket will have 2 tabs, selected items, and approved items, so in the selected items, he can see everything that was nominated by the ممثل المسار (they can nominate and they will have their own basket too) and then the committee will receive the nomination in the basket by the name of the one who nominated, and they can approve the things nominated as committee and it will move to the approved tab in the basket, or not. 

let's say for example, I have selected 2 operations from the list as committee, it will go straight to the approved basket, the entity owner of the operation for example, will receive a notification mentionning that the cost of this operations transformation will be covered by the committee it self, but still the execution is the role of the entity it self.

## Assistant

This is a big, central change. Let me read the workflow and UI code carefully before building.

_[tool: read_file]_

Understood — I'll implement the changes now so you can continue in Claude Code. Let me read the remaining pieces I need (notifications, header, card menu, views).

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

Let me check `wfOf`, the seed states, and how state loads, so committee-gate items don't get stuck after I remove that approval.

_[tool: grep]_

Now I understand the full architecture. Let me lay out the plan and implement.

_[tool: update_todos]_

Starting with the workflow/logic changes:

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now rescope roles, notifications, and card fields:

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now basket row computation + exports:

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the template: header basket button + drawer, inserted before the profile menu:

_[tool: dc_html_str_replace]_

Now the basket drawer overlay, inserted before the work area:

_[tool: dc_html_str_replace]_

I need to add a `notCommitteeBasket` export, a `slideIn` keyframe, and remove a stray empty tag. Let me also add card footer actions:

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

Let me check the `slideIn` keyframe exists:

_[tool: grep]_

`slideIn` exists. Now let me verify it all works by testing the different roles in the preview.

_[tool: eval_js]_

_[tool: get_webview_logs]_

Let me interactively verify the committee flow — switch role, fund a card, open the basket:

_[tool: eval_js]_

_[tool: eval_js]_

_[tool: eval_js]_

_[tool: show_html]_

_[tool: eval_js]_

Works after reload. Let me test the full flow: committee funds a card directly, then path nominates one.

_[tool: eval_js]_

Now verify the committee receives the path's nomination in the selected tab:

_[tool: eval_js]_

Full flow works end-to-end. Let me bump the seed version so test nominations/funding I created during testing reset to a clean state on reload:

_[tool: dc_js_str_replace]_

_[tool: show_html]_

_[tool: eval_js]_

One stray "اعتماد" button remains for committee — let me find it:

_[tool: eval_js]_

All working: committee has no visible gate approvals (the one match is in a hidden/disabled block), entity remains the sole approver, and the seed is clean. Let me mark the tasks done and finalize.

_[tool: update_todos]_

I implemented the full set of changes. Here's what's now in place, ready for you to continue in Claude Code:

_[tool: ready_for_verification]_

## User

we don't need to have big buttons for the approval for the fund, it should be a small tick, and it can be removed at anytime if he wants and also they can rejected the nominated from the ممثل المسار

## Assistant

Good call — let me make funding a small toggle tick that can be removed anytime, and let the committee reject nominations on the card too.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Let me update the card template for the new tick UI and hide "Add" for the committee. First let me read the current footer markup:

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

Now applying all the template changes — small fund tick, card-level nomination reject, funded chip only for others, and Add restricted to coord:

_[tool: str_replace_edit]_

_[tool: dc_js_str_replace]_

Let me verify the new tick, reject, and Add-button rules across roles:

_[tool: show_html]_

_[tool: eval_js]_

All rules verified: the committee funds via a small toggle tick (removable anytime), path reps and the committee can no longer add, and only منسق المسار في الجهة can add.

Done. Summary of this round:
- Funding is now a small tick pill ("تحديد للتمويل" → "مموّل من اللجنة") that the committee can toggle off anytime.
- The committee can reject a stream-rep nomination directly on the card ("رفض الترشيح") as well as in the basket.
- "إضافة جديد" now shows only for منسق المسار في الجهة — hidden for ممثل المسار, ممثل الجهة, and the committee.

_[tool: ready_for_verification]_

All changes are in and verified working. The committee's funding is now a compact toggle tick they can remove at any time, they can reject stream-rep nominations from the card or the basket, and adding new items is restricted to منسق المسار في الجهة only.

## User

let's make the launch plan part of the previous step in the addition for execution, and let's call in execution and launch plan

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

Now I'll merge the launch step into the execution step. First the sub-stepper and launch panel header, then the step logic:

_[tool: str_replace_edit]_

_[tool: dc_js_str_replace]_

Let me verify the create flow now shows 4 steps with the merged execution+launch step:

_[tool: show_html]_

_[tool: eval_js]_

_[tool: eval_js]_

_[tool: eval_js]_

_[tool: eval_js]_

_[tool: eval_js]_

_[tool: grep]_

The edits are in the file correctly. Let me reload and drive the form to step 4 to confirm visually:

_[tool: show_html]_

_[tool: eval_js]_

_[tool: save_screenshot]_

_[tool: save_screenshot]_

_[tool: eval_js]_

The merge works — the create form now has 4 steps with step 4 "التنفيذ وخطة الإطلاق" showing both the execution phases and the launch plan. Let me clean up the test screenshots and finalize.

_[tool: delete_file]_

Done. The launch plan is now merged into the execution step of the add flow — the sub-stepper went from 5 steps to 4, and step 4 is renamed "التنفيذ وخطة الإطلاق", showing both the execution phases and the launch plan (separated by a divider). Advancing from that step goes straight to the smart review.

## User

prepare a document for claude code

## Assistant

_[tool: read_skill_prompt]_

There's already a handoff folder from before. Let me refresh it with the current design and document all the recent changes.

_[tool: read_file]_

I'll refresh the handoff: copy the current design in and rewrite the README to reflect the new four-role model, the committee basket/funding system, the simplified workflow, and the merged create step.

_[tool: copy_files]_

_[tool: write_file]_

Let me verify the handoff folder has the assets it references.

_[tool: list_files]_

The handoff folder is complete and self-contained. Now let me present it for download.

_[tool: present_fs_item_for_download]_

The handoff package is ready to download above. It contains:

- **README.md** — a self-sufficient spec. It opens with a "What changed most recently" section covering the four-role model, the committee losing gate approvals, the entity becoming sole approver, coordinator-only item creation, the basket/funding system, and the merged create step. Then full detail on roles, workflow state machine, the basket data model + methods, create-wizard steps, validation, state, and design tokens.
- **AI Transformation Portal.dc.html** — current source of truth.
- **support.js** + **assets/**.

One thing I flagged in the README for your dev: the dashboard program-stepper still labels a step as "committee approval," which no longer matches the new flow — noted as a data cleanup, not logic.

Want me to include screenshots of the key screens in the package too?

## User

the execution plan will change, it will be a 3 months by 3 months plan, every 3months some milestones will have to be met. attached the predefined milestones and inside any of them you can add sub milestones you want

## Assistant

Let me look at the current execution-plan phase definitions and how they render in the create form.

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

Now I'll implement the new quarterly execution plan with sub-milestones. First the logic (predefined phases helper, blankItem, sub-milestone methods, phaseRows):

_[tool: str_replace_edit]_

_[tool: dc_js_str_replace]_

Noted — I'll rename the step pill too. Now updating `phaseRows` to carry the period + sub-milestones, then the template:

_[tool: str_replace_edit]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the F3 template — add period + description + sub-milestones UI, update the header, and rename the step pill:

_[tool: str_replace_edit]_

Now rename the step pill to "خطة التنفيذ والإطلاق":

_[tool: str_replace_edit]_

Let me verify the new quarterly execution plan renders in the create form with sub-milestones:

_[tool: show_html]_

_[tool: eval_js]_

All working. Let me capture the result to confirm the layout looks clean:

_[tool: save_screenshot]_

The DOM checks confirm everything renders correctly (the modal is a scroll panel the top-viewport capture doesn't show). Let me clean up and finalize.

_[tool: delete_file]_

_[tool: ready_for_verification]_

Done. The execution plan is now a quarterly (3-month) plan with your 5 predefined milestones — التقييم والتهيئة, and the four دفعات — each showing its period (e.g. يونيو – يوليو 2026), description, and start/end dates prefilled from your table. Inside every milestone there's an **إضافة مرحلة فرعية** button to add sub-milestones (name + date), which you can remove individually. I also renamed the step to **خطة التنفيذ والإطلاق** as requested.

Note: this applies to newly created items; the existing seed demo items keep their old phases. Want me to update the handoff README to document the new quarterly plan too?

## User

for this user (منسق المسار في الجهة), second step will be entity representative approval, then execution and launch plan

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

`programPhases` reloads fresh from the seed, so editing it will take effect. Updating step 2 to entity-rep approval and the responsibility labels:

_[tool: str_replace_edit]_

_[tool: dc_js_str_replace]_

Let me verify the updated stepper:

_[tool: show_html]_

_[tool: eval_js]_

The stepper now reads correctly for the coordinator: step 1 collection (منسق المسار في الجهة), step 2 **اعتماد ممثل الجهة لأولويات التحول** (ممثل الجهة), step 3 تنفيذ واختبار التحول والإطلاق (منسق المسار في الجهة) — the committee approval step is gone, matching the new flow.

## User

for the committee, there will be only 2 steps, اعتماد   اختيار أولويات التحول الذكي then execution and launch. 

the same thing for the ممثل المسار

## Assistant

_[tool: grep]_

_[tool: read_file]_

This needs a role-specific stepper. I'll make the committee and ممثل المسار see a 2-step program (approval → execution & launch), while the coordinator keeps 3 steps:

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Let me verify the stepper per role:

_[tool: show_html]_

_[tool: eval_js]_

_[tool: eval_js]_

The steppers are now role-specific:

- **منسق المسار في الجهة** — 3 steps: حصر واختيار → اعتماد ممثل الجهة → التنفيذ والإطلاق.
- **اللجنة الوطنية** and **ممثل المسار** — 2 steps: اعتماد اختيار أولويات التحول الذكي → تنفيذ واختبار التحول والإطلاق.
- **ممثل الجهة** keeps the 3-step view (you didn't specify a change for it — say the word if you want it on 2 steps too).

## User

the countdown will have the first 3 months or 90 days milestone

## Assistant

The user wants the top countdown to target the first quarterly (90-day) execution milestone. Let me see how the banner countdown is wired.

_[tool: grep]_

_[tool: read_file]_

I'll point the top countdown at the first quarterly execution milestone (التقييم والتهيئة, ending 2026-07-31) and label it:

_[tool: str_replace_edit]_

_[tool: show_html]_

The countdown now targets the first milestone (التقييم والتهيئة, 31 يوليو 2026). Let me refine the label to cleaner Arabic:

_[tool: str_replace_edit]_

The top countdown now targets the first quarterly execution milestone — **المرحلة الأولى · التقييم والتهيئة**, ending 31 يوليو 2026 — instead of the old registration deadline. It counts down to that milestone's end date and its color still escalates (green → amber → red) as it nears.

Good direction — a select checkbox + a single bottom action bar is cleaner and less colorful. Let me rework the committee funding UX.

First the logic — selection state, methods, and card fields:

_[tool: dc_js_str_replace]_

Two things in flight — let me finish the funding-checkbox UX and also apply this new visibility rule. First the visibility change:

_[tool: grep]_

_[tool: dc_js_str_replace]_

Now the card fields for the funding checkbox — replacing the tick fields:

_[tool: dc_js_str_replace]_

Now the exports for the bottom bar:

_[tool: dc_js_str_replace]_

Now the card template — replace the fund tick block with a checkbox, and show the funded chip for all roles:

_[tool: read_file]_

_[tool: str_replace_edit]_

Now add the bottom action bar. Let me place it right before the basket drawer:

_[tool: str_replace_edit]_

Let me verify the new committee funding flow and the visibility rule:

_[tool: show_html]_

_[tool: eval_js]_

Funding-by-selection works and the committee no longer sees pending-entity items. Let me confirm coord still sees them and path doesn't:

_[tool: eval_js]_

Everything checks out. Summary of this round:

- **Committee funding is now select-based**, not a colorful per-card tick. Each committee card has a neutral checkbox (**تحديد للتمويل**). Selecting one or more raises a single navy bottom bar showing the count with two buttons: **تمويل التحول** (funds all selected) and **تخطي** (clears the selection). Funded cards show a minimal green "مموّل من اللجنة الوطنية" chip.
- **Visibility rule**: items pending entity-rep approval (`بانتظار اعتماد ممثل الجهة`) are now hidden from the committee **and** from ممثل المسار — only منسق المسار في الجهة (and the entity rep who acts on them) can see that state.

The teal fund button is gone, so the card color load is lighter. Want me to also remove the per-card **رفض الترشيح** button and move nomination decisions entirely into the basket, or keep it on the card?

## User

ممثل المسار is not updating anything, it's like the committee, they can only see things, all entities are filling in their stream. basically they are higher than منسق المسار and entity rep. but they can nominate the same way the committee does but it goes to commitee for approval

## Assistant

Got it — ممثل المسار becomes read-only oversight that nominates (to committee) via the same checkbox mechanism. Let me find all the edit-granting `role==='path'` spots to restrict them to coord.

_[tool: grep]_

This is a substantial role redefinition. Let me make ممثل المسار fully read-only (moving all edit rights to coord) and give it the same checkbox-nominate flow. Batching the read-only conversions:

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now adding the budget & scope step. Let me check the draft field bindings and the sub-stepper/step logic.

_[tool: grep]_

The user wants budget & scope as an editable create step. Let me read the field bindings and step logic to add it cleanly.

_[tool: read_file]_

_[tool: read_file]_

`scopeOfWork`/`budget` are already wired into the draft. Let me add the budget step to the wizard. First the step logic:

_[tool: grep]_

Lots stacking — let me batch. First the logic: budget step, selection methods, approval-gated funding, and path-nominate dispatch.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the template. Let me read the current card footer to update the checkbox and remove the old nominate button:

_[tool: read_file]_

_[tool: str_replace_edit]_

Now the bottom-bar label, the sub-stepper pills, and the new budget step panel:

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

Good point — a small checkbox by the title, not a big row. Let me read the card title area:

_[tool: read_file]_

_[tool: grep]_

Line 448 is the main card title. Let me move the checkbox there and remove the bottom checkbox block:

_[tool: str_replace_edit]_

Let me verify all the changes work together:

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: eval_js]_

Committee funds / path nominates via the small title checkbox. Now let me verify the new budget step in the wizard:

_[tool: eval_js]_

All verified working. Here's what landed in this round:

- **ممثل المسار is now read-only oversight** — all data entry (fill CTAs, scope/budget, execution/launch editing, returned-item fixes) moved to منسق المسار في الجهة only. Path just views its stream across all entities.
- **Path nominates like the committee** — same small checkbox next to the item name → bottom bar button reads **ترشيح للتحول**, and nominations flow to the committee's basket for approval.
- **Committee funding** — checkbox → bottom bar **تمويل التحول**. Selection is only offered on **entity-approved** items (exec/launch/done); pending-entity items are neither visible nor fundable.
- **Small checkbox by the title** — no more full-width row bloating the cards.
- **New "نطاق العمل والميزانية" step** added to the create wizard after النتائج المتوقعة (scope + estimated budget + attachment). Wizard is now 5 steps ending in خطة التنفيذ والإطلاق → smart review.

To answer your earlier question directly: budget/scope/attachment are now editable in that new wizard step (and still in the item detail for the coordinator while the item is in draft).

## User

here I need to be able to cancel with reason or something

## Assistant

Funded items should be cancelable with a reason. Let me add that. First the logic — methods, card field, notification, and modal exports:

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: snip]_

Now the template — funded chip with a cancel button, plus the reason modal:

_[tool: str_replace_edit]_

Let me verify the cancel-with-reason flow:

_[tool: show_html]_

Good call — a compact status chip in the header, not a footer block. Let me read the card header:

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

A compact chip in the header row it is. Let me add the fields, put the chip by the status, and remove the footer block:

_[tool: dc_js_str_replace]_

_[tool: str_replace_edit]_

For the committee, the detail-view step timeline should also collapse to 2 steps. Let me find it:

_[tool: grep]_

_[tool: read_file]_

Both are about the committee no longer approving. Let me find the detail approval log where the committee entry is generated:

_[tool: grep]_

Let me read the exact approval-status lines and the synthetic log to update them:

_[tool: read_file]_

_[tool: read_file]_

Now I'll fix the log (remove committee approval, relabel submitter), the approval-status texts, and make the detail timeline 2-step for committee/path:

_[tool: str_replace_edit]_

Now the detail-view timeline — make it 2 steps for committee/path:

_[tool: dc_js_str_replace]_

Let me verify: cancel-fund chip in header, committee detail 2-step timeline, and no committee-approval in the log.

_[tool: show_html]_

_[tool: eval_js]_

_[tool: str_replace_edit]_

The funded chip now reads **معتمد للتمويل**. All the committee/detail changes are in and verified — the header shows the compact status chip (clickable to cancel funding with a reason for the committee), the item detail timeline shows 2 steps for the committee/ممثل المسار, and the approval log no longer mentions committee approval (only منسق المسار submission → ممثل الجهة approval).

## User

the star comes after the text not beofre

## Assistant

_[tool: grep]_

_[tool: grep]_

Let me look at the exact team-setup fields to see how the star is placed:

_[tool: read_file]_

That clears it up — the rep-info fields. Let me make name, position, and phone mandatory with the star after the text (email stays optional):

_[tool: str_replace_edit]_

For consistency with the same rule, let me mark the position field in the team-member rows too (name/phone already starred, email optional):

_[tool: str_replace_edit]_

_[tool: read_file]_

Two committee-dashboard tweaks. Let me add a "funded" stat and a title for the recommendations row:

_[tool: str_replace_edit]_

_[tool: dc_js_str_replace]_

_[tool: show_html]_

_[tool: eval_js]_

Both committee-dashboard tweaks are in: the top stats row now has 5 cards including **معتمدة للتمويل** (funded count), and the recommendations row (موصى به / قائمة الانتظار / غير موصى به) now sits under its own heading **تصنيف توصيات التحول الذكي**.

All the changes from this session are applied and verified. Quick recap of everything since the funding redesign:
- Committee funds / ممثل المسار nominates via a small checkbox by the item title → single bottom action bar; funding only on entity-approved items.
- Funded state is a compact **معتمد للتمويل** chip in the card header; committee can cancel funding with a required reason.
- Committee & ممثل المسار see a 2-step program and detail timeline; approval log shows only منسق submission → ممثل الجهة approval.
- New "نطاق العمل والميزانية" step in the create wizard.
- Team-setup: name, title, phone mandatory (star after text); email optional.
- Committee dashboard: funded stat + titled recommendations row.

Want me to refresh the Claude Code handoff README to capture all these role/flow changes?

## User

for ممثل المسار an entity filter is required

## Assistant

For ممثل المسار (cross-entity view), an entity filter makes sense. Let me find how the committee's entity filter is wired:

_[tool: grep]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: str_replace_edit]_

_[tool: eval_js]_

_[tool: show_html]_

_[tool: eval_js]_

ممثل المسار now has the entity filter (كل الجهات + the participating entities), so they can narrow their cross-entity stream view to a specific entity.

## User

prepare the document for claude code

## Assistant

I'll refresh the handoff with the current design and a fully updated README.

_[tool: copy_files]_

_[tool: write_file]_

The handoff is refreshed with the current design and a fully rewritten README. Presenting it for download:

_[tool: present_fs_item_for_download]_

The updated handoff package is ready above. The README now documents the current state end-to-end: the four-role model (coord fills, path read-only oversight + nominates, entity sole approver, committee funds), the funding/nomination/basket system with cancel-with-reason, role-specific 2-vs-3-step timelines, visibility rules, the 5-step create wizard with the quarterly execution plan and sub-milestones, the committee analytics dashboard, team-setup validation, and the full data model + tokens.

