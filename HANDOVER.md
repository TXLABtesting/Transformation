# Handover — المنصة الحكومية لتخطيط ومتابعة مشروع الذكاء الاصطناعي المساعد

Go-live handover for the IT team. The repository ships **clean**: no demo
items, an **empty users table**, no role switcher, and sign-in lands
directly on the platform (no self-service setup screen — the system admin
provisions every account for every entity centrally).

## 1. What the system is

A Next.js 14 (App Router, TypeScript) portal + PostgreSQL 16 (Prisma ORM).
The roles work the same data through one workflow:

| Role | Responsibility |
|---|---|
| منسق المسار في الجهة | Fills the stream inventory (قوائم الحصر) for their entity: عملية / مهمة / خدمة entries, manually or via the per-stream Excel template (incomplete rows import as «بيانات ناقصة» drafts); distributes entries over دفعات الإطلاق and sets start/end dates within each دفعة window; submits for approval |
| رئيس المسار ونائبه | Review submissions of all entities within their stream — اعتماد / إعادة للتعديل / طلب تفاصيل — from the list, the details drawer, or the notification |
| اللجنة الوطنية (الرئيس والأمانة العامة) | National view over the approved entries of the three streams and their distribution across دفعات الإطلاق (read-only) |
| مشرف النظام | Provisions all users for all entities/streams, manages roles, the public-site content (من نحن / المنشورات), and inquiries |

Item lifecycle: `مسودة → قيد الاعتماد (رئيس المسار) → معتمد` — a returned
entry shows «للتعديل». Approved entries are **locked** (no further edits).
Streams: العمليات والدعم المؤسسي، العمل الحكومي الاستراتيجي، الخدمات
الحكومية. Each stream has its own دفعات الإطلاق pages (six launch batches +
التقييم والتهيئة / التوسع); entries can only be placed on batches of their
own stream, and moving one notifies رئيس المسار.

## 2. Repository layout

- `app/` — routes + API (`/api/items`, `/api/svc-catalog`, `/api/admin/*`,
  `/api/auth/*`, `/api/state`, `/api/ai-review`)
- `lib/` — domain model, store, view-model, services catalog, Excel importer
- `components/` — UI (inline-styled RTL; Noto Kufi Arabic + Alexandria via
  `next/font`)
- `prisma/` — schema, migrations `0001…0011`, idempotent seed
- `k8s/` — Kubernetes manifests (see `k8s/README.md`)
- `Dockerfile`, `docker-compose.yml`, `.env.example`
- `DEPLOYMENT.md` — step-by-step environment/DB setup
- `docs/` — IT handover pack, architecture & data-flow, roles & access

## 3. Database

`prisma migrate deploy` creates the schema (through migration
`0011_item_activities`). Verified on a fresh PostgreSQL 16: migrations
apply cleanly; `prisma db seed` inserts **reference data only** — the 3
`streams` (official order + رؤساء المسارات as `head_name`), the federal
`entities`, `program_phases`, `exec_batches` (التقييم والتهيئة، دفعات
الإطلاق الست، التوسع في التطبيق — with their date windows), `settings`,
and `service_catalog` (دليل الخدمات الاتحادية: أزواج الخدمة
الرئيسية/الفرعية لكل جهة، من `lib/svcCatalog.json`) — and leaves `users`,
`items` and every transaction table **empty**.

### دليل الخدمات (service_catalog)

- Table `service_catalog(entity_id FK→entities, main_service, sub_service)`
  with a unique key on the triple — migration `0010_service_catalog`.
- Seeded from `lib/svcCatalog.json` (merged from the two approved Excel
  catalogs, 47 entities). Entities present in the catalog but missing from
  `entities` are created by the seed. To refresh the catalog, replace the
  JSON and re-run `prisma db seed` (idempotent, `skipDuplicates`).
- API: `GET /api/svc-catalog` returns `{ services: { main: [subs] } }`
  **scoped server-side to the session user's entity** (`user.entityId`,
  falling back to the first `user_entity_scopes` row). Only global roles
  (system/program admin, committee) may pass `?entityId=` to inspect
  another entity. Requires the `items:view` permission.
- UI: the services-stream إضافة form (`components/CreatePanel.tsx`,
  `lib/svcCatalog.ts → useSvcCatalog`) renders الخدمة/الخدمة الفرعية as
  dependent dropdowns from this endpoint; when the entity has no catalog
  rows the form falls back to manual input with a notice. The static demo
  build (`NEXT_PUBLIC_DEMO_MODE=1`) reads the bundled JSON instead of the
  API, with the same entity-only scoping.

Transaction tables: `items`, `item_launch_plans`, `launch_plans`,
`launches`, `item_launches`, `exec_checklist_items`, `sub_milestones`,
`log_entries` (audit trail of every action with actor + timestamp),
`nominations`, `fundings`, `funding_cancellations`, `entity_reps`,
`stream_owners`, `app_state`.

## 4. DB linking

Set `NEXT_PUBLIC_DATA_MODE=api` and `DATABASE_URL`. The UI persists through
`/api/state` (guard it with `STATE_API_TOKEN`). `local` mode (browser
storage) exists for demos only — do not use it in production.

## 5. Kubernetes

Manifests in `k8s/`: namespace, configmap, secret template, migration Job,
2-replica Deployment (non-root, no privilege escalation, probes, resource
limits), Service, TLS Ingress. Flow: build image → apply namespace/config →
create secret → run migrate Job → roll deployment. Prefer a managed
PostgreSQL over in-cluster.

## 6. Security status & checklist

Done in the app:
- Security headers on all routes (CSP, `X-Frame-Options: DENY`,
  `nosniff`, referrer policy) — `next.config.mjs`
- `/api/state` bearer-token guard (`STATE_API_TOKEN`)
- UAE PASS OIDC scaffold with state/nonce (mock mode until creds exist)
- No secrets in the repo; `.env*` git-ignored
- Dependencies: no critical advisories. **Known open advisories** on
  Next 14.2.x (DoS-class: image-optimizer, RSC request handling, rewrites
  smuggling — fixed only in Next 16): the app uses no `next/image`, no
  rewrites; mitigate at the WAF/ingress (rate-limit, body-size limit,
  request normalization) and plan a post-go-live upgrade to Next 16.

For IT before go-live:
- [ ] TLS everywhere; WAF/rate limiting at the edge
- [ ] Real UAE PASS credentials (`NEXT_PUBLIC_UAEPASS_MODE=live`)
- [ ] **Role mapping**: after sign-in, resolve the user in the `users`
      table (create accounts per entity; رؤساء المسارات names are already
      official in the app) and set role/stream/entity in the session
- [ ] Strong `STATE_API_TOKEN`; rotate any tokens used during development
- [ ] Postgres backups + point-in-time recovery
- [ ] Pen-test against the deployed environment

## 7. Testing checklist (functional)

1. Sign in (mock) → lands directly on the coordinator's قوائم الحصر
   (no setup screen), all zeros on a clean database.
2. As منسق المسار: add one entry per stream — ops (التصنيف + conditional
   نوع عملية الدعم المؤسسي، هل العملية مؤتمتة؟ with conditional
   نظام/نسبة الأتمتة), strategy (matrix → أولوية الاختيار colored, derived
   أولوية التحول; مؤتمتة كلياً locks 100%), services (الخدمة/الخدمة
   الفرعية from the entity-scoped `service_catalog` dropdowns).
3. Bulk upload: download the stream template, upload with one incomplete
   row → it imports as a «بيانات ناقصة» draft; select drafts → the bar
   offers «إكمال وإرسال» / «إرسال للاعتماد» with the missing-fields popup.
4. Submit → as رئيس المسار approve from the list → the entry turns
   **معتمد** (green) and becomes locked; إعادة → shows «للتعديل» for the
   coordinator with the notes banner.
5. دفعات الإطلاق: from each stream's batches page add entries, verify
   dates are constrained to the دفعة window, and a batch move raises the
   رئيس المسار notification.
6. Verify `audit_logs` rows for every mutation, and the Excel/PPT report
   figures (المعتمدة ضمن الدفعات، بانتظار اعتماد رئيس المسار).

## 8. Known gaps / next steps

- The demo/staging UI drives workflow through the client store + `/api/state`
  blob; the relational routes (`/api/items/*` submit/approve/reject) are
  implemented and enforced server-side — wire the UI to them before
  multi-tenant production.
- Users table is empty by design; sign-in → user resolution is IT's wiring.
- Legacy tables (`nominations`, `fundings`, `funding_cancellations`,
  `launch_plans`, `entity_reps`) remain in the schema for compatibility but
  are **not part of the current confirmed flow** (no nomination/funding/
  budget concepts in the UI).
- AI review uses the heuristic fallback until `AI_API_BASE_URL` points to
  the internal model.
- Next 16 upgrade (see §6).

## الإشعارات البريدية التلقائية (متطلب إلزامي للتشغيل)

إشعارات سير العمل الرئيسية يجب أن تصل بالبريد الإلكتروني تلقائياً إضافة إلى إشعار المنصة:

| الحدث | المستلم |
|---|---|
| إرسال مدخل للاعتماد | رئيس المسار ونائبه |
| اعتماد / إعادة / طلب تفاصيل | منسق المسار في الجهة |
| نقل مدخل بين دفعات الإطلاق | رئيس المسار |

للتشغيل الفعلي: عند كل حدث من الأحداث أعلاه يُستدعى `POST /api/notify` (تُنفَّذ لدى فريق التقنية)
بربطها بخادم SMTP الحكومي أو خدمة البريد المعتمدة، مع قالب بريد يحمل اسم المشروع
وشعاره ورابط المدخل المعني. عناوين المستلمين تُقرأ من جدول المستخدمين (users) حسب الدور والمسار.
