'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { ContactMethod } from '@/lib/contentManager'
import {
  Loader2,
  Mail,
  Phone,
  Linkedin,
  Github,
  Twitter,
  Globe,
  MapPin,
  Link as LinkIcon,
} from 'lucide-react'

const ICON_MAP = {
  Mail,
  Phone,
  Linkedin,
  Github,
  Twitter,
  Globe,
  MapPin,
  Link: LinkIcon,
}

export default function ContactPage() {
  const { t, language } = useLanguage()
  const [methods, setMethods] = useState<ContactMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMethods() {
      try {
        const res = await fetch('/api/content/contact')
        if (res.ok) {
          const data = await res.json()
          setMethods(data.methods || [])
        }
      } catch (error) {
        console.error('Failed to fetch contact methods:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMethods()
  }, [])

  const lang = language === 'en' ? 'en' : 'vi'

  function getHref(type: ContactMethod['type'], value: string): string {
    switch (type) {
      case 'email':
        return `mailto:${value}`
      case 'phone':
        return `tel:${value}`
      case 'linkedin':
      case 'github':
      case 'twitter':
      case 'website':
        return value.startsWith('http') ? value : `https://${value}`
      default:
        return '#'
    }
  }

  function getIconComponent(iconName: string) {
    return ICON_MAP[iconName as keyof typeof ICON_MAP] || LinkIcon
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold text-slate-900">{t('contact.title')}</h1>
        <p className="mt-4 text-xl text-slate-600">{t('contact.subtitle')}</p>

        {/* Contact Links */}
        <div className="mt-12 space-y-4">
          {methods.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-slate-600">
                {lang === 'en'
                  ? 'Contact information coming soon.'
                  : 'Thông tin liên hệ sẽ được cập nhật sớm.'}
              </p>
            </div>
          ) : (
            methods.map((method) => {
              const Icon = getIconComponent(method.icon)
              const href = getHref(method.type, method.value)
              const isExternal = method.type !== 'email' && method.type !== 'phone' && method.type !== 'address'

              return (
                <a
                  key={method.id}
                  href={href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="text-primary-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{method.label[lang]}</p>
                    <p className="text-slate-600">{method.value}</p>
                  </div>
                </a>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}
