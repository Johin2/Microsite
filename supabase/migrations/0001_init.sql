create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_email text,
  type text,
  status text default 'intake',
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text,
  description text,
  status text default 'backlog',
  assignee text,
  labels text[],
  estimate_hours numeric,
  depends_on uuid[],
  acceptance jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  state text default 'queued',
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
  kind text,
  payload jsonb,
  created_at timestamptz default now()
);

alter table projects enable row level security;
alter table briefs enable row level security;
alter table plans enable row level security;
alter table tasks enable row level security;
alter table runs enable row level security;
alter table events enable row level security;

create policy "Projects are readable" on projects
  for select using (true);

create policy "Plans are readable" on plans
  for select using (true);

create policy "Tasks are readable" on tasks
  for select using (true);

create policy "Runs are readable" on runs
  for select using (true);

create policy "Events are readable" on events
  for select using (true);
