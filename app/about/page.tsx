import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Me - Hung Dinh',
  description: 'Learn about my journey from Business Analyst to Product Manager',
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900">About Me</h1>
          <p className="mt-4 text-xl text-slate-600">
            My journey from Business Analyst to Product Manager
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
            <h2 className="text-2xl font-bold text-slate-900">Hung Dinh</h2>
            <p className="mt-2 text-lg text-slate-600">
              Product Manager | AI Enthusiast | Lifelong Learner
            </p>
            <p className="mt-4 text-slate-600">
              Currently transitioning from Business Analyst to Product Manager,
              with a focus on AI-powered solutions. I believe in understanding
              problems deeply before building solutions, and leveraging AI as a
              tool to create real value.
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
              year="2024-Present"
              title="Product Manager Transition"
              description="Focusing on AI products and learning PM skills through building real projects"
            />
            <TimelineItem
              year="2020-2024"
              title="Business Analyst"
              description="Worked on enterprise projects, gathering requirements and bridging technical and business teams"
            />
            <TimelineItem
              year="2018-2020"
              title="Started Career in Tech"
              description="First steps in the technology industry"
            />
          </div>
        </section>

        {/* Education & Skills */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-slate-900">
            Education & Skills
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-xl font-semibold">Education</h3>
              <ul className="mt-4 space-y-2 text-slate-600">
                <li>• Business Administration</li>
                <li>• Product Management Courses</li>
                <li>• AI/ML Self-learning</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-xl font-semibold">Current Focus</h3>
              <ul className="mt-4 space-y-2 text-slate-600">
                <li>• Product Management</li>
                <li>• AI Product Development</li>
                <li>• User Research & Analytics</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-slate-900">Core Principles</h2>
          <div className="mt-8 space-y-4">
            <PrincipleCard
              title="Problem-Solving First"
              description="Always start with understanding the problem deeply. AI is a tool, not the goal."
            />
            <PrincipleCard
              title="Build in Public"
              description="Share failures and learnings. Growth comes from transparency."
            />
            <PrincipleCard
              title="User-Centric Approach"
              description="Products succeed when they solve real user problems."
            />
            <PrincipleCard
              title="Continuous Learning"
              description="Technology evolves fast. Stay curious and keep learning."
            />
          </div>
        </section>

        {/* Personal Touch */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-slate-900">Beyond Work</h2>
          <p className="mt-4 text-slate-600">
            When I'm not working on products, you'll find me running (training
            for my next marathon), learning new skills from online courses, or
            spending quality time with my family. I believe that diverse
            experiences make better product managers.
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

function PrincipleCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600">{description}</p>
    </div>
  )
}
