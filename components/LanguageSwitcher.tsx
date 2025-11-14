/**
 * Language Switcher Component
 * Toggle between English and Vietnamese
 */

'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en')
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-primary-400 hover:text-primary-600 active:scale-95"
      aria-label={t('header.language')}
      title={`Switch to ${language === 'en' ? 'Vietnamese' : 'English'}`}
    >
      <Globe className="h-4 w-4" />
      <span className="hidden sm:inline">{t('header.switchTo')}</span>
      <span className="inline sm:hidden">{language === 'en' ? 'VI' : 'EN'}</span>
    </button>
  )
}
