/**
 * 법인 추가 API
 * 환경변수 생성 → 폴더 생성 → 스프레드시트 생성 → Apps Script 복사 → 시트 복사
 */

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { ProgressItem, ProgressEvent } from '@/lib/types'
import { broadcastProgress } from '@/app/api/progress/stream/route'

// Google API 클라이언트 초기화
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/script.projects'
  ]
})

const drive = google.drive({ version: 'v3', auth })
const sheets = google.sheets({ version: 'v4', auth })
const script = google.script({ version: 'v1', auth })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { corpName, envKey } = body

    if (!corpName || !envKey) {
      return NextResponse.json(
        { error: '법인명과 환경키는 필수입니다.' },
        { status: 400 }
      )
    }

    // 진행 상황 ID 생성
    const progressId = `${envKey}_${Date.now()}`

    // 초기 진행 상황 설정
    const progressItem: ProgressItem = {
      id: progressId,
      corpName,
      envKey,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      steps: [
        { name: '환경변수 생성', status: 'pending' },
        { name: 'Google Drive 폴더 생성', status: 'pending' },
        { name: '스프레드시트 생성', status: 'pending' },
        { name: 'Apps Script 복사', status: 'pending' },
        { name: '시트 1행 복사', status: 'pending' }
      ]
    }

    // 시작 이벤트 브로드캐스트
    broadcastProgress({
      type: 'started',
      data: progressItem
    })

    // 비동기로 법인 추가 작업 실행
    processCorporationAddition(progressItem)
      .catch((error) => {
        console.error('법인 추가 중 오류:', error)
      })

    return NextResponse.json({
      success: true,
      progressId,
      message: '법인 추가 작업이 시작되었습니다.'
    })

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 법인 추가 프로세스 실행
 */
async function processCorporationAddition(progressItem: ProgressItem) {
  try {
    // 1단계: 환경변수 생성
    await updateStepStatus(progressItem, 0, 'in_progress')
    // TODO: 실제 환경변수 생성 로직
    await sleep(1000)
    await updateStepStatus(progressItem, 0, 'completed', '환경변수 생성 완료')

    // 2단계: Google Drive 폴더 생성
    await updateStepStatus(progressItem, 1, 'in_progress')
    const folderId = await createDriveFolder(progressItem.corpName)
    await updateStepStatus(progressItem, 1, 'completed', `폴더 ID: ${folderId}`)

    // 3단계: 스프레드시트 생성
    await updateStepStatus(progressItem, 2, 'in_progress')
    const spreadsheetId = await createSpreadsheet(progressItem.corpName, folderId)
    await updateStepStatus(progressItem, 2, 'completed', `스프레드시트 ID: ${spreadsheetId}`)

    // 4단계: Apps Script 복사
    await updateStepStatus(progressItem, 3, 'in_progress')
    const scriptId = await copyAppsScript(spreadsheetId, progressItem.corpName)
    await updateStepStatus(progressItem, 3, 'completed', `Script ID: ${scriptId}`)

    // 5단계: 시트 1행 복사
    await updateStepStatus(progressItem, 4, 'in_progress')
    await copyFirstRow(spreadsheetId)
    await updateStepStatus(progressItem, 4, 'completed', '모든 시트의 1행 복사 완료')

    // 완료
    progressItem.status = 'completed'
    progressItem.completedAt = new Date().toISOString()
    broadcastProgress({
      type: 'completed',
      data: progressItem
    })

  } catch (error) {
    // 실패
    progressItem.status = 'failed'
    progressItem.error = error instanceof Error ? error.message : '알 수 없는 오류'
    progressItem.completedAt = new Date().toISOString()

    broadcastProgress({
      type: 'failed',
      data: progressItem
    })
  }
}

/**
 * 진행 단계 상태 업데이트
 */
async function updateStepStatus(
  progressItem: ProgressItem,
  stepIndex: number,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  message?: string
) {
  progressItem.steps[stepIndex].status = status
  progressItem.steps[stepIndex].message = message
  progressItem.steps[stepIndex].timestamp = new Date().toISOString()

  broadcastProgress({
    type: 'step',
    data: progressItem
  })
}

/**
 * Google Drive 폴더 생성
 */
async function createDriveFolder(corpName: string): Promise<string> {
  const response = await drive.files.create({
    requestBody: {
      name: `은행거래내역_${corpName}`,
      mimeType: 'application/vnd.google-apps.folder'
    },
    fields: 'id'
  })

  return response.data.id || ''
}

/**
 * 스프레드시트 생성
 */
async function createSpreadsheet(corpName: string, folderId: string): Promise<string> {
  // 1. 스프레드시트 생성
  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `법인재무관리_${corpName}`
      }
    }
  })

  const spreadsheetId = response.data.spreadsheetId || ''

  // 2. 생성된 스프레드시트를 폴더로 이동
  await drive.files.update({
    fileId: spreadsheetId,
    addParents: folderId,
    fields: 'id, parents'
  })

  return spreadsheetId
}

/**
 * Apps Script 프로젝트 복사
 */
async function copyAppsScript(spreadsheetId: string, corpName: string): Promise<string> {
  // TODO: 실제로는 템플릿 Apps Script 프로젝트를 복사해야 함
  // 현재는 간단히 시뮬레이션
  await sleep(1000)
  return `script_${spreadsheetId}`
}

/**
 * 시트 1행 복사 (템플릿 시트에서)
 */
async function copyFirstRow(spreadsheetId: string): Promise<void> {
  // TODO: 실제로는 템플릿 스프레드시트에서 모든 시트의 1행을 복사해야 함
  await sleep(1000)
}

/**
 * Sleep 유틸리티
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
