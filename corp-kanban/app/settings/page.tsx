/**
 * 설정 페이지
 * 시스템 설정 및 환경 구성
 */

'use client'

import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Database, Key, Bell, Shield, Users, Plus, Trash2, Globe, ListChecks, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import CorporationSelectorModal from '@/components/CorporationSelectorModal'

export default function SettingsPage() {
  const { corporations, loadCorporations } = useStore()

  const [allowedEmails, setAllowedEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [showSelectorModal, setShowSelectorModal] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')

  useEffect(() => {
    loadCorporations()
  }, [loadCorporations])

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

  const handleApplyToAll = async () => {
    if (allowedEmails.length === 0) {
      alert('권한을 부여할 이메일을 먼저 추가해주세요.')
      return
    }

    if (!confirm(`모든 법인(${corporations.length}개)에 ${allowedEmails.length}개 이메일 권한을 부여하시겠습니까?`)) {
      return
    }

    setIsApplying(true)
    setApplyMessage('')

    try {
      const response = await fetch('/api/permissions/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'all',
          emails: allowedEmails,
          role: 'writer',
          sendNotification: true
        })
      })

      const result = await response.json()

      if (result.success) {
        setApplyMessage(`✅ ${result.message}`)
        setTimeout(() => setApplyMessage(''), 5000)
      } else {
        alert(`실패: ${result.error}`)
      }
    } catch (error) {
      console.error('Apply to all error:', error)
      alert('권한 부여에 실패했습니다.')
    } finally {
      setIsApplying(false)
    }
  }

  const handleApplyToSelected = (selectedIds: string[]) => {
    if (allowedEmails.length === 0) {
      alert('권한을 부여할 이메일을 먼저 추가해주세요.')
      return
    }

    if (selectedIds.length === 0) {
      alert('법인을 선택해주세요.')
      return
    }

    setIsApplying(true)
    setApplyMessage('')

    fetch('/api/permissions/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: 'selected',
        emails: allowedEmails,
        corporationIds: selectedIds,
        role: 'writer',
        sendNotification: true
      })
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setApplyMessage(`✅ ${result.message}`)
          setTimeout(() => setApplyMessage(''), 5000)
        } else {
          alert(`실패: ${result.error}`)
        }
      })
      .catch(error => {
        console.error('Apply to selected error:', error)
        alert('권한 부여에 실패했습니다.')
      })
      .finally(() => {
        setIsApplying(false)
      })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">설정</h1>
              <p className="text-sm text-gray-600">
                시스템 환경 및 구성 관리
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* 접근 권한 관리 */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">접근 권한 관리</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              법인 폴더 및 스프레드시트에 접근할 수 있는 구글 계정을 관리합니다.
            </p>

            {/* 이메일 추가 */}
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                placeholder="이메일 주소 입력 (예: user@gmail.com)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleAddEmail}
                className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>

            {/* 이메일 목록 */}
            <div className="space-y-2">
              {allowedEmails.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-700">{email}</span>
                  <button
                    onClick={() => handleRemoveEmail(email)}
                    className="text-red-600 hover:text-red-700"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {allowedEmails.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  등록된 이메일이 없습니다.
                </p>
              )}
            </div>

            {/* 적용 버튼 */}
            <div className="mt-4 space-y-3">
              {applyMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                  {applyMessage}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleApplyToAll}
                  disabled={isApplying || allowedEmails.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      적용 중...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      모든 법인에 적용
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowSelectorModal(true)}
                  disabled={isApplying || allowedEmails.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <ListChecks className="w-4 h-4" />
                  법인 선택하여 적용
                </button>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 <strong>팁:</strong> "모든 법인에 적용"을 클릭하면 현재 등록된 모든 법인의 폴더와 스프레드시트에 접근 권한이 부여됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* Google API 설정 */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Google API</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-gray-600 mb-1">Service Account Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="service-account@project.iam.gserviceaccount.com"
                  disabled
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Google Sheet ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="스프레드시트 ID"
                  disabled
                />
              </div>
              <p className="text-xs text-gray-500">
                API 키는 환경변수(.env.local)에서 관리됩니다
              </p>
            </div>
          </div>

          {/* 데이터베이스 설정 */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">데이터 소스</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Google Sheets</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  연결됨
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">environments.json</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  동기화
                </span>
              </div>
              <p className="text-xs text-gray-500">
                데이터는 양방향으로 자동 동기화됩니다
              </p>
            </div>
          </div>

          {/* 알림 설정 */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-yellow-600" />
              <h2 className="text-lg font-bold text-gray-900">알림</h2>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" defaultChecked />
                <span className="text-sm text-gray-700">법인 추가 완료 알림</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" defaultChecked />
                <span className="text-sm text-gray-700">오류 발생 알림</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm text-gray-700">일일 요약 리포트</span>
              </label>
            </div>
          </div>

          {/* 보안 설정 */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-bold text-gray-900">보안</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">API 인증</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  활성
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">HTTPS</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  활성
                </span>
              </div>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                API 키 갱신
              </button>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="mt-8 flex items-center justify-end gap-3 max-w-4xl">
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            취소
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            설정 저장
          </button>
        </div>
      </main>

      {/* 법인 선택 모달 */}
      <CorporationSelectorModal
        isOpen={showSelectorModal}
        onClose={() => setShowSelectorModal(false)}
        corporations={corporations}
        onConfirm={handleApplyToSelected}
        title="권한을 적용할 법인 선택"
      />
    </div>
  )
}
