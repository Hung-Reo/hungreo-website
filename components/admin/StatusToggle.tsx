'use client'

interface StatusToggleProps {
  status: 'draft' | 'published'
  onChange: (status: 'draft' | 'published') => void
  featured?: boolean
  onFeaturedChange?: (featured: boolean) => void
}

export function StatusToggle({
  status,
  onChange,
  featured,
  onFeaturedChange,
}: StatusToggleProps) {
  return (
    <div className="flex items-center gap-6">
      {/* Status Toggle */}
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase block mb-2">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => onChange(e.target.value as 'draft' | 'published')}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Featured Checkbox */}
      {onFeaturedChange !== undefined && (
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase block mb-2">
            Featured
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => onFeaturedChange(e.target.checked)}
              className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-slate-700">Show on homepage</span>
          </label>
        </div>
      )}
    </div>
  )
}
