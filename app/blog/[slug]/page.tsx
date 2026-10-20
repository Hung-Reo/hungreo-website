'use client'

import { useState, useEffect } from 'react'
import { notFound, useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import type { BlogPost } from '@/lib/contentManager'
import { Loader2, ArrowLeft, Calendar, Clock, Tag, BookOpen, Quote, Sparkles, History } from 'lucide-react'
// Content is fetched after mount; sanitize with the browser DOM, not server-side jsdom.
import DOMPurify from 'dompurify'
import { marked } from 'marked'

// Configure marked for better parsing
marked.setOptions({
  breaks: true,
  gfm: true,
})

// Helper function to convert content to HTML
function contentToHTML(content: string): string {
  if (!content) return ''

  try {
    // Strip any wrapping HTML tags (AI parser sometimes wraps content in <p> tags)
    let cleanContent = content

    // Remove opening and closing <p> tags if they wrap the entire content
    if (cleanContent.startsWith('<p>') && cleanContent.endsWith('</p>')) {
      cleanContent = cleanContent.slice(3, -4)
    }

    // Also remove any stray <p> or </p> tags
    cleanContent = cleanContent.replace(/<\/?p>/g, '')

    // Parse markdown to HTML
    const html = marked.parse(cleanContent) as string

    return html
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return content
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// occurredAt / thoughtEvolution dates are plain YYYY-MM-DD; format in UTC so the
// day never shifts with the reader's timezone.
function formatDay(day: string, lang: 'en' | 'vi'): string {
  const date = new Date(`${day}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return day
  return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })
}

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>()
  const { language } = useLanguage()
  const router = useRouter()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [notFoundError, setNotFoundError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch current post
        const postRes = await fetch(`/api/content/blog/${params.slug}`)
        if (!postRes.ok) {
          setNotFoundError(true)
          return
        }
        const postData = await postRes.json()
        setPost(postData)

        // Fetch all posts for related section
        const allPostsRes = await fetch('/api/content/blog')
        if (allPostsRes.ok) {
          const allPostsData = await allPostsRes.json()

          // Find related posts (same category or shared tags, excluding current)
          const related = (allPostsData.posts || [])
            .filter((p: BlogPost) => {
              if (p.slug === params.slug) return false

              // Match by category
              if (p.category && postData.category && p.category === postData.category) {
                return true
              }

              // Match by tags
              if (p.tags && postData.tags) {
                return p.tags.some(tag => postData.tags.includes(tag))
              }

              return false
            })
            .slice(0, 3)

          setRelatedPosts(related)
        }
      } catch (error) {
        console.error('Failed to fetch blog post:', error)
        setNotFoundError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (notFoundError || !post) {
    notFound()
  }

  const lang = language === 'en' ? 'en' : 'vi'
  const publishDate = post.publishedAt
    ? formatDate(new Date(post.publishedAt).toISOString())
    : formatDate(new Date(post.createdAt).toISOString())

  // Living Thought blocks: fall back to the other language when this one is empty.
  const structured = post.structuredContent
  const otherLang = lang === 'en' ? 'vi' : 'en'
  const thought = structured
    ? (structured[lang].context || structured[lang].originalVoice || structured[lang].aiEditorial
        ? structured[lang]
        : structured[otherLang])
    : null
  // Hung writes in Vietnamese; flag the English block as a translation.
  const voiceIsTranslation = lang === 'en' && Boolean(structured?.vi.originalVoice) && thought === structured?.en
  const evolution = [...(post.thoughtEvolution || [])].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <article className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {lang === 'en' ? 'Back to Blog' : 'Quay lại Blog'}
        </Link>

        {/* Header */}
        <header className="mb-8">
          {/* Category */}
          {post.category && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                {post.category}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {post[lang].title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl text-slate-600 mb-6">
            {post[lang].excerpt}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 pb-6 border-b">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{publishDate}</span>
            </div>
            {post.readTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{post.readTime} min read</span>
              </div>
            )}
            {post.occurredAt && (
              <div className="flex items-center gap-1">
                <History className="h-4 w-4" />
                <span>
                  {lang === 'en' ? 'Happened on ' : 'Diễn ra ngày '}
                  {formatDay(post.occurredAt, lang)}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Featured image */}
        {post.featuredImage && (
          <div className="mb-12 max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg">
            <img
              src={post.featuredImage}
              alt={post[lang].title}
              className="w-full h-auto object-contain"
            />
          </div>
        )}

        {/* Living Thought: context, Hung's own words, AI notes kept apart */}
        {thought && (
          <div className="space-y-8 mb-12">
            {thought.context && (
              <div data-index-section={lang === 'en' ? 'Context' : 'Bối cảnh'}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  {lang === 'en' ? 'Context' : 'Bối cảnh'}
                </h2>
                <p className="text-lg text-slate-700 whitespace-pre-wrap">{thought.context}</p>
              </div>
            )}

            {thought.originalVoice && (
              <div
                data-index-section={lang === 'en' ? "Hung's own words" : 'Lời gốc của Hưng'}
                className="border-l-4 border-primary-500 bg-primary-50/40 rounded-r-lg px-6 py-5"
              >
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary-700 mb-3">
                  <Quote className="h-4 w-4" />
                  {lang === 'en' ? "Hung's own words" : 'Lời gốc của Hưng'}
                </h2>
                <blockquote className="text-lg leading-relaxed text-slate-900 whitespace-pre-wrap">
                  {thought.originalVoice}
                </blockquote>
                {voiceIsTranslation && (
                  <p className="mt-3 text-xs text-slate-500">
                    Translated from the original Vietnamese.
                  </p>
                )}
              </div>
            )}

            {thought.aiEditorial && (
              <div data-index-exclude className="border border-dashed border-slate-300 rounded-lg px-6 py-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  <Sparkles className="h-4 w-4" />
                  {lang === 'en' ? 'Editorial notes (AI-assisted)' : 'Ghi chú biên tập (AI hỗ trợ)'}
                </h2>
                <p className="text-xs text-slate-500 mb-3">
                  {lang === 'en'
                    ? "Organised by AI from Hung's words above; not his own wording."
                    : 'AI hệ thống hoá từ lời gốc ở trên, không phải nguyên văn của Hưng.'}
                </p>
                <div
                  className="prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(contentToHTML(thought.aiEditorial))
                  }}
                />
              </div>
            )}

            {evolution.length > 0 && (
              <div data-index-section={lang === 'en' ? 'How my thinking changed' : 'Tư duy thay đổi theo thời gian'}>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  <History className="h-4 w-4" />
                  {lang === 'en' ? 'How my thinking changed' : 'Tư duy thay đổi theo thời gian'}
                </h2>
                <ol className="space-y-3 border-l border-slate-200 pl-5">
                  {evolution.map((entry) => (
                    <li key={entry.id}>
                      <p className="text-sm font-medium text-slate-500">{formatDay(entry.date, lang)}</p>
                      <p className="text-slate-800 whitespace-pre-wrap">
                        {(lang === 'en' ? entry.noteEn : entry.noteVi) || entry.noteVi || entry.noteEn}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {post[lang].content && (
          <div
            data-index-section={lang === 'en' ? 'Article' : 'Bài viết'}
            className="prose prose-slate prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(contentToHTML(post[lang].content || ''))
            }}
          />
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <section className="mb-12 pb-12 border-b">
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {lang === 'en' ? 'Tags' : 'Thẻ'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full hover:bg-slate-200 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary-600" />
              {lang === 'en' ? 'Related Posts' : 'Bài viết liên quan'}
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => {
                const relatedPublishDate = relatedPost.publishedAt
                  ? formatDate(new Date(relatedPost.publishedAt).toISOString())
                  : formatDate(new Date(relatedPost.createdAt).toISOString())

                return (
                  <div
                    key={relatedPost.id}
                    onClick={() => router.push(`/blog/${relatedPost.slug}`)}
                    className="group bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                  >
                    {relatedPost.featuredImage && (
                      <div className="aspect-video overflow-hidden bg-slate-100">
                        <img
                          src={relatedPost.featuredImage}
                          alt={relatedPost[lang].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      {relatedPost.category && (
                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full mb-2">
                          {relatedPost.category}
                        </span>
                      )}
                      <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors mb-2 line-clamp-2">
                        {relatedPost[lang].title}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {relatedPost[lang].excerpt}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{relatedPublishDate}</span>
                        </div>
                        {relatedPost.readTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{relatedPost.readTime} min</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
