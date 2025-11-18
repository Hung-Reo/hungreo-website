'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Heart, BookOpen } from 'lucide-react'

// Custom 4-petal flower icon (clover pattern)
const FlowerIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      {/* Top petal */}
      <circle cx="12" cy="6" r="4" opacity="0.9" />
      {/* Right petal */}
      <circle cx="18" cy="12" r="4" opacity="0.9" />
      {/* Bottom petal */}
      <circle cx="12" cy="18" r="4" opacity="0.9" />
      {/* Left petal */}
      <circle cx="6" cy="12" r="4" opacity="0.9" />
      {/* Center */}
      <circle cx="12" cy="12" r="2.5" />
    </g>
  </svg>
)

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

  // Family Values Framework - 3 columns like the wall poster
  const values = {
    en: {
      title: 'Văn Hóa Gia Đình',
      subtitle: 'Hướng tới Hạnh Phúc, Vui Vẻ và Ấm Áp',
      quote: '"Family is where each person finds their true self, is loved unconditionally, and grows together"',
      values: [
        {
          name: 'Sống Thật',
          subtitle: 'BE AUTHENTIC',
          icon: FlowerIcon,
          description:
            'Know yourself, Understand yourself, and Be your authentic self with consistency: Think honestly, Speak honestly, and Act honestly',
          color: 'from-teal-400 to-teal-500',
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-200',
        },
        {
          name: 'Tình Yêu Thương',
          subtitle: 'UNCONDITIONAL LOVE',
          icon: Heart,
          description:
            'Unconditional love with respect for individual freedom, sharing, forgiveness, and helping each other in daily life',
          color: 'from-rose-400 to-rose-500',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
        },
        {
          name: 'Học Tập và Rèn Luyện',
          subtitle: 'GROWTH MINDSET',
          icon: BookOpen,
          description:
            'Learning and Practice to build good habits: Exercise, Reflection, and Simplicity',
          color: 'from-blue-400 to-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        },
      ],
    },
    vi: {
      title: 'Văn Hóa Gia Đình',
      subtitle: 'Hướng tới Hạnh Phúc, Vui Vẻ và Ấm Áp',
      quote:
        '"Gia đình là nơi mỗi người tìm thấy bản thân thật, được yêu thương vô điều kiện và cùng nhau phát triển"',
      values: [
        {
          name: 'Sống Thật',
          subtitle: 'BE AUTHENTIC',
          icon: FlowerIcon,
          description:
            'Biết mình, Hiểu mình và Là mình với phương châm Suy nghĩ thật, Nói thật và Làm phải nhất quán',
          color: 'from-teal-400 to-teal-500',
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-200',
        },
        {
          name: 'Tình Yêu Thương',
          subtitle: 'UNCONDITIONAL LOVE',
          icon: Heart,
          description:
            'Vô Điều Kiện với Tôn trọng sự tự do cá nhân, chia sẻ, tha thứ, và giúp đỡ mọi việc trong cuộc sống',
          color: 'from-rose-400 to-rose-500',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
        },
        {
          name: 'Học Tập và Rèn Luyện',
          subtitle: 'GROWTH MINDSET',
          icon: BookOpen,
          description:
            'Học tập và Rèn Luyện thói quen tốt: như Tập thể dục, Phản ánh, và Đơn giản',
          color: 'from-blue-400 to-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        },
      ],
    },
  }

  const content = values[lang]

  return (
    <div className={embedded ? '' : 'py-8'}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <svg
            className="w-8 h-8 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-800">{content.title}</h3>
        </div>
        <p className="text-sm md:text-base text-slate-600 mb-4">{content.subtitle}</p>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {content.values.map((value, index) => {
          const Icon = value.icon
          return (
            <div
              key={index}
              className={`${value.bgColor} ${value.borderColor} border-2 rounded-lg p-6 hover:shadow-lg transition-shadow`}
            >
              {/* Icon & Title */}
              <div className="text-center mb-4">
                <div
                  className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${value.color} flex items-center justify-center shadow-md`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-1">{value.name}</h4>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {value.subtitle}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-700 leading-relaxed text-center">
                {value.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Quote */}
      <div className="mt-8 text-center max-w-3xl mx-auto">
        <p className="text-sm md:text-base italic text-slate-600 border-l-4 border-slate-300 pl-4 py-2">
          {content.quote}
        </p>
      </div>

      {/* Date */}
      {!embedded && (
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">Cập nhật: 12/12/2024</p>
        </div>
      )}
    </div>
  )
}
