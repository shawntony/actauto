/**
 * 법인 선택 모달 컴포넌트
 */

'use client'

import { useState } from 'react'
import { CorporationCard } from '@/lib/types'
import { X, Search, CheckSquare, Square } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  corporations: CorporationCard[]
  onConfirm: (selectedIds: string[]) => void
  title?: string
}

export default function CorporationSelectorModal({
  isOpen,
  onClose,
  corporations,
  onConfirm,
  title = '법인 선택'
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  // 검색 필터링
  const filteredCorporations = corporations.filter(corp =>
    corp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    corp.envKey.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    setSelectedIds(filteredCorporations.map(c => c.id))
  }

  const handleDeselectAll = () => {
    setSelectedIds([])
  }

  const handleConfirm = () => {
    onConfirm(selectedIds)
    setSelectedIds([])
    setSearchQuery('')
    onClose()
  }

  const handleCancel = () => {
    setSelectedIds([])
    setSearchQuery('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={handleCancel} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 검색 및 전체 선택 */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="법인명 또는 환경키 검색..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 전체 선택/해제 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedIds.length}개 선택됨 / 전체 {filteredCorporations.length}개
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
              >
                전체 선택
              </button>
              <button
                onClick={handleDeselectAll}
                className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-50 rounded"
              >
                선택 해제
              </button>
            </div>
          </div>
        </div>

        {/* 법인 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredCorporations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCorporations.map(corp => (
                <div
                  key={corp.id}
                  onClick={() => handleToggle(corp.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedIds.includes(corp.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {selectedIds.includes(corp.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {corp.name}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      환경키: {corp.envKey}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 버튼 */}
        <div className="border-t border-gray-200 p-4 flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIds.length === 0}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              selectedIds.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            확인 ({selectedIds.length}개 선택)
          </button>
        </div>
      </div>
    </div>
  )
}
