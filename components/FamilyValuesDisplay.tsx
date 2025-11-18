'use client'

import { useLanguage } from '@/contexts/LanguageContext'

interface FamilyValuesDisplayProps {
  size?: 'small' | 'medium' | 'large'
  showDescription?: boolean
  embedded?: boolean
}

export function FamilyValuesDisplay({
  size = 'medium',
  showDescription = false,
  embedded = false,
}: FamilyValuesDisplayProps) {
  const { language } = useLanguage()
  const lang = language === 'en' ? 'en' : 'vi'

  // Family Values Framework - 4 core values in a cycle
  const values = {
    en: {
      title: 'Family Values Framework',
      values: [
        { name: 'Sống Thật', translation: 'Living Authentically', position: 'top' },
        { name: 'Tình Yêu Thương', translation: 'Love & Compassion', position: 'right' },
        { name: 'Phục Vụ', translation: 'Service', position: 'bottom' },
        { name: 'Học Tập', translation: 'Learning', position: 'left' },
      ],
      description: 'A cyclical framework of values that strengthen each other',
    },
    vi: {
      title: 'Khung Giá Trị Gia Đình',
      values: [
        { name: 'Sống Thật', translation: 'Sống chân thật', position: 'top' },
        { name: 'Tình Yêu Thương', translation: 'Yêu thương & Từ bi', position: 'right' },
        { name: 'Phục Vụ', translation: 'Phục vụ cộng đồng', position: 'bottom' },
        { name: 'Học Tập', translation: 'Học hỏi không ngừng', position: 'left' },
      ],
      description: 'Một khung giá trị tuần hoàn, tương hỗ lẫn nhau',
    },
  }

  const content = values[lang]

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-64 h-64',
      text: 'text-xs',
      centerCircle: 'w-16 h-16',
      valueCircle: 'w-24 h-24',
      arrow: 'w-8',
    },
    medium: {
      container: 'w-80 h-80 md:w-96 md:h-96',
      text: 'text-sm md:text-base',
      centerCircle: 'w-20 h-20 md:w-24 md:h-24',
      valueCircle: 'w-28 h-28 md:w-32 md:h-32',
      arrow: 'w-10 md:w-12',
    },
    large: {
      container: 'w-96 h-96 md:w-[32rem] md:h-[32rem]',
      text: 'text-base md:text-lg',
      centerCircle: 'w-24 h-24 md:w-32 md:h-32',
      valueCircle: 'w-32 h-32 md:w-40 md:h-40',
      arrow: 'w-12 md:w-16',
    },
  }

  const config = sizeConfig[size]

  return (
    <div className={embedded ? '' : 'py-8'}>
      {!embedded && showDescription && (
        <div className="mb-6 text-center">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">{content.title}</h3>
          <p className="text-slate-600">{content.description}</p>
        </div>
      )}

      {/* Circular Framework */}
      <div className={`relative mx-auto ${config.container}`}>
        {/* Center Circle - "Văn Hóa" */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${config.centerCircle} bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg`}
        >
          <span className="text-white font-bold text-sm md:text-base text-center">
            Văn Hóa
            <br />
            <span className="text-xs">Culture</span>
          </span>
        </div>

        {/* Top: Sống Thật */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 ${config.valueCircle} bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-md`}
        >
          <div className="text-center px-2">
            <div className="font-bold text-white text-sm md:text-base leading-tight">
              Sống Thật
            </div>
            {size !== 'small' && (
              <div className="text-xs text-green-50 mt-1">
                {lang === 'en' ? 'Authentic' : 'Chân thật'}
              </div>
            )}
          </div>
        </div>

        {/* Right: Tình Yêu Thương */}
        <div
          className={`absolute right-0 top-1/2 -translate-y-1/2 ${config.valueCircle} bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center shadow-md`}
        >
          <div className="text-center px-2">
            <div className="font-bold text-white text-sm md:text-base leading-tight">
              Tình
              <br />
              Yêu Thương
            </div>
            {size !== 'small' && (
              <div className="text-xs text-pink-50 mt-1">
                {lang === 'en' ? 'Love' : 'Yêu thương'}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Phục Vụ */}
        <div
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${config.valueCircle} bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-md`}
        >
          <div className="text-center px-2">
            <div className="font-bold text-white text-sm md:text-base leading-tight">
              Phục Vụ
            </div>
            {size !== 'small' && (
              <div className="text-xs text-orange-50 mt-1">
                {lang === 'en' ? 'Service' : 'Phục vụ'}
              </div>
            )}
          </div>
        </div>

        {/* Left: Học Tập */}
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 ${config.valueCircle} bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center shadow-md`}
        >
          <div className="text-center px-2">
            <div className="font-bold text-white text-sm md:text-base leading-tight">
              Học Tập
            </div>
            {size !== 'small' && (
              <div className="text-xs text-purple-50 mt-1">
                {lang === 'en' ? 'Learning' : 'Học hỏi'}
              </div>
            )}
          </div>
        </div>

        {/* Arrows showing the cycle (clockwise) */}
        {/* Top → Right */}
        <div className="absolute top-[20%] right-[20%] transform rotate-45">
          <svg
            className={`${config.arrow} text-slate-400`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* Right → Bottom */}
        <div className="absolute bottom-[20%] right-[20%] transform rotate-[135deg]">
          <svg
            className={`${config.arrow} text-slate-400`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* Bottom → Left */}
        <div className="absolute bottom-[20%] left-[20%] transform rotate-[225deg]">
          <svg
            className={`${config.arrow} text-slate-400`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* Left → Top */}
        <div className="absolute top-[20%] left-[20%] transform rotate-[315deg]">
          <svg
            className={`${config.arrow} text-slate-400`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>

      {embedded && size !== 'small' && (
        <p className="text-center text-xs text-slate-500 mt-4 italic">
          {lang === 'en'
            ? 'A cyclical framework where each value strengthens the others'
            : 'Một khung giá trị tuần hoàn, tương hỗ lẫn nhau'}
        </p>
      )}
    </div>
  )
}
