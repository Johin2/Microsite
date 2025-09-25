import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY
const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

const client = apiKey ? new OpenAI({ apiKey }) : null

export const llmEnabled = Boolean(client)

export async function callLLM({ systemPrompt, userPrompt, schema, temperature = 0.2 }) {
  if (!client) {
    throw new Error('LLM provider is not configured. Set OPENAI_API_KEY to enable agent responses.')
  }

  const completion = await client.chat.completions.create({
    model,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  })

  const content = completion.choices[0]?.message?.content

  if (!content) {
    throw new Error('Empty response from LLM provider')
  }

  if (!schema) {
    return content
  }

  try {
    const parsed = JSON.parse(content)
    return schema.parse(parsed)
  } catch (error) {
    console.error('Failed to parse LLM JSON payload', error)
    throw error
  }
}
