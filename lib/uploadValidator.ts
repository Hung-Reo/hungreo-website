/**
 * Shared upload validator for all admin upload routes.
 * Provides consistent file type, MIME type, size, and filename sanitization.
 */

export type UploadType = 'image' | 'cv' | 'document'

interface ValidationResult {
  valid: boolean
  error?: string
  sanitizedName: string
}

const CONFIGS = {
  image: {
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'],
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
  },
  cv: {
    allowedExtensions: ['.pdf', '.docx'],
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
  },
  document: {
    allowedExtensions: ['.pdf', '.docx', '.txt', '.md'],
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ],
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
  },
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') // only allow safe chars
    .replace(/\.{2,}/g, '.') // no path traversal with ..
    .replace(/^[.\-]/, '_') // don't start with . or -
    .slice(0, 200) // max length
}

export function validateUpload(file: File, type: UploadType): ValidationResult {
  const config = CONFIGS[type]
  const sanitizedName = sanitizeFilename(file.name)
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()

  if (!config.allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed: ${config.allowedExtensions.join(', ')}`,
      sanitizedName,
    }
  }

  if (!config.allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file format.`, sanitizedName }
  }

  if (file.size > config.maxSizeBytes) {
    const maxMB = config.maxSizeBytes / (1024 * 1024)
    return { valid: false, error: `File too large. Max size: ${maxMB}MB`, sanitizedName }
  }

  return { valid: true, sanitizedName }
}
