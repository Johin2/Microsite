import { z } from 'zod'

export const RunStateSchema = z.enum(['queued', 'running', 'failed', 'passed', 'needs_review', 'stopped'])

export const RunRecordSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  state: RunStateSchema,
  attempt: z.number().int().nonnegative().default(0),
  branch: z.string().optional(),
  prUrl: z.string().url().nullable().optional(),
  ciUrl: z.string().url().nullable().optional(),
  previewUrl: z.string().url().nullable().optional(),
  logs: z.string().nullable().optional(),
  result: z.unknown().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
})
