/**
 * Project Parser Library
 * Handles project document upload, text extraction, AI parsing, and translation
 */

import { getOpenAIClient } from './openai'
import { extractText } from 'unpdf'
import mammoth from 'mammoth'

// Get AI model from env
const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

/**
 * Extract text from PDF or DOCX file
 */
export async function extractTextFromFile(
  fileUrl: string,
  fileName: string
): Promise<string> {
  try {
    const response = await fetch(fileUrl)
    const buffer = await response.arrayBuffer()

    if (fileName.toLowerCase().endsWith('.pdf')) {
      console.log('[Project Parser] Extracting text from PDF...')
      // Use unpdf (compatible with Next.js)
      const uint8Array = new Uint8Array(buffer)
      const { text } = await extractText(uint8Array, { mergePages: true })
      return text
    } else if (fileName.toLowerCase().endsWith('.docx')) {
      console.log('[Project Parser] Extracting text from DOCX...')
      const result = await mammoth.extractRawText({
        buffer: Buffer.from(buffer),
      })
      return result.value
    }

    throw new Error('Unsupported file format. Only PDF and DOCX are supported.')
  } catch (error) {
    console.error('[Project Parser] Text extraction failed:', error)
    throw new Error(
      `Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Detect language (EN or VI)
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
          content: text.substring(0, 1000), // First 1000 chars
        },
      ],
      temperature: 0, // Deterministic
    })

    const detected = response.choices[0].message.content?.trim().toLowerCase()
    console.log(`[Project Parser] Detected language: ${detected}`)
    return detected === 'vi' ? 'vi' : 'en'
  } catch (error) {
    console.error('[Project Parser] Language detection failed:', error)
    // Default to English if detection fails
    return 'en'
  }
}

/**
 * AI Parsing Prompt for Project Extraction
 */
const PROJECT_PARSING_PROMPT = `
You are a professional project documentation parser. Extract structured data from this project document in JSON format.

Extract the following information:

1. PROJECT TITLE
   - Concise, professional project name

2. SHORT DESCRIPTION
   - 1-2 sentences summarizing the project

3. DETAILED CONTENT
   - Full project description with:
     - Problem/Challenge
     - Solution/Approach
     - Implementation details
     - Results/Outcomes
   - Use Markdown formatting with proper headings (##, ###)
   - Use bullet points and code blocks where appropriate
   - Keep paragraphs concise (2-4 sentences)

4. TECH STACK
   - Array of technologies, frameworks, tools used
   - Examples: ["Next.js", "TypeScript", "Tailwind CSS", "OpenAI API"]

5. KEY LEARNINGS
   - 2-5 key takeaways or lessons learned
   - Each learning should be 1-2 sentences

Return JSON in this exact format:
{
  "title": "Project Name",
  "description": "Brief 1-2 sentence description",
  "content": "## Overview\\n\\nDetailed content in Markdown...",
  "techStack": ["Technology 1", "Technology 2", ...],
  "learnings": [
    "Learning 1: Brief description",
    "Learning 2: Brief description"
  ]
}

RULES:
- Keep descriptions concise and professional
- Use Markdown formatting for content (headings, bullets, code blocks)
- Extract actual tech stack (don't invent)
- Learnings should be specific and actionable
- If information is not found, use empty array [] or minimal placeholder
- Preserve technical accuracy

If the document is in English, also provide Vietnamese translation.
If the document is in Vietnamese, also provide English translation.

Return bilingual JSON:
{
  "en": { title, description, content, techStack, learnings },
  "vi": { title, description, content, techStack, learnings }
}
`

/**
 * Parse project document into structured data
 */
export async function parseProject(text: string, detectedLanguage: 'en' | 'vi') {
  try {
    const openai = getOpenAIClient()

    console.log(`[Project Parser] Parsing project (${detectedLanguage})...`)

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: PROJECT_PARSING_PROMPT,
        },
        {
          role: 'user',
          content: `Language: ${detectedLanguage}\n\n${text}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Slightly higher for better content generation
    })

    const parsed = JSON.parse(response.choices[0].message.content!)
    console.log('[Project Parser] ✅ Project parsed successfully')
    return parsed
  } catch (error) {
    console.error('[Project Parser] Parsing failed:', error)
    throw new Error(
      `Failed to parse project: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
