/**
 * "Building now / Learning now" block on the homepage.
 * Edited in Admin → Home and stored in KV (lib/homeNowStore.ts); the homepage falls
 * back to DEFAULT_HOME_NOW when nothing is stored or the read fails. Client-safe:
 * no server imports. Section titles and link labels stay in LanguageContext.
 */

export interface HomeNowText {
  updated: string // e.g. "Updated October 2026"
  buildingP1: string
  buildingP2: string // optional, empty = hidden
  learningP1: string
  learningP2: string // optional, empty = hidden
}

export interface HomeNowContent {
  en: HomeNowText
  vi: HomeNowText
}

export const HOME_NOW_LIMITS = { updated: 60, paragraph: 600 }

// The text that was live (hard-coded in LanguageContext) before the block moved to the admin
export const DEFAULT_HOME_NOW: HomeNowContent = {
  en: {
    updated: 'Updated October 2026',
    buildingP1:
      "Through September and October, I've been building AI agents that do real work: giving them the right tools and skills, and running them inside a sandbox so every action an AI takes in a business setting stays under control.",
    buildingP2:
      "This month the focus is Personal AI: I'm reviewing the instructions my agents follow so they understand me better — how I work, what I prioritise and the principles I hold to.",
    learningP1:
      "I'm going deeper into AI security: how to give an agent only the permissions it needs and keep it sandboxed when it acts for a real business.",
    learningP2:
      "Alongside that, I'm learning more about education — how learning and teaching change when AI becomes an everyday companion.",
  },
  vi: {
    updated: 'Cập nhật tháng 10/2026',
    buildingP1:
      'Tháng 9 và tháng 10, mình tập trung xây các AI Agent làm việc thật: trang bị cho chúng công cụ (tools) và kỹ năng (skills) phù hợp, đồng thời đặt chúng trong môi trường an toàn (sandbox) để mỗi hành động của AI trong công việc kinh doanh đều nằm trong tầm kiểm soát.',
    buildingP2:
      'Tháng 10 này, trọng tâm là Personal AI: mình rà soát lại chỉ dẫn (instructions) cho các agent để chúng hiểu mình hơn — cách mình làm việc, điều mình ưu tiên và những nguyên tắc mình giữ.',
    learningP1:
      'Mình đang học sâu hơn về bảo mật cho AI: làm sao để agent được giao đúng quyền cần thiết và chạy trong sandbox khi thực hiện hành động thật cho doanh nghiệp.',
    learningP2:
      'Song song, mình dành thời gian tìm hiểu sâu hơn về giáo dục — việc học và dạy sẽ thay đổi thế nào khi AI trở thành người đồng hành hằng ngày.',
  },
}

const FIELDS: Array<{ key: keyof HomeNowText; label: string; required: boolean; max: number }> = [
  { key: 'updated', label: 'date line', required: true, max: HOME_NOW_LIMITS.updated },
  { key: 'buildingP1', label: 'Building paragraph 1', required: true, max: HOME_NOW_LIMITS.paragraph },
  { key: 'buildingP2', label: 'Building paragraph 2', required: false, max: HOME_NOW_LIMITS.paragraph },
  { key: 'learningP1', label: 'Learning paragraph 1', required: true, max: HOME_NOW_LIMITS.paragraph },
  { key: 'learningP2', label: 'Learning paragraph 2', required: false, max: HOME_NOW_LIMITS.paragraph },
]

/** Validates admin input (and stored data) into exactly the known fields. Rejects, never truncates. */
export function parseHomeNow(body: unknown): { ok: true; content: HomeNowContent } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid body' }
  const source = body as Record<string, unknown>
  const content = {} as HomeNowContent

  for (const lang of ['en', 'vi'] as const) {
    const raw = (source[lang] && typeof source[lang] === 'object' ? source[lang] : {}) as Record<string, unknown>
    const text = {} as HomeNowText
    for (const { key, label, required, max } of FIELDS) {
      const value = typeof raw[key] === 'string' ? (raw[key] as string).trim() : ''
      if (required && !value) return { ok: false, error: `${lang.toUpperCase()}: ${label} is required` }
      if (value.length > max) return { ok: false, error: `${lang.toUpperCase()}: ${label} is too long (max ${max} characters)` }
      text[key] = value
    }
    content[lang] = text
  }

  return { ok: true, content }
}
