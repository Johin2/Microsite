import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { createServiceSupabaseClient } from '@lib/supabase'
import { generateProjectBrief } from '@lib/agents'
import { orchestratorStep } from '@lib/orchestrator'

const IntakeSchema = z.object({
  title: z.string(),
  description: z.string(),
  categoryHint: z.string().optional(),
  dueDate: z.string().optional(),
  ownerEmail: z.string().email().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        name: z.string()
      })
    )
    .optional()
})

export async function POST(request: Request) {
  const body = IntakeSchema.parse(await request.json())
  const supabase = createServiceSupabaseClient()

  const projectId = randomUUID()

  const brief = await generateProjectBrief({
    title: body.title,
    description: body.description,
    categoryHint: body.categoryHint,
    dueDate: body.dueDate,
    attachments: body.attachments
  })

  const { error: projectError } = await supabase.from('projects').insert({
    id: projectId,
    title: brief.title ?? body.title,
    owner_email: body.ownerEmail ?? null,
    status: 'intake',
    type: brief.categoryGuess ?? null,
    due_date: body.dueDate ?? null,
    priority: 3
  })

  if (projectError) {
    console.error(projectError)
    return NextResponse.json({ error: projectError.message }, { status: 400 })
  }

  const { error: briefError } = await supabase.from('briefs').insert({
    id: randomUUID(),
    project_id: projectId,
    summary: brief.summary,
    scope: brief.scope,
    constraints: brief.constraints,
    success_criteria: brief.successCriteria,
    attachments: brief.attachments ?? []
  })

  if (briefError) {
    console.error(briefError)
    return NextResponse.json({ error: briefError.message }, { status: 400 })
  }

  await supabase.from('events').insert({
    id: randomUUID(),
    project_id: projectId,
    kind: 'intake',
    payload: { brief, clarifyingQuestions: brief.clarifyingQuestions },
    created_at: new Date().toISOString()
  })

  const next = await orchestratorStep(projectId)

  return NextResponse.json({ projectId, brief, next })
}
