create table if not exists intake_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  name text not null,
  email text not null,
  status text not null default 'pending',
  details text default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists intake_submissions_status_idx on intake_submissions(status);
create index if not exists intake_submissions_created_at_idx on intake_submissions(created_at desc);

create or replace function update_intake_submissions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_intake_submissions_updated_at on intake_submissions;
create trigger set_intake_submissions_updated_at
before update on intake_submissions
for each row
execute function update_intake_submissions_updated_at();

alter table intake_submissions enable row level security;

create policy "Intake submissions are readable" on intake_submissions
  for select
  using (true);

create policy "Service role can write intake submissions" on intake_submissions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
