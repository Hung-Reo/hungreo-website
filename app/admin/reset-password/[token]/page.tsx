'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newHash, setNewHash] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: params.token,
          newPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setNewHash(data.newPasswordHash)
        toast.success('Password reset successful!')
      } else {
        toast.error(data.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
              <Lock className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
            <p className="text-slate-600 mt-2">Enter your new password below</p>
          </div>

          {!newHash ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">At least 8 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Password Reset Successful!</p>
                    <p className="text-sm text-green-700 mt-1">
                      Your password has been updated. You can now log in with your new password.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  📋 For Production: Update Environment Variable
                </p>
                <p className="text-xs text-blue-700 mb-2">
                  Copy this hash and add it to Vercel → Settings → Environment Variables:
                </p>
                <div className="bg-white border rounded p-2 font-mono text-xs break-all">
                  ADMIN_PASSWORD_HASH={newHash}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newHash)
                    toast.success('Hash copied to clipboard!')
                  }}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Copy hash to clipboard
                </button>
              </div>

              <button
                onClick={() => router.push('/admin/login')}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
