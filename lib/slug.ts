/**
 * Picks a slug no other blog post/project owns. Without this, creating an item with
 * the same title (or renaming one) overwrote the slug index: the existing URL started
 * showing the new item and both shared one chatbot page.
 */
export async function findAvailableSlug(
  desired: string,
  ownId: string,
  slugOwner: (slug: string) => Promise<string | null>
): Promise<string> {
  const suffix = ownId.slice(0, 8)
  // Titles with no latin letters slugify to '' (generateSlug drops Vietnamese diacritics)
  const base = desired || `post-${suffix}`
  const candidates = [base, `${base}-${suffix}`]
  for (let n = 2; n <= 20; n++) candidates.push(`${base}-${suffix}-${n}`)

  for (const candidate of candidates) {
    const owner = await slugOwner(candidate)
    if (!owner || owner === ownId) return candidate
  }
  throw new Error(`No free slug for "${base}"`)
}
