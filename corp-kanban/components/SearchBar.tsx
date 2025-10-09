/**
 * 검색 바 컴포넌트
 */

'use client'

import { Search, Filter, X } from 'lucide-react'
import { useState } from 'react'
import { SearchFilter } from '@/lib/types'

interface Props {
  onSearch: (filter: SearchFilter) => void
}

export default function SearchBar({ onSearch }: Props) {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [status, setStatus] = useState<SearchFilter['status']>()

  const handleSearch = () => {
    onSearch({ query, status })
  }

  const handleClear = () => {
    setQuery('')
    setStatus(undefined)
    onSearch({ query: '' })
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 mb-6 transition-all duration-300">
      {/* 검색 입력 */}
      <div className="flex gap-3">
        <div className="flex-1 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="법인명, 환경키로 검색..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-5 py-3 border rounded-lg flex items-center gap-2 font-medium transition-all hover:scale-105 shadow-sm ${
            showFilters
              ? 'bg-blue-600 border-blue-600 text-white shadow-md'
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Filter className="w-5 h-5" />
          <span className="hidden sm:inline">필터</span>
        </button>

        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium transition-all hover:scale-105 shadow-md hover:shadow-lg"
        >
          검색
        </button>

        {(query || status) && (
          <button
            onClick={handleClear}
            className="px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-all hover:scale-105 shadow-sm"
          >
            <span className="hidden sm:inline">초기화</span>
            <X className="w-5 h-5 sm:hidden" />
          </button>
        )}
      </div>

      {/* 필터 옵션 */}
      {showFilters && (
        <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex gap-6">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></span>
                상태 필터
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'active', label: '활성', color: 'green' },
                  { value: 'inactive', label: '비활성', color: 'yellow' },
                  { value: 'archived', label: '보관', color: 'gray' }
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStatus(s.value as any)}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-all hover:scale-105 shadow-sm ${
                      status === s.value
                        ? s.color === 'green'
                          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md'
                          : s.color === 'yellow'
                          ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white shadow-md'
                          : 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}

                {status && (
                  <button
                    onClick={() => setStatus(undefined)}
                    className="px-4 py-2 text-sm rounded-lg font-medium transition-all hover:scale-105 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-800"
                  >
                    필터 해제
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
