import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import { validateUpload } from '@/lib/uploadValidator'

/**
 * POST /api/admin/upload/image
 * General image upload endpoint
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 })
    }

    // Validate file type, MIME type, and size
    const validation = validateUpload(file, 'image')
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`images/${Date.now()}-${validation.sanitizedName}`, file, {
      access: 'public',
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
    })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
