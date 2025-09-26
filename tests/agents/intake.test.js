import { describe, it, expect, vi, afterAll } from 'vitest'

const baseRequest = {
  title: 'Manual Project',
  description: 'Line one\nLine two\nLine three',
  categoryHint: 'development'
}

async function loadGenerator(mockFactory) {
  vi.resetModules()
  // Reapply global test mocks after resetting modules
  await import('../setup')

  vi.doMock('@lib/llm', mockFactory)
  const module = await import('@lib/agents/intake')
  return module.generateProjectBrief
}

afterAll(async () => {
  vi.resetModules()
  await import('../setup')
})

describe('generateProjectBrief fallback', () => {
  it('returns heuristic brief when llm is disabled', async () => {
    const generateProjectBrief = await loadGenerator(() => ({
      llmEnabled: false,
      callLLM: vi.fn()
    }))

    const brief = await generateProjectBrief(baseRequest)

    expect(brief.title).toBe('Manual Project')
    expect(brief.scope).toEqual(['Line one', 'Line two', 'Line three'])
    expect(brief.categoryGuess).toBe('development')
  })

  it('falls back gracefully when llm call fails', async () => {
    const callLLM = vi.fn().mockRejectedValue(new Error('slow_down'))
    const generateProjectBrief = await loadGenerator(() => ({
      llmEnabled: true,
      callLLM
    }))

    const brief = await generateProjectBrief({
      ...baseRequest,
      attachments: [{ url: 'https://example.com', name: 'spec.pdf' }]
    })

    expect(callLLM).toHaveBeenCalledOnce()
    expect(brief.attachments).toEqual([{ url: 'https://example.com', name: 'spec.pdf' }])
    expect(brief.clarifyingQuestions).toHaveLength(3)
  })
})
