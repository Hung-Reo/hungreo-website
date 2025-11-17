/**
 * Blog Polisher Library
 * Handles blog draft polishing, structuring, and translation
 */

import { getOpenAIClient } from './openai'

const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

/**
 * Detect language from text
 */
export async function detectLanguage(text: string): Promise<'en' | 'vi'> {
  try {
    const openai = getOpenAIClient()

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Detect if the text is in English or Vietnamese. Reply with only "en" or "vi".',
        },
        {
          role: 'user',
          content: text.substring(0, 1000),
        },
      ],
      temperature: 0,
    })

    const detected = response.choices[0].message.content?.trim().toLowerCase()
    return detected === 'vi' ? 'vi' : 'en'
  } catch (error) {
    console.error('[Blog Polisher] Language detection failed:', error)
    return 'en'
  }
}

/**
 * AI Prompt for Blog Polishing
 */
const BLOG_POLISHING_PROMPT = `
You are a professional blog editor and writing assistant. Your task is to polish a raw blog draft into a well-structured, engaging blog post.

Input: Raw blog draft in {{LANGUAGE}}

Tasks:
1. POLISH CONTENT:
   - Fix grammar, spelling, and punctuation errors
   - Improve sentence structure and flow
   - Add proper Markdown formatting:
     - Use ## for main headings, ### for subheadings
     - Use **bold** for emphasis
     - Use bullet points (-) or numbered lists (1.)
     - Use > for blockquotes
     - Use \`code\` for inline code, \`\`\`language for code blocks
   - Break long paragraphs (keep to 2-4 sentences each)
   - Preserve the author's voice and personality
   - Keep technical terms in English (API, database, etc.)

2. GENERATE TITLE:
   - Create a catchy, SEO-friendly title (50-60 characters)
   - Should be engaging and descriptive

3. GENERATE EXCERPT:
   - Write a compelling 2-3 sentence summary
   - Should make readers want to read more

4. EXTRACT TAGS:
   - Identify 3-5 relevant tags from the content
   - Use lowercase with hyphens (e.g., "product-management", "ai", "startup")

5. SUGGEST CATEGORY:
   - Suggest ONE category that best fits this post
   - Examples: "Product Management", "Engineering", "Personal Growth", "AI & Technology"

6. TRANSLATE:
   - If input is English → Translate to Vietnamese
   - If input is Vietnamese → Translate to English
   - Maintain the same structure and formatting

Return JSON in this exact format:
{
  "en": {
    "title": "Engaging Title in English",
    "excerpt": "Compelling 2-3 sentence summary in English.",
    "content": "## Main Heading\\n\\nPolished content in Markdown...",
    "tags": ["tag-1", "tag-2", "tag-3"],
    "category": "Suggested Category"
  },
  "vi": {
    "title": "Tiêu đề hấp dẫn bằng Tiếng Việt",
    "excerpt": "Tóm tắt 2-3 câu hấp dẫn bằng Tiếng Việt.",
    "content": "## Tiêu đề chính\\n\\nNội dung được chỉnh sửa bằng Markdown...",
    "tags": ["tag-1", "tag-2", "tag-3"],
    "category": "Danh mục đề xuất"
  }
}

STYLE RULES:
- Preserve author's authentic voice
- Professional but conversational tone
- Use minimal emojis (max 2 per section, only if appropriate)
- Keep paragraphs scannable (2-4 sentences)
- Use active voice
- Make content engaging and readable
`

/**
 * Polish blog draft with AI
 */
export async function polishBlog(rawDraft: string) {
  try {
    const openai = getOpenAIClient()

    // Detect language
    const detectedLanguage = await detectLanguage(rawDraft)
    console.log(`[Blog Polisher] Detected language: ${detectedLanguage}`)

    const prompt = BLOG_POLISHING_PROMPT.replace(
      '{{LANGUAGE}}',
      detectedLanguage === 'en' ? 'English' : 'Vietnamese'
    )

    console.log('[Blog Polisher] Polishing blog draft...')

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: rawDraft,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4, // Slightly creative for better writing
    })

    const polished = JSON.parse(response.choices[0].message.content!)
    console.log('[Blog Polisher] ✅ Blog polished successfully')

    return {
      ...polished,
      detectedLanguage,
    }
  } catch (error) {
    console.error('[Blog Polisher] Polishing failed:', error)
    throw new Error(
      `Failed to polish blog: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
