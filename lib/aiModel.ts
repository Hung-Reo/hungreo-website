import type OpenAI from 'openai'

/**
 * Single source of truth for the chat model used across the site.
 * Override in Vercel env: OPENAI_MODEL, OPENAI_REASONING_EFFORT.
 * Note: temperature is only accepted with reasoning_effort 'none', so call sites omit it.
 * No env loading here: a side-effect dotenv load would leak real keys into tests.
 * CLI scripts load .env.local themselves and call getAIModel() at request time.
 */

export const SUPPORTED_REASONING_EFFORTS = [
  'none',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
] as const

export type ReasoningEffort = (typeof SUPPORTED_REASONING_EFFORTS)[number]
const DEFAULT_EFFORT: ReasoningEffort = 'medium'

/** Dynamic model resolver to avoid stale env when imported in CLI scripts */
export function getAIModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-6-luna'
}

/** Dynamic reasoning effort validator to avoid crashing with unsupported values */
export function getReasoningEffort(): ReasoningEffort {
  const raw = process.env.OPENAI_REASONING_EFFORT?.trim().toLowerCase()
  if (!raw) return DEFAULT_EFFORT
  if ((SUPPORTED_REASONING_EFFORTS as readonly string[]).includes(raw)) {
    return raw as ReasoningEffort
  }
  console.warn(
    `[aiModel] Unsupported OPENAI_REASONING_EFFORT="${raw}". Supported values for GPT-6 Luna are: ${SUPPORTED_REASONING_EFFORTS.join(', ')}. Falling back to "${DEFAULT_EFFORT}".`
  )
  return DEFAULT_EFFORT
}

export const AI_MODEL = getAIModel()

/** Extra params for reasoning models. Legacy gpt-4* models reject reasoning_effort. */
export function reasoningParams(): {
  reasoning_effort?: OpenAI.Chat.ChatCompletionCreateParams['reasoning_effort']
} {
  const model = getAIModel()
  if (model.startsWith('gpt-4')) {
    return {}
  }
  const effort = getReasoningEffort()
  return {
    reasoning_effort: (effort as unknown) as OpenAI.Chat.ChatCompletionCreateParams['reasoning_effort'],
  }
}
