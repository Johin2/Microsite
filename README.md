# Project Ops Microsite

Next.js (App Router) control tower that intakes project requests, auto-classifies them, plans execution, tracks delivery, and closes the loop with QA-aware auto-repair.

## Stack

- **Next.js 14 (App Router)** with React Server Components + Tailwind CSS
- **Supabase** for persistence (projects, briefs, plans, tasks, runs, events)
- **OpenAI (LLM)** via `lib/llm.ts` with fallback stubs when no key is configured
- **Agent modules**: intake, classification, planning, estimation, triage, auto-repair
- **DevOps runner**: Supabase-backed run history with guardrails + CI/Vercel webhooks

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy environment variables
   ```bash
   cp .env.example .env.local
   ```
3. Populate `.env.local`
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   OPENAI_API_KEY=...
   OPENAI_MODEL=gpt-4o-mini
   GIT_TOKEN=ghp_...
   VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/prj...
   CI_API_TOKEN=...
   ```
4. Apply Supabase schema
   ```bash
   supabase db reset --schema supabase/migrations
   ```
5. Start everything
   ```bash
   pnpm dev
   ```

### Optional Seed

Insert a sample project + task after Supabase is running:
```bash
supabase db query < scripts/seed.sql
```

## Key Directories

- `app/` — App Router UI + API handlers
  - `/(marketing)` Landing page
  - `/(app)` Authenticated microsite (dashboard, projects, tasks, intake)
  - `api/` Agent endpoints, orchestrator heartbeat, CI/Vercel webhooks
- `components/` — Tailwind UI widgets (TaskBoard, RunTimeline, PlanTree, IntakeForm)
- `lib/`
  - `agents/` LLM-facing agent wrappers
  - `prompts/` System prompts per agent role
  - `orchestrator.ts` Deterministic state machine
  - `devops/runner.ts` Run lifecycle helpers
  - `guardrails.ts` Auto-repair safety checks
  - `schemas/` Zod + TypeScript models for DB & agent contracts
  - `supabase.ts` Server/service client helpers
- `supabase/migrations/` — SQL migrations for all tables + RLS defaults
- `scripts/seed.sql` — Sample data for demos (blocked tasks, queued runs)

## Orchestrator Flow

1. **Intake** (`/api/intake`): generates brief, stores to Supabase, fires first orchestrator step.
2. **Classification**: auto-tags project type, transitions to `planning`.
3. **Planning**: LLM drafts milestones/tasks + acceptance, persists to `plans`.
4. **Estimation**: adds P90/P50 estimates, seeds Supabase `tasks`, moves to `executing`.
5. **Execution**: `RunTaskButton` + `NextStepButton` queue runs, `TaskBoard` tracks states.
6. **CI hooks** (`/api/webhooks/ci` + `/api/webhooks/vercel`): sync statuses and previews.
7. **Failures**: `/api/devops/triage` parses logs → `/api/devops/repair` returns guardrail-checked patches.
8. **Heartbeat** (`/api/orchestrator/heartbeat`): Vercel cron nudge for stuck states.

## Testing & Validation

- `pnpm lint` — Next.js lint rules + TypeScript strict mode.
- `pnpm dev` — hot reload UI, test Supabase integration locally.
- Add Playwright or Vitest suites under `tests/` for end-to-end coverage. The auto-repair guardrails enforce `tests/` as a safe path for generated scripts.

## Deployment

- Deploy to **Vercel**; configure cron job hitting `/api/orchestrator/heartbeat`.
- Add environment variables in Vercel dashboard.
- Grant Supabase service role key as Vercel encrypted env secret.
- Configure CI provider webhook (GitHub Actions, CircleCI, etc.) to POST to `/api/webhooks/ci`.
- Hook Vercel deploy notifications to `/api/webhooks/vercel` for preview URL sync.

## Guardrails

- Path whitelist: `app/`, `components/`, `lib/`, `tests/`
- Patch caps: ≤20 files, ≤400 changed lines per auto-repair proposal
- Attempt caps: 6 repair loops, 45-minute wall clock per task
- Mandatory tests: agents must report tests to run before merge

## References

- [AGENTS.md](AGENTS.md) — role definitions & prompts
- [PLAN.md](PLAN.md) — build plan alignment
- [PRD.md](PRD.md) — product requirements deep dive
