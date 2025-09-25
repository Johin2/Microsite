# AGENTS.md — Microsite for Project Intake → Auto-Plan → Track → Auto-Fix

This document defines the agentic architecture, roles, tools, routing, data models, and runbooks for a Next.js (App Router) + Tailwind CSS microsite that:

1. collects project requests, 2) classifies them (design/dev/etc.), 3) turns them into a detailed plan using an LLM, 4) tracks execution, and 5) **automatically runs code, finds issues, proposes fixes, and repeats until green** via a safe auto-repair loop. Optional persistence uses **Supabase**. Deploy target: **Vercel**.

---

## High-Level System

```
User → Intake UI → Orchestrator → {Classifier → Planner → Estimator → Tracker → DevOps Runner → QA/Test → Triage → Repair Loop} → Team Views
```

* **Next.js (App Router)** serves UI + API routes.
* **LLM-backed Agents** run in server actions/Route Handlers.
* **Supabase** stores requests, plans, tasks, runs, and artifacts.
* **Vercel** hosts web, creates Preview deployments for PRs, and schedules CRONs (for queues/heartbeats).
* **Git provider (GitHub/GitLab)** is assumed for repo, PRs, and CI. The DevOps agent interacts via REST/GraphQL APIs.

---

## Agent Roster

### 1) **Intake Agent**

**Purpose:** Normalize raw user requests into a structured brief.

* **Inputs:** free-text request, optional files/links, category hints, due date.
* **Outputs:** `ProjectBrief` (title, summary, scope bullets, constraints, success criteria, category guess).
* **Prompts / Behaviors:** extract entities, user goals, hard constraints; flag missing info; produce clarifying questions.
* **Tools:** None (LLM only). Writes to `projects` + `briefs` tables.

### 2) **Classification Agent**

**Purpose:** Tag the project type so the team quickly sees what it is: *design, development, research, content, data/ML*, etc.

* **Inputs:** `ProjectBrief`.
* **Outputs:** `ProjectType` (one primary, many secondary), confidence, rationale.
* **Tools:** zero-shot classification heuristic + labels table.

### 3) **Planning Agent**

**Purpose:** Convert brief → stepwise plan.

* **Inputs:** `ProjectBrief`, `ProjectType`.
* **Outputs:** `WorkPlan` (milestones → tasks → subtasks; owners TBD; dependencies; acceptance tests; risks; timeline).
* **Behaviors:** drafts testable acceptance criteria; attaches measurable success metrics; proposes repo/package layout if dev work.

### 4) **Estimation Agent**

**Purpose:** Put time/cost/complexity estimates per task.

* **Inputs:** `WorkPlan`.
* **Outputs:** `Estimates` (pess/likely/opt, confidence, skill breakdowns). Updates plan with scores for prioritization (WSJF-like optional).

### 5) **Tracker Agent**

**Purpose:** Maintain a living tracker visible to the team.

* **Inputs:** `WorkPlan`, `Estimates`, task events.
* **Outputs:** `TaskBoard` (Backlog, In Progress, Review, Done), burndown data, blocker warnings.
* **Tools:** Supabase row-level changes + webhooks to update status; emits digest summaries.

### 6) **Orchestrator (Supervisor)**

**Purpose:** Route context among agents, manage state transitions, guardrails, and loops.

* **Inputs:** Project ID, stage, last results.
* **Outputs:** Next action & agent call; escalation when stuck.
* **Tools:** Server Action/Route Handler with deterministic state machine; retry & cooldowns.

### 7) **DevOps Runner Agent**

**Purpose:** Execute code workflows: create branches, run CI, collect logs/artifacts.

* **Inputs:** a repo URL, task spec or failing test/stack trace.
* **Outputs:** PRs, CI results (passed/failed), artifacts links.
* **Tools:** Git provider API (create branch/PR, commit), CI API (rerun, read logs), Vercel Deploy Hooks for previews.

### 8) **QA/Test Agent**

**Purpose:** Evaluate changes against acceptance tests.

* **Inputs:** Test suite outputs (unit/e2e), Lighthouse/Web Vitals for previews, type-check output if applicable.
* **Outputs:** Pass/Fail verdict + failure summaries.

### 9) **Issue Triage Agent**

**Purpose:** Triage CI and runtime issues into actionable diffs.

* **Inputs:** CI logs, stack traces, failing tests, lint/type errors.
* **Outputs:** Root-cause hypothesis, minimal patch plan, safety checks.

### 10) **Auto-Repair Agent**

**Purpose:** Propose patches, open PRs, and **repeat until green** under guardrails.

* **Inputs:** Triage output.
* **Outputs:** Candidate diffs; PR updates; commit messages; stop conditions met/not met.
* **Tools:** Codegen with repo-aware context (limited file scope), Structural edit API (fs patch), test runner, semantic diff annotator.

### 11) **Comms Agent** (optional)

**Purpose:** Team notifications (email/Slack) and weekly digest.

---

## Safety & Guardrails for Auto-Repair

* **Scope limiter:** Only allow changes within whitelisted paths (e.g., `/app`, `/components`, `/lib`, test files). No secrets or CI config edits unless explicitly allowed.
* **Patch size cap:** e.g., ≤ 400 changed lines or ≤ 20 files per loop.
* **Time cap:** max N repair cycles (e.g., 6) and 45 minutes wall time per ticket.
* **Mandatory tests:** All unit + critical e2e must pass. No `--force` merges.
* **Change review:** If patch size or risk > threshold, require human approval.
* **Secrets handling:** Only env vars from Vercel/Supabase; never write secret literals to repo.

---

## Data Models (Supabase)

```sql
-- projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_email text,
  type text, -- design | development | research | content | data-ml | other
  status text default 'intake', -- intake | planning | executing | review | done | blocked
  priority int default 3,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- briefs
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

-- plans
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  milestones jsonb,
  tasks jsonb,
  risks jsonb,
  acceptance jsonb,
  estimates jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text,
  description text,
  status text default 'backlog', -- backlog | in_progress | review | done | blocked
  assignee text,
  labels text[],
  estimate_hours numeric,
  depends_on uuid[],
  acceptance jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- runs (CI/repair loop runs)
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

-- events (audit trail)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  kind text, -- intake | classification | planning | estimate | task_update | run_update | triage | repair
  payload jsonb,
  created_at timestamptz default now()
);
```

---

## Next.js App Router Structure

```
/app
  /(marketing)
    page.tsx                     # Landing: explain flow, CTA → /new
  /(app)
    dashboard/page.tsx           # Team dashboard: filters, status, burndown
    projects/[id]/page.tsx       # Project overview (brief, type, plan, tracker)
    projects/[id]/plan/page.tsx  # Gantt-ish plan, edit
    tasks/[id]/page.tsx          # Task detail, runs, logs, preview links
    new/page.tsx                 # Intake form (title, description, files, due)

  api/
    intake/route.ts              # POST → create Project + Brief; kick Orchestrator
    classify/route.ts            # POST → Classifier Agent
    plan/route.ts                # POST → Planning Agent
    estimate/route.ts            # POST → Estimator Agent
    tracker/route.ts             # GET → board data; POST → status change
    devops/run/route.ts          # POST → start run for a task
    devops/triage/route.ts       # POST → triage CI logs
    devops/repair/route.ts       # POST → propose patch & commit (guardrails)
    webhooks/ci/route.ts         # CI webhook (status updates)
    webhooks/vercel/route.ts     # preview deployment status

/components
  ProjectTypeBadge.tsx
  StatusPill.tsx
  TaskBoard.tsx
  RunTimeline.tsx
  PlanTree.tsx
  Editor.tsx

/lib
  supabase.ts
  llm.ts                         # provider-agnostic wrapper
  orchestrator.ts                # state machine
  devops.ts                      # git + ci clients
  guardrails.ts                  # path/size/time caps
  prompts/                      # system + tool prompts per agent
  schemas/                      # zod schemas for Brief/Plan/Task/Run
```

> **Note:** If you prefer `.jsx` over TSX, keep components as `.jsx` and adjust imports; server code can stay in `.ts` if desired. UI uses Tailwind.

---

## UI Highlights (Tailwind)

* **Intake (/new):** Title, description (rich), category hint, due date, attachments. Shows live AI extraction preview.
* **Dashboard:** Filters by *type*, *status*, *owner*, *due*. ProjectType badge (design/dev/etc.).
* **Project:** Tabs → *Brief*, *Plan*, *Tracker*, *Runs*. PlanTree (milestone → task nesting). RunTimeline shows CI, previews, and repair attempts.
* **Task:** Logs viewer with collapsible sections for stack traces and failing tests.

---

## Orchestrator State Machine (server)

**States:** `intake → classified → planned → estimated → executing → review → done | blocked`

**Transitions:**

1. Intake → Classify (Classify Agent)
2. Classify → Plan (Planning Agent)
3. Plan → Estimate (Estimator Agent)
4. Estimate → Tracker (create tasks) → Executing
5. Executing: for each task with `acceptance`, spawn **Run** via DevOps Runner
6. Run → QA/Test Agent verdict
7. If fail → Triage → Auto-Repair → loop to Run
8. If pass → move task to *review* or *done*

**Pseudo-code:**

```ts
async function step(projectId) {
  const p = await db.project(projectId)
  switch (p.status) {
    case 'intake': await classify(projectId); return;
    case 'planning': await plan(projectId); return;
    case 'estimated': await spawnRuns(projectId); return;
    case 'executing': await maybeRepairOpenFailures(projectId); return;
    // ...
  }
}
```

---

## DevOps & Auto-Repair Loop

**Assumptions:** Repo has CI with: `lint`, `unit`, optional `e2e` (Playwright), and builds preview on Vercel for PRs.

1. **Spawn Run**: Create branch `task-<id>-attempt-<n>`. Commit scaffolds/tests if missing.
2. **Open/Update PR**: Map run → PR. Post acceptance criteria as checklist.
3. **CI Executes**: gather URLs for CI + Vercel Preview.
4. **If CI Fails**:

   * **QA/Test Agent** parses logs, summarizes failures.
   * **Triage Agent** maps failures → affected files, hypothesized fixes.
   * **Auto-Repair Agent** proposes small patches (constrained paths). It generates diffs and justification.
   * **Guardrails** validate size/scope. If OK, commit; otherwise escalate.
   * **Re-run CI** → repeat up to caps.
5. **If CI Passes**: mark task passed, request human review if required, then merge.

**Patch Format (example):**

```json
{
  "files": [
    {"path": "app/api/intake/route.ts", "change": "replace", "start": 120, "end": 186, "content": "..."}
  ],
  "message": "fix: handle empty attachments + add zod validation"
}
```

---

## LLM Prompts (sketch)

* **Intake Agent (system):** “You are a product analyst. Normalize messy requests into a concise Brief with scope bullets, constraints, success criteria. Propose 3 clarifying questions. Output JSON schema: ProjectBrief.”
* **Classification Agent:** “Label the project type among {design, development, research, content, data-ml, other}. Provide confidence and rationale.”
* **Planning Agent:** “Expand the brief into milestones → tasks → acceptance tests with explicit, verifiable checks. Include dependencies and risk notes.”
* **Estimator Agent:** “Estimate P50/P90 hours per task, confidence, and roles needed. Flag high-variance tasks.”
* **Triage Agent:** “Given CI logs and stack traces, identify root causes and minimal safe patches.”
* **Auto-Repair Agent:** “Propose minimal diffs limited to whitelisted paths, respect caps, and reference the failing test IDs.”

---

## API Contracts (Zod sketch)

```ts
// /api/intake POST
{
  title: string,
  description: string,
  categoryHint?: string,
  dueDate?: string,
  attachments?: { url: string; name: string }[]
}

// /api/devops/run POST
{ taskId: string }

// /api/devops/triage POST
{ runId: string, ciLog: string, failingTests?: string[] }

// /api/devops/repair POST
{ runId: string, triage: TriageSummary }
```

---

## Environment & Config

* **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `OPENAI_API_KEY` (or provider key), `GIT_TOKEN`, `VERCEL_DEPLOY_HOOK_URL`, `CI_API_TOKEN`.
* **RLS:** Enable Row Level Security in Supabase; use service role for server handlers only.
* **Webhooks:**

  * `/api/webhooks/ci` — updates `runs.state` + `runs.logs`.
  * `/api/webhooks/vercel` — sets `runs.preview_url`.
* **Cron (Vercel):** periodic `/api/orchestrator/heartbeat` to retry stuck runs.

---

## Team Views & Tracker

* **Dashboard:** By type (design/dev/etc.), status, due date. Quick filters show the nature of each project.
* **Project Page:** Brief, Plan with acceptance criteria, risks, timeline.
* **Tracker/Board:** Columnar Kanban + burndown. Drag to change status.
* **Runs Tab:** CI status, preview link, attempts, repair history.

---

## Local Development

* `pnpm dev` runs Next.js.
* `supabase start` for local db (if using Supabase CLI) or use hosted.
* Create a `.env.local` with the variables above.
* Seed script can insert a sample project + tasks.

---

## Minimal Implementation Steps

1. Scaffold Next.js (App Router) + Tailwind.
2. Add Supabase client + schema migration.
3. Build `/new` Intake UI → POST `/api/intake` → create project + brief.
4. Implement Orchestrator stepper + agents (server actions/route handlers).
5. Implement Project/Task pages + Tracker.
6. Wire DevOps Runner to your git/CI provider + Vercel preview.
7. Add QA/Test, Triage, and Auto-Repair loop with guardrails.
8. Add notifications and digests (optional).

---

## Risk & Mitigation

* **Runaway loops** → hard caps + escalation.
* **Bad patches** → minimal diffs, tests-first, PR reviews for large changes.
* **Prompt drift** → version prompts; checksum.
* **Secrets exposure** → never commit secrets; rely on environment.
* **Vendor lock-in** → LLM wrapper abstraction; swappable.

---

## Definition of Done (for this project)

* Users can submit a project and immediately see: type badge, generated plan, and a populated tracker.
* Team dashboard lists projects with type (design/dev/etc.) clearly visible.
* Dev tasks can spawn a run → CI executes → if failing, agents triage and propose minimal patches until CI is green (within guardrails).
* Deployed on Vercel; Supabase persistence working; basic e2e passes.
