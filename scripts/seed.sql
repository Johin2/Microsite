insert into projects (id, title, owner_email, type, status, priority, due_date)
values
  ('11111111-1111-1111-1111-111111111111', 'Sample AI Landing Page', 'pm@example.com', 'development', 'executing', 2, now() + interval '7 days')
  on conflict (id) do nothing;

insert into briefs (project_id, summary, scope, constraints, success_criteria)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Create a responsive marketing site highlighting AI capabilities.',
    '["Hero section", "Feature highlights", "Testimonials"]',
    '["Must use Tailwind", "Deploy on Vercel"]',
    '["Lighthouse 95+", "Deploy preview"]'
  )
  on conflict (project_id) do nothing;

insert into plans (project_id, milestones, tasks, risks, acceptance, estimates)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '[{"id":"m1","name":"Design and Copy","tasks":[]}],
    '[{"id":"t1","title":"Implement landing page","acceptance":[{"id":"a1","description":"Lighthouse >= 95"}]}]',
    '["Third-party API rate limits"],
    '[{"id":"a0","description":"Responsive layout across breakpoints"}]',
    '{"tasks":[{"taskId":"t1","role":"frontend","optimisticHours":6,"likelyHours":10,"pessimisticHours":16,"confidence":0.7}]}'
  )
  on conflict (project_id) do nothing;

insert into tasks (id, project_id, title, description, status, acceptance, estimate_hours)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Implement landing page', 'Build Next.js page with Tailwind sections', 'in_progress', '[{"id":"a1","description":"Page renders without errors"}]', 10)
  on conflict (id) do nothing;

insert into runs (id, task_id, state, attempt)
values ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'failed', 0)
  on conflict (id) do nothing;
