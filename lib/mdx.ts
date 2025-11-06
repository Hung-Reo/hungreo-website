import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const contentDirectory = path.join(process.cwd(), 'content')

export interface PostMeta {
  title: string
  date: string
  description: string
  tags?: string[]
  slug: string
}

export interface ProjectMeta {
  title: string
  description: string
  tech: string[]
  image: string
  slug: string
  github?: string
  demo?: string
}

export function getContentByType<T>(type: 'blog' | 'projects'): T[] {
  const directory = path.join(contentDirectory, type)

  if (!fs.existsSync(directory)) {
    return []
  }

  const files = fs.readdirSync(directory)

  const content = files
    .filter(file => file.endsWith('.mdx'))
    .map(file => {
      const slug = file.replace('.mdx', '')
      const filePath = path.join(directory, file)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(fileContent)

      return {
        ...data,
        slug,
      } as T
    })

  return content
}

export function getContentBySlug(
  type: 'blog' | 'projects',
  slug: string
): { meta: any; content: string } {
  const filePath = path.join(contentDirectory, type, `${slug}.mdx`)
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(fileContent)

  return {
    meta: { ...data, slug },
    content,
  }
}
