import { z } from 'zod'
import { AcceptanceTestSchema } from './plan'

export const TaskStatusSchema = z.enum(['backlog', 'in_progress', 'review', 'done', 'blocked'])

export const TrackerTaskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatusSchema,
  assignee: z.string().email().optional(),
  labels: z.array(z.string()).default([]),
  estimateHours: z.number().optional(),
  dependsOn: z.array(z.string().uuid()).default([]),
  acceptance: z.array(AcceptanceTestSchema).default([]),
  updatedAt: z.string().optional()
})
