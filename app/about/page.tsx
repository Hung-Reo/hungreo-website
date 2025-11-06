import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Me - Dinh Quang Hung',
  description: '20 years of IT leadership experience transitioning to Product Management with AI focus',
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900">About Me</h1>
          <p className="mt-4 text-xl text-slate-600">
            20 years of IT leadership experience, now embracing Product Management with AI
          </p>
        </div>

        {/* Profile Section */}
        <div className="mt-12 flex flex-col items-center gap-8 md:flex-row">
          <div className="h-48 w-48 overflow-hidden rounded-full bg-slate-200">
            {/* Placeholder for profile image */}
            <div className="flex h-full items-center justify-center text-slate-400">
              Photo
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">Dinh Quang Hung</h2>
            <p className="mt-2 text-lg text-slate-600">
              IT Leader | AI Consultant | Product Management Enthusiast
            </p>
            <p className="mt-4 text-slate-600">
              Available for new opportunities to add value, challenge my leadership,
              and continue my learning journey. With 8 years as Head of IT and 20 years
              in multinational companies (FMCG, Manufacturing, K12 Education), I'm now
              focusing on AI-powered products and Product Management.
            </p>
          </div>
        </div>

        {/* Professional Journey */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-slate-900">
            Professional Journey
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
            Education & Expertise
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-xl font-semibold">Education</h3>
              <ul className="mt-4 space-y-2 text-slate-600">
                <li>• <strong>MBA</strong> - Business in IT, University of Technology Sydney (UTS), Australia (2001-2003)</li>
                <li>• <strong>Bachelor of Commerce</strong> - Economics & Finance, Macquarie University, Australia (1997-2001)</li>
                <li>• <strong>Diploma of Commerce</strong> - Business Economics, Insearch Institute, Australia (1996-1997)</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-xl font-semibold">Current Focus</h3>
              <ul className="mt-4 space-y-2 text-slate-600">
                <li>• AI learner and practitioner (AI chatbots, AI apps, AI Agents with n8n)</li>
                <li>• Product Management transition</li>
                <li>• Team management & leadership</li>
                <li>• SAP ERP systems</li>
                <li>• IT Service Management</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Training & Certifications */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-slate-900">Training & Development</h2>
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
          <h2 className="text-3xl font-bold text-slate-900">Core Competencies</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CompetencyCard icon="✓" title="Integrity" />
            <CompetencyCard icon="✓" title="Respect Others" />
            <CompetencyCard icon="✓" title="Accountability" />
            <CompetencyCard icon="✓" title="Learning Attitude" />
            <CompetencyCard icon="✓" title="Excellent English Communication" />
            <CompetencyCard icon="✓" title="Team Leadership" />
          </div>
        </section>

        {/* Personal Touch */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-slate-900">Beyond Work</h2>
          <p className="mt-4 text-slate-600">
            Born March 9, 1975. Married, Vietnamese national living in District 3, HCMC.
          </p>
          <p className="mt-4 text-slate-600">
            When I'm not working on IT solutions or learning about AI, you'll find me
            running or traveling. I believe in continuous learning and challenging myself
            with new opportunities. My 20 years of experience across diverse industries
            has taught me that the best solutions come from understanding people first,
            then applying technology.
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
