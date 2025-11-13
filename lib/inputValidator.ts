/**
 * Input Validation and Sanitization
 * Protects against injection attacks, XSS, and malicious input
 */

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean
  error?: string
  sanitized?: string
}

/**
 * Validate and sanitize chatbot message input
 * Rules:
 * - Length: 1-1000 characters
 * - No empty/whitespace-only messages
 * - Trim whitespace
 * - Check for suspicious patterns
 */
export function validateChatMessage(message: string): ValidationResult {
  // Check if message exists
  if (!message || typeof message !== 'string') {
    return {
      isValid: false,
      error: 'Tin nhắn không hợp lệ / Message is required',
    }
  }

  // Trim whitespace
  const trimmed = message.trim()

  // Check if empty after trimming
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Tin nhắn không được để trống / Message cannot be empty',
    }
  }

  // Check minimum length
  if (trimmed.length < 1) {
    return {
      isValid: false,
      error: 'Tin nhắn quá ngắn / Message is too short',
    }
  }

  // Check maximum length
  if (trimmed.length > 1000) {
    return {
      isValid: false,
      error:
        'Tin nhắn quá dài (tối đa 1000 ký tự) / Message is too long (max 1000 characters)',
    }
  }

  // Check for suspicious patterns (potential injection attempts)
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
    /<iframe/gi, // iframes
    /<object/gi, // objects
    /<embed/gi, // embeds
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      console.warn('[Validation] Suspicious pattern detected:', {
        pattern: pattern.toString(),
        message: trimmed.substring(0, 100),
      })
      return {
        isValid: false,
        error:
          'Tin nhắn chứa nội dung không hợp lệ / Message contains invalid content',
      }
    }
  }

  // Check for excessive special characters (potential spam)
  const specialCharCount = (trimmed.match(/[^a-zA-Z0-9\s\u0080-\uFFFF]/g) || [])
    .length
  const specialCharRatio = specialCharCount / trimmed.length

  if (specialCharRatio > 0.5 && trimmed.length > 10) {
    console.warn('[Validation] Excessive special characters detected:', {
      ratio: specialCharRatio,
      message: trimmed.substring(0, 100),
    })
    return {
      isValid: false,
      error: 'Tin nhắn chứa quá nhiều ký tự đặc biệt / Message contains too many special characters',
    }
  }

  return {
    isValid: true,
    sanitized: trimmed,
  }
}

/**
 * Validate file upload
 * Rules:
 * - File size: max 10MB
 * - Allowed types: .pdf, .docx, .txt
 * - Validate MIME type (not just extension)
 * - Sanitize filename
 */
export interface FileValidationOptions {
  maxSizeBytes?: number // Default: 10MB
  allowedTypes?: string[] // Default: ['pdf', 'docx', 'txt']
  allowedMimeTypes?: string[] // Default: application/pdf, etc.
}

export function validateFile(
  file: File,
  options?: FileValidationOptions
): ValidationResult {
  const maxSize = options?.maxSizeBytes || 10 * 1024 * 1024 // 10MB
  const allowedTypes = options?.allowedTypes || ['pdf', 'docx', 'txt', 'doc']
  const allowedMimeTypes = options?.allowedMimeTypes || [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/plain',
  ]

  // Check file exists
  if (!file) {
    return {
      isValid: false,
      error: 'Vui lòng chọn file / Please select a file',
    }
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
    return {
      isValid: false,
      error: `File quá lớn (tối đa ${maxSizeMB}MB) / File is too large (max ${maxSizeMB}MB)`,
    }
  }

  // Check file size is not 0
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File rỗng / File is empty',
    }
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !allowedTypes.includes(extension)) {
    return {
      isValid: false,
      error: `Loại file không hợp lệ. Chỉ chấp nhận: ${allowedTypes.join(', ')} / Invalid file type. Only accept: ${allowedTypes.join(', ')}`,
    }
  }

  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    console.warn('[Validation] Invalid MIME type:', {
      filename: file.name,
      mimeType: file.type,
      expectedTypes: allowedMimeTypes,
    })
    return {
      isValid: false,
      error: `Loại file không hợp lệ / Invalid file type`,
    }
  }

  // Sanitize filename (remove special characters, prevent path traversal)
  const sanitizedFilename = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/\.\.+/g, '.') // Remove multiple dots (path traversal attempt)
    .replace(/^\./, '_') // Remove leading dot
    .substring(0, 255) // Limit filename length

  return {
    isValid: true,
    sanitized: sanitizedFilename,
  }
}

/**
 * Validate YouTube video ID
 * Rules:
 * - Must be exactly 11 characters
 * - Alphanumeric + dash + underscore only
 */
export function validateYouTubeVideoId(videoId: string): ValidationResult {
  if (!videoId || typeof videoId !== 'string') {
    return {
      isValid: false,
      error: 'Video ID là bắt buộc / Video ID is required',
    }
  }

  const trimmed = videoId.trim()

  // YouTube video IDs are exactly 11 characters
  if (trimmed.length !== 11) {
    return {
      isValid: false,
      error: 'Video ID không hợp lệ / Invalid video ID format',
    }
  }

  // Only allow alphanumeric, dash, and underscore
  const validPattern = /^[a-zA-Z0-9_-]{11}$/
  if (!validPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Video ID chứa ký tự không hợp lệ / Video ID contains invalid characters',
    }
  }

  return {
    isValid: true,
    sanitized: trimmed,
  }
}

/**
 * Validate URL
 * Rules:
 * - Must be valid URL format
 * - Optional: Allowed domains only
 */
export function validateUrl(
  url: string,
  allowedDomains?: string[]
): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL là bắt buộc / URL is required',
    }
  }

  const trimmed = url.trim()

  // Check URL format
  let parsedUrl: URL
  try {
    parsedUrl = new URL(trimmed)
  } catch (error) {
    return {
      isValid: false,
      error: 'URL không hợp lệ / Invalid URL format',
    }
  }

  // Check protocol (only http/https)
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      isValid: false,
      error: 'URL phải sử dụng HTTP hoặc HTTPS / URL must use HTTP or HTTPS',
    }
  }

  // Check allowed domains if specified
  if (allowedDomains && allowedDomains.length > 0) {
    const hostname = parsedUrl.hostname.toLowerCase()
    const isAllowed = allowedDomains.some((domain) =>
      hostname.endsWith(domain.toLowerCase())
    )

    if (!isAllowed) {
      return {
        isValid: false,
        error: `Domain không được phép. Chỉ chấp nhận: ${allowedDomains.join(', ')} / Domain not allowed. Only accept: ${allowedDomains.join(', ')}`,
      }
    }
  }

  return {
    isValid: true,
    sanitized: parsedUrl.toString(),
  }
}

/**
 * Sanitize markdown content
 * Removes potentially dangerous HTML/JavaScript while preserving markdown
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  let sanitized = markdown

  // Remove script tags
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gis, '')

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')

  // Remove iframes
  sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')

  // Remove objects and embeds
  sanitized = sanitized.replace(/<object[^>]*>.*?<\/object>/gis, '')
  sanitized = sanitized.replace(/<embed[^>]*>/gi, '')

  return sanitized
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email là bắt buộc / Email is required',
    }
  }

  const trimmed = email.trim().toLowerCase()

  // Basic email regex (not perfect but good enough)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Email không hợp lệ / Invalid email format',
    }
  }

  // Check for common typos
  const commonTypos = ['gmial.com', 'gmai.com', 'yahooo.com', 'hotmial.com']
  const domain = trimmed.split('@')[1]
  if (commonTypos.includes(domain)) {
    return {
      isValid: false,
      error: 'Email có vẻ sai chính tả / Email appears to have a typo',
    }
  }

  return {
    isValid: true,
    sanitized: trimmed,
  }
}
