import clsx from 'clsx'

const statusStyles = {
  intake: 'bg-slate-700 text-slate-100',
  planning: 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40',
  estimated: 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/40',
  executing: 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40',
  review: 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40',
  done: 'bg-emerald-500 text-emerald-900',
  blocked: 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40'
}

export function StatusPill({ status }) {
  const cls = statusStyles[status] ?? 'bg-slate-700 text-slate-100'
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize', cls)}>
      {status.replace('_', ' ')}
    </span>
  )
}
