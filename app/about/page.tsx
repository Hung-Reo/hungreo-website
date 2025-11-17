'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { AboutContent } from '@/lib/contentManager'
import { Loader2 } from 'lucide-react'

export default function AboutPage() {
  const { language } = useLanguage()
  const [aboutData, setAboutData] = useState<AboutContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAboutData()
  }, [])

  async function fetchAboutData() {
    try {
      const res = await fetch('/api/content/about')
      if (!res.ok) throw new Error('Failed to load content')

      const data = await res.json()
      setAboutData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !aboutData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-600">Failed to load About content</p>
      </div>
    )
  }

  const lang = language === 'en' ? 'en' : 'vi'

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-16">
          {aboutData.hero[lang].photo && (
            <img
              src={aboutData.hero[lang].photo}
              alt={aboutData.hero[lang].name}
              className="w-48 h-48 rounded-full mb-6 object-cover border-4 border-primary-100"
            />
          )}
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{aboutData.hero[lang].name}</h1>
          <p className="text-xl text-primary-600 font-medium mb-4">{aboutData.hero[lang].role}</p>
          <p className="text-lg text-slate-600 max-w-2xl">{aboutData.hero[lang].intro}</p>
        </div>

        {/* Professional Journey */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            {lang === 'en' ? 'Professional Journey' : 'Hành trình nghề nghiệp'}
          </h2>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-slate-200" />

            <div className="space-y-8">
              {aboutData.professionalJourney[lang].map((job) => (
                <div key={job.id} className="relative pl-8">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary-600 border-4 border-white" />

                  <div>
                    <p className="text-sm font-medium text-primary-600 mb-1">{job.year}</p>
                    <h3 className="text-xl font-semibold text-slate-900">{job.title}</h3>
                    <p className="text-slate-600 font-medium mb-2">{job.company}</p>
                    <p className="text-slate-700">{job.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Education & Expertise */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            {lang === 'en' ? 'Education & Expertise' : 'Học vấn & Chuyên môn'}
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Education */}
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-xl font-semibold mb-4">
                {lang === 'en' ? 'Education' : 'Học vấn'}
              </h3>
              <ul className="space-y-2 text-slate-600">
                {aboutData.educationExpertise.education[lang].map((edu) => (
                  <li key={edu.id}>
                    • <strong>{edu.degree}</strong> - {edu.detail}
                  </li>
                ))}
              </ul>
            </div>

            {/* Current Focus */}
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-xl font-semibold mb-4">
                {lang === 'en' ? 'Current Focus' : 'Hiện tại tập trung'}
              </h3>
              <ul className="space-y-2 text-slate-600">
                {aboutData.educationExpertise.currentFocus[lang].map((focus) => (
                  <li key={focus.id}>• {focus.focus}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Training & Development */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            {lang === 'en' ? 'Training & Development' : 'Đào tạo & Phát triển'}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {aboutData.training[lang].map((training) => (
              <div key={training.id} className="rounded-lg border bg-white p-4">
                <p className="font-semibold text-slate-900">{training.name}</p>
                <p className="text-sm text-slate-600">{training.issuer}</p>
                {training.year && (
                  <p className="text-xs text-slate-500 mt-1">{training.year}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Core Competencies */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            {lang === 'en' ? 'Core Competencies' : 'Năng lực cốt lõi'}
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aboutData.competencies[lang].map((comp) => (
              <div
                key={comp.id}
                className="flex items-center gap-3 rounded-lg border bg-white p-4"
              >
                <span className="text-2xl text-primary-600">✓</span>
                <span className="font-medium text-slate-900">{comp.competency}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Interests */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            {lang === 'en' ? 'Beyond Work' : 'Ngoài công việc'}
          </h2>

          <div className="space-y-4">
            <p className="text-slate-600">{aboutData.interests[lang].bio}</p>
            <p className="text-slate-600">
              <strong className="text-slate-900">
                {lang === 'en' ? 'Interests: ' : 'Sở thích: '}
              </strong>
              {aboutData.interests[lang].hobbies}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
