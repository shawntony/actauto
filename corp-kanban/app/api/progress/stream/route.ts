/**
 * SSE 스트림 API - 법인 추가 진행 상황을 실시간으로 전송
 */

import { ProgressEvent } from '@/lib/types'

// 진행 상황을 저장하는 맵 (실제로는 Redis 등 사용)
export const progressMap = new Map<string, ProgressEvent>()

// SSE 클라이언트들을 저장
const clients = new Set<ReadableStreamDefaultController>()

export const runtime = 'edge'

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // 클라이언트 추가
      clients.add(controller)

      // 초기 데이터 전송 (현재 진행 중인 모든 작업)
      const allProgress = Array.from(progressMap.values())
      if (allProgress.length > 0) {
        const data = JSON.stringify(allProgress)
        controller.enqueue(`data: ${data}\n\n`)
      }

      // 연결 유지를 위한 heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`: heartbeat\n\n`)
        } catch (error) {
          clearInterval(heartbeat)
          clients.delete(controller)
        }
      }, 30000) // 30초마다

      // 클라이언트 연결 종료 시
      return () => {
        clearInterval(heartbeat)
        clients.delete(controller)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}

/**
 * 모든 연결된 클라이언트에게 진행 상황 브로드캐스트
 */
export function broadcastProgress(event: ProgressEvent) {
  // 진행 상황 저장
  progressMap.set(event.data.id, event)

  // 완료되거나 실패한 경우 5분 후 삭제
  if (event.type === 'completed' || event.type === 'failed') {
    setTimeout(() => {
      progressMap.delete(event.data.id)
    }, 5 * 60 * 1000)
  }

  // 모든 클라이언트에게 전송
  const data = JSON.stringify([event])
  clients.forEach((controller) => {
    try {
      controller.enqueue(`data: ${data}\n\n`)
    } catch (error) {
      clients.delete(controller)
    }
  })
}
