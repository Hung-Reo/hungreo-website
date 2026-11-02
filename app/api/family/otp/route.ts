import { NextRequest, NextResponse, after } from 'next/server'
import { familyAllowlist } from '@/lib/research/access'
import { emailHash, issueOtp, kvOtpStore, normalizeEmail } from '@/lib/familyOtp'
import { sendFamilyCodeViaGmail } from '@/lib/gmailSender'
import { familyOtpEmailDailyRateLimit, familyOtpEmailRateLimit, familyOtpIpRateLimit, getClientIp } from '@/lib/rateLimit'

// Same answer whether or not the address is on the list, so the form cannot be
// used to find out who is in the family.
const GENERIC = { message: 'Nếu email có trong danh sách, mã đã được gửi. Kiểm tra hộp thư (cả mục Spam).' }

function isSameOrigin(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const host = req.headers.get('host')
  for (const header of ['origin', 'referer']) {
    const value = req.headers.get(header)
    if (!value) continue
    try {
      if (new URL(value).host === host) return true
    } catch {
      // ignore malformed header
    }
  }
  return false
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ip = await familyOtpIpRateLimit.limit(getClientIp(req))
  if (!ip.success) {
    return NextResponse.json({ error: 'Bạn thử nhiều quá, chờ 15 phút rồi thử lại.' }, { status: 429 })
  }

  let email: unknown
  try {
    ;({ email } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Thiếu email' }, { status: 400 })
  }
  if (typeof email !== 'string' || email.length > 254 || !email.includes('@')) {
    return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 })
  }

  const normalized = normalizeEmail(email)
  const hash = await emailHash(normalized)
  const [perEmail, perEmailDaily] = await Promise.all([
    familyOtpEmailRateLimit.limit(hash),
    familyOtpEmailDailyRateLimit.limit(hash),
  ])

  // Issue and send after the response, so listed and unlisted addresses answer
  // equally fast and the reply time cannot reveal who is on the family list.
  if (perEmail.success && perEmailDaily.success && familyAllowlist().has(normalized)) {
    after(async () => {
      try {
        const code = await issueOtp(kvOtpStore, normalized)
        if (!(await sendFamilyCodeViaGmail(normalized, code))) {
          console.error('[FamilyOTP] Code not sent: mail transport unavailable')
        }
      } catch (error) {
        console.error('[FamilyOTP] Issue failed:', error instanceof Error ? error.name : 'unknown')
      }
    })
  }
  return NextResponse.json(GENERIC)
}
