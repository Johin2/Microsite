import clsx from 'clsx'

const typeConfig = {
  design: 'border-white/40',
  development: 'border-white/40',
  research: 'border-white/40',
  content: 'border-white/40',
  'data-ml': 'border-white/40',
  other: 'border-white/40'
}

export function ProjectTypeBadge({ type }) {
  if (!type) {
    return null
  }

  const key = type.toLowerCase()
  const styles = typeConfig[key] ?? typeConfig.other

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-neutral-900 transition duration-200',
        styles
      )}
    >
      {type}
    </span>
  )
}
