# IT Handover — منصة التحول للذكاء الاصطناعي المساعد

Everything the IT team needs to stand up the production deployment: database,
roles, authentication hooks, and operational notes. The repository is a
Next.js 14 (App Router, TypeScript) application with a PostgreSQL schema
managed by Prisma.

---

## 1. Runtime & prerequisites

| Component | Requirement |
| --- | --- |
| Node.js | 20 LTS or newer |
| PostgreSQL | **14+ recommended** (12 minimum — migration `0006` uses `ALTER TYPE … ADD VALUE` inside a transaction) |
| Package manager | npm (lockfile committed) |

```bash
npm ci
npx prisma migrate deploy   # applies prisma/migrations in order (0001 → 0006)
npx prisma db seed          # reference data: streams, batches, phases, entities
npm run build && npm start  # serves on PORT (default 3000)
```

## 2. Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string, e.g. `postgresql://user:pass@host:5432/aihub?schema=public` |
| `NEXT_PUBLIC_DEMO_MODE` | **Leave unset in production.** `1` shows the role-switcher tabs (demo only) |
| `NEXT_PUBLIC_DEMO_DATA` | **Leave unset in production.** `1` seeds the browser demo dataset |
| `NEXT_PUBLIC_BASE_PATH` | Only for sub-path hosting (GitHub Pages demo uses `/Transformation`) |
| UAE PASS client id/secret/redirect | Consumed by `app/api/auth/uaepass/*` — see §5 |

Secrets belong in the host's secret manager — never in the repository.

## 3. Database structure (Prisma → Postgres)

Schema: `prisma/schema.prisma` (tables/columns are snake_case via `@map`;
the client uses camelCase). Migrations: `prisma/migrations/0001…0006`.

**Reference data**
- `streams` — the five transformation streams (ids: `ops`, `strategy`,
  `services`, `capacity`, `tech`) with the official stream heads.
- `entities` — federal entities (seeded with the 34 entities).
- `program_phases` — program phases with editable deadlines (committee).
- `exec_batches` — the four execution/launch stages (المراحل) with periods.
- `settings` — key/value (e.g. `approvedBudget` for the committee wallet).

**Team setup (per entity)**
- `entity_reps` — official entity representative (one per entity).
- `stream_owners` — per-stream owner inside the entity (unique per
  entity+stream).

**Portfolio**
- `items` — every مشروع/مبادرة/عملية/خدمة. Carries the assessment fields,
  outcome/scope fields, type-specific fields, the execution stage
  (`exec_batch`), the returned-with-notes state (`ret_*`), and the
  stage-move marker (`stage_move_*` — set when an item is moved between
  stages; the client notifies all stakeholders).
  `wf` is the workflow enum:
  `draft → ent1 → pm1 → pm2 → ent2 → budget → exec → launch → done`
  (the UI presents the simplified delivery view: قيد التطوير / تم التطوير /
  تم الإطلاق on top of `budget|exec / launch / done`).
- `launch_plans` — centrally managed launches per stage (name, type, date,
  launch-level scope, informational launch budget). The **execution budget
  is derived**: the server/client recomputes it as the sum of attached
  items' budgets — do not write it independently.
- `item_launch_plans` — join table (an item may join several launches, all
  within its single stage).
- `exec_checklist_items`, `sub_milestones` — per-item execution details.
- `launches`, `item_launches` — legacy per-item launch rows kept for the
  detail view history; new planning goes through `launch_plans`.

**Governance**
- `log_entries` — the approval/action audit trail shown in السجل.
- `nominations` — ترشيحات رؤساء المسارات (what the committee reviews).
- `fundings` / `funding_cancellations` — committee funding decisions with
  the mandatory cancellation reason.

**Demo sync**
- `app_state` — single JSON blob used by `/api/state` for the demo
  persistence. Harmless in production; can stay empty.

## 4. Role management

`users` table drives access. `role` is one of:

| role | Arabic | Scope columns |
| --- | --- | --- |
| `coord` | منسق المسار في الجهة | `entity_id` + `stream_id` |
| `entity` | ممثل الجهة | `entity_id` |
| `path` | رئيس المسار | `stream_id` |
| `ai` | اللجنة الوطنية | — |

Rules the application assumes (enforce when provisioning users):
- `coord` and `entity` **must** have `entity_id`; `coord` and `path`
  **must** have `stream_id`; `ai` has neither.
- One `entity` user per entity is the approver (mirrored in `entity_reps`).
- The five `path` users are the official stream heads (names pre-seeded on
  `streams.head_name`); attach their emails when known.
- Deactivate (never delete) users via `is_active = false` so the audit log
  keeps valid author names.

Data visibility implemented by the app (for reference):
- Drafts (`wf = 'draft'`) are visible **only** to the coordinator.
- `ent1` (awaiting entity approval) is visible to coord + entity rep.
- The committee acts only on nominations (`nominations`), not raw items.

## 5. Authentication (UAE PASS)

`app/api/auth/uaepass/login` and `…/callback` contain the integration
points; the demo build bypasses them behind the "Sign in with UAE PASS"
button. To go live:
1. Register the redirect URI with UAE PASS and set the client id/secret in
   the environment.
2. In the callback, map the verified Emirates ID / email to a row in
   `users` (email is unique) and reject users with no active row.
3. Put the resolved `{role, entityId, streamId, name}` in the session; the
   client reads the role from the session — the role-switcher tabs only
   exist when `NEXT_PUBLIC_DEMO_MODE=1`.

Invitation emails for entity reps and coordinators are drafted in
`docs/email-templates.md` — wire them to the mail gateway when accounts are
provisioned.

## 6. Operational notes

- **Budgets**: item budgets are free-text in Arabic; the parsed numeric
  value is mirrored into `budget_amount` (BigInt, drhm) for reporting.
  Plan execution budgets are always recomputed from attached items.
- **Notifications** are currently derived in the client from data state
  (returns, nominations, funding, stage moves). If IT wants push/email
  later, the same triggers can be raised from the API layer; templates are
  in `docs/email-templates.md`.
- **Exports** (Excel/PowerPoint) are generated client-side; no server
  dependency.
- **Backups**: standard Postgres dumps; all state is in the tables above
  (nothing critical lives in `app_state`).
- **Security**: run behind the government gateway/WAF; the app sets no
  cookies of its own in demo mode; rotate any tokens used during the
  handover (including the temporary GitHub deploy token used for the demo
  site).
