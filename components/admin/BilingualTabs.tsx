'use client'

interface BilingualTabsProps {
  activeTab: 'en' | 'vi'
  onChange: (tab: 'en' | 'vi') => void
}

export function BilingualTabs({ activeTab, onChange }: BilingualTabsProps) {
  return (
    <div className="border-b">
      <div className="flex px-6">
        <button
          onClick={() => onChange('en')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'en'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          English
        </button>
        <button
          onClick={() => onChange('vi')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'vi'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Tiếng Việt
        </button>
      </div>
    </div>
  )
}
