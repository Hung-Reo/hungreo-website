'use client'

import { useState } from 'react'
import { Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitted(true)
        toast.success('Password reset email sent!')
      } else {
        toast.error(data.error || 'Failed to send reset email')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Back to Login */}
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        {/* Card */}
        <div className="bg-white rounded-lg border shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
              <Mail className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Forgot Password?</h1>
            <p className="text-slate-600 mt-2">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="hungreo2005@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800">
                  ✅ If this email is registered, a password reset link has been sent.
                </p>
              </div>
              <p className="text-sm text-slate-600">
                Check your inbox and click the link to reset your password.
                <br />
                The link will expire in 15 minutes.
              </p>
              <Link
                href="/admin/login"
                className="inline-block mt-4 text-sm text-primary-600 hover:underline"
              >
                Return to login
              </Link>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <p className="text-xs text-slate-500 text-center mt-4">
          For security reasons, we don't disclose whether an email is registered.
        </p>
      </div>
    </div>
  )
}
