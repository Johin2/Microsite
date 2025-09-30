import { StatusPill } from './StatusPill'
import { formatDistanceToNow } from 'date-fns'

export function RunTimeline({ runs }) {
  if (!runs.length) {
    return <p className="text-sm text-neutral-400">No runs yet.</p>
  }

  return (
    <ol className="space-y-4 border-l border-neutral-800 pl-6">
      {runs.map((run) => (
        <li key={run.id} className="relative">
          <span className="absolute -left-[11px] top-2 h-3 w-3 rounded-full bg-primary"></span>
          <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h4 className="text-sm font-semibold text-white">Attempt {run.attempt + 1}</h4>
              <StatusPill status={run.state} />
              <span className="text-xs text-neutral-500">
                {run.createdAt ? formatDistanceToNow(new Date(run.createdAt), { addSuffix: true }) : '—'}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
              {run.ciUrl ? (
                <a href={run.ciUrl} className="hover:text-white" target="_blank" rel="noreferrer">
                  CI Logs
                </a>
              ) : null}
              {run.previewUrl ? (
                <a href={run.previewUrl} className="hover:text-white" target="_blank" rel="noreferrer">
                  Preview
                </a>
              ) : null}
              {run.prUrl ? (
                <a href={run.prUrl} className="hover:text-white" target="_blank" rel="noreferrer">
                  Pull Request
                </a>
              ) : null}
            </div>
            {run.logs ? (
              <details className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-400">
                <summary className="cursor-pointer font-semibold text-neutral-300">Logs</summary>
                <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-neutral-400">
                  {run.logs}
                </pre>
              </details>
            ) : null}
            {run.result ? (
              <pre className="overflow-auto rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-400">
                {JSON.stringify(run.result, null, 2)}
              </pre>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
