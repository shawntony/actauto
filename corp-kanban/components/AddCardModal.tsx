/**
 * 법인 카드 추가/수정 모달
 */

'use client'

import { CorporationCard } from '@/lib/types'
import { X, Plus, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (card: Omit<CorporationCard, 'id' | 'createdAt' | 'updatedAt'>) => void
  editingCard?: CorporationCard
}

export default function AddCardModal({ isOpen, onClose, onSave, editingCard }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    envKey: '',
    folderId: '',
    folderUrl: '',
    spreadsheetId: '',
    spreadsheetUrl: '',
    scriptId: '',
    scriptUrl: '',
    description: '',
    status: 'active' as CorporationCard['status'],
    tags: '',
    boardId: 'active'
  })

  const [allowedEmails, setAllowedEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    if (editingCard) {
      setFormData({
        name: editingCard.name,
        envKey: editingCard.envKey,
        folderId: editingCard.folderId,
        folderUrl: editingCard.folderUrl,
        spreadsheetId: editingCard.spreadsheetId,
        spreadsheetUrl: editingCard.spreadsheetUrl,
        scriptId: editingCard.scriptId,
        scriptUrl: editingCard.scriptUrl,
        description: editingCard.description || '',
        status: editingCard.status,
        tags: editingCard.tags?.join(', ') || '',
        boardId: editingCard.boardId || 'active'
      })
      setAllowedEmails(editingCard.allowedEmails || [])
    } else {
      setFormData({
        name: '',
        envKey: '',
        folderId: '',
        folderUrl: '',
        spreadsheetId: '',
        spreadsheetUrl: '',
        scriptId: '',
        scriptUrl: '',
        description: '',
        status: 'active',
        tags: '',
        boardId: 'active'
      })
      setAllowedEmails([])
    }
    setNewEmail('')
  }, [editingCard, isOpen])

  const handleAddEmail = () => {
    if (newEmail && newEmail.trim() && newEmail.includes('@')) {
      setAllowedEmails([...allowedEmails, newEmail.trim()])
      setNewEmail('')
    } else {
      alert('올바른 이메일 주소를 입력하세요.')
    }
  }

  const handleRemoveEmail = (email: string) => {
    setAllowedEmails(allowedEmails.filter(e => e !== email))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSave({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      allowedEmails: allowedEmails,
      boardId: formData.boardId
    })

    onClose()
  }

  if (!isOpen) return null

  const inputClassName = "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 duration-300">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 border-b border-blue-700 dark:border-purple-700 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editingCard ? '법인 정보 수정' : '새 법인 추가'}
            </h2>
            <p className="text-sm text-blue-100 mt-1">
              {editingCard ? '법인 정보를 수정합니다' : '새로운 법인을 시스템에 추가합니다'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all hover:scale-110 text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></span>
              기본 정보
            </h3>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                법인명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClassName}
                placeholder="법인명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                환경 키 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.envKey}
                onChange={(e) => setFormData({ ...formData, envKey: e.target.value })}
                placeholder="예: jjqube, uniace"
                className={inputClassName}
              />
            </div>
          </div>

          {/* 폴더 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="w-1 h-5 bg-gradient-to-b from-yellow-600 to-yellow-500 rounded-full"></span>
              폴더 정보
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  폴더 ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.folderId}
                  onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                  className={inputClassName}
                  placeholder="Google Drive 폴더 ID"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  폴더 URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.folderUrl}
                  onChange={(e) => setFormData({ ...formData, folderUrl: e.target.value })}
                  className={inputClassName}
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>
          </div>

          {/* 스프레드시트 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="w-1 h-5 bg-gradient-to-b from-green-600 to-green-500 rounded-full"></span>
              스프레드시트 정보
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  스프레드시트 ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.spreadsheetId}
                  onChange={(e) => setFormData({ ...formData, spreadsheetId: e.target.value })}
                  className={inputClassName}
                  placeholder="Google Sheets ID"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  스프레드시트 URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.spreadsheetUrl}
                  onChange={(e) => setFormData({ ...formData, spreadsheetUrl: e.target.value })}
                  className={inputClassName}
                  placeholder="https://docs.google.com/..."
                />
              </div>
            </div>
          </div>

          {/* Apps Script 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="w-1 h-5 bg-gradient-to-b from-purple-600 to-purple-500 rounded-full"></span>
              Apps Script 정보
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Apps Script ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.scriptId}
                  onChange={(e) => setFormData({ ...formData, scriptId: e.target.value })}
                  className={inputClassName}
                  placeholder="Apps Script Project ID"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Apps Script URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.scriptUrl}
                  onChange={(e) => setFormData({ ...formData, scriptUrl: e.target.value })}
                  className={inputClassName}
                  placeholder="https://script.google.com/..."
                />
              </div>
            </div>
          </div>

          {/* 추가 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="w-1 h-5 bg-gradient-to-b from-gray-600 to-gray-500 rounded-full"></span>
              추가 정보
            </h3>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className={inputClassName}
                placeholder="법인에 대한 간단한 설명을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className={inputClassName}
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="archived">보관</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  태그 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="예: 주식회사, 서울, 제조업"
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* 접근 권한 관리 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
                <span className="w-1 h-5 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></span>
                접근 권한 관리
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                이 법인의 폴더와 스프레드시트에 접근할 수 있는 구글 계정을 관리합니다.
              </p>
            </div>

            {/* 이메일 추가 */}
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                placeholder="이메일 주소 입력 (예: user@gmail.com)"
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm transition-all"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-105 shadow-md font-medium"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>

            {/* 이메일 목록 */}
            <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              {allowedEmails.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-all"
                >
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all hover:scale-110"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {allowedEmails.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  등록된 이메일이 없습니다.
                </p>
              )}
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <span className="font-bold">⚠️ 참고:</span> 여기에 추가된 이메일은 저장 시 자동으로 이 법인의 폴더와 스프레드시트에 접근 권한이 부여됩니다.
              </p>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all hover:scale-105 shadow-sm"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-bold transition-all hover:scale-105 shadow-md hover:shadow-lg"
            >
              {editingCard ? '수정 완료' : '법인 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
