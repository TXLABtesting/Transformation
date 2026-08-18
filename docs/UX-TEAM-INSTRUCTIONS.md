# UX Team Development Instructions — AIGP V4 Portal

## Overview

This document provides step-by-step instructions for the UX team to set up, develop, and enhance the AIGP Work Plan Portal (V4). The codebase includes a full role-based access control (RBAC) system, auto-role assignment, an admin panel, Docker/Kubernetes deployment, UAE PASS authentication, and production security hardening.

**GitHub Repository:** https://github.com/suhailsaeed3-del/aigp-v4-roles-access

---

## 1. Local Environment Setup

### Prerequisites

- **Node.js** 18+ (recommended: 22.x)
- **PostgreSQL** 14+ (running locally or via Docker)
- **Git**
- **Docker** (optional — for containerized setup)

### Option A: Manual Setup (Clone and Install)

```bash
# Clone the repository
git clone https://github.com/suhailsaeed3-del/aigp-v4-roles-access.git
cd aigp-v4-roles-access

# Install dependencies
npm install

# Create your local environment file
cp .env.example .env.local
```

### Option B: Docker Compose (Recommended for Quick Start)

```bash
# Clone the repository
git clone https://github.com/suhailsaeed3-del/aigp-v4-roles-access.git
cd aigp-v4-roles-access

# Start everything (PostgreSQL + App)
docker compose up --build

# The portal will be available at http://localhost:3000
# Database is automatically migrated and seeded
```

Docker Compose starts:
- **PostgreSQL 16** on port 5432 (user: `portal`, password: `portal`, db: `transformation`)
- **Next.js app** on port 3000 (auto-runs migrations + seed + start)

---

### Configure `.env.local` (Manual Setup Only)

```env
# ---- Data Layer ----
NEXT_PUBLIC_DATA_MODE=api                  # "local" = localStorage demo, "api" = PostgreSQL production
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/workplan?schema=public"

# ---- Sessions / Security ----
SESSION_SECRET="generate-with-openssl-rand-hex-32"   # REQUIRED: openssl rand -hex 32
SESSION_TTL_HOURS=12                                  # Session lifetime (default 12h)
STATE_API_TOKEN=""                                    # Guards /api/state writes (optional for local)

# ---- Authentication ----
NEXT_PUBLIC_AUTH_PROVIDER=mock-backend                # "mock-backend" for dev, remove for UAE PASS
BOOTSTRAP_ADMIN_EMAILS=your-email@domain.com         # First login with this email → system_admin

# ---- UAE PASS SSO (Production Only) ----
NEXT_PUBLIC_UAEPASS_MODE=mock              # "mock" for dev, "live" for production
UAEPASS_ENV=staging                        # staging | production
UAEPASS_CLIENT_ID=                         # REQUIRED for live
UAEPASS_CLIENT_SECRET=                     # REQUIRED for live
UAEPASS_REDIRECT_URI=https://YOUR_HOST/api/auth/uaepass/callback

# ---- AI Review (Optional) ----
AI_API_BASE_URL=http://localhost:8000/v1   # OpenAI-compatible endpoint
AI_API_KEY=
AI_MODEL=default

# ---- Demo Switches (MUST stay 0 in production) ----
NEXT_PUBLIC_DEMO_MODE=0                    # 1 = show role-switcher tabs
NEXT_PUBLIC_DEMO_DATA=0                    # 1 = seed mock portfolio items
NEXT_PUBLIC_DEFAULT_ROLE=entity            # Default fallback role
```

> **Note:** `BOOTSTRAP_ADMIN_EMAILS` — the first user to login with this email will automatically become a `system_admin`. Use your own email for local development.

---

## 2. Database Setup

### Manual Setup

```bash
# Create the database (if it doesn't exist)
createdb workplan

# Push the Prisma schema to the database
npx prisma db push

# Seed the database (creates roles, permissions, entities, streams)
npx prisma db seed

# Start the development server
npm run dev
```

### Using npm Scripts

```bash
# Full database setup in one command (migrate + generate + seed)
npm run db:setup

# Individual commands:
npm run prisma:generate    # Regenerate Prisma client
npm run prisma:migrate     # Run migrations (dev mode)
npm run prisma:push        # Push schema changes
npm run db:migrate         # Deploy migrations (production)
npm run db:seed            # Seed reference data
```

The portal will be available at `http://localhost:3000`.

---

## 3. Accessing the Portal

| Page | URL | Description |
|------|-----|-------------|
| Main Portal | `http://localhost:3000` | Login → Setup → Dashboard |
| Admin Panel | `http://localhost:3000/admin` | User/entity/stream/role management |
| Health Check | `http://localhost:3000/api/health` | Server status |
| Readiness Probe | `http://localhost:3000/api/ready` | Database connectivity |

On first login (mock mode), you will be automatically assigned as `system_admin` if your email matches `BOOTSTRAP_ADMIN_EMAILS`.

---

## 4. Project File Structure

```
├── app/
│   ├── page.tsx                        ← Main page (Login / Setup / Dashboard)
│   ├── admin/page.tsx                  ← Admin panel page (/admin)
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts          ← Mock login (dev mode)
│       │   ├── me/route.ts             ← Current user session
│       │   ├── logout/route.ts         ← Logout
│       │   └── uaepass/               ← UAE PASS OIDC flow
│       │       ├── login/route.ts      ← Redirect to UAE PASS
│       │       └── callback/route.ts   ← Handle OIDC callback
│       ├── items/
│       │   ├── route.ts                ← List/Create items (entity-scoped)
│       │   └── [id]/
│       │       ├── route.ts            ← Get/Update/Delete item
│       │       ├── submit/route.ts     ← Submit for approval
│       │       ├── approve/route.ts    ← Approve item
│       │       ├── reject/route.ts     ← Reject item
│       │       └── return/route.ts     ← Return item for revision
│       ├── nominations/route.ts        ← Stream head nominations
│       ├── funding/route.ts            ← Committee funding decisions
│       ├── launch-plans/route.ts       ← Launch plan management
│       ├── ai-review/route.ts          ← AI-powered item review
│       ├── team/register/route.ts      ← Team registration (auto-role creation)
│       ├── admin/
│       │   ├── users/route.ts          ← User management
│       │   ├── role-rules/route.ts     ← Auto-role assignment rules (CRUD)
│       │   ├── entities/route.ts       ← Entity listing
│       │   ├── streams/route.ts        ← Stream listing
│       │   ├── roles/route.ts          ← Roles & permissions
│       │   └── audit-logs/route.ts     ← Audit log viewer
│       ├── state/route.ts              ← UI state persistence
│       └── health/route.ts             ← Health/readiness probes
│
├── components/
│   ├── AdminPanel.tsx                  ← Full admin panel UI (6 tabs)
│   ├── AdminConsole.tsx                ← IT handover admin console (users, assign, roles)
│   ├── Dashboard.tsx                   ← Main dashboard
│   ├── Login.tsx                       ← Login screen
│   ├── TeamSetup.tsx                   ← Team registration wizard
│   ├── Overlays.tsx                    ← Modal overlays
│   └── Icon.tsx                        ← SVG icon component
│
├── lib/
│   ├── store.ts                        ← Zustand state management
│   ├── viewModel.ts                    ← Role-based view logic (what shows/hides)
│   ├── domain.ts                       ← Types, constants, enums
│   ├── entities.ts                     ← Federal entities registry (34 entities)
│   ├── workplan.ts                     ← Excel workplan importer
│   ├── export.ts                       ← Excel/PowerPoint export
│   ├── seed.ts                         ← Seed data helpers
│   ├── data/
│   │   ├── federalServices.json        ← Entity → services
│   │   ├── federalSubServices.json     ← Entity → department → services (34 entities)
│   │   └── servicePackages.json        ← Entity → package → services
│   └── security/
│       ├── rbac.ts                     ← Role-Based Access Control enforcement
│       ├── auth.ts                     ← Authentication helpers
│       ├── session.ts                  ← Iron-session management
│       ├── user-access.ts              ← User creation + auto-role assignment
│       ├── audit.ts                    ← Audit logging
│       └── env.ts                      ← Environment variable validation
│
├── prisma/
│   ├── schema.prisma                   ← Database models (20+ tables)
│   ├── seed.ts                         ← Seed script (roles, entities, streams, phases)
│   └── migrations/                     ← Versioned migrations (0001-0008+)
│
├── k8s/                                ← Kubernetes deployment manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.example.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── migrate-job.yaml
│
├── scripts/
│   ├── export-static.mjs              ← Static export for GitHub Pages
│   └── smoke.mjs                      ← Playwright smoke test
│
├── docs/
│   ├── architecture-dataflow.html     ← Architecture diagram (printable A4)
│   ├── roles-access.html              ← Roles & access diagram (printable A4)
│   ├── email-templates.md             ← Arabic invitation email templates
│   └── it-handover.md                 ← Detailed IT handover documentation
│
├── deploy/
│   └── github-pages-workflow.yml.example  ← GitHub Actions for static deploy
│
├── Dockerfile                          ← Multi-stage production build
├── docker-compose.yml                  ← Full stack (app + PostgreSQL)
├── HANDOVER.md                         ← System overview & operational notes
├── DEPLOYMENT.md                       ← Step-by-step deployment guide
└── SECURITY.md                         ← Security posture documentation
```

---

## 5. Role System

### The 4 User Roles (Operational)

| Role | Code | Arabic | Entity Scope | Stream Scope | Sees |
|------|------|--------|-------------|-------------|------|
| Stream Coordinator | `coord` / `entity_coordinator` | منسق المسار في الجهة | Own entity only | Own stream only | Everything (drafts, pending, approved) |
| Entity Representative | `entity` / `entity_representative` | ممثل الجهة | Own entity only | All streams | No drafts (submissions onward) |
| Stream Head | `path` / `stream_owner` | رئيس المسار | All entities | Own stream only | Approved items only |
| National Committee | `ai` / `ai_committee` | اللجنة الوطنية | All entities | All streams | Approved items only |

### Admin Role

| Role | Code | Arabic | Description |
|------|------|--------|-------------|
| System Admin | `admin` / `system_admin` | مشرف النظام | Full access to everything including admin panel, user management, role assignment |

### Role Permissions Matrix

| Permission | Coordinator | Entity Rep | Stream Head | Committee | Admin |
|-----------|:-----------:|:----------:|:-----------:|:---------:|:-----:|
| item.create | ✅ | — | — | — | ✅ |
| item.update | ✅ | — | — | — | ✅ |
| item.submit | ✅ | — | — | — | ✅ |
| item.approve | — | ✅ | — | — | ✅ |
| item.return | — | ✅ | — | — | ✅ |
| item.nominate | — | — | ✅ | — | ✅ |
| funding.approve | — | — | — | ✅ | ✅ |
| funding.cancel | — | — | — | ✅ | ✅ |
| team.manage | — | ✅ | — | — | ✅ |
| users.manage | — | — | — | — | ✅ |
| plan.edit | ✅ | — | — | — | ✅ |
| plan.view | — | — | ✅ | ✅ | ✅ |

---

## 6. Auto-Role Assignment System

### How It Works

1. **Entity Representative** registers their team in the Setup wizard (Step 1: rep info, Step 2: stream owners)
2. **On submit ("اعتماد")**, the system calls `POST /api/team/register`
3. **Backend creates `RoleAssignmentRule`** entries for each team member:
   - Rep email → `entity_representative` (scoped to their entity)
   - Each stream owner email → `entity_coordinator` (scoped to entity + stream)
4. **On first login** (via UAE PASS in production), the system matches the user's email against rules and **auto-assigns role + entity + stream**
5. **The portal renders** the correct view based on their role — no admin intervention needed

### Managing Rules via Admin Panel

Navigate to `/admin` → **"قواعد الصلاحيات" (Role Rules)** tab:
- View all pre-configured rules with status (pending / consumed)
- Add new rules manually with the "+ إضافة قاعدة" button
- Delete rules that are no longer needed

### Managing Rules via API

```bash
# List all rules
GET /api/admin/role-rules

# Create a new rule
POST /api/admin/role-rules
Content-Type: application/json
{
  "email": "user@entity.gov.ae",
  "roleCode": "entity_coordinator",
  "entityId": "entity-uuid-here",
  "streamId": "ops",
  "displayName": "User Name"
}

# Delete a rule
DELETE /api/admin/role-rules
Content-Type: application/json
{ "id": "rule-uuid-here" }
```

---

## 7. Authentication — UAE PASS SSO

### Architecture

The portal uses **UAE PASS** (OpenID Connect authorization-code flow) for production authentication:

1. User clicks "Sign in with UAE PASS" → redirected to UAE PASS IdP
2. User authenticates with their UAE digital identity
3. UAE PASS redirects back to `/api/auth/uaepass/callback` with an authorization code
4. Backend exchanges code for tokens, extracts user identity (`sub`, `email`, `name`)
5. Backend creates/updates user in database, applies auto-role rules, creates session
6. Session cookie (httpOnly, SameSite=Lax, Secure) is set with 8h TTL

### Configuration for Production

```env
NEXT_PUBLIC_UAEPASS_MODE=live
UAEPASS_ENV=production
UAEPASS_CLIENT_ID=your-client-id-from-uaepass
UAEPASS_CLIENT_SECRET=your-client-secret
UAEPASS_REDIRECT_URI=https://portal.yourorg.gov.ae/api/auth/uaepass/callback
```

### Development Mode (Mock Login)

For local development, set `NEXT_PUBLIC_UAEPASS_MODE=mock` or `NEXT_PUBLIC_AUTH_PROVIDER=mock-backend`. This enables a mock login button that creates a session without contacting the real IdP.

---

## 8. Item Workflow Lifecycle

```
draft → ent1 (بانتظار اعتماد ممثل الجهة) → exec (قيد التنفيذ) → launch (إطلاق) → done (مكتمل)
```

| Stage | Who Acts | Action |
|-------|----------|--------|
| `draft` | Coordinator | Creates and edits items |
| `draft` → `ent1` | Coordinator | Submits for entity approval (passes AI review first) |
| `ent1` → `exec` | Entity Rep | Approves the item |
| `ent1` → `draft` | Entity Rep | Returns for revision |
| `exec` | Stream Head | Nominates for committee funding |
| `exec` → funded | Committee | Approves funding via basket |

### AI Review

Every submission triggers an automated AI review (`/api/ai-review`) that checks:
- Completeness of scope of work
- Budget justification
- Alignment with program objectives

If the AI endpoint is unreachable, a built-in heuristic reviewer provides fallback analysis.

---

## 9. Database Schema Overview

### Reference Tables (Seeded)

| Table | Records | Description |
|-------|---------|-------------|
| `streams` | 5 | Program streams (ops, strategy, services, capacity, tech) |
| `entities` | 35 | Federal entities (34 real + 1 session default) |
| `program_phases` | 3 | Program phases with deadlines |
| `exec_batches` | 5 | Quarterly execution milestones |
| `roles` | 5 | Role definitions with permissions |
| `settings` | 1 | Approved budget (100M AED) |

### Transaction Tables

| Table | Description |
|-------|-------------|
| `items` | Work plan entries (projects, operations, services) |
| `nominations` | Stream head nominations for funding |
| `fundings` | Committee funding approvals |
| `funding_cancellations` | Cancelled fundings with reason |
| `launch_plans` | Grouped launch plans |
| `launches` | Individual launch events |
| `exec_checklist_items` | Execution checklist per item |
| `sub_milestones` | Sub-milestones per batch |
| `log_entries` | Activity log per item |
| `notifications` | Persisted notifications (kind, title, body, readAt) |

### Auth Tables

| Table | Description |
|-------|-------------|
| `users` | All registered users (name, email, role, entity, stream, status) |
| `sessions` | Server-side sessions (token, expiresAt, ip, userAgent) |
| `role_assignment_rules` | Pre-configured email → role mappings |
| `audit_logs` | All mutations with actor, action, timestamp, metadata |

---

## 10. Seeded Test Accounts

When the database is seeded (`npx prisma db seed`), the following placeholder accounts are created:

| Email | Role | Entity | Stream |
|-------|------|--------|--------|
| `admin@aigp.gov.ae` | System Admin | — | — |
| `rep@aigp.gov.ae` | Entity Rep | Default Entity | All |
| `coord.ops@aigp.gov.ae` | Coordinator | Default Entity | ops |
| `coord.strategy@aigp.gov.ae` | Coordinator | Default Entity | strategy |
| `coord.services@aigp.gov.ae` | Coordinator | Default Entity | services |
| `coord.capacity@aigp.gov.ae` | Coordinator | Default Entity | capacity |
| `coord.tech@aigp.gov.ae` | Coordinator | Default Entity | tech |
| `head.ops@aigp.gov.ae` | Stream Head | All | ops |
| `head.strategy@aigp.gov.ae` | Stream Head | All | strategy |
| `head.services@aigp.gov.ae` | Stream Head | All | services |
| `head.capacity@aigp.gov.ae` | Stream Head | All | capacity |
| `head.tech@aigp.gov.ae` | Stream Head | All | tech |

---

## 11. Development Guidelines

### Adding a New API Route

Every API route **must** include authentication and permission checks:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/security/auth';
import { assertPermission, buildItemScopeWhere } from '@/lib/security/rbac';
import { writeAuditLog } from '@/lib/security/audit';

export async function GET(req: NextRequest) {
  // 1. Authenticate
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Check permission
  assertPermission(user, 'items', 'read'); // throws 403 if denied

  // 3. Apply entity/stream scoping
  const scopeWhere = buildItemScopeWhere(user);

  // 4. Query with scope
  const items = await prisma.item.findMany({ where: scopeWhere });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  assertPermission(user, 'items', 'create');

  // ... create logic ...

  // 5. Audit log every mutation
  await writeAuditLog({
    action: 'create',
    resourceType: 'item',
    resourceId: newItem.id,
    actorUserId: user.id,
    metadata: { title: newItem.title },
  });

  return NextResponse.json({ item: newItem }, { status: 201 });
}
```

### Modifying UI Based on Role

The file `lib/viewModel.ts` controls all role-based visibility. Key flags:

```typescript
// Role flags (boolean)
isCoord    // true if entity_coordinator
isEntity   // true if entity_representative
isStream   // true if stream_owner
isAi       // true if ai_committee or system_admin or program_admin

// Use these to show/hide UI elements
canCreate  // can create new items
canEdit    // can edit items
canSubmit  // can submit items for approval
canApprove // can approve/reject items
```

> **Important:** Never rely on frontend-only checks. Every action must also be validated on the API side.

### Adding a New Database Field

```bash
# 1. Edit prisma/schema.prisma (add your field)
# 2. Push the change to the database
npx prisma db push

# 3. Regenerate the Prisma client
npx prisma generate

# 4. Restart the dev server
# (Ctrl+C and npm run dev again)
```

---

## 12. Testing Different Roles

### Method 1: Via Admin Panel

1. Login as admin → go to `/admin`
2. Click "قواعد الصلاحيات" tab
3. Click "+ إضافة قاعدة"
4. Enter the test email, select role, entity, and stream
5. Logout and login with that email

### Method 2: Via Environment Variable

Change `BOOTSTRAP_ADMIN_EMAILS` in `.env.local` to test different bootstrap behaviors.

### Method 3: Via Direct API Call

```bash
# Login first to get a session cookie
curl -c cookies.txt -L http://localhost:3000/api/auth/login

# Create a role rule for testing
curl -X POST http://localhost:3000/api/admin/role-rules \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "test-coordinator@test.com",
    "roleCode": "entity_coordinator",
    "entityId": "ENTITY_ID_HERE",
    "streamId": "ops"
  }'
```

### Method 4: Demo Mode (Role Switcher)

Set `NEXT_PUBLIC_DEMO_MODE=1` in `.env.local` to show role-switcher tabs in the UI. This allows switching between all roles without re-login. **Never enable in production.**

---

## 13. Deployment

### Option 1: Docker Compose (Staging/Simple Production)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Fill in required values:
#    - SESSION_SECRET (openssl rand -hex 32)
#    - UAEPASS_CLIENT_ID, UAEPASS_CLIENT_SECRET (from UAE PASS registration)
#    - UAEPASS_REDIRECT_URI (your public URL + /api/auth/uaepass/callback)

# 3. Build and start
docker compose up --build -d

# 4. Check logs
docker compose logs -f app
```

The app automatically runs migrations and seeds on startup.

### Option 2: Kubernetes (Production)

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Apply ConfigMap (non-sensitive config)
kubectl apply -f k8s/configmap.yaml

# 3. Create secrets (copy secret.example.yaml → secret.yaml, fill values)
cp k8s/secret.example.yaml k8s/secret.yaml
# Edit k8s/secret.yaml with real values
kubectl apply -f k8s/secret.yaml

# 4. Run database migration job
kubectl apply -f k8s/migrate-job.yaml
# Wait for completion:
kubectl -n aitp wait --for=condition=complete job/aitp-migrate --timeout=120s

# 5. Deploy the application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# 6. Verify
kubectl -n aitp get pods
kubectl -n aitp logs -l app=aitp-portal --tail=50
```

**Kubernetes Deployment Specs:**
- 2 replicas, non-root (UID 1001)
- Resource limits: 100m–1 CPU, 256Mi–1Gi memory
- Readiness probe: `GET /` every 10s (initial delay 5s)
- Liveness probe: `GET /` every 20s (initial delay 15s)
- TLS via Ingress (nginx class)

### Option 3: Static Export (GitHub Pages — Demo Only)

```bash
# Export as static site (localStorage mode, no backend)
npm run export

# Output is in ./out/ — deploy to any static host
# GitHub Actions workflow: deploy/github-pages-workflow.yml.example
```

> **Warning:** Static export has no authentication, no database, no API routes. Use only for demos/presentations.

---

## 14. Security Guidelines

### Transport & Headers (Production)

The Next.js server sets strict security headers on every response:

| Header | Value |
|--------|-------|
| Content-Security-Policy | `default-src 'self'`; scripts limited to self; `frame-ancestors 'none'` |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| Cross-Origin-Opener-Policy | same-origin |
| X-Powered-By | Disabled |

### API Security

| Endpoint | Protection |
|----------|-----------|
| `/api/ai-review` | POST only; body < 64KB; prompt < 20KB; 20s timeout; no user-supplied URLs (SSRF prevention) |
| `/api/state` | Payload < 2MB; optional Bearer token guard; rejects non-object bodies |
| All DB access | Prisma parameterized queries (no SQL injection) |
| All mutations | Audit logged with actor, IP, timestamp |

### Frontend Security

- React escapes all interpolated content
- **No** `dangerouslySetInnerHTML` anywhere
- **No** `eval()` anywhere
- No secrets shipped to client (only `NEXT_PUBLIC_*` config flags)
- `.env*` is git-ignored

### Dependency Security

- `exceljs` replaces unmaintained `xlsx` (fixed ReDoS + prototype pollution)
- Next.js pinned to latest 14.2.35 patch (CVE-2025-29927 middleware bypass fixed)
- `package-lock.json` pinned; run `npm audit` in CI

---

## 15. Email Invitation Templates

When the Entity Rep registers team members, invitation emails should be sent. Templates are in `docs/email-templates.md`:

### Entity Rep Invitation

**Subject:** دعوة للانضمام إلى منصة مشروع الذكاء الاصطناعي المساعد

**Placeholders:** `{{اسم_الممثل}}`, `{{اسم_الجهة}}`, `{{رابط_المنصة}}`, `{{تاريخ_الانتهاء}}`, `{{بريد_الدعم}}`

### Stream Coordinator Invitation

**Subject:** دعوة للانضمام كمنسّق مسار «{{اسم المسار}}»

**Placeholders:** `{{اسم_المنسق}}`, `{{اسم_المسار}}`, `{{اسم_الجهة}}`, `{{رابط_المنصة}}`, `{{تاريخ_الانتهاء}}`, `{{بريد_الدعم}}`

---

## 16. Available Streams (IDs)

| Stream ID | Arabic Name | English Name |
|-----------|------------|--------------|
| `ops` | العمليات والدعم المؤسسي | Operations & Institutional Support |
| `strategy` | العمل الحكومي الاستراتيجي | Strategic Government Work |
| `services` | الخدمات الحكومية | Government Services |
| `capacity` | بناء القدرات والتدريب | Capacity Building & Training |
| `tech` | تقنيات الذكاء الاصطناعي والبيانات | AI Technologies & Data |

---

## 17. Key API Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/login` | Mock login (dev mode) |
| GET | `/api/auth/me` | Current user + roles + scopes |
| POST | `/api/auth/logout` | Destroy session |
| GET | `/api/auth/uaepass/login` | Redirect to UAE PASS |
| GET | `/api/auth/uaepass/callback` | Handle OIDC callback |

### Items (Work Plan Entries)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | List items (entity-scoped) |
| POST | `/api/items` | Create new item |
| GET | `/api/items/:id` | Get single item |
| PATCH | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
| POST | `/api/items/:id/submit` | Submit for approval |
| POST | `/api/items/:id/approve` | Approve item |
| POST | `/api/items/:id/reject` | Reject item |
| POST | `/api/items/:id/return` | Return for revision |

### Nominations & Funding
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/nominations` | Stream head nominations |
| GET/POST | `/api/funding` | Committee funding decisions |
| GET/POST | `/api/launch-plans` | Launch plan management |

### Team Registration
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/team/register` | Register team + create role rules |

### AI Review
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai-review` | AI-powered item review (body < 64KB) |

### Admin (requires system_admin/program_admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:id` | Update user (role, status) |
| GET | `/api/admin/entities` | List all entities |
| GET | `/api/admin/streams` | List all streams |
| GET | `/api/admin/roles` | List roles + permissions |
| GET/POST/DELETE | `/api/admin/role-rules` | Manage auto-role rules |
| GET | `/api/admin/audit-logs` | View audit trail |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/ready` | Database readiness probe |
| GET/PUT | `/api/state` | UI state persistence blob |

---

## 18. Smoke Testing

A Playwright-based smoke test is available at `scripts/smoke.mjs`:

```bash
# Install Playwright (first time only)
npx playwright install chromium

# Run smoke test (app must be running on port 3080)
PORT=3080 npm run dev &
node scripts/smoke.mjs
```

The smoke test verifies:
- Login page renders
- Dashboard loads after login
- Completion KPI is present
- Create wizard opens for coordinator
- Committee basket and funded total footer work

---

## 19. Git Workflow

```bash
# Create a feature branch for your enhancement
git checkout -b feature/your-enhancement-name

# Make your changes...

# Verify TypeScript compiles cleanly (MUST be 0 errors)
npx tsc --noEmit

# Commit your changes
git add -A
git commit -m "feat: description of your enhancement"

# Push to GitHub
git push origin feature/your-enhancement-name

# Create a Pull Request on GitHub for review
```

---

## 20. Important Rules

| Rule | Details |
|------|---------|
| **TypeScript: 0 errors** | Always run `npx tsc --noEmit` before committing |
| **Don't modify `lib/security/*`** | These files are the security layer — changes require review |
| **Audit every mutation** | Use `writeAuditLog()` for any create/update/delete operation |
| **API + UI checks** | Never rely on frontend-only permission checks |
| **Entity scoping** | All data queries must use `buildItemScopeWhere(user)` |
| **Single role per user** | Each user has exactly one role — assigning a new role replaces the old one |
| **CSP disabled in dev only** | Content Security Policy headers are disabled in development mode only |
| **Admin page access** | `/admin` is only accessible to `system_admin` and `program_admin` roles |
| **No secrets in client** | Only `NEXT_PUBLIC_*` variables are available in the browser |
| **DEMO_MODE=0 in prod** | Never enable demo mode or demo data in production |
| **Session secret required** | Generate with `openssl rand -hex 32` — never leave empty |

---

## 21. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Unauthorized" on all APIs | Login first: visit `/api/auth/login` in browser |
| Database connection error | Ensure PostgreSQL is running and `DATABASE_URL` is correct |
| Prisma schema out of sync | Run `npx prisma db push` then restart dev server |
| New user gets no role | Check if a `RoleAssignmentRule` exists for their email in `/admin` → Rules tab |
| Admin page redirects to `/` | Your user doesn't have `system_admin` or `program_admin` role |
| TypeScript errors after pull | Run `npm install` then `npx prisma generate` |
| Docker build fails | Ensure `NEXT_PUBLIC_*` build args are set in docker-compose.yml |
| UAE PASS callback fails | Verify `UAEPASS_REDIRECT_URI` matches your public domain exactly |
| AI review returns fallback | Check `AI_API_BASE_URL` is reachable and `AI_API_KEY` is set |
| Static export fails | Ensure `BUILD_STATIC=1` is set and API routes are not imported in pages |

---

## 22. Reference Documentation

| Document | Location | Description |
|----------|----------|-------------|
| Architecture & Data Flow | `docs/architecture-dataflow.html` | System architecture diagram (printable A4) |
| Roles & Access | `docs/roles-access.html` | Role-permission matrix diagram (printable A4) |
| Email Templates | `docs/email-templates.md` | Arabic invitation email templates |
| IT Handover | `docs/it-handover.md` | Detailed technical handover |
| Deployment Guide | `DEPLOYMENT.md` | Step-by-step deployment instructions |
| Security Posture | `SECURITY.md` | Security headers, auth, API protection |
| System Overview | `HANDOVER.md` | Full system overview & operational notes |

---

## Contact

For questions about the security layer, RBAC logic, or deployment configuration, contact the backend team. For UI/UX changes within `components/` and `lib/viewModel.ts`, the UX team has full ownership.
