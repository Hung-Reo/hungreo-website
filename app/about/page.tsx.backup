'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function AboutPage() {
  const { t } = useLanguage()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900">{t('about.title')}</h1>
          <p className="mt-4 text-xl text-slate-600">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Profile Section */}
        <div className="mt-12 flex flex-col items-center gap-8 md:flex-row">
          <div className="h-48 w-48 overflow-hidden rounded-full bg-slate-200">
            {/* Placeholder for profile image */}
            <div className="flex h-full items-center justify-center text-slate-400">
              {t('about.photo')}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">{t('about.name')}</h2>
            <p className="mt-2 text-lg text-slate-600">
              {t('about.role')}
            </p>
            <p className="mt-4 text-slate-600">
              {t('about.intro')}
            </p>
          </div>
        </div>

        {/* Professional Journey */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-slate-900">
            {t('about.journey.title')}
          </h2>
          <div className="mt-8 space-y-8">
            <TimelineItem
              year="Mar 2025 - Oct 2025"
              title="AI Consultant - Pétrus Ký Primary & High School"
              description="Consulting AI implementation for 200 teachers and 2,000 students. Developed AI chatbots for school website using OpenAI API with RAG method, generative AI for English teachers, and rolled out OpenUI tool for creating multiple AI chatbots."
            />
            <TimelineItem
              year="Sep 2021 - Oct 2024"
              title="Head of Applications Management - Samsung Vina Electronics"
              description="Led team of 4 managing SAP modules (SD, LE, MM, FI, CO), Sales systems (Portal, Salesforce), E-Invoice system. Supported 800 employees across 3 sales offices (HCM, HN, DN)."
            />
            <TimelineItem
              year="Nov 2019 - Jan 2021"
              title="IT Manager - ON Semiconductors Vietnam"
              description="Managed 14 team members for 2,800 employees across 2 factory sites. Business partnering for Manufacturing, managed IT Service Delivery for CIM applications 24/7, led IT strategy for new projects."
            />
            <TimelineItem
              year="Aug 2011 - May 2019"
              title="IT Manager - Kao Vietnam"
              description="Led team of 5 across 7 sites, 500 employees. IT Business Partnering for Customer Development, Supply Chain, Finance, HR. Delivered innovation projects: Quota management system, DMS for 40 distributors, E-sale devices for 250 salesmen, SAP WMS implementation."
            />
            <TimelineItem
              year="Nov 2004 - Jun 2011"
              title="IT Assistant Manager - Unilever Vietnam"
              description="Started as IT Business Partner for Supply Chain & Finance. Led SAP SD & WM implementation (2010-2011). Relocated to Singapore RHQ as IT Business Partner for Supply Chain, leading SAP MDM implementation for Unilever Asia (2009-2010)."
            />
          </div>
        </section>

        {/* Education & Skills */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-slate-900">
            {t('about.education.title')}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-xl font-semibold">{t('about.education.subtitle')}</h3>
              <ul className="mt-4 space-y-2 text-slate-600">
                <li>• <strong>MBA</strong> - {t('about.education.mba')}</li>
                <li>• <strong>Bachelor of Commerce</strong> - {t('about.education.bachelor')}</li>
                <li>• <strong>Diploma of Commerce</strong> - {t('about.education.diploma')}</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-xl font-semibold">{t('about.currentFocus.title')}</h3>
              <ul className="mt-4 space-y-2 text-slate-600">
                <li>• {t('about.currentFocus.ai')}</li>
                <li>• {t('about.currentFocus.pm')}</li>
                <li>• {t('about.currentFocus.team')}</li>
                <li>• {t('about.currentFocus.sap')}</li>
                <li>• {t('about.currentFocus.itsm')}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Training & Certifications */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-slate-900">{t('about.training.title')}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-4">
              <p className="font-semibold text-slate-900">Leader as a Coach</p>
              <p className="text-sm text-slate-600">Samsung Vina</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="font-semibold text-slate-900">7 Habits - Highly Effective People</p>
              <p className="text-sm text-slate-600">Kao Vietnam</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="font-semibold text-slate-900">Project Management</p>
              <p className="text-sm text-slate-600">Unilever Vietnam</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="font-semibold text-slate-900">Problem Solving & Decision Making</p>
              <p className="text-sm text-slate-600">Unilever Vietnam</p>
            </div>
          </div>
        </section>

        {/* Core Competencies */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-slate-900">{t('about.competencies.title')}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CompetencyCard icon="✓" title={t('about.competency.integrity')} />
            <CompetencyCard icon="✓" title={t('about.competency.respect')} />
            <CompetencyCard icon="✓" title={t('about.competency.accountability')} />
            <CompetencyCard icon="✓" title={t('about.competency.learning')} />
            <CompetencyCard icon="✓" title={t('about.competency.english')} />
            <CompetencyCard icon="✓" title={t('about.competency.leadership')} />
          </div>
        </section>

        {/* Personal Touch */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-slate-900">{t('about.beyond.title')}</h2>
          <p className="mt-4 text-slate-600">
            {t('about.beyond.bio')}
          </p>
          <p className="mt-4 text-slate-600">
            {t('about.beyond.interests')}
          </p>
        </section>
      </div>
    </div>
  )
}

function TimelineItem({
  year,
  title,
  description,
}: {
  year: string
  title: string
  description: string
}) {
  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
          <div className="h-3 w-3 rounded-full bg-primary-600" />
        </div>
        <div className="h-full w-px bg-slate-200" />
      </div>
      <div className="flex-1 pb-8">
        <p className="text-sm font-semibold text-primary-600">{year}</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-slate-600">{description}</p>
      </div>
    </div>
  )
}

function CompetencyCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-4">
      <span className="text-2xl text-primary-600">{icon}</span>
      <span className="font-medium text-slate-900">{title}</span>
    </div>
  )
}
