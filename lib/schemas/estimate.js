import { z } from 'zod'

export const TaskEstimateSchema = z.object({
  taskId: z.string(),
  role: z.string(),
  pessimisticHours: z.number().nonnegative(),
  likelyHours: z.number().nonnegative(),
  optimisticHours: z.number().nonnegative(),
  confidence: z.number().min(0).max(1)
})

export const PlanEstimateSchema = z.object({
  totalLikelyHours: z.number().nonnegative().optional(),
  totalCost: z.number().nonnegative().optional(),
  assumptions: z.array(z.string()).default([]),
  tasks: z.array(TaskEstimateSchema)
})
