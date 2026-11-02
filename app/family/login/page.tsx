'use client'

import { useState, FormEvent } from 'react'
import { signIn, getCsrfToken } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const input =
  'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

export default function FamilyLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const requestCode = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/family/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Không gửi được, thử lại sau.')
        return
      }
      setMessage(data.message)
      setStep('code')
    } catch {
      setError('Không gửi được, thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  const submitCode = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const result = await signIn('family-otp', {
        email,
        code,
        csrfToken: await getCsrfToken(),
        redirect: false,
      })
      if (result?.error) {
        setError('Mã không đúng hoặc đã hết hạn. Sai 5 lần thì phải xin mã mới.')
      } else {
        router.push('/family/research')
        router.refresh()
      }
    } catch {
      setError('Có lỗi, thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">Phiếu research của gia đình</h1>
        <p className="mb-6 text-center text-sm text-slate-600">
          Dành cho người nhà đã được Hưng thêm email. Không cần mật khẩu: nhập email, nhận mã 6 số.
        </p>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        {step === 'email' ? (
          <form onSubmit={requestCode} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={input}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang gửi…' : 'Gửi mã'}
            </Button>
          </form>
        ) : (
          <form onSubmit={submitCode} className="space-y-4">
            {message && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-slate-700">
                Mã 6 số (hết hạn sau 10 phút)
              </label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                className={`${input} text-center text-2xl tracking-[0.5em]`}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? 'Đang kiểm…' : 'Vào đọc'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setCode('')
                setMessage('')
              }}
              className="w-full text-sm text-primary-600 hover:underline"
            >
              Đổi email / xin mã mới
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Hưng đăng nhập ở <Link href="/admin/login" className="underline">trang admin</Link>.
        </p>
      </div>
    </div>
  )
}
