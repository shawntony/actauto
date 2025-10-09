/**
 * 법인 추가 과정 페이지
 * 진행 중인 법인 생성 작업의 상태를 실시간으로 표시
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { Loader2, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'
import { ProgressItem, ProgressEvent } from '@/lib/types'

export default function ProgressPage() {
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  // SSE 연결
  useEffect(() => {
    // EventSource 생성
    const eventSource = new EventSource('/api/progress/stream')
    eventSourceRef.current = eventSource

    // 연결 성공
    eventSource.onopen = () => {
      console.log('SSE 연결됨')
      setIsConnected(true)
    }

    // 메시지 수신
    eventSource.onmessage = (event) => {
      if (event.data.startsWith(':')) {
        // heartbeat 무시
        return
      }

      try {
        const events: ProgressEvent[] = JSON.parse(event.data)

        setProgressItems((prev) => {
          const newItems = [...prev]

          events.forEach((progressEvent) => {
            const index = newItems.findIndex((item) => item.id === progressEvent.data.id)

            if (index >= 0) {
              // 기존 항목 업데이트
              newItems[index] = progressEvent.data
            } else {
              // 새 항목 추가
              newItems.unshift(progressEvent.data)
            }
          })

          return newItems
        })
      } catch (error) {
        console.error('SSE 메시지 파싱 오류:', error)
      }
    }

    // 오류 처리
    eventSource.onerror = (error) => {
      console.error('SSE 오류:', error)
      setIsConnected(false)

      // 5초 후 재연결 시도
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          window.location.reload()
        }
      }, 5000)
    }

    // 정리
    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료'
      case 'failed':
        return '실패'
      case 'in_progress':
        return '진행 중'
      default:
        return '대기 중'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">법인 추가 과정</h1>
                <p className="text-sm text-gray-600">
                  실시간 진행 상황을 확인하세요
                </p>
              </div>
            </div>

            {/* 연결 상태 표시 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-600">
                {isConnected ? '실시간 연결됨' : '연결 끊김'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-6">
        {progressItems.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">진행 중인 작업이 없습니다</p>
            <p className="text-sm text-gray-400 mt-2">
              회계보드에서 새 법인을 추가하면 여기에 진행 상황이 표시됩니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {progressItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
              >
                {/* 상단 정보 */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{item.corpName}</h3>
                    <p className="text-sm text-gray-500">환경키: {item.envKey}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${getStatusBadge(item.status)}`}
                  >
                    {getStatusText(item.status)}
                  </span>
                </div>

                {/* 진행 단계 */}
                <div className="space-y-3">
                  {item.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {getStatusIcon(step.status)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{step.name}</p>
                        {step.message && (
                          <p className="text-xs text-gray-500 mt-1">{step.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 시간 정보 */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>시작: {new Date(item.startedAt).toLocaleString('ko-KR')}</span>
                  {item.completedAt && (
                    <span>완료: {new Date(item.completedAt).toLocaleString('ko-KR')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
