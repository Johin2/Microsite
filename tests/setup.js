import { vi } from 'vitest'

vi.mock('@lib/supabase', () => {
  const createServiceSupabaseClient = vi.fn()
  return {
    __esModule: true,
    createServiceSupabaseClient,
    createBrowserSupabaseClient: vi.fn(),
    createServerSupabaseClient: vi.fn()
  }
})

vi.mock('@lib/agents', () => ({
  __esModule: true,
  generateProjectBrief: vi.fn(),
  classifyProject: vi.fn(),
  generateWorkPlan: vi.fn(),
  estimatePlan: vi.fn(),
  triageFailure: vi.fn(),
  proposeRepair: vi.fn()
}))

vi.mock('@lib/orchestrator', () => ({
  __esModule: true,
  orchestratorStep: vi.fn()
}))

vi.mock('@lib/devops/runner', () => ({
  __esModule: true,
  startRun: vi.fn(),
  runsExhausted: vi.fn()
}))
