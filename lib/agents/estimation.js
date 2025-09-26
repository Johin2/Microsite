import { callLLM, llmEnabled } from '../llm'
import { ESTIMATION_SYSTEM_PROMPT } from '../prompts/estimate'
import { PlanEstimateSchema } from '../schemas'

function buildFallbackEstimates(workPlan) {
  const tasks = workPlan.milestones.flatMap((milestone) =>
    milestone.tasks.map((task) => ({
      taskId: task.id,
      role: 'full-stack',
      optimisticHours: 4,
      likelyHours: 8,
      pessimisticHours: 12,
      confidence: 0.5
    }))
  )

  return {
    totalLikelyHours: tasks.reduce((sum, task) => sum + task.likelyHours, 0),
    totalCost: undefined,
    assumptions: ['LLM unavailable — heuristic estimates only'],
    tasks
  }
}

export async function estimatePlan(workPlan) {
  if (!llmEnabled) {
    return buildFallbackEstimates(workPlan)
  }

  try {
    const response = await callLLM({
      systemPrompt: ESTIMATION_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(workPlan, null, 2),
      schema: PlanEstimateSchema
    })

    return response
  } catch (error) {
    console.warn('LLM estimation failed, using heuristic estimates', error)
    return buildFallbackEstimates(workPlan)
  }
}
