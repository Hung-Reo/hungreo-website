/**
 * Client-side helpers for admin uploads.
 */

/**
 * browser-image-compression 2.x returns a Blob (it only sets `blob.name`). FormData sends a
 * plain Blob with the filename "blob", so the server saw extension ".blob" and rejected every
 * compressed image with 400. Wrap it in a real File that keeps the original name.
 */
export function asUploadFile(compressed: Blob, originalName: string): File {
  return new File([compressed], originalName, { type: compressed.type })
}

/**
 * Turns a failed upload response into a message the admin can act on.
 * Vercel returns HTML (not JSON) for some failures, e.g. 413 when the body exceeds 4.5 MB.
 */
export async function getUploadErrorMessage(response: Response): Promise<string> {
  const data = await response.json().catch(() => null)
  const detail = data && typeof data.error === 'string' ? data.error : 'Upload failed'
  return `${detail} (HTTP ${response.status})`
}
