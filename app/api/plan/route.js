import { NextResponse } from 'next/server'
import { z } from 'zod'
import { orchestratorStep } from '@lib/orchestrator'

const Schema = z.object({
  projectId: z.string().uuid()
})

export async function POST(request) {
  const { projectId } = Schema.parse(await request.json())
  const result = await orchestratorStep(projectId)
  return NextResponse.json(result)
}
