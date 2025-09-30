import clsx from 'clsx'

const typeConfig = {
  design: {
    bubbleLabel: 'DS',
    bubbleStyle: 'bg-white text-[#0b0d11]',
    wrapperStyle: 'border-white/30 bg-white/10 text-white'
  },
  development: {
    bubbleLabel: 'DV',
    bubbleStyle: 'bg-white/90 text-[#050708]',
    wrapperStyle: 'border-white/25 bg-white/10 text-white/90'
  },
  research: {
    bubbleLabel: 'RS',
    bubbleStyle: 'bg-white/80 text-[#111216]',
    wrapperStyle: 'border-white/20 bg-white/5 text-white/90'
  },
  content: {
    bubbleLabel: 'CT',
    bubbleStyle: 'bg-white/75 text-[#111216]',
    wrapperStyle: 'border-white/20 bg-white/5 text-white/90'
  },
  'data-ml': {
    bubbleLabel: 'ML',
    bubbleStyle: 'bg-white/70 text-[#111216]',
    wrapperStyle: 'border-white/20 bg-white/5 text-white/90'
  },
  'brand identity': {
    bubbleLabel: 'BI',
    bubbleStyle: 'bg-white text-[#111216]',
    wrapperStyle: 'border-white/25 bg-white/10 text-white'
  },
  campaign: {
    bubbleLabel: 'CP',
    bubbleStyle: 'bg-slate-100 text-[#050708]',
    wrapperStyle: 'border-white/20 bg-white/5 text-white/90'
  },
  'digital product': {
    bubbleLabel: 'DP',
    bubbleStyle: 'bg-slate-200 text-[#050708]',
    wrapperStyle: 'border-white/25 bg-white/10 text-white'
  },
  'spatial / retail': {
    bubbleLabel: 'SR',
    bubbleStyle: 'bg-slate-50 text-[#050708]',
    wrapperStyle: 'border-white/20 bg-white/5 text-white/90'
  },
  'launch strategy': {
    bubbleLabel: 'LS',
    bubbleStyle: 'bg-slate-300 text-[#050708]',
    wrapperStyle: 'border-white/25 bg-white/10 text-white'
  },
  other: {
    bubbleLabel: 'OT',
    bubbleStyle: 'border border-white/40 bg-transparent text-white/85',
    wrapperStyle: 'border-white/15 bg-white/5 text-white/80'
  },
  default: {
    bubbleLabel: 'OT',
    bubbleStyle: 'border border-white/35 bg-transparent text-white/85',
    wrapperStyle: 'border-white/15 bg-white/5 text-white/80'
  }
}

export function ProjectTypeBadge({ type }) {
  if (!type) {
    return null
  }

  const normalized = type.trim().toLowerCase()
  const config = typeConfig[normalized] ?? typeConfig.default
  const bubbleLabel = config.bubbleLabel ?? buildAbbreviation(type)

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85 transition duration-200 backdrop-blur-md',
        config.wrapperStyle
      )}
    >
      <span
        className={clsx(
          'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold tracking-[0.1em]',
          config.bubbleStyle
        )}
      >
        {bubbleLabel}
      </span>
      <span className="whitespace-nowrap text-white/90">{type}</span>
    </span>
  )
}

function buildAbbreviation(value) {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed) {
    return '—'
  }

  const words = trimmed.split(/\s+/).filter(Boolean)
  const letters = words.slice(0, 2).map((word) => word[0])

  if (letters.length === 0) {
    return trimmed.slice(0, 2).toUpperCase()
  }

  if (letters.length === 1) {
    const fallback = trimmed.replace(words[0], '').trim()
    const secondLetter = fallback ? fallback[0] : trimmed.slice(1, 2)
    return `${letters[0]}${secondLetter ?? ''}`.toUpperCase()
  }

  return letters.join('').toUpperCase()
}
