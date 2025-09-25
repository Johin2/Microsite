import { z } from 'zod'

export const AcceptanceTestSchema = z.object({
  id: z.string(),
  description: z.string(),
  validation: z.string().optional()
})

export const PlanTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  acceptance: z.array(AcceptanceTestSchema).default([]),
  dependencies: z.array(z.string()).default([]),
  risk: z.string().optional(),
  timeline: z.object({
    start: z.string().optional(),
    end: z.string().optional()
  }).optional()
})

export const MilestoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string().optional(),
  tasks: z.array(PlanTaskSchema)
})

export const WorkPlanSchema = z.object({
  projectId: z.string().uuid().optional(),
  milestones: z.array(MilestoneSchema),
  risks: z.array(z.string()).default([]),
  acceptance: z.array(AcceptanceTestSchema).default([]),
  successMetrics: z.array(z.string()).default([])
})
