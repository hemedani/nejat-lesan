'use client'

import React, { useState } from 'react'
import ChartsFilterSidebar, { RoadDefectsFilterState } from './ChartsFilterSidebar'

// Define different configuration presets for demonstration
const configPresets = {
  default: {
    disableSeverityFilter: false,
    disableCollisionTypeFilter: false,
    disableLightingFilter: false,
    lockToSevereAccidents: false
  },
  roadDefects: {
    disableSeverityFilter: false,
    disableCollisionTypeFilter: false,
    disableLightingFilter: false,
    lockToSevereAccidents: true // Lock to severe accidents only
  },
  lightingAnalysis: {
    disableSeverityFilter: false,
    disableCollisionTypeFilter: true, // Disable collision type for lighting analysis
    disableLightingFilter: false,
    lockToSevereAccidents: false
  },
  severityFocus: {
    disableSeverityFilter: true, // Disable severity filter completely
    disableCollisionTypeFilter: false,
    disableLightingFilter: false,
    lockToSevereAccidents: false
  }
}

type ConfigPresetKey = keyof typeof configPresets

const ChartsFilterExample: React.FC = () => {
  const [activePreset, setActivePreset] = useState<ConfigPresetKey>('default')
  const [appliedFilters, setAppliedFilters] = useState<RoadDefectsFilterState | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)

  // Handle filter application
  const handleApplyFilters = (filters: RoadDefectsFilterState) => {
    setAppliedFilters(filters)
    console.log('Applied Filters:', filters)
  }

  // Preset descriptions in Persian
  const presetDescriptions = {
    default: 'پیکربندی پیش‌فرض - همه فیلترها فعال',
    roadDefects: 'تحلیل نقایص راه - فقط تصادفات شدید قابل انتخاب',
    lightingAnalysis: 'تحلیل روشنایی - نوع برخورد غیرفعال',
    severityFocus: 'تمرکز بر شدت - فیلتر شدت غیرفعال'
  }

  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      {/* Control Panel */}
      <div className="w-96 bg-white border-l border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          نمونه استفاده از فیلتر ساید بار
        </h1>

        {/* Preset Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            انتخاب پیکربندی:
          </h2>
          <div className="space-y-3">
            {Object.entries(presetDescriptions).map(([key, description]) => (
              <button
                key={key}
                onClick={() => setActivePreset(key as ConfigPresetKey)}
                className={`w-full text-right p-3 rounded-lg border-2 transition-all ${
                  activePreset === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{description}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {key}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Configuration Display */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            پیکربندی فعلی:
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 font-mono">
              {JSON.stringify(configPresets[activePreset], null, 2)}
            </pre>
          </div>
        </div>

        {/* Toggle Sidebar */}
        <div className="mb-8">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            {showSidebar ? 'مخفی کردن ساید بار' : 'نمایش ساید بار'}
          </button>
        </div>

        {/* Applied Filters Display */}
        {appliedFilters && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              فیلترهای اعمال شده:
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {/* Time Range */}
                <div>
                  <h3 className="font-medium text-green-800">بازه زمانی:</h3>
                  <p className="text-sm text-green-700">
                    {appliedFilters.dateOfAccidentFrom && appliedFilters.dateOfAccidentTo
                      ? `از ${appliedFilters.dateOfAccidentFrom} تا ${appliedFilters.dateOfAccidentTo}`
                      : 'تعیین نشده'}
                  </p>
                </div>

                {/* Geographic */}
                <div>
                  <h3 className="font-medium text-green-800">محدوده مکانی:</h3>
                  <p className="text-sm text-green-700">
                    استان: {appliedFilters.province?.join(', ') || 'انتخاب نشده'} |
                    شهر: {appliedFilters.city?.join(', ') || 'انتخاب نشده'}
                  </p>
                </div>

                {/* Severity */}
                <div>
                  <h3 className="font-medium text-green-800">شدت تصادف:</h3>
                  <p className="text-sm text-green-700">
                    حداقل فوتی: {appliedFilters.deadCountMin || 0} |
                    حداقل مجروح: {appliedFilters.injuredCountMin || 0}
                  </p>
                </div>

                {/* Filters Applied */}
                <div>
                  <h3 className="font-medium text-green-800">فیلترهای اعمال شده:</h3>
                  <p className="text-sm text-green-700">
                    {[
                      appliedFilters.lightStatus?.length ? `روشنایی: ${appliedFilters.lightStatus.join(', ')}` : null,
                      appliedFilters.collisionType?.length ? `نوع برخورد: ${appliedFilters.collisionType.join(', ')}` : null,
                      appliedFilters.roadDefects?.length ? `نقایص راه: ${appliedFilters.roadDefects.join(', ')}` : null
                    ].filter(Boolean).join(' | ') || 'هیچ فیلتر خاصی اعمال نشده'}
                  </p>
                </div>

                {/* Summary */}
                <div className="border-t border-green-200 pt-3">
                  <h3 className="font-medium text-green-800">خلاصه:</h3>
                  <p className="text-xs text-green-600">
                    فیلترها با موفقیت اعمال شدند. تعداد کل معیارهای انتخاب شده در کنسول مرورگر قابل مشاهده است.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Chart Area */}
        <div className="flex-1 p-8">
          <div className="bg-white rounded-lg shadow-sm p-8 h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                منطقه نمایش نمودار
              </h2>
              <p className="text-gray-600 mb-4">
                پیکربندی فعلی: <span className="font-semibold">{presetDescriptions[activePreset]}</span>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
                <h3 className="font-medium text-blue-800 mb-2">وضعیت فیلترها:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>
                    فیلتر شدت: {configPresets[activePreset].disableSeverityFilter ? '❌ غیرفعال' : '✅ فعال'}
                  </div>
                  <div>
                    فیلتر نوع برخورد: {configPresets[activePreset].disableCollisionTypeFilter ? '❌ غیرفعال' : '✅ فعال'}
                  </div>
                  <div>
                    فیلتر روشنایی: {configPresets[activePreset].disableLightingFilter ? '❌ غیرفعال' : '✅ فعال'}
                  </div>
                  <div>
                    قفل تصادفات شدید: {configPresets[activePreset].lockToSevereAccidents ? '🔒 فعال' : '🔓 غیرفعال'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <ChartsFilterSidebar
            config={configPresets[activePreset]}
            onApplyFilters={handleApplyFilters}
          />
        )}
      </div>
    </div>
  )
}

export default ChartsFilterExample
