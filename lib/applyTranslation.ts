/**
 * Client-safe (no OpenAI import): merges a translation into the target language tab.
 * Empty translated fields (source was empty) keep the current value: RichTextEditor ignores
 * an empty content prop, so clearing it would leave the old text on screen while Save
 * stores an empty body.
 */

type BlogLangFields = { title: string; excerpt: string; content: string }

export function applyTranslation(
  current: Partial<BlogLangFields> | undefined,
  translated: BlogLangFields
): BlogLangFields {
  return {
    title: translated.title || current?.title || '',
    excerpt: translated.excerpt || current?.excerpt || '',
    content: translated.content || current?.content || '',
  }
}
