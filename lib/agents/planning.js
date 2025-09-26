import { callLLM, llmEnabled } from '../llm'
import { PLANNING_SYSTEM_PROMPT } from '../prompts/planning'
import { WorkPlanSchema } from '../schemas'

function buildFallbackPlan(brief) {
  return {
    projectId: brief.projectId,
    milestones: [
      {
        id: 'm1',
        name: 'Plan & Discover',
        summary: 'Lean milestone generated without LLM',
        tasks: [
          {
            id: 't1',
            title: 'Draft detailed requirements',
            description: 'Collaborate with stakeholders to refine goals and constraints.',
            acceptance: [
              {
                id: 'a1',
                description: 'Requirements document shared and approved.'
              }
            ],
            dependencies: []
          },
          {
            id: 't2',
            title: 'Outline implementation plan',
            description: 'Break down solution approach and tooling.',
            acceptance: [
              {
                id: 'a2',
                description: 'Plan reviewed with delivery team.'
              }
            ],
            dependencies: ['t1']
          }
        ]
      }
    ],
    risks: ['LLM unavailable — using heuristic work plan'],
    acceptance: [
      { id: 'pa1', description: 'Stakeholder sign-off on requirements', validation: 'Link to doc' }
    ],
    successMetrics: ['Plan approved', 'Tasks created in tracker']
  }
}

export async function generateWorkPlan(brief) {
  if (!llmEnabled) {
    return buildFallbackPlan(brief)
  }

  try {
    const response = await callLLM({
      systemPrompt: PLANNING_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(brief, null, 2),
      schema: WorkPlanSchema
    })

    return response
  } catch (error) {
    console.warn('LLM planning failed, using heuristic plan', error)
    return buildFallbackPlan(brief)
  }
}
