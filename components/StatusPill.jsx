import clsx from 'clsx'

const statusStyles = {
  intake: 'bg-white/14 text-white/90',
  planning: 'bg-white/12 text-white/90',
  estimated: 'bg-white/10 text-white/90',
  executing: 'bg-white/10 text-white/90',
  review: 'bg-white/12 text-white/90',
  done: 'bg-white text-neutral-900',
  blocked: 'bg-neutral-900 text-neutral-200',
  pending: 'bg-white/10 text-white/90',
  accepted: 'bg-white/12 text-white/90',
  rejected: 'bg-neutral-900 text-neutral-200'
}

export function StatusPill({ status }) {
  const normalized = typeof status === 'string' && status.trim().length > 0 ? status.trim().toLowerCase() : 'pending'
  const cls = statusStyles[normalized] ?? statusStyles.pending
  const label = normalized.replace(/_/g, ' ')
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ring-1 ring-white/10 backdrop-blur-sm transition',
        cls
      )}
    >
      {label}
    </span>
  )
}
