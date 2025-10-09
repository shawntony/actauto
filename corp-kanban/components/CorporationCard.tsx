/**
 * 법인 카드 컴포넌트
 */

'use client'

import { CorporationCard as CorporationCardType } from '@/lib/types'
import {
  ExternalLink,
  FolderOpen,
  FileSpreadsheet,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react'
import { useState } from 'react'

interface Props {
  card: CorporationCardType
  onEdit: (card: CorporationCardType) => void
  onDelete: (id: string) => void
}

export default function CorporationCard({ card, onEdit, onDelete }: Props) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-4 border border-gray-200 dark:border-gray-700 hover:scale-[1.02] group">
      {/* 카드 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">{card.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md">
              <span className="font-mono text-[10px]">{card.envKey}</span>
            </span>
          </p>
        </div>

        {/* 메뉴 버튼 */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          {showMenu && (
            <>
              {/* 오버레이 */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />

              {/* 메뉴 */}
              <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
                <button
                  onClick={() => {
                    onEdit(card)
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  수정
                </button>
                <button
                  onClick={() => {
                    if (confirm(`${card.name}을(를) 삭제하시겠습니까?`)) {
                      onDelete(card.id)
                    }
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 설명 */}
      {card.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* 링크 목록 - 간소화 버전 */}
      <div className="space-y-2 mb-3">
        {/* 은행거래내역 폴더 */}
        <a
          href={card.folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-2.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all duration-200 group/link border border-transparent hover:border-yellow-200 dark:hover:border-yellow-800"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg group-hover/link:scale-110 transition-transform">
              <FolderOpen className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover/link:text-yellow-700 dark:group-hover/link:text-yellow-400 font-medium transition-colors flex-1">
              은행거래내역 폴더
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </div>
        </a>

        {/* 스프레드시트 */}
        <a
          href={card.spreadsheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-2.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 group/link border border-transparent hover:border-green-200 dark:hover:border-green-800"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-lg group-hover/link:scale-110 transition-transform">
              <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-500" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover/link:text-green-700 dark:group-hover/link:text-green-400 font-medium truncate flex-1 transition-colors">
              법인재무관리_{card.name}
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </div>
        </a>
      </div>

      {/* 태그 */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          {card.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 상태 뱃지 */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg shadow-sm ${
            card.status === 'active'
              ? 'bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : card.status === 'inactive'
              ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-800/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
              : 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${
            card.status === 'active'
              ? 'bg-green-500 dark:bg-green-400 animate-pulse'
              : card.status === 'inactive'
              ? 'bg-yellow-500 dark:bg-yellow-400'
              : 'bg-gray-500 dark:bg-gray-400'
          }`} />
          {card.status === 'active' ? '활성' : card.status === 'inactive' ? '비활성' : '보관'}
        </span>
      </div>
    </div>
  )
}
