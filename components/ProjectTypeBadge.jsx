import clsx from 'clsx'

const typeConfig = {
  design: 'from-white/18 via-white/8 to-transparent text-[#f5f5f5]',
  development: 'from-white/16 via-white/6 to-transparent text-[#f5f5f5]',
  research: 'from-white/14 via-white/6 to-transparent text-[#f5f5f5]',
  content: 'from-white/18 via-white/8 to-transparent text-[#f5f5f5]',
  'data-ml': 'from-white/14 via-white/6 to-transparent text-[#f5f5f5]',
  other: 'from-white/12 via-white/5 to-transparent text-[#f5f5f5]'
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
        'inline-flex items-center gap-1 rounded-full bg-gradient-to-br px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/90 transition duration-200 backdrop-blur-md ring-1 ring-white/10',
        styles
      )}
    >
      {type}
    </span>
  )
}
