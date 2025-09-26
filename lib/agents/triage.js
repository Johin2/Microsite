import { z } from 'zod'
import { callLLM, llmEnabled } from '../llm'
import { TRIAGE_SYSTEM_PROMPT } from '../prompts/triage'

const TriageSchema = z.object({
  rootCause: z.string(),
  impactedFiles: z.array(z.string()).default([]),
  proposedFix: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  qaFocus: z.array(z.string()).default([])
})

function buildFallbackTriage(failingTests = []) {
  return {
    rootCause: failingTests[0] ? `Failure in test ${failingTests[0]}` : 'Refer to CI logs',
    impactedFiles: [],
    proposedFix: 'Review CI logs manually. Auto triage unavailable without LLM.',
    riskLevel: 'medium',
    qaFocus: failingTests
  }
}

export async function triageFailure(ciLog, failingTests = []) {
  if (!llmEnabled) {
    return buildFallbackTriage(failingTests)
  }

  try {
    const response = await callLLM({
      systemPrompt: TRIAGE_SYSTEM_PROMPT,
      userPrompt: JSON.stringify({ ciLog, failingTests }, null, 2),
      schema: TriageSchema
    })

    return response
  } catch (error) {
    console.warn('LLM triage failed, using heuristic summary', error)
    return buildFallbackTriage(failingTests)
  }
}
