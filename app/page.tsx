import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold text-slate-900 md:text-6xl">
          Hung Dinh
        </h1>
        <p className="mt-4 text-xl text-slate-600 md:text-2xl">
          Product Manager | AI Enthusiast | Problem Solver
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-slate-600">
          Transitioning from Business Analyst to Product Manager,
          building AI-powered solutions and sharing lessons learned along the way.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            View Projects
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
          >
            About Me
          </Link>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold">Problem-First Mindset</h3>
            <p className="mt-2 text-slate-600">
              Understanding the problem deeply before jumping to solutions
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold">AI as a Tool</h3>
            <p className="mt-2 text-slate-600">
              Leveraging AI to solve real problems, not technology for technology's sake
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold">Build in Public</h3>
            <p className="mt-2 text-slate-600">
              Sharing failures and learnings to help others grow
            </p>
          </div>
        </div>
      </section>

      {/* Placeholder for Projects */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-slate-900">Featured Projects</h2>
        <p className="mt-4 text-slate-600">
          Projects coming soon... Building in progress! 🚀
        </p>
      </section>

      {/* Placeholder for Blog */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-slate-900">Latest Posts</h2>
        <p className="mt-4 text-slate-600">
          Blog posts coming soon... Stay tuned! ✍️
        </p>
      </section>
    </div>
  )
}
