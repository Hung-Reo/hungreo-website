import { Metadata } from 'next'
import { Shield, Lock, Eye, Server, FileCheck, CheckCircle, XCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Security & Privacy | Hung Dinh',
  description: 'Learn about our security practices and how we protect your data',
}

export default function SecurityPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-10 w-10 text-primary-600" />
          <h1 className="text-4xl font-bold">Security & Privacy</h1>
        </div>
        <p className="text-lg text-slate-600">
          At Hungreo, we take the security and privacy of your data seriously. This page outlines the measures we've implemented to protect your information.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Last Updated: January 13, 2025
        </p>
      </div>

      {/* Our Commitment */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Lock className="h-6 w-6 text-primary-600" />
          Our Commitment to Security
        </h2>
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-slate-700">
            We implement industry-standard security practices to ensure your data is protected at all times.
            Our website is secured with HTTPS encryption, rate limiting, and comprehensive input validation.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary-600" />
          Security Features
        </h2>

        <div className="space-y-6">
          {/* Data Protection */}
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Server className="h-5 w-5 text-primary-600" />
              1. Data Protection
            </h3>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Encrypted Connections:</strong> All data transmitted between your browser and our servers is encrypted using HTTPS/TLS.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>No Personal Data Collection:</strong> Our chatbot does not collect or store personal information (names, emails, phone numbers).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Secure Storage:</strong> Chat logs are stored in encrypted databases with automatic 90-day expiration.</span>
              </li>
            </ul>
          </div>

          {/* Rate Limiting */}
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary-600" />
              2. Rate Limiting & Abuse Prevention
            </h3>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Chatbot Rate Limiting:</strong> Limited to 10 messages per minute to prevent spam and abuse.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Admin Protection:</strong> Login attempts limited to 5 per 15 minutes with automatic lockout.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>File Upload Limits:</strong> Maximum 5 uploads per 10 minutes to prevent storage abuse.</span>
              </li>
            </ul>
          </div>

          {/* Input Validation */}
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary-600" />
              3. Input Validation
            </h3>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>XSS Prevention:</strong> All user input is sanitized to prevent cross-site scripting attacks.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>File Type Validation:</strong> Only safe file types (PDF, DOCX, TXT) are allowed for uploads.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Message Length Limits:</strong> Chat messages limited to 1-1000 characters.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* What Data We Collect */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Eye className="h-6 w-6 text-primary-600" />
          What Data We Collect
        </h2>

        <div className="border rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-3">Chatbot Conversations</h3>
          <div className="space-y-2 text-slate-700">
            <p><strong>What we collect:</strong> Your questions, AI responses, timestamp, page context</p>
            <p><strong>Why we collect it:</strong> To improve chatbot accuracy and user experience</p>
            <p><strong>How long we keep it:</strong> 90 days (automatic deletion)</p>
            <p><strong>Who can access it:</strong> Admin only (not sold or shared with third parties)</p>
            <p><strong>Your rights:</strong> You can request deletion of your data at any time</p>
          </div>
        </div>

        <div className="bg-slate-50 border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">No Personal Identification</h3>
          <p className="mb-3 text-slate-700">We do not collect:</p>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Names</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Email addresses (except for admin login)</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Phone numbers</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>IP addresses (used only for rate limiting, not stored long-term)</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Location data</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Third-Party Services */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Third-Party Services</h2>
        <p className="text-slate-700 mb-4">We use the following trusted third-party services:</p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead className="bg-slate-100">
              <tr>
                <th className="border p-3 text-left">Service</th>
                <th className="border p-3 text-left">Purpose</th>
                <th className="border p-3 text-left">Data Shared</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-3"><strong>OpenAI</strong></td>
                <td className="border p-3">AI chatbot responses</td>
                <td className="border p-3">User messages (not stored by OpenAI)</td>
              </tr>
              <tr>
                <td className="border p-3"><strong>Vercel</strong></td>
                <td className="border p-3">Website hosting</td>
                <td className="border p-3">None (infrastructure only)</td>
              </tr>
              <tr>
                <td className="border p-3"><strong>Upstash Redis</strong></td>
                <td className="border p-3">Chat log storage</td>
                <td className="border p-3">Chat conversations</td>
              </tr>
              <tr>
                <td className="border p-3"><strong>Pinecone</strong></td>
                <td className="border p-3">Document search (RAG)</td>
                <td className="border p-3">Document embeddings</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* GDPR Compliance */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">GDPR Compliance</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Right to Access</h3>
            </div>
            <p className="text-sm text-slate-700">Request a copy of your chat logs</p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Right to Deletion</h3>
            </div>
            <p className="text-sm text-slate-700">Request deletion of your data</p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Right to Object</h3>
            </div>
            <p className="text-sm text-slate-700">Opt-out of data collection</p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Data Minimization</h3>
            </div>
            <p className="text-sm text-slate-700">We only collect what's necessary</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Security Incident Response</h2>
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
          <p className="text-slate-700 mb-4">
            If you discover a security vulnerability, please report it to:
          </p>
          <p className="text-slate-700">
            <strong>Email:</strong> <a href="mailto:hungreo2005@gmail.com" className="text-primary-600 hover:underline">hungreo2005@gmail.com</a>
          </p>
          <p className="text-slate-700 mt-4">We will:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 mt-2">
            <li>Acknowledge your report within 24 hours</li>
            <li>Investigate and confirm the issue</li>
            <li>Patch the vulnerability within 7 days (critical) or 30 days (non-critical)</li>
            <li>Notify affected users if necessary</li>
          </ol>
        </div>
      </section>

      {/* Compliance Badges */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Compliance & Certifications</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 border rounded-lg p-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="text-slate-700"><strong>HTTPS/TLS Encryption</strong> - All connections encrypted</span>
          </div>
          <div className="flex items-center gap-3 border rounded-lg p-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="text-slate-700"><strong>OWASP Top 10 Protection</strong> - Mitigated common vulnerabilities</span>
          </div>
          <div className="flex items-center gap-3 border rounded-lg p-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="text-slate-700"><strong>GDPR Compliant</strong> - User data rights respected</span>
          </div>
          <div className="flex items-center gap-3 border rounded-lg p-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="text-slate-700"><strong>Regular Security Audits</strong> - Quarterly reviews</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t pt-8 text-center text-sm text-slate-600">
        <p>For security or privacy questions, contact: <a href="mailto:hungreo2005@gmail.com" className="text-primary-600 hover:underline">hungreo2005@gmail.com</a></p>
        <p className="mt-2">Last Security Audit: January 13, 2025 | Next Scheduled Audit: April 13, 2025</p>
        <p className="mt-4 text-xs">This page is updated regularly. Last update: January 13, 2025</p>
      </div>
    </div>
  )
}
