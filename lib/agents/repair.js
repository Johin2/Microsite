import { z } from 'zod'
import { callLLM, llmEnabled } from '../llm'
import { REPAIR_SYSTEM_PROMPT } from '../prompts/repair'
import { validatePatchSummary } from '../guardrails'

const PatchFileSchema = z.object({
  path: z.string(),
  action: z.enum(['create', 'update', 'delete']),
  patch: z.string()
})

const RepairSchema = z.object({
  summary: z.string(),
  files: z.array(PatchFileSchema),
  tests: z.array(z.string()).default([]),
  stop: z.boolean().default(false)
})

export async function proposeRepair(context) {
  if (!llmEnabled) {
    return {
      summary: 'LLM disabled — no auto-repair generated.',
      files: [],
      tests: [],
      stop: true
    }
  }

  const response = await callLLM({
    systemPrompt: REPAIR_SYSTEM_PROMPT,
    userPrompt: JSON.stringify(context, null, 2),
    schema: RepairSchema,
    temperature: 0.1
  })

  const validation = validatePatchSummary(response.files.map(({ path, patch }) => ({ path, patch })))
  if (!validation.ok) {
    throw new Error(`Guardrail violation: ${validation.reason}`)
  }

  return response
}
