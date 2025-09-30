'use client'

import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StatusPill } from './StatusPill'

const columns = [
  { status: 'backlog', title: 'Backlog' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'review', title: 'Review' },
  { status: 'done', title: 'Done' },
  { status: 'blocked', title: 'Blocked' }
]

const STATUS_OPTIONS = ['backlog', 'in_progress', 'review', 'done', 'blocked']

export function TaskBoard({ tasks }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const grouped = useMemo(() => {
    const map = {}
    for (const column of columns) {
      map[column.status] = []
    }
    for (const task of tasks) {
      if (!map[task.status]) {
        map[task.status] = []
      }
      map[task.status].push(task)
    }
    return map
  }, [tasks])

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {columns.map((column) => (
        <section key={column.status} className="flex min-h-[18rem] flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
          <header className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              {column.title}
            </h3>
            <span className="text-xs text-neutral-500">{grouped[column.status]?.length ?? 0}</span>
          </header>
          <div className="flex-1 space-y-3">
            {(grouped[column.status] ?? []).map((task) => (
              <article key={task.id} className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{task.title}</p>
                  <StatusPill status={task.status} />
                </div>
                {task.description ? (
                  <p className="text-xs text-neutral-400">{task.description}</p>
                ) : null}
                <StatusPicker
                  value={task.status}
                  onChange={(status) =>
                    startTransition(async () => {
                      await fetch('/api/tracker', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ taskId: task.id, status })
                      })
                      router.refresh()
                    })
                  }
                  disabled={isPending}
                />
                {task.acceptance?.length ? (
                  <ul className="space-y-1 text-xs text-neutral-500">
                    {task.acceptance.slice(0, 2).map((test) => (
                      <li key={test.id ?? test.description}>✓ {test.description}</li>
                    ))}
                    {task.acceptance.length > 2 ? (
                      <li className="text-[10px] uppercase text-neutral-600">
                        +{task.acceptance.length - 2} more tests
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function StatusPicker({ value, onChange, disabled }) {
  return (
    <label className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-neutral-500">
      Status
      <select
        className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
