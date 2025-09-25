import { callLLM, llmEnabled } from '../llm'
import { ESTIMATION_SYSTEM_PROMPT } from '../prompts/estimate'
import { PlanEstimateSchema } from '../schemas'

export async function estimatePlan(workPlan) {
  if (!llmEnabled) {
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
      assumptions: ['LLM disabled — heuristic estimates only'],
      tasks
    }
  }

  const response = await callLLM({
    systemPrompt: ESTIMATION_SYSTEM_PROMPT,
    userPrompt: JSON.stringify(workPlan, null, 2),
    schema: PlanEstimateSchema
  })

  return response
}
