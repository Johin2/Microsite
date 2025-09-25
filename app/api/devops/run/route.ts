import { NextResponse } from 'next/server'
import { z } from 'zod'
import { startRun } from '@lib/devops/runner'

const Schema = z.object({
  taskId: z.string().uuid(),
  metadata: z.record(z.unknown()).optional()
})

export async function POST(request: Request) {
  const { taskId, metadata } = Schema.parse(await request.json())
  const run = await startRun({ taskId, metadata: metadata ?? {} })
  return NextResponse.json({ run })
}
