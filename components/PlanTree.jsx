export function PlanTree({ milestones }) {
  if (!milestones.length) {
    return <p className="text-sm text-slate-400">Plan not generated yet.</p>
  }

  return (
    <div className="space-y-6">
      {milestones.map((milestone) => (
        <section key={milestone.id} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <header>
            <h3 className="text-lg font-semibold text-white">{milestone.name}</h3>
            {milestone.summary ? <p className="text-sm text-slate-400">{milestone.summary}</p> : null}
          </header>
          <ol className="space-y-3">
            {milestone.tasks.map((task) => (
              <li key={task.id} className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{task.title}</p>
                  {task.dependencies?.length ? (
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">
                      Depends on: {task.dependencies.join(', ')}
                    </span>
                  ) : null}
                </div>
                {task.description ? (
                  <p className="text-sm text-slate-400">{task.description}</p>
                ) : null}
                {task.acceptance?.length ? (
                  <ul className="space-y-1 text-xs text-slate-500">
                    {task.acceptance.map((acceptance) => (
                      <li key={acceptance.id}>• {acceptance.description}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-600">No acceptance tests yet.</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
