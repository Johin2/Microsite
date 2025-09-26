import { z } from 'zod'
import { callLLM, llmEnabled } from '../llm'
import { CLASSIFICATION_SYSTEM_PROMPT } from '../prompts/classification'

const ClassificationSchema = z.object({
  primary: z.string(),
  secondary: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  rationale: z.string()
})

function buildFallbackClassification(brief) {
  const normalized = brief.categoryGuess?.toLowerCase() ?? ''
  const primary = ['design', 'development', 'research', 'content', 'data-ml'].includes(normalized)
    ? normalized
    : 'development'

  return {
    primary,
    secondary: primary === 'development' ? ['content'] : [],
    confidence: 0.4,
    rationale: 'Heuristic classification based on category hint.'
  }
}

export async function classifyProject(brief) {
  if (!llmEnabled) {
    return buildFallbackClassification(brief)
  }

  try {
    const response = await callLLM({
      systemPrompt: CLASSIFICATION_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(brief, null, 2),
      schema: ClassificationSchema
    })

    return response
  } catch (error) {
    console.warn('LLM classification failed, using fallback labels', error)
    return buildFallbackClassification(brief)
  }
}
