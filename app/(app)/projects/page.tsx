import Link from 'next/link'
import { createServiceSupabaseClient } from '@lib/supabase'
import { ProjectTypeBadge } from '@components/ProjectTypeBadge'
import { StatusPill } from '@components/StatusPill'

export default async function ProjectsPage() {
  const supabase = createServiceSupabaseClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, type, status, priority, due_date')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="text-sm text-slate-400">Browse every intake and track its current stage.</p>
        </div>
        <Link href="/(app)/new" className="text-sm text-primary">
          + New Project
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {(projects ?? []).map((project) => (
          <article key={project.id} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">{project.title}</h2>
              <ProjectTypeBadge type={project.type} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <StatusPill status={project.status} />
              <span>Priority {project.priority ?? '—'}</span>
              {project.due_date ? <span>Due {new Date(project.due_date).toLocaleDateString()}</span> : null}
            </div>
            <Link href={`/(app)/projects/${project.id}`} className="text-sm text-primary">
              View details →
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
