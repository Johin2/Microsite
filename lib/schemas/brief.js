import { z } from 'zod'

export const AttachmentSchema = z.object({
  url: z.string().url(),
  name: z.string()
})

export const ProjectBriefSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string(),
  summary: z.string().min(10),
  scope: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  successCriteria: z.array(z.string()).default([]),
  categoryGuess: z.string().optional(),
  clarifyingQuestions: z.array(z.string()).default([]),
  attachments: z.array(AttachmentSchema).optional()
})
