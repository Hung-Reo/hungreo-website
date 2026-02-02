/**
 * Visitor analytics tracking (GDPR friendly, no PII)
 * Stores aggregate counts only in Vercel KV
 */

import { kv } from '@vercel/kv'

export interface VisitorStats {
  today: number
  thisWeek: number
  thisMonth: number
  topPages: Array<{ page: string; views: number }>
  devices: { desktop: number; mobile: number }
}

export interface PublicVisitorCount {
  count: number
  monthNumber: number
}

const VN_TIMEZONE = 'Asia/Ho_Chi_Minh'

function getVNDateParts(date = new Date()): { year: string; month: string; day: string } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const year = parts.find(p => p.type === 'year')?.value || '1970'
  const month = parts.find(p => p.type === 'month')?.value || '01'
  const day = parts.find(p => p.type === 'day')?.value || '01'
  return { year, month, day }
}

function getVNDayOfWeek(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

function getVNWeekStartDateString(date = new Date()): string {
  const { year, month, day } = getVNDateParts(date)
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  const dayOfWeek = getVNDayOfWeek(y, m, d)
  const weekStart = new Date(Date.UTC(y, m - 1, d - dayOfWeek))
  const wsYear = weekStart.getUTCFullYear()
  const wsMonth = String(weekStart.getUTCMonth() + 1).padStart(2, '0')
  const wsDay = String(weekStart.getUTCDate()).padStart(2, '0')
  return `${wsYear}-${wsMonth}-${wsDay}`
}

function sanitizePathname(pathname: string): string {
  return pathname
    .replace(/\/admin\/reset-password\/[^/]+/, '/admin/reset-password/[token]')
    .replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '/[id]')
    .replace(/\/[a-f0-9]{32,}/gi, '/[token]')
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(16)
}

function generateVisitorHash(date: string, userAgent: string, deviceType: string): string {
  const data = `${date}|${userAgent}|${deviceType}`
  return hashString(data).substring(0, 16)
}

function isBotUserAgent(userAgent: string): boolean {
  if (!userAgent) return true
  const botPattern = /bot|crawler|spider|crawling|headless|lighthouse|pingdom|uptimerobot|facebookexternalhit|slackbot|discordbot|embedly|quora link preview|whatsapp|telegrambot|googlebot|bingbot|yandex|baiduspider|duckduckbot|facebot|ia_archiver/i
  return botPattern.test(userAgent)
}

function getYearMonthKey(date = new Date()): { yearMonth: string; dateKey: string; monthNumber: number } {
  const { year, month, day } = getVNDateParts(date)
  return {
    yearMonth: `${year}-${month}`,
    dateKey: `${year}-${month}-${day}`,
    monthNumber: Number(month),
  }
}

async function getTopPages(yearMonth: string, limit = 5): Promise<Array<{ page: string; views: number }>> {
  const pages = await kv.hgetall<Record<string, number>>(`visitors:${yearMonth}:pages`)
  if (!pages) return []

  return Object.entries(pages)
    .map(([page, views]) => ({ page, views: Number(views) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
}

async function getDeviceBreakdown(yearMonth: string): Promise<{ desktop: number; mobile: number }> {
  const devices = await kv.hgetall<Record<string, number>>(`visitors:${yearMonth}:devices`)
  return {
    desktop: Number(devices?.desktop || 0),
    mobile: Number(devices?.mobile || 0),
  }
}

export async function trackPageView(page: string, userAgent: string, screenWidth: number): Promise<void> {
  try {
    if (!page) return
    if (isBotUserAgent(userAgent)) return

    const { yearMonth, dateKey } = getYearMonthKey()
    const weekStart = getVNWeekStartDateString()
    const device = screenWidth >= 1024 ? 'desktop' : 'mobile'
    const dailyHash = generateVisitorHash(dateKey, userAgent, device)
    const weeklyHash = generateVisitorHash(weekStart, userAgent, device)
    const monthlyHash = generateVisitorHash(yearMonth, userAgent, device)
    const sanitizedPage = sanitizePathname(page)

    await Promise.all([
      kv.sadd(`visitors:daily:${dateKey}`, dailyHash),
      kv.sadd(`visitors:weekly:${weekStart}`, weeklyHash),
      kv.sadd(`visitors:${yearMonth}:unique`, monthlyHash),
      kv.hincrby(`visitors:${yearMonth}:pages`, sanitizedPage, 1),
      kv.hincrby(`visitors:${yearMonth}:devices`, device, 1),
    ])
  } catch (error) {
    console.error('Failed to track page view:', error)
  }
}

export async function getMonthlyStats(yearMonth: string): Promise<{ uniqueCount: number }> {
  try {
    const uniqueCount = (await kv.scard(`visitors:${yearMonth}:unique`)) || 0
    return { uniqueCount: Number(uniqueCount) }
  } catch (error) {
    console.error('Failed to get monthly stats:', error)
    return { uniqueCount: 0 }
  }
}

export async function getPublicVisitorCount(): Promise<PublicVisitorCount> {
  const { yearMonth, monthNumber } = getYearMonthKey()
  const count = (await kv.scard(`visitors:${yearMonth}:unique`)) || 0
  return { count: Number(count), monthNumber }
}

export async function getVisitorStats(): Promise<VisitorStats> {
  try {
    const { yearMonth, dateKey } = getYearMonthKey()
    const weekStart = getVNWeekStartDateString()

    const [todayCount, weekCount, monthCount, topPages, devices] = await Promise.all([
      kv.scard(`visitors:daily:${dateKey}`),
      kv.scard(`visitors:weekly:${weekStart}`),
      kv.scard(`visitors:${yearMonth}:unique`),
      getTopPages(yearMonth, 5),
      getDeviceBreakdown(yearMonth),
    ])

    return {
      today: Number(todayCount || 0),
      thisWeek: Number(weekCount || 0),
      thisMonth: Number(monthCount || 0),
      topPages,
      devices,
    }
  } catch (error) {
    console.error('Failed to get visitor stats:', error)
    return {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      topPages: [],
      devices: { desktop: 0, mobile: 0 },
    }
  }
}

export async function resetVisitorStats(scope: 'today' | 'week' | 'month' = 'month'): Promise<void> {
  try {
    const { yearMonth, dateKey } = getYearMonthKey()
    const weekStart = getVNWeekStartDateString()
    const keysToDelete: string[] = []

    if (scope === 'today') {
      keysToDelete.push(`visitors:daily:${dateKey}`)
    }

    if (scope === 'week') {
      keysToDelete.push(`visitors:weekly:${weekStart}`)
    }

    if (scope === 'month') {
      keysToDelete.push(
        `visitors:${yearMonth}:unique`,
        `visitors:${yearMonth}:pages`,
        `visitors:${yearMonth}:devices`,
        `visitors:weekly:${weekStart}`,
        `visitors:daily:${dateKey}`
      )
    }

    if (keysToDelete.length > 0) {
      await kv.del(...keysToDelete)
    }
  } catch (error) {
    console.error('Failed to reset visitor stats:', error)
  }
}
