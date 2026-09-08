import type { MetadataRoute } from 'next'
import { getAllBlogPosts, getAllProjects } from '@/lib/contentManager'
import { getAllVideos } from '@/lib/videoManager'
import { CATEGORY_SLUGS, categorySlugFor, createVideoSlug } from '@/lib/knowledge'
import { BASE_URL } from '@/lib/metadata'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all published blog posts
  const posts = await getAllBlogPosts()
  const publishedPosts = posts.filter((p) => p.status === 'published')

  // Fetch all published projects
  const projects = await getAllProjects()
  const publishedProjects = projects.filter((p) => p.status === 'published')

  // Knowledge library videos. Limit is generous on purpose: the catalog is
  // small, and a silently truncated sitemap is worse than a slower build.
  const videos = await getAllVideos(500, 0)

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tools/knowledge`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/security`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Knowledge category landings
  const categoryPages: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/tools/knowledge/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Video detail pages. Skip any video whose category no longer maps to a
  // route rather than emitting a URL that would 404.
  const videoPages: MetadataRoute.Sitemap = videos.flatMap((video) => {
    const categorySlug = categorySlugFor(video.category)
    if (!categorySlug) return []

    const title = video.en?.title || video.title || ''
    const stamp = new Date(video.addedAt || video.publishedAt || Date.now())

    return [
      {
        url: `${BASE_URL}/tools/knowledge/${categorySlug}/${createVideoSlug(video.videoId, title)}`,
        lastModified: Number.isNaN(stamp.getTime()) ? new Date() : stamp,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
    ]
  })

  // Dynamic blog post pages
  const blogPages: MetadataRoute.Sitemap = publishedPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Dynamic project pages
  const projectPages: MetadataRoute.Sitemap = publishedProjects.map((project) => ({
    url: `${BASE_URL}/projects/${project.slug}`,
    lastModified: new Date(project.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...blogPages, ...projectPages, ...categoryPages, ...videoPages]
}
