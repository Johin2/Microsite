import clsx from 'clsx'

const statusStyles = {
  intake: 'bg-white/14 text-white/90',
  planning: 'bg-white/12 text-white/90',
  estimated: 'bg-white/10 text-white/90',
  executing: 'bg-white/10 text-white/90',
  review: 'bg-white/12 text-white/90',
  done: 'bg-white text-[#111216]',
  blocked: 'bg-[#2a1a1a] text-white/90',
  pending: 'bg-white/10 text-white/90',
  accepted: 'bg-white/12 text-white/90',
  rejected: 'bg-[#2a1a1a] text-white/90'
}

export function StatusPill({ status }) {
  const cls = statusStyles[status] ?? 'bg-white/12 text-white/90'
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ring-1 ring-white/10 backdrop-blur-sm transition',
        cls
      )}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
