import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import { validateUpload } from '@/lib/uploadValidator'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type, MIME type, and size
    const validation = validateUpload(file, 'image')
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`profile/${Date.now()}-${validation.sanitizedName}`, file, {
      access: 'public',
    })

    console.log('[Photo Upload] Success:', blob.url)

    return NextResponse.json({
      success: true,
      photoUrl: blob.url,
    })
  } catch (error) {
    console.error('[Photo Upload] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
