/**
 * CV Parser Library
 * Handles CV upload, text extraction, AI parsing, and translation
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
      console.log('[CV Parser] Extracting text from PDF...')
      // Use unpdf (compatible with Next.js)
      const uint8Array = new Uint8Array(buffer)
      const { text } = await extractText(uint8Array, { mergePages: true })
      return text
    } else if (fileName.toLowerCase().endsWith('.docx')) {
      console.log('[CV Parser] Extracting text from DOCX...')
      const result = await mammoth.extractRawText({
        buffer: Buffer.from(buffer),
      })
      return result.value
    }

    throw new Error('Unsupported file format. Only PDF and DOCX are supported.')
  } catch (error) {
    console.error('[CV Parser] Text extraction failed:', error)
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
    console.log(`[CV Parser] Detected language: ${detected}`)
    return detected === 'vi' ? 'vi' : 'en'
  } catch (error) {
    console.error('[CV Parser] Language detection failed:', error)
    // Default to English if detection fails
    return 'en'
  }
}

/**
 * AI Parsing Prompt for CV Structure
 */
const CV_PARSING_PROMPT = `
You are a professional CV parser. Extract structured data from this CV in JSON format.

IMPORTANT: Map the CV content to exactly these 5 sections:

1. HERO SECTION (Basic Information)
   - name: Full name
   - role: Current job title or professional summary (1 line)
   - intro: Professional summary (2-3 sentences max)

2. PROFESSIONAL JOURNEY (Work Experience)
   Extract all positions in chronological order (newest first):
   - year: "Mar 2025 - Oct 2025" or "Sep 2021 - Oct 2024" format
   - title: Job title (e.g., "AI Consultant")
   - company: Company name (e.g., "Samsung Vina Electronics")
   - description: Brief description of responsibilities (2-3 sentences)

3. EDUCATION & EXPERTISE
   Split into two parts:

   a) Education:
   - degree: "MBA", "Bachelor of Commerce", "Diploma of Commerce"
   - detail: Full education detail with school and year

   b) Current Focus:
   Extract from skills section, core competencies, areas of expertise
   - focus: Brief description of each focus area

4. TRAINING & DEVELOPMENT
   Extract all training, certifications, courses:
   - name: Training/certification name
   - issuer: Organization that provided training
   - year: Year (if mentioned, otherwise omit)

5. INTERESTS (Personal Information)
   Extract from personal section, hobbies/interests, about me:
   - bio: Personal facts (age, location, family status, etc.)
   - hobbies: Hobbies and interests outside of work

6. CORE COMPETENCIES
   Extract from skills, strengths, soft skills sections:
   - competency: Single competency name (e.g., "Integrity", "Team Leadership")

Return JSON in this exact format:
{
  "hero": {
    "name": "...",
    "role": "...",
    "intro": "..."
  },
  "professionalJourney": [
    {
      "year": "...",
      "title": "...",
      "company": "...",
      "description": "..."
    }
  ],
  "educationExpertise": {
    "education": [
      {
        "degree": "MBA",
        "detail": "Business in IT, University of Technology Sydney (UTS), Australia (2001-2003)"
      }
    ],
    "currentFocus": [
      {
        "focus": "AI learner and practitioner (AI chatbots, AI apps, AI Agents with n8n)"
      }
    ]
  },
  "training": [
    {
      "name": "Leader as a Coach",
      "issuer": "Samsung Vina",
      "year": "2024"
    }
  ],
  "competencies": [
    {
      "competency": "Integrity"
    },
    {
      "competency": "Respect Others"
    }
  ],
  "interests": {
    "bio": "Born March 9, 1975. Married, Vietnamese national living in District 3, HCMC.",
    "hobbies": "Running, traveling, continuous learning..."
  }
}

RULES:
- Keep descriptions concise (2-3 sentences max)
- Maintain chronological order (newest first) for Professional Journey
- If a section is not found in CV, return empty array [] or empty string ""
- Extract competencies from skills, strengths, or soft skills sections
- Be accurate - don't invent information
- Professional Journey MUST have year, title, company, description
`

/**
 * Parse CV into structured data (5 sections)
 */
export async function parseCV(text: string, language: 'en' | 'vi') {
  try {
    const openai = getOpenAIClient()

    console.log(`[CV Parser] Parsing CV (${language})...`)

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: CV_PARSING_PROMPT,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Low temperature for consistency
    })

    const parsed = JSON.parse(response.choices[0].message.content!)
    console.log('[CV Parser] ✅ CV parsed successfully')
    return parsed
  } catch (error) {
    console.error('[CV Parser] Parsing failed:', error)
    throw new Error(
      `Failed to parse CV: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Translate CV data from one language to another
 */
export async function translateCVData(data: any, sourceLanguage: 'en' | 'vi') {
  try {
    const openai = getOpenAIClient()
    const targetLanguage = sourceLanguage === 'en' ? 'vi' : 'en'

    console.log(`[CV Parser] Translating from ${sourceLanguage} to ${targetLanguage}...`)

    const prompt =
      sourceLanguage === 'en'
        ? 'Translate this CV data from English to Vietnamese. Keep the same JSON structure. Maintain professional tone. Do not translate proper nouns (names, companies, degrees).'
        : 'Dịch dữ liệu CV này từ tiếng Việt sang tiếng Anh. Giữ nguyên cấu trúc JSON. Giữ giọng điệu chuyên nghiệp. Không dịch tên riêng (tên người, công ty, bằng cấp).'

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: JSON.stringify(data, null, 2),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const translated = JSON.parse(response.choices[0].message.content!)
    console.log('[CV Parser] ✅ Translation completed')
    return translated
  } catch (error) {
    console.error('[CV Parser] Translation failed:', error)
    throw new Error(
      `Failed to translate CV: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
