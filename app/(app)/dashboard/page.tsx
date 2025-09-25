import Link from 'next/link'
import { format } from 'date-fns'
import { createServiceSupabaseClient } from '@lib/supabase'
import { ProjectTypeBadge } from '@components/ProjectTypeBadge'
import { StatusPill } from '@components/StatusPill'

const PROJECT_TYPES = ['design', 'development', 'research', 'content', 'data-ml', 'other']
const STATUSES = ['intake', 'planning', 'estimated', 'executing', 'review', 'done', 'blocked']

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const typeFilter = toParam(searchParams.type)
  const statusFilter = toParam(searchParams.status)
  const ownerFilter = toParam(searchParams.owner)

  const supabase = createServiceSupabaseClient()
  let query = supabase
    .from('projects')
    .select('id, title, type, status, priority, due_date, updated_at, owner_email')
    .order('updated_at', { ascending: false })

  if (typeFilter) query = query.eq('type', typeFilter)
  if (statusFilter) query = query.eq('status', statusFilter)
  if (ownerFilter) query = query.eq('owner_email', ownerFilter)

  const { data: projects } = await query

  const { data: runs } = await supabase
    .from('runs')
    .select('state')

  const { data: owners } = await supabase
    .from('projects')
    .select('owner_email')
    .not('owner_email', 'is', null)
    .order('owner_email', { ascending: true })

  const totalRuns = runs?.length ?? 0
  const failingRuns = runs?.filter((run) => run.state === 'failed').length ?? 0
  const trackerStats = summarizeStatuses(projects ?? [])

  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Active Projects" value={projects?.length ?? 0} description="Visible on the control tower" />
        <MetricCard title="Failed Runs" value={failingRuns} description={`${totalRuns} total runs tracked`} />
        <MetricCard title="Avg Priority" value={averagePriority(projects)} description="Lower is higher priority" />
      </section>

      <FilterBar owners={owners?.map((item) => item.owner_email).filter(Boolean) ?? []} />

      <section className="grid gap-4 md:grid-cols-4">
        {trackerStats.map((item) => (
          <div key={item.status} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-wide text-slate-500">{item.status}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.count}</p>
            <p className="mt-1 text-xs text-slate-500">{item.percent}% of portfolio</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Project Portfolio</h2>
            <p className="text-xs text-slate-400">Sorted by recent activity</p>
          </div>
          <Link href="/(app)/new" className="text-sm text-primary">
            + New Project
          </Link>
        </header>
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-950/40 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-6 py-4 text-left">Project</th>
              <th className="px-6 py-4 text-left">Type</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Owner</th>
              <th className="px-6 py-4 text-left">Priority</th>
              <th className="px-6 py-4 text-left">Due</th>
              <th className="px-6 py-4 text-left">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-sm text-slate-300">
            {(projects ?? []).map((project) => (
              <tr key={project.id} className="hover:bg-slate-900/60">
                <td className="px-6 py-4">
                  <Link className="font-medium text-white hover:text-primary" href={`/(app)/projects/${project.id}`}>
                    {project.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <ProjectTypeBadge type={project.type} />
                </td>
                <td className="px-6 py-4">
                  <StatusPill status={project.status} />
                </td>
                <td className="px-6 py-4 text-slate-400">{project.owner_email ?? '—'}</td>
                <td className="px-6 py-4 text-slate-400">{project.priority}</td>
                <td className="px-6 py-4 text-slate-400">
                  {project.due_date ? format(new Date(project.due_date), 'MMM d') : '—'}
                </td>
                <td className="px-6 py-4 text-slate-400">
                  {project.updated_at ? format(new Date(project.updated_at), 'MMM d, yyyy') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

type MetricCardProps = {
  title: string
  value: number | string
  description: string
}

function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  )
}

function averagePriority(projects?: { priority: number | null }[]) {
  if (!projects?.length) return '—'
  const sum = projects.reduce((total, project) => total + (project.priority ?? 0), 0)
  return Math.round((sum / projects.length) * 10) / 10
}

function FilterBar({ owners }: { owners: string[] }) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-4 text-sm text-slate-300"
    >
      <FilterSelect label="Type" name="type" options={PROJECT_TYPES} />
      <FilterSelect label="Status" name="status" options={STATUSES} />
      <FilterSelect label="Owner" name="owner" options={owners} />
      <button type="submit" className="ml-auto border border-primary bg-transparent px-4 py-2 text-primary">
        Apply Filters
      </button>
    </form>
  )
}

function FilterSelect({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
      {label}
      <select name={name} className="min-w-[8rem] border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200">
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function toParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value ?? null
}

function summarizeStatuses(projects: { status: string }[]) {
  const totals = projects.length || 1
  const counts = STATUSES.reduce<Record<string, number>>((acc, status) => {
    acc[status] = 0
    return acc
  }, {})

  for (const project of projects) {
    if (!counts[project.status]) {
      counts[project.status] = 0
    }
    counts[project.status] += 1
  }

  return STATUSES.map((status) => ({
    status,
    count: counts[status] ?? 0,
    percent: Math.round(((counts[status] ?? 0) / totals) * 100)
  }))
}
