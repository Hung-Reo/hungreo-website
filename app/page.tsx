'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Project, BlogPost } from '@/lib/contentManager'
import { Loader2, ArrowRight, Calendar, Clock } from 'lucide-react'
import { FamilyValuesDisplay } from '@/components/FamilyValuesDisplay'
import { CVDownloadButton } from '@/components/CVDownloadButton'

export default function HomePage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([])
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch featured projects
        const projectsRes = await fetch('/api/content/projects')
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          const featured = (projectsData.projects || [])
            .filter((p: Project) => p.featured && p.status === 'published')
            .slice(0, 3)
          setFeaturedProjects(featured)
        }

        // Fetch latest blog posts
        const postsRes = await fetch('/api/content/blog')
        if (postsRes.ok) {
          const postsData = await postsRes.json()
          const latest = (postsData.posts || [])
            .filter((p: BlogPost) => p.status === 'published')
            .sort((a: BlogPost, b: BlogPost) => {
              const dateA = a.publishedAt || a.createdAt
              const dateB = b.publishedAt || b.createdAt
              return dateB - dateA
            })
            .slice(0, 3)
          setLatestPosts(latest)
        }
      } catch (error) {
        console.error('Failed to fetch homepage data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const lang = language === 'en' ? 'en' : 'vi'

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="py-12 text-center">
        <h1 className="text-5xl font-bold text-slate-900 md:text-6xl">
          {t('home.hero.name')}
        </h1>
        <p className="mt-4 text-xl text-slate-600 md:text-2xl">
          {t('home.hero.tagline')}
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 md:text-xl">
          {t('home.hero.description')}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <CVDownloadButton />
          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
          >
            {t('home.hero.viewProjects')}
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            {t('home.hero.aboutMe')}
          </Link>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold text-primary-600">{t('home.values.title1')}</h3>
            <p className="mt-2 text-slate-600">
              {t('home.values.desc1')}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold text-primary-600">{t('home.values.title2')}</h3>
            <p className="mt-2 text-slate-600">
              {t('home.values.desc2')}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold text-primary-600">{t('home.values.title3')}</h3>
            <p className="mt-2 text-slate-600">
              {t('home.values.desc3')}
            </p>
          </div>
        </div>
      </section>

      {/* Where It All Began - Origin Story */}
      <section className="bg-gradient-to-b from-slate-50 to-slate-100 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            {/* Section Header */}
            <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
              {t('home.origin.title')}
            </h2>

            {/* ACT 1: The Discovery */}
            <div className="mb-8 rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-sm">
              <p className="text-lg leading-relaxed text-slate-800">
                {t('home.origin.act1')}
              </p>
            </div>

            {/* ACT 2: The Question - HIGHLIGHTED */}
            <div className="mb-8 rounded-lg border-l-4 border-primary-500 bg-blue-50 p-6 shadow-sm">
              <p className="text-lg leading-relaxed text-slate-800">
                {t('home.origin.act2.intro')}
              </p>
              <p className="mt-4 text-xl font-semibold text-primary-700">
                "{t('home.origin.act2.question')}"
              </p>
            </div>

            {/* ACT 3: The Answer with Embedded Component */}
            <div className="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-sm">
              <p className="mb-8 text-lg leading-relaxed text-slate-800">
                {t('home.origin.act3.intro')}
              </p>

              {/* EMBEDDED: Family Values Visual */}
              <div className="my-8">
                <FamilyValuesDisplay size="medium" showDescription={false} embedded={true} />
              </div>

              <p className="text-lg leading-relaxed text-slate-800">
                {t('home.origin.act3.closing')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-slate-900">{t('home.featured.projects')}</h2>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            {lang === 'en' ? 'View all' : 'Xem tất cả'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : featuredProjects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {featuredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.slug}`)}
                className="group bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
              >
                {project.featuredImage && (
                  <div className="aspect-video overflow-hidden bg-slate-100">
                    <img
                      src={project.featuredImage}
                      alt={project[lang].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary-600 transition-colors mb-2">
                    {project[lang].title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                    {project[lang].description}
                  </p>
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                          +{project.techStack.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 text-center py-8">
            {lang === 'en' ? 'No featured projects yet.' : 'Chưa có dự án nổi bật.'}
          </p>
        )}
      </section>

      {/* Latest Blog Posts */}
      <section className="py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-slate-900">{t('home.featured.latestPosts')}</h2>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            {lang === 'en' ? 'View all' : 'Xem tất cả'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : latestPosts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {latestPosts.map((post) => {
              const publishDate = post.publishedAt
                ? formatDate(post.publishedAt)
                : formatDate(post.createdAt)

              return (
                <div
                  key={post.id}
                  onClick={() => router.push(`/blog/${post.slug}`)}
                  className="group bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                >
                  {post.featuredImage && (
                    <div className="aspect-video overflow-hidden bg-slate-100">
                      <img
                        src={post.featuredImage}
                        alt={post[lang].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    {post.category && (
                      <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full mb-2">
                        {post.category}
                      </span>
                    )}
                    <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary-600 transition-colors mb-2 line-clamp-2">
                      {post[lang].title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {post[lang].excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{publishDate}</span>
                      </div>
                      {post.readTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTime} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-slate-600 text-center py-8">
            {lang === 'en' ? 'No blog posts yet.' : 'Chưa có bài viết.'}
          </p>
        )}
      </section>
    </div>
  )
}
