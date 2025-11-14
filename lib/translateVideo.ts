/**
 * Video Translation Helper
 * Uses OpenAI GPT-4 to translate video content from English to Vietnamese
 */

import OpenAI from 'openai'
import { VideoContent } from './videoManager'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Translate video content from English to Vietnamese
 * @param englishContent - Original English content
 * @returns Translated Vietnamese content
 */
export async function translateToVietnamese(
  englishContent: VideoContent
): Promise<VideoContent> {
  try {
    const prompt = `You are a professional translator specializing in Vietnamese translations.
Translate the following YouTube video content from English to Vietnamese.

IMPORTANT RULES:
1. Maintain the tone and style of the original content
2. Keep technical terms in English if commonly used (e.g., "AI", "Machine Learning", "Leadership")
3. Use natural Vietnamese phrasing (not word-for-word translation)
4. Preserve formatting and line breaks
5. For video titles: Keep it concise and engaging
6. For descriptions: Translate fully while maintaining readability

CONTENT TO TRANSLATE:

Title: ${englishContent.title}

Description:
${englishContent.description}

${englishContent.summary ? `Summary:\n${englishContent.summary}` : ''}

${englishContent.transcript ? `Transcript (translate first 500 words only):\n${englishContent.transcript.slice(0, 2000)}` : ''}

Return ONLY a valid JSON object with this structure:
{
  "title": "Vietnamese title",
  "description": "Vietnamese description",
  "summary": "Vietnamese summary (if provided, otherwise null)",
  "transcript": "Vietnamese transcript excerpt (if provided, otherwise null)"
}

Do not include any other text outside the JSON object.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional English-to-Vietnamese translator. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent translations
    })

    const translatedContent = JSON.parse(
      response.choices[0].message.content || '{}'
    )

    return {
      title: translatedContent.title || englishContent.title,
      description: translatedContent.description || englishContent.description,
      summary: translatedContent.summary || englishContent.summary,
      transcript: translatedContent.transcript || englishContent.transcript,
    }
  } catch (error) {
    console.error('Translation error:', error)
    throw new Error('Failed to translate video content')
  }
}

/**
 * Estimate translation cost
 * @param content - Content to translate
 * @returns Estimated tokens and cost in USD
 */
export function estimateTranslationCost(content: VideoContent): {
  estimatedTokens: number
  estimatedCost: number
} {
  // Rough estimation: 1 word ≈ 1.3 tokens
  const words =
    (content.title?.split(' ').length || 0) +
    (content.description?.split(' ').length || 0) +
    (content.summary?.split(' ').length || 0) +
    (content.transcript?.slice(0, 2000).split(' ').length || 0)

  const estimatedTokens = Math.ceil(words * 1.3)

  // GPT-4o-mini pricing: $0.150 per 1M input tokens, $0.600 per 1M output tokens
  // Assume output is roughly same size as input
  const inputCost = (estimatedTokens / 1000000) * 0.150
  const outputCost = (estimatedTokens / 1000000) * 0.600
  const estimatedCost = inputCost + outputCost

  return { estimatedTokens, estimatedCost }
}

/**
 * Batch translate multiple videos
 * @param videos - Array of videos to translate
 * @returns Translation results with success/failure count
 */
export async function batchTranslateVideos(
  videos: Array<{ id: string; en: VideoContent }>
): Promise<{
  success: number
  failed: number
  results: Array<{ id: string; vi?: VideoContent; error?: string }>
}> {
  const results = []
  let success = 0
  let failed = 0

  for (const video of videos) {
    try {
      const translated = await translateToVietnamese(video.en)
      results.push({ id: video.id, vi: translated })
      success++

      // Rate limiting: wait 1 second between requests
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error: any) {
      results.push({ id: video.id, error: error.message })
      failed++
    }
  }

  return { success, failed, results }
}
