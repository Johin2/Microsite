## 1) Problem Statement & Goals

### 1.1 Problem

Teams lose time converting raw requests into plans, keeping trackers updated, and fixing trivial CI/test issues. This delays delivery and obscures status, especially for cross‑functional work.

### 1.2 Goals (Must‑Have)

* **Intake → Plan:** Turn a free‑form request into a structured brief + detailed plan automatically.
* **Clear Project Type:** Prominently show classification (e.g., **Design**, **Development**, **Research**, **Content**, **Data/ML**).
* **Tracker:** Auto‑create tasks with statuses (Backlog/In Progress/Review/Done/Blocked); show burndown and blockers.
* **Auto‑Repair Loop:** For dev tasks, run CI; when failing, auto‑triage and propose/commit minimal patches; **repeat until green** under guardrails.
* **Deployable on Vercel**; optional **Supabase** for persistence and auth; **Next.js App Router + Tailwind**.

### 1.3 Non‑Goals (for v1)

* Full multi‑tenant billing.
* Deep integrations beyond GitHub/GitLab + Vercel + one CI platform (e.g., GitHub Actions).
* Complex resource management (e.g., capacity planning).
* Heavy compliance regimes (SOC2/HIPAA) beyond sensible best practices.

### 1.4 Success Metrics

* **Time to Plan:** Median < 60s from intake to draft plan.
* **Classification Accuracy:** ≥ 95% primary type judged correct by reviewers.
* **Tracker Adoption:** ≥ 80% of created tasks receive at least one status update.
* **Auto‑Repair Effectiveness:** ≥ 60% of failing CI runs are fixed without human changes (within guardrails).
* **Lead Time Reduction:** ≥ 30% reduction in time from intake to first green CI on dev tasks.

---

## 2) Users & Personas

* **Requester (R):** Submits project requests. Cares about fast, clear plans and ETAs.
* **Project Manager (PM):** Monitors dashboard, edits plan, prioritizes tasks, tracks progress.
* **Engineer/Designer (IC):** Executes tasks; reviews auto‑patches; owns merges.
* **Tech Lead (TL):** Oversees CI/CD health, configures guardrails, approves risky patches.
* **Stakeholder (SH):** Read‑only status and updates.

---

## 3) Key Use Cases & User Stories (MoSCoW)

1. **Submit a request** *(Must)*

   * As R, I provide title, description, due date, and attachments to create a project.
2. **See project type + plan** *(Must)*

   * As PM/IC, I see a type badge (Design/Development/…) and an auto‑generated plan with acceptance criteria.
3. **Track tasks** *(Must)*

   * As PM/IC, I see a Kanban board and can move tasks across statuses.
4. **Run dev tasks** *(Must for Dev)*

   * As IC, I click “Run” on a dev task to open a branch, PR, CI, and Vercel preview.
5. **Auto‑repair CI** *(Must for Dev)*

   * When CI fails, the system triages logs, proposes a minimal patch, commits, re‑runs CI, and repeats with guardrails.
6. **Review & Merge** *(Should)*

   * As IC/TL, I review PRs, require approval for large/risky patches, and merge when green.
7. **Dashboard & filters** *(Should)*

   * As PM/TL, I filter projects by type, status, due date, owner.
8. **Notifications** *(Could)*

   * As PM/IC, I receive status digests and failure alerts.

---

## 4) Feature Requirements

### 4.1 Intake & Classification

* **F‑1** Intake form at `/new` with fields: Title (required), Description (rich text), Category hint (optional), Due date, Attachments (URLs).
* **F‑2** On submit, create `Project` + `Brief`.
* **F‑3** Classification Agent labels project with primary type and optional secondary tags. Show visible **Type Badge** on cards/pages.
* **F‑4** If information is missing, produce up to 3 clarifying questions (display to PM; non‑blocking).

### 4.2 Planning & Estimation

* **F‑5** Planner Agent outputs milestones → tasks → subtasks with **acceptance criteria** (verifiable).
* **F‑6** Estimator Agent adds P50/P90 hour ranges, confidence, and suggested roles.
* **F‑7** Plan is editable by PM; edits are versioned.

### 4.3 Tracker

* **F‑8** Auto‑create tasks in Backlog with labels and dependencies; Kanban board with drag‑and‑drop and keyboard shortcuts.
* **F‑9** Task detail page shows acceptance criteria, estimate, assignee, labels, run history, previews, and logs.
* **F‑10** Built‑in analytics: burndown, throughput, blockers list.

### 4.4 DevOps Runner (Code Execution)

* **F‑11** For dev tasks: “Run” spawns a branch `task-<id>-attempt-<n>`, opens/updates a PR, triggers CI, and links a Vercel preview (if applicable).
* **F‑12** Collect CI status, logs, test artifacts, and preview URL; display in Runs timeline.

### 4.5 QA/Test, Triage, Auto‑Repair

* **F‑13** QA/Test Agent summarizes failing steps (lint, unit, e2e, type check, build). See CI JSON artifact schema in Appendix H.
* **F‑14** Triage Agent identifies likely root cause and files affected (no regex; prefer structured CI JSON + LLM summarization). See Appendix H.
* **F‑15** Auto‑Repair Agent proposes **minimal** patches limited to whitelisted paths and patch size caps; commits and re‑runs CI.
* **F‑16** **Stop conditions:** Max attempts (default 6), patch size/file limits, time cap, or risk threshold → require human approval.
* **F‑17** If green, mark task **passed** and move to **review** or **done** per policy.
* **F‑18** Risk gating UI: If a patch exceeds size/risk thresholds or touches risky paths (e.g., `.github/workflows/`, `infra/`), mark run `needs_review` with clear reason and present a minimal approval UI.
* **F‑19** Manual override: Allow TL/Admin to flip a run to `needs_review`, lock PR via label `auto-repair:blocked`, and resume after review.

### 4.6 Permissions & Roles

* **F‑20** Roles: Admin, Manager, Contributor, Viewer.

  * Only Admin/Manager can alter guardrails and repo/CI config.
  * Contributors can run tasks and accept small auto‑patches (configurable).
  * Viewers are read‑only.

### 4.7 Notifications (Optional v1)

* **F‑21** Email/Slack summaries: new plan generated, CI failed, auto‑patch proposed, CI green, review requested.

---

## 5) Non‑Functional Requirements

* **Performance:** P95 page TTFB ≤ 350ms (server render on Vercel Edge/Node), LCP ≤ 2.5s on broadband.
* **Reliability:** 99.9% uptime target; no single CI call should block UI threads; idempotent webhooks.
* **Security:** RLS in Supabase; least‑privilege tokens for Git/CI; no secrets in code; environment variables only.
* **Privacy:** Encrypt PII at rest (Supabase defaults + TLS). Provide data export/delete on request.
* **Accessibility:** WCAG 2.1 AA; keyboard navigable Kanban; ARIA labels; color contrast ≥ 4.5:1.
* **Internationalization:** English v1; system clock/timezone aware.
* **Browser Support:** Last 2 versions of Chrome/Edge/Firefox/Safari.
* **Cost:** Track LLM spend per project; alert if plan+repair combined exceeds configurable budget.

---

## 6) Information Architecture & Navigation

### 6.1 Route Map (App Router)

```
/                      (marketing landing)
/new                   (intake form)
/dashboard             (filters: type, status, owner, due)
/projects/[id]         (overview: badges, brief, plan, tracker, runs)
/projects/[id]/plan    (editable plan + estimates)
/tasks/[id]            (task detail + runs + preview + logs)
```

### 6.2 Primary Components (.jsx)

* `ProjectTypeBadge.jsx`, `StatusPill.jsx`, `TaskBoard.jsx`, `PlanTree.jsx`, `RunTimeline.jsx`, `RichEditor.jsx`.

---

## 7) System Architecture

```
[Next.js App Router] ─ UI (.jsx) + API Routes (server) ─┬─ LLM Wrapper
                                                        ├─ Supabase (Auth + DB + RLS)
                                                        ├─ Git Provider API (GH/GL)
                                                        ├─ CI API (e.g., GH Actions)
                                                        └─ Vercel (Hosting + Previews + Cron)
```

* **Server Actions/Route Handlers** host agents (intake/classify/plan/estimate/triage/repair).
* **Supabase** stores projects, plans, tasks, runs, events; emits row change events for live updates.
* **Vercel** deploy + previews; Cron schedules heartbeat/retry endpoints.
* **Git/CI** used by DevOps Runner; PRs map 1:1 to a **Run**.

---

## 8) Data Model (Supabase)

### 8.1 Entities

* **Project:** id, title, owner_email, type, status, priority, due_date, created_at, updated_at.
* **Brief:** project_id, summary, scope[], constraints[], success_criteria[], attachments[].
* **Plan:** milestones[], tasks[], risks[], acceptance[], estimates[], version.
* **Task:** project_id, title, description, status, assignee, labels[], estimate_hours, depends_on[], acceptance[], risk, created/updated.
* **Run:** task_id, state, attempt, branch, pr_url, ci_url, preview_url, logs, result json.
* **Event:** project_id, kind, payload, created_at.
* **User:** id, email, role.
* **Settings:** guardrails: caps, whitelisted_paths[], risk thresholds; integrations.

> See Appendix A for SQL DDL (ready to adapt to Supabase migrations).

---

## 9) API Design (Route Handlers)

> **Auth:** Supabase Auth JWT (RLS enforced).
> **Errors:** JSON `{ code, message, details? }`.

### 9.1 Intake

* **POST** `/api/intake`
  **Body:** `{ title, description, categoryHint?, dueDate?, attachments? }`
  **200:** `{ projectId }` → Orchestrator enqueues `classify → plan → estimate`.

### 9.2 Classification

* **POST** `/api/classify`
  **Body:** `{ projectId }`
  **200:** `{ type: "development" | "design" | "research" | "content" | "data-ml" | "other", confidence, rationale }`

### 9.3 Planning

* **POST** `/api/plan`
  **Body:** `{ projectId }`
  **200:** `{ planId, tasksCreated }`

### 9.4 Estimation

* **POST** `/api/estimate`
  **Body:** `{ projectId }`
  **200:** `{ updatedTasks, summary }`

### 9.5 Tracker

* **GET** `/api/tracker?projectId=...` → board data
* **POST** `/api/tracker` `{ taskId, status }`

### 9.6 DevOps Runner

* **POST** `/api/devops/run` `{ taskId }`
  → Creates/updates branch & PR, triggers CI, returns `{ runId, pr_url, ci_url, preview_url? }`.

### 9.7 CI/Vercel Webhooks

* **POST** `/api/webhooks/ci` (CI provider → us)
* **POST** `/api/webhooks/vercel` (Vercel → us)

### 9.8 Triage & Repair

* **POST** `/api/devops/triage` `{ runId, ciLog, failingTests? }`
* **POST** `/api/devops/repair` `{ runId, triage }`
  → Applies minimal patch if within **guardrails**, re‑triggers CI, returns `{ patched: boolean, reason }`.

### 9.9 Error Codes (common)

All endpoints may return `{ code, message, details? }`. Common codes include:

- `PATCH_TOO_LARGE` — proposed diff exceeds size/file caps
- `RISKY_PATH` — patch touches protected path without approval
- `ATTEMPTS_EXCEEDED` — max attempts reached for a run
- `BUDGET_EXCEEDED` — LLM or CI budget for project exceeded
- `LOCKED` — run is currently locked (another attempt in progress)
- `INVALID_SCHEMA` — agent output failed schema validation
- `UNAUTHORIZED` — auth/role insufficient for action

---

## 10) Orchestration & State Machine

**Project states:** `intake → classified → planned → estimated → executing → review → done | blocked`

**Run states:** `queued → running → failed → passed → needs_review → stopped`

### 10.1 Flow

1. **Intake** created → **Classification Agent**
2. → **Planning Agent** → plan + tasks
3. → **Estimator Agent** adds estimates
4. → **Executing:** For dev tasks, **DevOps Runner** spawns runs
5. **QA/Test Agent** summarizes failures
6. **Triage Agent** proposes root cause & patch plan
7. **Auto‑Repair Agent** commits minimal fix → CI → loop until green or **stop conditions**
8. If green → **review** (human) → **done**

### 10.2 Guardrails

* Whitelisted paths (e.g., `/app`, `/components`, `/lib`, `/tests`).
* Patch limits: ≤ 400 changed lines; ≤ 20 files; no secrets; no CI config edits unless explicitly allowed.
* Attempts: ≤ 6 per run; time cap per run (45 min).
* Risk scoring: risky changes require approval.

---

## 11) LLM System

### 11.1 Provider & Policies

* **Pluggable LLM** via `/lib/llm.ts` wrapper (OpenAI‑compatible JSON mode).
* **No chain‑of‑thought storage;** only brief rationales.
* **JSON‑only outputs** for machine‑consumable steps (use schema validators).

### 11.2 Prompts (Summaries)

* **Intake Agent (system):** Normalize request → `{ title, summary, scope[], constraints[], success_criteria[] }` + 3 clarifying Qs.
* **Classification Agent:** Pick primary type from allowed set; include `confidence` and `rationale`.
* **Planning Agent:** Milestones → tasks → acceptance checks that are objectively testable.
* **Estimator Agent:** P50/P90 hours, confidence.
* **QA/Test Agent:** Summarize failing steps and suspected modules.
* **Triage Agent:** Root cause + minimal change set per file.
* **Auto‑Repair Agent:** Generate *minimal* diffs; respect guardrails; reference failing test ids.

### 11.3 Cost Controls

* Token budgets per agent; truncate logs; reuse context via short summaries.
* Hard per‑project LLM budget with soft warning threshold.

### 11.4 Evals

* **Classification accuracy** vs. labeled set (50 examples).
* **Plan quality rubric:** coverage, acceptance clarity, risk identification (1–5).
* **Repair loop success rate** on seeded failing repos.
* **Latency:** P50 plan time; P90 triage time.

---

## 12) UX Requirements

### 12.1 Dashboard

* Cards with **Type Badge**, title, owner, due, status.
* Filters: type (multi‑select), status, owner, due window.
* Sorting: priority, due soonest.

### 12.2 Project Page

* Tabs: **Brief**, **Plan**, **Tracker**, **Runs**.
* Risks & acceptance visible near top.
* CTA: “Generate/Refresh Plan”, “Run Task”, “Open PR”.

### 12.3 Task Board

* Columns: Backlog / In Progress / Review / Done / Blocked.
* Drag‑and‑drop, keyboard shortcuts; inline quick edit (assignee/labels).
* Visual indicators: red for Blocked, blue for In Progress, green for Done.

### 12.4 Runs Timeline

* Each attempt shows: state, PR/CI/Preview links, log snippets, failure reasons, patches applied.

### 12.5 Accessibility

* Focus rings, tab order, ARIA roles for lists/boards, non‑color indicators, skip links.

---

## 13) Analytics & Telemetry

### 13.1 KPIs

* Time to Plan (create → plan ready).
* Classification accuracy (reviewer‑rated).
* Run success rate (auto‑repair vs. manual).
* Mean attempts to green (target ≤ 3).
* Guardrail decision latency P95 ≤ 2s.
* Error budget: ≤ 5% runs stuck > 30m.
* Task throughput; cycle time.

### 13.2 Event Catalog (examples)

* `intake_submitted`, `classification_done`, `plan_generated`, `estimate_added`,
  `task_status_changed`, `run_started`, `ci_failed`, `auto_patch_applied`, `ci_passed`, `approved_merge`.

> Store in Supabase `events` and optionally forward to Vercel Analytics or a product analytics tool. No sensitive payloads.

---

## 14) Security, Privacy, Compliance

* **Auth:** Supabase Auth (OAuth or magic link); JWT enforced in server routes; RLS per org/user. v1 roles: `admin|manager|contributor|viewer`.
* **Secrets:** Vercel Envs: `SUPABASE_SERVICE_ROLE_KEY` (server only), LLM key, `GIT_TOKEN` or GitHub App creds, `CI_TOKEN`, `VERCEL_DEPLOY_HOOK`.
* **Data handling:** Minimal PII; log redaction; do not store code diffs in LLM logs beyond necessity. Data retention defaults: `runs.logs` 30 days, `runs.result` 90 days, `events` 180 days.
* **DSR readiness:** Email‑based export/delete workflow; purge linked events and runs on request.
* **Audit:** `events` table captures key state changes and agent actions; include `actor` and `correlation_id`.

---

## 15) Deployment & Environments

* **Envs:** Dev, Staging, Prod (separate Supabase projects or schemas).
* **Vercel:** Project + Preview Deployments for PRs; Edge cache for static assets; Cron for `/api/orchestrator/heartbeat`.
* **CI:** GitHub Actions baseline: `lint`, `build`, `test`, `e2e` (Playwright), `lighthouse` (preview).
* **DevOps Runner:** Use a GitHub App (preferred) installed on an allowlisted set of repos for branch/PR operations and short‑lived tokens.

---

## 16) Testing Strategy

* **Unit:** Utilities, guards, validators (Vitest/Jest).
* **Integration:** Route handlers with mocked LLM/Git/CI.
* **E2E:** Playwright flows—intake → plan → run → failure → auto‑repair → green.
* **Seed Data:** Script to create sample project with failing test to validate repair loop.
* **Acceptance (Gherkin‑style):**

  * *Given* a new dev task with a failing unit test
    *When* I click “Run”
    *Then* a PR is opened and CI fails
    *And* the system proposes a minimal patch within guardrails
    *And* re‑runs CI until green or attempts exhausted.

---

## 17) Risks & Mitigations

* **Runaway auto‑patching:** Strict attempt/time/size caps + approval gates.
* **Over‑broad classification:** Present confidence + allow human override; retrain labels.
* **Unhelpful plans:** Include acceptance checks and risks; allow “Refresh Plan” with context.
* **Secrets leakage:** No logs with secrets; environment‑only; pre‑commit checks.
* **Vendor lock‑in:** LLM abstraction; CI/Git adapters.

---

## 18) Rollout Plan (Milestones)

* **M0 (Week 1‑2):** Skeleton (Next.js App Router + Tailwind), Supabase schema, Intake → Classify → Plan (no UI polish).
* **M1 (Week 3‑4):** Dashboard, Project page, editable Plan, Tracker; Estimates.
* **M2 (Week 5‑6):** DevOps Runner (branch/PR/CI/Vercel preview); Runs timeline.
* **M3 (Week 7‑8):** QA/Test + Triage + Auto‑Repair with guardrails; webhooks; analytics.
* **M4 (Week 9):** Hardening, accessibility, perf, docs; initial production launch on Vercel.

---

## 19) Open Questions & Decisions

* Which CI will we standardize on first (GitHub Actions vs. GitLab CI)?
* Default guardrails and thresholds by repo size?
* Do we require approvals for all merges or only risky patches?
* Which analytics sink do we prefer initially (Supabase events only vs. PostHog/Segment)?

---

# Appendices

## Appendix A — Supabase SQL (DDL Sketch)

```sql
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text check (role in ('admin','manager','contributor','viewer')) not null default 'contributor',
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_email text references users(email),
  type text, -- design | development | research | content | data-ml | other
  status text default 'intake', -- intake | classified | planned | estimated | executing | review | done | blocked
  priority int default 3,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  summary text,
  scope jsonb,
  constraints jsonb,
  success_criteria jsonb,
  attachments jsonb,
  created_at timestamptz default now()
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  milestones jsonb,
  tasks jsonb,
  risks jsonb,
  acceptance jsonb,
  estimates jsonb,
  version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text,
  description text,
  status text default 'backlog', -- backlog | in_progress | review | done | blocked
  assignee text references users(email),
  labels text[],
  estimate_hours numeric,
  depends_on uuid[],
  acceptance jsonb,
  risk text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  state text default 'queued', -- queued | running | failed | passed | needs_review | stopped
  attempt int default 0,
  branch text,
  pr_url text,
  ci_url text,
  preview_url text,
  logs text,
  result jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  kind text, -- intake | classification | planning | estimate | task_update | run_update | triage | repair
  payload jsonb,
  created_at timestamptz default now()
);
```

> **RLS (sketch):**
>
> * Projects, tasks, plans visible to users in the same org (if org support is added).
> * Users can **read** all; **write** only if role in (`admin`,`manager`,`contributor`) and ownership checks pass.

---

## Appendix B — OpenAPI‑style Endpoint Sketch

```yaml
paths:
  /api/intake:
    post:
      summary: Create project + brief
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [title, description]
              properties:
                title: { type: string }
                description: { type: string }
                categoryHint: { type: string }
                dueDate: { type: string, format: date }
                attachments:
                  type: array
                  items: { type: object, properties: { url: {type: string}, name: {type: string} } }
      responses:
        "200": { description: OK }
  /api/devops/run:
    post:
      summary: Start a run for a task
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [taskId]
              properties:
                taskId: { type: string, format: uuid }
      responses:
        "200": { description: OK }
```

---

## Appendix C — Guardrails (Config Example)

```json
{
  "whitelisted_paths": ["app/", "components/", "lib/", "tests/"],
  "max_changed_lines": 400,
  "max_changed_files": 20,
  "max_attempts": 6,
  "max_run_minutes": 45,
  "risky_paths": ["infra/", "ci/", ".github/workflows/"],
  "require_human_review_if_risky": true
}
```

---

## Appendix D — Sample Agent Output Schemas

**Classification Agent →**

```json
{
  "type": "development",
  "secondary": ["frontend", "nextjs"],
  "confidence": 0.92,
  "rationale": "Code changes to Next.js; tests required."
}
```

**Planning Agent →**

```json
{
  "milestones": [
    {"title": "Scaffold & Intake", "tasks": ["Create /new form", "Persist brief", "Classify type"]},
    {"title": "Planner & Tracker", "tasks": ["Generate plan", "Create tasks", "Kanban board"]},
    {"title": "DevOps & Auto-Repair", "tasks": ["Runner", "QA/Triage", "Patch loop"]}
  ],
  "tasks": [
    {
      "title": "Implement /api/intake",
      "acceptance": ["Submitting form creates project and brief", "Project visible on dashboard"],
      "dependencies": []
    }
  ],
  "risks": ["Ambiguous requests", "LLM drift"]
}
```

---

## Appendix E — Wireframe Sketches (ASCII)

**Dashboard**

```
+--------------------------------------------------------------+
|  Filters: [Type v] [Status v] [Owner v] [Due v]   (+ New)    |
+--------------------------------------------------------------+
| [Design] Homepage refresh        Due: Oct 5   Status: Plan   |
| [Development] API rate limiter   Due: Oct 8   Status: Exec   |
| [Data/ML] Embedding evals        Due: Oct 9   Status: Plan   |
+--------------------------------------------------------------+
```

**Project Page**

```
Title [Type Badge][Priority]
Tabs: [Brief][Plan][Tracker][Runs]
---------------------------------------------------------------
Brief: Summary | Scope | Constraints | Success Criteria
Plan:  M1 ... Tasks with acceptance & estimates
Tracker: [Backlog][In Progress][Review][Done][Blocked]
Runs: Attempts with PR/CI/Preview + logs
```

**Task Detail**

```
Task: Implement /api/intake    Status: In Progress
Acceptance:
 - POST /api/intake returns 200 with projectId
 - Project card appears on dashboard
Runs:
 #1 FAILED  PR: ...  CI: ...  Preview: ...
   Failure: Unit test "intake creates project" failed
   Patch: app/api/intake/route.ts (+12 -3)
 #2 PASSED  ...
```

---

## Appendix F — CI Baseline (GitHub Actions example)

```yaml
name: ci
on: [push, pull_request]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: pnpm i
      - run: pnpm lint
      - run: pnpm build
      - run: pnpm test
      - run: pnpm exec playwright install --with-deps
      - run: pnpm e2e
```

---

## Appendix G — Auto‑Repair Loop (Concrete Steps)

1. **Spawn Run:** Create branch `task-<uuid>-attempt-<n>`.
2. **Open/Update PR:** Checklist includes acceptance criteria.
3. **Trigger CI:** Attach `ci_url`, `preview_url` (from Vercel webhook).
4. **On Failure:**

   * QA/Test Agent generates concise failure summary.
   * Triage Agent pinpoints likely files/lines and proposes minimal edits.
   * Auto‑Repair Agent drafts patch **limited to whitelisted paths and caps**.
   * Guardrails validate patch → commit → re‑run CI.
5. **Loop:** Stop on success or when caps exceeded → “needs_review”.
6. **Success:** Move task to **review** (human) or **done** per policy; merge PR.

---

## Appendix H — CI JSON Artifact Schema

CI must publish a concise JSON artifact per run to support deterministic QA/Triage/Repair.

```json
{
  "job": "build-test",
  "steps": [
    { "name": "lint", "status": "passed", "errors": [] },
    { "name": "unit", "status": "failed", "failing_test_ids": ["utils/math.test.ts#adds"] },
    { "name": "e2e", "status": "skipped", "failing_test_ids": [] }
  ],
  "summary": "1 failed, 1 passed, 1 skipped",
  "stack_traces": ["AssertionError: expected 2 to equal 3..."],
  "type_errors": [],
  "lint_errors": [],
  "artifacts": { "report_url": "https://ci.example.com/run/123/report" }
}
```

Webhook `/api/webhooks/ci` should store this JSON in `runs.result` and keep `runs.logs` minimal.
