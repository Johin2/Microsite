import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST as intakePost } from '@/app/api/intake/route'
import { POST as classifyPost } from '@/app/api/classify/route'
import { POST as planPost } from '@/app/api/plan/route'
import { POST as estimatePost } from '@/app/api/estimate/route'
import { GET as trackerGet, POST as trackerPost } from '@/app/api/tracker/route'
import { POST as devopsRunPost } from '@/app/api/devops/run/route'
import { POST as devopsTriagePost } from '@/app/api/devops/triage/route'
import { POST as devopsRepairPost } from '@/app/api/devops/repair/route'
import { POST as heartbeatPost } from '@/app/api/orchestrator/heartbeat/route'
import { POST as ciWebhookPost } from '@/app/api/webhooks/ci/route'
import { POST as vercelWebhookPost } from '@/app/api/webhooks/vercel/route'
import { createServiceSupabaseClient } from '@lib/supabase'
import { generateProjectBrief, triageFailure, proposeRepair } from '@lib/agents'
import { orchestratorStep } from '@lib/orchestrator'
import { startRun } from '@lib/devops/runner'

const serviceSupabaseMock = createServiceSupabaseClient
const generateProjectBriefMock = generateProjectBrief
const triageFailureMock = triageFailure
const proposeRepairMock = proposeRepair
const orchestratorStepMock = orchestratorStep
const startRunMock = startRun

function createSupabaseMock(map) {
  return {
    from: vi.fn((table) => {
      const factory = map[table]
      if (!factory) {
        throw new Error(`Unexpected table: ${table}`)
      }
      return factory()
    })
  }
}

function jsonRequest(url, body) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('api/intake', () => {
  it('creates project, brief, and triggers orchestrator', async () => {
    const insertProjects = vi.fn().mockResolvedValue({ error: null })
    const insertBriefs = vi.fn().mockResolvedValue({ error: null })
    const insertEvents = vi.fn().mockResolvedValue({ error: null })

    serviceSupabaseMock.mockReturnValue(
      createSupabaseMock({
        projects: () => ({ insert: insertProjects }),
        briefs: () => ({ insert: insertBriefs }),
        events: () => ({ insert: insertEvents })
      })
    )

    const brief = {
      title: 'Project Title',
      summary: 'Summary',
      scope: ['one'],
      constraints: [],
      successCriteria: ['ship'],
      categoryGuess: 'development',
      clarifyingQuestions: ['?'],
      attachments: []
    }

    generateProjectBriefMock.mockResolvedValue(brief)
    orchestratorStepMock.mockResolvedValue({ status: 'planning' })

    const response = await intakePost(
      jsonRequest('http://localhost/api/intake', {
        title: 'My project',
        description: 'Do things',
        categoryHint: 'development'
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.brief).toEqual(brief)
    expect(typeof payload.projectId).toBe('string')
    expect(generateProjectBriefMock).toHaveBeenCalledWith({
      title: 'My project',
      description: 'Do things',
      categoryHint: 'development',
      dueDate: undefined,
      attachments: undefined
    })
    expect(insertProjects).toHaveBeenCalledOnce()
    expect(insertBriefs).toHaveBeenCalledOnce()
    expect(insertEvents).toHaveBeenCalledOnce()
    expect(orchestratorStepMock).toHaveBeenCalledWith(payload.projectId)
  })
})

describe('api/classify', () => {
  it('invokes orchestrator for the project', async () => {
    orchestratorStepMock.mockResolvedValue({ status: 'ok' })

    const projectId = '00000000-0000-0000-0000-000000000001'
    const response = await classifyPost(
      jsonRequest('http://localhost/api/classify', { projectId })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ status: 'ok' })
    expect(orchestratorStepMock).toHaveBeenCalledWith(projectId)
  })
})

describe('api/plan', () => {
  it('routes to orchestrator', async () => {
    orchestratorStepMock.mockResolvedValue({ status: 'estimated' })
    const projectId = '00000000-0000-0000-0000-000000000002'
    const response = await planPost(
      jsonRequest('http://localhost/api/plan', { projectId })
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'estimated' })
    expect(orchestratorStepMock).toHaveBeenCalledWith(projectId)
  })
})

describe('api/estimate', () => {
  it('routes to orchestrator', async () => {
    orchestratorStepMock.mockResolvedValue({ status: 'executing' })
    const projectId = '00000000-0000-0000-0000-000000000003'
    const response = await estimatePost(
      jsonRequest('http://localhost/api/estimate', { projectId })
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'executing' })
    expect(orchestratorStepMock).toHaveBeenCalledWith(projectId)
  })
})

describe('api/tracker', () => {
  it('returns grouped task board', async () => {
    const tasks = [
      { id: 't1', status: 'backlog' },
      { id: 't2', status: 'done' }
    ]

    const order = vi.fn(async () => ({ data: tasks, error: null }))
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })

    serviceSupabaseMock.mockReturnValue(
      createSupabaseMock({
        tasks: () => ({ select })
      })
    )

    const response = await trackerGet(
      new Request('http://localhost/api/tracker?projectId=proj1')
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.board.backlog).toHaveLength(1)
    expect(body.board.done).toHaveLength(1)
    expect(select).toHaveBeenCalledWith('*')
  })

  it('updates task status', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })

    serviceSupabaseMock.mockReturnValue(
      createSupabaseMock({
        tasks: () => ({ update })
      })
    )

    const response = await trackerPost(
      jsonRequest('http://localhost/api/tracker', {
        taskId: '00000000-0000-0000-0000-000000000010',
        status: 'review'
      })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(update).toHaveBeenCalledOnce()
    expect(eq).toHaveBeenCalledWith('id', '00000000-0000-0000-0000-000000000010')
  })
})

describe('api/devops/run', () => {
  it('starts a run and returns payload', async () => {
    startRunMock.mockResolvedValue({ id: 'run-1', attempt: 1 })

    const response = await devopsRunPost(
      jsonRequest('http://localhost/api/devops/run', {
        taskId: '00000000-0000-0000-0000-000000000100'
      })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ run: { id: 'run-1', attempt: 1 } })
    expect(startRunMock).toHaveBeenCalledWith({ taskId: '00000000-0000-0000-0000-000000000100', metadata: {} })
  })
})

describe('api/devops/triage', () => {
  it('stores triage result and updates state', async () => {
    const runRow = { id: 'run-1', task_id: 'task-1', tasks: { project_id: 'proj-1' } }

    const runsSelectSingle = vi.fn().mockResolvedValue({ data: runRow, error: null })
    const runsSelectEq = vi.fn().mockReturnValue({ single: runsSelectSingle })
    const runsSelect = vi.fn().mockReturnValue({ eq: runsSelectEq })
    const runsUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const runsUpdate = vi.fn().mockReturnValue({ eq: runsUpdateEq })
    const tasksUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const tasksUpdate = vi.fn().mockReturnValue({ eq: tasksUpdateEq })
    const eventsInsert = vi.fn().mockResolvedValue({ error: null })

    serviceSupabaseMock.mockReturnValue(
      createSupabaseMock({
        runs: () => ({ select: runsSelect, update: runsUpdate }),
        tasks: () => ({ update: tasksUpdate }),
        events: () => ({ insert: eventsInsert })
      })
    )

    triageFailureMock.mockResolvedValue({ summary: 'failed build' })

    const response = await devopsTriagePost(
      jsonRequest('http://localhost/api/devops/triage', {
        runId: '00000000-0000-0000-0000-000000000200',
        ciLog: 'lint failed'
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.triage).toEqual({ summary: 'failed build' })
    expect(runsUpdate).toHaveBeenCalledOnce()
    expect(tasksUpdate).toHaveBeenCalledOnce()
    expect(eventsInsert).toHaveBeenCalledOnce()
  })
})

describe('api/devops/repair', () => {
  it('records repair proposal', async () => {
    const runRow = { id: 'run-2', task_id: 'task-3', tasks: { project_id: 'proj-2' } }

    const runsSelectSingle = vi.fn().mockResolvedValue({ data: runRow, error: null })
    const runsSelectEq = vi.fn().mockReturnValue({ single: runsSelectSingle })
    const runsSelect = vi.fn().mockReturnValue({ eq: runsSelectEq })
    const runsUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const runsUpdate = vi.fn().mockReturnValue({ eq: runsUpdateEq })
    const eventsInsert = vi.fn().mockResolvedValue({ error: null })

    serviceSupabaseMock.mockReturnValue(
      createSupabaseMock({
        runs: () => ({ select: runsSelect, update: runsUpdate }),
        events: () => ({ insert: eventsInsert })
      })
    )

    proposeRepairMock.mockResolvedValue({ stop: false, patch: [] })

    const response = await devopsRepairPost(
      jsonRequest('http://localhost/api/devops/repair', {
        runId: '00000000-0000-0000-0000-000000000300',
        triage: { summary: 'lint error' }
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.proposal).toEqual({ stop: false, patch: [] })
    expect(runsUpdate).toHaveBeenCalledOnce()
    expect(eventsInsert).toHaveBeenCalledOnce()
  })
})

describe('api/orchestrator/heartbeat', () => {
  it('steps active projects', async () => {
    const projects = [
      { id: 'proj-1', status: 'intake' },
      { id: 'proj-2', status: 'executing' }
    ]

    const limit = vi.fn().mockResolvedValue({ data: projects, error: null })
    const inFilter = vi.fn().mockReturnValue({ limit })
    const select = vi.fn().mockReturnValue({ in: inFilter })

    serviceSupabaseMock.mockReturnValue(
      createSupabaseMock({
        projects: () => ({ select })
      })
    )

    orchestratorStepMock.mockImplementation(() => Promise.resolve({ projectId: 'handled' }))

    const response = await heartbeatPost()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.results).toHaveLength(2)
    expect(orchestratorStepMock).toHaveBeenCalledTimes(2)
  })
})

describe('api/webhooks/ci', () => {
  it('updates run state and task status', async () => {
    const runRow = { id: 'run-3', task_id: 'task-9', tasks: { project_id: 'proj-9' } }
    const runsSelectSingle = vi.fn().mockResolvedValue({ data: runRow, error: null })
    const runsSelectEq = vi.fn().mockReturnValue({ single: runsSelectSingle })
    const runsSelect = vi.fn().mockReturnValue({ eq: runsSelectEq })
    const runsUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const runsUpdate = vi.fn().mockReturnValue({ eq: runsUpdateEq })
    const tasksUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const tasksUpdate = vi.fn().mockReturnValue({ eq: tasksUpdateEq })
    const eventsInsert = vi.fn().mockResolvedValue({ error: null })

    serviceSupabaseMock.mockReturnValue(
      createSupabaseMock({
        runs: () => ({ select: runsSelect, update: runsUpdate }),
        tasks: () => ({ update: tasksUpdate }),
        events: () => ({ insert: eventsInsert })
      })
    )

    const response = await ciWebhookPost(
      jsonRequest('http://localhost/api/webhooks/ci', {
        runId: '00000000-0000-0000-0000-000000000400',
        status: 'passed',
        ciUrl: 'https://ci.example.com'
      })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(runsUpdate).toHaveBeenCalledOnce()
    expect(tasksUpdate).toHaveBeenCalledOnce()
    expect(eventsInsert).toHaveBeenCalledOnce()
  })
})

describe('api/webhooks/vercel', () => {
  it('stores preview url and emits event', async () => {
    const runRow = { id: 'run-4', task_id: 'task-11', tasks: { project_id: 'proj-11' } }
    const runsSelectSingle = vi.fn().mockResolvedValue({ data: runRow, error: null })
    const runsSelectEq = vi.fn().mockReturnValue({ single: runsSelectSingle })
    const runsSelect = vi.fn().mockReturnValue({ eq: runsSelectEq })
    const runsUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const runsUpdate = vi.fn().mockReturnValue({ eq: runsUpdateEq })
    const eventsInsert = vi.fn().mockResolvedValue({ error: null })

    serviceSupabaseMock.mockReturnValue(
      createSupabaseMock({
        runs: () => ({ select: runsSelect, update: runsUpdate }),
        events: () => ({ insert: eventsInsert })
      })
    )

    const response = await vercelWebhookPost(
      jsonRequest('http://localhost/api/webhooks/vercel', {
        runId: '00000000-0000-0000-0000-000000000500',
        previewUrl: 'https://preview.example.com',
        status: 'ready'
      })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(runsUpdate).toHaveBeenCalledOnce()
    expect(eventsInsert).toHaveBeenCalledOnce()
  })
})

describe('api/tracker validation', () => {
  it('returns 400 when projectId missing in GET', async () => {
    const response = await trackerGet(new Request('http://localhost/api/tracker'))
    expect(response.status).toBe(400)
  })
})

describe('devops guardrails', () => {
  it('repair marks needs review when stop is true', async () => {
    const runRow = { id: 'run-5', task_id: 'task-20', tasks: { project_id: 'proj-20' } }

    const runsSelectSingle = vi.fn().mockResolvedValue({ data: runRow, error: null })
    const runsSelectEq = vi.fn().mockReturnValue({ single: runsSelectSingle })
    const runsSelect = vi.fn().mockReturnValue({ eq: runsSelectEq })
    const runsUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const runsUpdate = vi.fn().mockReturnValue({ eq: runsUpdateEq })
    const eventsInsert = vi.fn().mockResolvedValue({ error: null })

    serviceSupabaseMock.mockReturnValue(
      createSupabaseMock({
        runs: () => ({ select: runsSelect, update: runsUpdate }),
        events: () => ({ insert: eventsInsert })
      })
    )

    proposeRepairMock.mockResolvedValue({ stop: true })

    const response = await devopsRepairPost(
      jsonRequest('http://localhost/api/devops/repair', {
        runId: '00000000-0000-0000-0000-000000000600',
        triage: {}
      })
    )

    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.proposal).toEqual({ stop: true })
    expect(runsUpdate).toHaveBeenCalledOnce()
    const updatePayload = runsUpdate.mock.calls[0][0]
    expect(updatePayload.state).toBe('needs_review')
  })
})

describe('executing stage helpers', () => {
  it('triage route blocks task when failure detected', async () => {
    const runRow = { id: 'run-6', task_id: 'task-21', tasks: { project_id: 'proj-21' } }

    const runsSelectSingle = vi.fn().mockResolvedValue({ data: runRow, error: null })
    const runsSelectEq = vi.fn().mockReturnValue({ single: runsSelectSingle })
    const runsSelect = vi.fn().mockReturnValue({ eq: runsSelectEq })
    const runsUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const runsUpdate = vi.fn().mockReturnValue({ eq: runsUpdateEq })
    const tasksUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const tasksUpdate = vi.fn().mockReturnValue({ eq: tasksUpdateEq })
    const eventsInsert = vi.fn().mockResolvedValue({ error: null })

    serviceSupabaseMock.mockReturnValue(
      createSupabaseMock({
        runs: () => ({ select: runsSelect, update: runsUpdate }),
        tasks: () => ({ update: tasksUpdate }),
        events: () => ({ insert: eventsInsert })
      })
    )

    triageFailureMock.mockResolvedValue({ summary: 'type error' })

    await devopsTriagePost(
      jsonRequest('http://localhost/api/devops/triage', {
        runId: '00000000-0000-0000-0000-000000000700',
        ciLog: 'type error'
      })
    )

    const updatePayload = runsUpdate.mock.calls[0][0]
    expect(updatePayload.state).toBe('failed')
    expect(tasksUpdateEq).toHaveBeenCalledWith('id', 'task-21')
  })
})

describe('runs exhaustion check', () => {
  it('heartbeat respects completed tasks', async () => {
    const projects = [{ id: 'proj-30', status: 'executing' }]
    const limit = vi.fn().mockResolvedValue({ data: projects, error: null })
    const inFilter = vi.fn().mockReturnValue({ limit })
    const select = vi.fn().mockReturnValue({ in: inFilter })

    serviceSupabaseMock.mockReturnValue(
      createSupabaseMock({
        projects: () => ({ select })
      })
    )

    orchestratorStepMock.mockImplementation(() => Promise.resolve({ projectId: 'proj-30', status: 'executing' }))

    const response = await heartbeatPost()
    expect(response.status).toBe(200)
    expect(orchestratorStepMock).toHaveBeenCalledWith('proj-30')
  })
})
