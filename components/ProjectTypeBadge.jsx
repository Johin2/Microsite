import clsx from 'clsx'

const typeConfig = {
  design: 'bg-pink-500/10 text-pink-200 ring-1 ring-inset ring-pink-500/40',
  development: 'bg-blue-500/10 text-blue-200 ring-1 ring-inset ring-blue-500/40',
  research: 'bg-purple-500/10 text-purple-200 ring-1 ring-inset ring-purple-500/40',
  content: 'bg-emerald-500/10 text-emerald-200 ring-1 ring-inset ring-emerald-500/40',
  'data-ml': 'bg-yellow-500/10 text-yellow-100 ring-1 ring-inset ring-yellow-500/40',
  other: 'bg-slate-500/10 text-slate-200 ring-1 ring-inset ring-slate-500/40'
}

export function ProjectTypeBadge({ type }) {
  if (!type) {
    return null
  }

  const key = type.toLowerCase()
  const styles = typeConfig[key] ?? typeConfig.other

  return (
    <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase', styles)}>
      {type}
    </span>
  )
}
