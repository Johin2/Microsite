# Execution Plan — Microsite: Project Intake → Plan → Track → Auto‑Repair

> **Stack:** Next.js (App Router) + Tailwind CSS · Supabase (optional, for DB/Auth) · Deployed on Vercel  
> **CI/CD:** GitHub + GitHub Actions · Vercel Preview Deployments  
> **Agents:** Intake · Classification · Planning · Estimation · Tracker · DevOps Runner · QA/Test · Triage · Auto‑Repair  
> **Note:** Frontend components will be authored in **.jsx** when code is provided.

---

## Table of Contents
1. [0) Program Framing](#0-program-framing)
2. [1) Team & RACI](#1-team--raci)
3. [2) Pre‑work (Day 0 checklist)](#2-prework-day-0-checklist)
4. [3) WBS — Detailed tasks by track & milestone](#3-wbs--detailed-tasks-by-track--milestone)
   - [M0 (Week 1–2)](#m0-week-12-bootstrap--intake--classify--plan)
   - [M1 (Week 3–4)](#m1-week-3-4-dashboard-project--task-uis-estimates-tracker)
   - [M2 (Week 5–6)](#m2-week-5-6-devops-runner-prcivercel-previews-runs-timeline)
   - [M3 (Week 7–8)](#m3-week-7-8-qatest--triage--auto-repair-loop-guardrails)
   - [M4 (Week 9)](#m4-week-9-hardening-perf-a11y-docs-launch)
5. [4) Detailed checklists & mini‑runbooks](#4-detailed-checklists--mini-runbooks)
6. [5) Testing matrix](#5-testing-matrix)
7. [6) Risk register & mitigations](#6-risk-register--mitigations)
8. [7) Execution timeline (week‑by‑week)](#7-execution-timeline-weekbyweek)
9. [8) Concrete issue list (initial backlog)](#8-concrete-issue-list-initial-backlog)
10. [9) Acceptance criteria (per milestone)](#9-acceptance-criteria-per-milestone)
11. [10) Operational runbooks (quick refs)](#10-operational-runbooks-quick-refs)
12. [11) Optional next steps (post‑launch)](#11-optional-next-steps-postlaunch)

---

## 0) Program Framing

### Tracks
- **Product & Frontend** — intake UI, dashboard, project/task views  
- **Agents & Orchestration** — intake/classify/plan/estimate, state machine  
- **Platform & Data** — Supabase schema, RLS, migrations, analytics  
- **DevOps Runner & Auto‑Repair** — PRs, CI, triage, patch loop  
- **Quality** — tests, e2e, perf, a11y, observability  
- **Security & Compliance** — secrets, RLS, approvals

### Sprints & Milestones (9 weeks total)
- **M0 (Week 1–2):** Repo bootstrap, schema, intake → classify → plan end‑to‑end  
- **M1 (Week 3–4):** Dashboard, Project & Task UIs, estimates, tracker  
- **M2 (Week 5–6):** DevOps Runner, PR/CI/Vercel previews, Runs timeline  
- **M3 (Week 7–8):** QA/Test + Triage + Auto‑Repair loop with guardrails  
- **M4 (Week 9):** Hardening, a11y/perf, docs, production launch

---

## 1) Team & RACI

| Area | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Product scope & priorities | PM | PM | Eng Lead, Design | All |
| Frontend (Next.js/Tailwind) | FE Eng | Eng Lead | Design | PM |
| Agents & LLM prompts | Backend/AI Eng | Eng Lead | PM | All |
| DB & RLS (Supabase) | Backend Eng | Eng Lead | Security | All |
| DevOps Runner & CI | Platform Eng | Eng Lead | Backend | All |
| QA/E2E & Observability | QA Eng | Eng Lead | Platform | All |
| Security & Secrets | Security Eng | Eng Lead | Platform | All |

---

## 2) Pre‑work (Day 0 checklist)

- [ ] Create GitHub repo (monorepo ok)  
- [ ] Create Vercel project (Preview Deployments enabled)  
- [ ] Create Supabase project (dev + staging + prod or separate schemas)  
- [ ] Provision secrets in **Vercel**:  
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`  
  - `SUPABASE_SERVICE_ROLE_KEY` *(server only)*  
  - `OPENAI_API_KEY` *(or chosen LLM provider key)*  
  - `GIT_TOKEN` *(repo write; restrict to needed scopes)*  
  - `CI_API_TOKEN` *(if needed)*, `VERCEL_DEPLOY_HOOK_URL`  
- [ ] GitHub → Vercel integration  
- [ ] Create a **GitHub App** for DevOps Runner; record `APP_ID`, `PRIVATE_KEY`, installation ID; install on an allowlisted set of repos  
- [ ] Set required branch protections: require PRs, required checks (CI)  
- [ ] Set up GitHub Environments: **staging**, **production** with secrets approvals  
- [ ] Assign **CODEOWNERS** (platform/team leads) for riskier paths (`infra`, workflows)

> **DoD:** All secrets validated by a health route **`/api/health`** (server logs only), branch protections active.

---

## 3) WBS — Detailed tasks by track & milestone

### M0 (Week 1–2): Bootstrap + Intake → Classify → Plan

#### 3.1 Platform & Data
- [ ] Add Supabase client in `/lib/supabase.ts` (server + client instances)  
- [ ] Migrations: `projects`, `briefs`, `plans`, `tasks`, `runs`, `events`, `users`, `settings` (see PRD Appendix SQL)  
- [ ] Enable **RLS**; policies:  
  - Read: users in the same org (if orgs added later) / otherwise all authenticated  
  - Write: `admin | manager | contributor` on owned records (scaffold now, refine later)  
- [ ] Seed script: one demo user, one project skeleton, default `settings` (feature flags + guardrails)

#### 3.2 Agents & Orchestration
- [ ] LLM wrapper `/lib/llm.ts` (provider‑agnostic) + JSON schema validator (**zod**)  
- [ ] Prompts v1 (system + tool): **Intake**, **Classification**, **Planning**, **Estimation**  
- [ ] Orchestrator state machine `/lib/orchestrator.ts`:  
  - States: `intake → classified → planned → estimated` (exec later)  
  - Idempotent **step** function; store transitions in `events`  
- [ ] Route handlers:  
  - `POST /api/intake` → create project+brief, emit `events`  
  - `POST /api/classify` → write `projects.type` + rationale  
  - `POST /api/plan` → write nested plan, create `tasks`  
  - `POST /api/estimate` → write P50/P90 + confidence to `tasks`

#### 3.3 Product & Frontend
- [ ] Tailwind setup; base theme; layout shell; `Nav` & `Container`  
- [ ] `(marketing)/page.jsx` landing with CTA → `/new`  
- [ ] `/new/page.jsx` intake form (title, description, category hint, due, attachments)  
- [ ] `/dashboard/page.jsx` basic list of projects with **Type Badge** component  
- [ ] `ProjectTypeBadge.jsx`, `StatusPill.jsx` components

#### 3.4 Quality
- [ ] Unit tests for **zod** schemas; snapshot tests for plan generation structures  
- [ ] Minimal Playwright e2e: intake → classify → plan visible

#### 3.5 Security
- [ ] Vercel env scoping (service role only on server)  
- [ ] Add simple allowlist of AI tools endpoints (no public POSTs without auth)  
- [ ] Log redaction helper (no secrets)

> **M0 DoD**
> - A user can submit a project and see: **type badge** + **generated plan**.  
> - DB tables live with **RLS**.  
> - Events recorded for major transitions.  
> - E2E “happy path” green in CI.

---

### M1 (Week 3–4): Dashboard, Project & Task UIs, Estimates, Tracker

#### 3.6 Frontend
- [ ] `/projects/[id]/page.jsx` with tabs: **Brief**, **Plan**, **Tracker**, **Runs** *(runs tab empty for now)*  
- [ ] `PlanTree.jsx` to render milestones → tasks → acceptance  
- [ ] `/projects/[id]/plan/page.jsx` editable plan, inline save (server actions)  
- [ ] `TaskBoard.jsx` **Kanban** with columns *Backlog / In Progress / Review / Done / Blocked* (drag‑and‑drop)  
- [ ] `/tasks/[id]/page.jsx` task detail with acceptance, estimates

#### 3.7 Agents
- [ ] **Estimation Agent** integration → update UI with P50/P90 + confidence  
- [ ] **Tracker Agent** (simple): `POST /api/tracker` to change task status; `GET` board

#### 3.8 Analytics
- [ ] Burndown data computed from **events** (server) and visualized on project page  
- [ ] Blockers list (tasks with `status=blocked` or dependency unmet)
 - [ ] Minimal **Events Explorer** view to filter/search events by project/run/correlation ID

#### 3.9 Tests
- [ ] Component tests (React Testing Library) for `TaskBoard.jsx` drag logic  
- [ ] E2E: edit plan, move tasks across statuses, estimates visible

> **M1 DoD**
> - PM can view/edit plans, drag tasks on Kanban, see estimates and burndown.  
> - Events fire on status change and updates.

---

### M2 (Week 5–6): DevOps Runner, PR/CI/Vercel Previews, Runs Timeline

#### 3.10 Platform
- [ ] `/lib/devops.ts` adapters: GitHub (branches, commits, PRs), CI (status, logs), Vercel (deploy hook)  
- [ ] `/api/devops/run` handler:  
  - Create/update branch ``task-<id>-attempt-<n>``  
  - Commit scaffolds/tests if required by task acceptance (opt‑in)  
  - Open/update PR; post acceptance checklist as PR body  
  - Trigger CI; persist `runs` with `ci_url`, `pr_url`
- [ ] Webhooks:  
  - `/api/webhooks/ci` *(CI → us)*: update `runs.state`, append `runs.logs` (structured JSON)  
  - `/api/webhooks/vercel` *(Vercel → us)*: set `runs.preview_url` when ready
 - [ ] Run‑level locking to prevent concurrent repair cycles on the same run (persist lock in DB)

#### 3.11 Frontend
- [ ] `RunTimeline.jsx` in `/tasks/[id]/page.jsx`: show attempts with state, PR/CI/Preview links, log snippets  
- [ ] On dev task, CTA **“Run”** → starts a run, shows attempt #1

#### 3.12 CI
- [ ] GitHub Actions baseline (lint, build, unit, e2e, optional Lighthouse on preview)  
- [ ] Cache Node modules; set required checks on `main`

#### 3.13 Tests
- [ ] E2E: dev task → Run → CI executes → preview link shown  
- [ ] Mock webhooks in test to simulate “CI failed/passed”

> **M2 DoD**
> - Dev tasks can spawn runs; PRs open automatically; CI status displayed; previews linked.  
> - Runs timeline present.

---

### M3 (Week 7–8): QA/Test + Triage + Auto‑Repair Loop (Guardrails)

#### 3.14 Agents
- [ ] **QA/Test Agent:** summarize failing checks from structured CI logs *(no regex; rely on known JSON sections + LLM summarization)*  
- [ ] **Triage Agent:** map failures → likely files/lines/modules and minimal change set  
- [ ] **Guardrails** `/lib/guardrails.ts`:  
  - Whitelisted paths (`app/`, `components/`, `lib/`, `tests/`)  
  - Limits (≤ **400** changed lines, ≤ **20** files)  
  - Risky paths (`infra/`, `.github/workflows/`) require human approval  
  - Attempt cap = **6**, run time cap = **45 min**  
- [ ] **Auto‑Repair Agent:** propose patch (structured diff object), validate via guardrails, commit to branch, re‑run CI
 - [ ] Backoff strategy for repeated failures (linear backoff; cap inflight runs per repo)

#### 3.15 APIs
- [ ] `POST /api/devops/triage` `{ runId, ciLog }` → triage summary  
- [ ] `POST /api/devops/repair` `{ runId, triage }` → conditional commit & retrigger CI  
- [ ] Orchestrator “repair loop” step runs automatically on webhook updates until stop condition

#### 3.16 Frontend
- [ ] Runs timeline shows: failure reason, proposed patch summary, guardrail decisions (approved/blocked), attempt counter  
- [ ] Button **“Require human review”** to set `runs.state = needs_review`

#### 3.17 Tests
- [ ] Seed repo with a known failing unit test; validate the loop makes a minimal fix and goes green  
- [ ] Property tests for guardrails (reject large/unsafe patches)  
- [ ] Load test: 20 concurrent runs; ensure queueing/backoff behaves

> **M3 DoD**
> - A failing CI can be repaired automatically via minimal patches within guardrails, iterating until green or stop conditions, with full audit trail.

---

### M4 (Week 9): Hardening, Perf, A11y, Docs, Launch

#### 3.18 Performance
- [ ] Optimize DB queries (indexes on `tasks.project_id`, `events.project_id`, `runs.task_id`)  
- [ ] Edge caching where safe (marketing, dashboard filters via ISR)  
- [ ] Audit LCP/TTFB on Vercel; target **LCP ≤ 2.5s**

#### 3.19 Accessibility
- [ ] Keyboard‑navigable Kanban; ARIA roles for lists and drag handles  
- [ ] Contrast checks; skip links; focus management after dialog actions

#### 3.20 Security
- [ ] Formal env review; rotate tokens; confirm least‑privilege scopes  
- [ ] Add Content‑Security‑Policy headers; secure cookies

#### 3.21 Documentation
- [ ] `README.md` (run, test, deploy)  
- [ ] `AGENTS.md` (update with final prompts)  
- [ ] `OPERATIONS.md` (runbooks, webhooks, incident)  
- [ ] `SECURITY.md` (secrets, RLS, data retention)

#### 3.22 Launch
- [ ] Final dry run on staging; sign‑off checklist  
- [ ] Promote to prod; enable cron for `/api/orchestrator/heartbeat` (Vercel)  
- [ ] Post‑launch monitoring (first 72 hours)

> **M4 DoD**
> - Production live on Vercel; alerts + dashboards working; docs complete.

---

## 4) Detailed checklists & mini‑runbooks

### 4.1 Repo bootstrap (Day 1)

```bash
pnpm create next-app@latest   # App Router; TypeScript optional, components in .jsx
pnpm add -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
pnpm add @supabase/supabase-js zod
pnpm add -D vitest @testing-library/react @testing-library/jest-dom playwright @playwright/test
pnpm add -D eslint prettier
pnpm add -D @types/node   # if using TS for server code
```
> **DoD:** Repo builds locally, Tailwind classes render, Supabase connects in dev.

---

### 4.2 Supabase migrations (Week 1)
- Create SQL files for each table; add `idx_*` on foreign keys  
- Enable **RLS**: write simple `auth.uid()` checks (or placeholder until orgs)  
- Set `updated_at` triggers on `projects`, `plans`, `tasks`, `runs`

> **DoD:** `supabase migrate up` succeeds; basic CRUD with auth tokens works.

---

### 4.3 Orchestrator pattern (Week 1–2)
- Implement `orchestrator.step(projectId)` with switch on project status  
- Ensure idempotency: if the previous step already wrote output, **skip**  
- Persist each step result into `events` (kind, payload summary)

> **DoD:** Re‑calling step does not duplicate work; events show clean progression.

---

### 4.4 Planning & estimates (Week 2–3)
- Validate LLM outputs against **zod** schemas; reject/repair malformed JSON  
- Add “Refresh Plan” with a guard to prevent infinite re‑planning  
- Estimation adds P50/P90 minutes → stored in `tasks.estimate_hours` (likely = P50)

> **DoD:** Plans are machine‑verifiable; estimates appear in UI and on PR checklists.

---

### 4.5 Tracker board (Week 3–4)
- Drag‑and‑drop with accessible handles (arrow keys to switch columns)  
- Server action `updateTaskStatus(taskId, status)` with optimistic UI and rollback  
- Emit `events.task_status_changed`

> **DoD:** Smooth move between columns with keyboard and mouse; no flicker on rollback.

---

### 4.6 DevOps Runner (Week 5)
- GitHub adapter: create branch, commit patch, open/update PR, comment  
- PR body includes acceptance checklist (markdown)  
- CI: on PR open/update → run workflow; report URL back via webhook  
- Vercel preview URL captured via webhook and stored in `runs.preview_url`

> **DoD:** A button click on a dev task opens a PR, kicks CI, and shows preview URL.

---

### 4.7 Structured logs for CI (Week 5 — priority)
- Standardize CI workflow to emit a **JSON summary artifact**:  
  `job`, `step`, `status`, `failing_test_ids[]`, `lint_errors[]`, `type_errors[]`, `stack_traces[]`  
- Webhook ingests artifact link, fetches JSON, saves to `runs.result` (avoid large blobs in `runs.logs`)

> **DoD:** Triage & QA/Test agents receive machine‑readable JSON—no reliance on pattern matching.

---

### 4.8 QA/Test, Triage, Auto‑Repair (Week 7)
- **QA/Test Agent:** concise summary + list of failing test IDs  
- **Triage Agent:** minimal change set + file paths + explanation  
- **Auto‑Repair Agent:** generate diff object → guardrails validate → commit → retrigger CI  
- Orchestrator repeats on webhook events until: green | attempts exhausted | risk threshold hit

> **DoD:** A seeded failing test is fixed via 1–3 patch attempts without human edits.

---

### 4.9 Guardrails (Week 7)
- Config in DB/JSON (editable by Admin/Manager):  
  `whitelisted_paths`, `max_changed_lines`, `max_changed_files`, `risky_paths[]`, `require_human_review_if_risky`, `max_attempts`, `max_run_minutes`  
- Server validates patch size before commit; marks run `needs_review` if blocked

> **DoD:** Oversized or risky diffs never commit; visible reason shown on UI.

---

### 4.10 Observability & alerts (Week 6–8)
- Emit structured `events` for all state changes; attach correlation IDs per project/run  
- Optional forwarding to analytics sink (can start with Supabase only)  
- Alert rules (email or Slack): CI failed twice; auto‑repair blocked; budget threshold hit
 - Global kill switch in `settings`: `enableAutoRepair` per repo or global
 - Basic OpenTelemetry traces for API routes and orchestrator steps (request → state transition → agent calls)

> **DoD:** Ops can answer “what happened and when” from events; alerts fire reliably.

---

## 5) Testing matrix

| Layer | Tool | Example |
|---|---|---|
| Unit | Vitest | zod schema validation, guardrails decision logic |
| Component | Testing Library | `TaskBoard.jsx` drag interactions |
| Integration | Vitest + msw | `/api/plan` with mocked LLM |
| E2E | Playwright | intake → plan → run → failure → auto‑repair → green |
| Performance | Lighthouse CI | LCP, TTI on Preview |
| Security | Static checks | disallow client exposure of server secrets |
| Dataset eval | Node script | classification accuracy on 50 labeled examples |

**Seed scenario:** A failing unit test in a sample Next util; acceptance requires specific function behavior; the loop patches a small conditional.

---

## 6) Risk register & mitigations

- **Runaway loops** → attempts/time caps; preview environment only; require approval on risk or size overages.  
- **Prompt drift** → version prompts; snapshot outputs; add “test set” of 50 known intakes.  
- **Secrets exposure** → no secrets in logs; server‑only env usage; Vercel access controls.  
- **LLM cost creep** → per‑project budget; kill‑switch when exceeded; summary reuse.  
- **Flaky tests** → quarantine tag; don’t allow auto‑repair to chase non‑determinism.

---

## 7) Execution timeline (week‑by‑week)

- **Week 1:** Repo, Tailwind, Supabase schema + RLS, health checks, LLM wrapper  
- **Week 2:** Intake, Classification, Planning APIs; basic dashboard; e2e (intake→plan)  
- **Week 3:** Editable Plan, Estimates, Kanban; events & burndown  
- **Week 4:** Task detail, polish; component tests; staging deploy  
- **Week 5:** DevOps runner adapters; PR/CI hooks; Runs timeline shell  
- **Week 6:** Webhooks (CI, Vercel), structured CI JSON; full Runs timeline; e2e (run/preview)  
- **Week 7:** QA/Test, Triage, Guardrails; Auto‑Repair loop core; seed failing test  
- **Week 8:** Hardening of loop, load testing, alerts, budget caps; a11y passes  
- **Week 9:** Perf, docs, cutover to prod, ops runbooks

---

## 8) Concrete issue list (initial backlog)

### Epic: M0 Bootstrap
- [ ] Scaffold Next.js App Router + Tailwind  
- [ ] Supabase client + migrations + RLS  
- [ ] `/api/intake` + `/new` intake UI  
- [ ] `/api/classify` (LLM) + badge UI  
- [ ] `/api/plan` + Plan zod schema + renderer  
- [ ] `/api/estimate` + estimates in UI  
- [ ] Basic dashboard list with filters

### Epic: Tracker
- [ ] `TaskBoard.jsx` (drag & keyboard), `/api/tracker`  
- [ ] Burndown chart from `events`  
- [ ] Task detail page with acceptance and estimates

### Epic: DevOps Runner
- [ ] GitHub adapter (branch/PR/commit)  
- [ ] CI webhook + artifact ingest  
- [ ] Vercel webhook (preview URL)  
- [ ] `RunTimeline.jsx`

### Epic: Auto‑Repair
- [ ] QA/Test Agent (read JSON artifact)  
- [ ] Triage Agent (map failures → files)  
- [ ] Guardrails module + config UI (admin‑only)  
- [ ] Auto‑Repair Agent (diff → validate → commit → rerun)  
- [ ] Orchestrator repair loop on webhook events

### Epic: Quality & Ops
- [ ] Playwright flows (3)  
- [ ] A11y checklist close‑out  
- [ ] Alerts (auto‑repair blocked, budget exceeded)  
- [ ] Docs (`README`, `OPERATIONS`, `SECURITY`)

---

## 9) Acceptance criteria (per milestone)

### M0
- [ ] Submitting a project returns `projectId` and shows **type + plan** within 60s.  
- [ ] DB rows for project, brief, plan, tasks created; `events` recorded.

### M1
- [ ] Plan editable; tasks movable across board; **P50/P90** estimates visible.  
- [ ] Burndown updates after movements; blockers list populated.

### M2
- [ ] Clicking **“Run”** creates PR, triggers CI; Runs timeline shows PR/CI/Preview links.  
- [ ] CI results update UI via webhook.

### M3
- [ ] On CI failure, a minimal patch is proposed, validated, committed; CI retried.  
- [ ] Stops after success or configured limits; **needs‑review** path works.

### M4
- [ ] A11y and perf budgets met; docs complete; production deploy stable.

---

## 10) Operational runbooks (quick refs)

### Heartbeat
- **Vercel Cron →** `GET /api/orchestrator/heartbeat`  
  - Finds stuck runs (`state=running`, `updated_at > 15m`), advances/alerts

### Incident: repair loop stuck
1. Flip run to `needs_review` via admin tool  
2. Lock PR; add label `auto-repair:blocked`  
3. Postmortem: events timeline; adjust guardrails or tests

### Key dashboards
- Projects by status/type, mean time to plan, auto‑repair success rate, avg attempts/run, cost per project

---

## 11) Optional next steps (post‑launch)
- Multi‑org + RBAC UI, SSO  
- Deeper design workflows (Figma links → tasks)  
- More CI adapters (GitLab, CircleCI)  
- Human‑in‑the‑loop patch review UI (diff viewer + inline approval)  
- SLA/OLAs and external stakeholder status pages
