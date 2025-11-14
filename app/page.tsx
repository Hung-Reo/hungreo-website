'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold text-slate-900 md:text-6xl">
          {t('home.hero.name')}
        </h1>
        <p className="mt-4 text-xl text-slate-600 md:text-2xl">
          {t('home.hero.tagline')}
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-slate-600">
          {t('home.hero.description')}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            {t('home.hero.viewProjects')}
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
          >
            {t('home.hero.aboutMe')}
          </Link>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold">{t('home.values.title1')}</h3>
            <p className="mt-2 text-slate-600">
              {t('home.values.desc1')}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold">{t('home.values.title2')}</h3>
            <p className="mt-2 text-slate-600">
              {t('home.values.desc2')}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold">{t('home.values.title3')}</h3>
            <p className="mt-2 text-slate-600">
              {t('home.values.desc3')}
            </p>
          </div>
        </div>
      </section>

      {/* Placeholder for Projects */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-slate-900">{t('home.featured.projects')}</h2>
        <p className="mt-4 text-slate-600">
          {t('home.featured.projectsPlaceholder')}
        </p>
      </section>

      {/* Placeholder for Blog */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-slate-900">{t('home.featured.latestPosts')}</h2>
        <p className="mt-4 text-slate-600">
          {t('home.featured.postsPlaceholder')}
        </p>
      </section>
    </div>
  )
}
