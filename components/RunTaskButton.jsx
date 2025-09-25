'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function RunTaskButton({ taskId }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      type="button"
      disabled={isPending}
      className="rounded-lg border border-primary bg-transparent px-4 py-2 text-sm font-medium text-primary"
      onClick={() =>
        startTransition(async () => {
          await fetch('/api/devops/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId })
          })
          router.refresh()
        })
      }
    >
      {isPending ? 'Queuing…' : 'Queue Run'}
    </button>
  )
}
