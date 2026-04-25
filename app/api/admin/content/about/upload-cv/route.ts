import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import {
  extractTextFromFile,
  detectLanguage,
  parseCV,
  translateCVData,
} from '@/lib/cvParser'
import { v4 as uuidv4 } from 'uuid'
import { validateUpload } from '@/lib/uploadValidator'

/**
 * POST /api/admin/content/about/upload-cv
 * Upload CV file, extract text, parse with AI, and translate
 */
export async function POST(req: NextRequest) {
  // 1. Check authentication
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[CV Upload] Starting upload process...')

    // 2. Get uploaded file
    const formData = await req.formData()
    const file = formData.get('cv') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // 3. Validate file type, MIME type, and size
    const validation = validateUpload(file, 'cv')
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const fileName = validation.sanitizedName
    console.log(`[CV Upload] File: ${fileName}, Size: ${file.size} bytes`)

    // 4. Upload to Vercel Blob Storage
    console.log('[CV Upload] Uploading to Vercel Blob...')
    const blob = await put(`cv/${Date.now()}-${fileName}`, file, {
      access: 'public',
    })
    console.log(`[CV Upload] ✅ Uploaded to: ${blob.url}`)

    // 5. Extract text from file
    console.log('[CV Upload] Extracting text...')
    const text = await extractTextFromFile(blob.url, fileName)

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        {
          error:
            'Failed to extract text from CV. File may be corrupted, empty, or image-based PDF.',
        },
        { status: 400 }
      )
    }

    console.log(`[CV Upload] ✅ Extracted ${text.length} characters`)

    // 6. Detect language
    console.log('[CV Upload] Detecting language...')
    const detectedLanguage = await detectLanguage(text)
    console.log(`[CV Upload] ✅ Detected language: ${detectedLanguage}`)

    // 7. Parse CV structure with AI
    console.log('[CV Upload] Parsing CV with AI...')
    const parsedData = await parseCV(text, detectedLanguage)

    // Add UUIDs to all array items
    const addIds = (items: any[]) => items.map((item) => ({ ...item, id: uuidv4() }))

    const parsedWithIds = {
      hero: parsedData.hero,
      professionalJourney: addIds(parsedData.professionalJourney || []),
      educationExpertise: {
        education: addIds(parsedData.educationExpertise?.education || []),
        currentFocus: addIds(parsedData.educationExpertise?.currentFocus || []),
      },
      training: addIds(parsedData.training || []),
      competencies: addIds(parsedData.competencies || []),
      interests: parsedData.interests || { bio: '', hobbies: '' },
    }

    console.log('[CV Upload] ✅ Parsed structure:', {
      professionalJourney: parsedWithIds.professionalJourney.length,
      education: parsedWithIds.educationExpertise.education.length,
      currentFocus: parsedWithIds.educationExpertise.currentFocus.length,
      training: parsedWithIds.training.length,
      competencies: parsedWithIds.competencies.length,
    })

    // 8. Translate to other language
    console.log('[CV Upload] Translating to other language...')
    const translatedData = await translateCVData(parsedWithIds, detectedLanguage)

    // Ensure translated data has same IDs
    const syncIds = (source: any[], target: any[]) => {
      return target.map((item, index) => ({
        ...item,
        id: source[index]?.id || uuidv4(),
      }))
    }

    const translatedWithIds = {
      hero: translatedData.hero,
      professionalJourney: syncIds(
        parsedWithIds.professionalJourney,
        translatedData.professionalJourney || []
      ),
      educationExpertise: {
        education: syncIds(
          parsedWithIds.educationExpertise.education,
          translatedData.educationExpertise?.education || []
        ),
        currentFocus: syncIds(
          parsedWithIds.educationExpertise.currentFocus,
          translatedData.educationExpertise?.currentFocus || []
        ),
      },
      training: syncIds(parsedWithIds.training, translatedData.training || []),
      competencies: syncIds(parsedWithIds.competencies, translatedData.competencies || []),
      interests: translatedData.interests || { bio: '', hobbies: '' },
    }

    // 9. Combine both languages
    const bilingualData = {
      hero: {
        en: detectedLanguage === 'en' ? parsedWithIds.hero : translatedWithIds.hero,
        vi: detectedLanguage === 'vi' ? parsedWithIds.hero : translatedWithIds.hero,
      },
      professionalJourney: {
        en:
          detectedLanguage === 'en'
            ? parsedWithIds.professionalJourney
            : translatedWithIds.professionalJourney,
        vi:
          detectedLanguage === 'vi'
            ? parsedWithIds.professionalJourney
            : translatedWithIds.professionalJourney,
      },
      educationExpertise: {
        education: {
          en:
            detectedLanguage === 'en'
              ? parsedWithIds.educationExpertise.education
              : translatedWithIds.educationExpertise.education,
          vi:
            detectedLanguage === 'vi'
              ? parsedWithIds.educationExpertise.education
              : translatedWithIds.educationExpertise.education,
        },
        currentFocus: {
          en:
            detectedLanguage === 'en'
              ? parsedWithIds.educationExpertise.currentFocus
              : translatedWithIds.educationExpertise.currentFocus,
          vi:
            detectedLanguage === 'vi'
              ? parsedWithIds.educationExpertise.currentFocus
              : translatedWithIds.educationExpertise.currentFocus,
        },
      },
      training: {
        en: detectedLanguage === 'en' ? parsedWithIds.training : translatedWithIds.training,
        vi: detectedLanguage === 'vi' ? parsedWithIds.training : translatedWithIds.training,
      },
      competencies: {
        en:
          detectedLanguage === 'en'
            ? parsedWithIds.competencies
            : translatedWithIds.competencies,
        vi:
          detectedLanguage === 'vi'
            ? parsedWithIds.competencies
            : translatedWithIds.competencies,
      },
      interests: {
        en: detectedLanguage === 'en' ? parsedWithIds.interests : translatedWithIds.interests,
        vi: detectedLanguage === 'vi' ? parsedWithIds.interests : translatedWithIds.interests,
      },
    }

    console.log('[CV Upload] ✅ Success! CV parsed and translated.')

    // 10. Return result
    return NextResponse.json({
      success: true,
      cv: {
        fileName,
        fileUrl: blob.url,
        uploadedAt: Date.now(),
        detectedLanguage,
      },
      parsedData: bilingualData,
    })
  } catch (error) {
    console.error('[CV Upload] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process CV',
      },
      { status: 500 }
    )
  }
}
