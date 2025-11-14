/**
 * Language Context for Bilingual Support (EN/VI)
 * Client-side language switching with localStorage persistence
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'en' | 'vi'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation dictionary
const translations = {
  en: {
    // Header Navigation
    'header.home': 'Home',
    'header.about': 'About',
    'header.projects': 'Projects',
    'header.blog': 'Blog',
    'header.aiTools': 'AI Tools',
    'header.contact': 'Contact',
    'header.admin': 'Admin',
    'header.language': 'Language',
    'header.switchTo': 'Tiếng Việt',

    // Footer
    'footer.copyright': '© {year} Hung Dinh. All rights reserved.',
    'footer.security': 'Secured with HTTPS | GDPR Compliant | No Tracking',
    'footer.learnMore': 'Learn More',
    'footer.email': 'Email',
    'footer.linkedin': 'LinkedIn',
    'footer.github': 'GitHub',
    'footer.securityPage': 'Security',

    // Knowledge/Videos Page
    'knowledge.title': 'AI Tools - Video Library',
    'knowledge.subtitle': 'Explore curated videos organized by category',
    'knowledge.categories.leadership': 'Leadership',
    'knowledge.categories.aiWorks': 'AI Works',
    'knowledge.categories.health': 'Health',
    'knowledge.categories.entertaining': 'Entertaining',
    'knowledge.categories.philosophy': 'Human Philosophy',
    'knowledge.videoCount': '{count} video(s)',
    'knowledge.browseVideos': 'Browse videos',

    // Common
    'common.readMore': 'Read more',
    'common.loading': 'Loading...',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',

    // Video-related
    'video.transcript': 'Transcript',
    'video.summary': 'Summary',
    'video.duration': 'Duration',
    'video.publishedAt': 'Published on',
    'video.category': 'Category',
    'video.relatedVideos': 'Related Videos',

    // ChatBot
    'chatbot.title': 'AI Assistant',
    'chatbot.placeholder': 'Ask me anything...',
    'chatbot.send': 'Send',
    'chatbot.thinking': 'Thinking...',
    'chatbot.error': 'Sorry, I encountered an error. Please try again.',
  },
  vi: {
    // Header Navigation
    'header.home': 'Trang chủ',
    'header.about': 'Giới thiệu',
    'header.projects': 'Dự án',
    'header.blog': 'Blog',
    'header.aiTools': 'Công cụ AI',
    'header.contact': 'Liên hệ',
    'header.admin': 'Quản trị',
    'header.language': 'Ngôn ngữ',
    'header.switchTo': 'English',

    // Footer
    'footer.copyright': '© {year} Hung Dinh. Bảo lưu mọi quyền.',
    'footer.security': 'Bảo mật HTTPS | Tuân thủ GDPR | Không theo dõi',
    'footer.learnMore': 'Tìm hiểu thêm',
    'footer.email': 'Email',
    'footer.linkedin': 'LinkedIn',
    'footer.github': 'GitHub',
    'footer.securityPage': 'Bảo mật',

    // Knowledge/Videos Page
    'knowledge.title': 'Công cụ AI - Thư viện Video',
    'knowledge.subtitle': 'Khám phá các video được tuyển chọn theo danh mục',
    'knowledge.categories.leadership': 'Lãnh đạo',
    'knowledge.categories.aiWorks': 'AI & Công nghệ',
    'knowledge.categories.health': 'Sức khỏe',
    'knowledge.categories.entertaining': 'Giải trí',
    'knowledge.categories.philosophy': 'Triết học con người',
    'knowledge.videoCount': '{count} video',
    'knowledge.browseVideos': 'Duyệt video',

    // Common
    'common.readMore': 'Đọc thêm',
    'common.loading': 'Đang tải...',
    'common.back': 'Quay lại',
    'common.next': 'Tiếp theo',
    'common.previous': 'Trước đó',
    'common.search': 'Tìm kiếm',
    'common.filter': 'Lọc',
    'common.sort': 'Sắp xếp',

    // Video-related
    'video.transcript': 'Bản ghi',
    'video.summary': 'Tóm tắt',
    'video.duration': 'Thời lượng',
    'video.publishedAt': 'Xuất bản ngày',
    'video.category': 'Danh mục',
    'video.relatedVideos': 'Video liên quan',

    // ChatBot
    'chatbot.title': 'Trợ lý AI',
    'chatbot.placeholder': 'Hỏi tôi bất cứ điều gì...',
    'chatbot.send': 'Gửi',
    'chatbot.thinking': 'Đang suy nghĩ...',
    'chatbot.error': 'Xin lỗi, tôi gặp lỗi. Vui lòng thử lại.',
  },
}

/**
 * Language Provider Component
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('language') as Language
    if (saved && (saved === 'en' || saved === 'vi')) {
      setLanguageState(saved)
    }
  }, [])

  // Save to localStorage when language changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  // Translation function with dynamic variable replacement
  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations['en']]
    return translation || key
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

/**
 * Custom hook to use Language Context
 */
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
