/**
 * Google Sheets에 법인 추가 API
 * environments.json에도 자동으로 동기화
 */

import { NextRequest, NextResponse } from 'next/server'
import { appendToSheet, readSheet, updateSheet } from '@/lib/google-auth'
import { corporationToSheetRow } from '@/lib/sheets'
import { CorporationCard } from '@/lib/types'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const SHEET_NAME = '법인목록'
const ENVIRONMENTS_PATH = path.join(process.cwd(), '../configs/environments.json')
const ACTAUTO_PATH = path.join(process.cwd(), '..')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const autoCreate = body.autoCreate === true // 자동 생성 플래그

    // ID와 타임스탬프 생성
    const card: CorporationCard = {
      ...body,
      id: body.id || `corp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const row = corporationToSheetRow(card)

    // 1. Google Sheets에 추가
    await appendToSheet(`${SHEET_NAME}!A:N`, [row])

    // 2. environments.json에 추가
    try {
      await addToEnvironments(card)
      console.log(`✅ environments.json에 ${card.envKey} 추가 완료`)
    } catch (envError) {
      console.warn('⚠️ environments.json 업데이트 실패:', envError)
    }

    // 3. 자동 생성 요청 시 create-new-environment.js 실행
    if (autoCreate) {
      try {
        console.log(`🚀 ${card.envKey} 환경 자동 생성 시작...`)
        const result = await createEnvironmentAutomatically(card.envKey, card.name, card.description || '')

        // 생성 결과로 environments.json 및 Google Sheets 업데이트
        if (result.success) {
          await updateEnvironmentsWithCreatedResources(card.envKey, result)
          await updateSheetWithCreatedResources(card.id, result)
          console.log(`✅ ${card.envKey} 환경 자동 생성 완료`)

          // 업데이트된 정보 반환
          return NextResponse.json({
            ...card,
            spreadsheetId: result.spreadsheetId,
            folderId: result.folderId,
            spreadsheetUrl: result.spreadsheetUrl,
            autoCreated: true,
            needsScriptId: true // scriptId는 사용자가 수동으로 입력해야 함
          })
        } else {
          console.warn(`⚠️ ${card.envKey} 환경 자동 생성 실패:`, result.error)
        }
      } catch (createError) {
        console.error('⚠️ 환경 자동 생성 중 오류:', createError)
        // 자동 생성 실패해도 기본 정보는 저장되었으므로 계속 진행
      }
    }

    return NextResponse.json(card)
  } catch (error) {
    console.error('Error adding corporation:', error)
    return NextResponse.json(
      { error: 'Failed to add corporation' },
      { status: 500 }
    )
  }
}

/**
 * environments.json 파일에 새 법인 추가
 */
async function addToEnvironments(card: CorporationCard) {
  // environments.json 파일 읽기
  const data = fs.readFileSync(ENVIRONMENTS_PATH, 'utf8')
  const config = JSON.parse(data)

  // 이미 존재하는지 확인
  if (config.environments[card.envKey]) {
    console.log(`⚠️ ${card.envKey}는 이미 environments.json에 존재합니다.`)
    return
  }

  // 새 환경 정보 추가
  config.environments[card.envKey] = {
    name: card.name,
    scriptId: card.scriptId || '',
    spreadsheetId: card.spreadsheetId || '',
    folderId: card.folderId || '',
    spreadsheetUrl: card.spreadsheetUrl || '',
    description: card.description || '',
    debugMode: card.tags?.includes('debug') || false
  }

  // 파일에 저장 (들여쓰기 2칸으로 포맷팅)
  fs.writeFileSync(ENVIRONMENTS_PATH, JSON.stringify(config, null, 2), 'utf8')
}

/**
 * create-new-environment.js 스크립트 실행하여 환경 자동 생성
 */
async function createEnvironmentAutomatically(envKey: string, envName: string, description: string) {
  try {
    console.log(`📝 환경 생성 스크립트 실행: ${envKey} ${envName}`)

    // create-new-environment.js 실행
    const output = execSync(
      `node scripts/create-new-environment.js ${envKey} "${envName}" "${description}"`,
      {
        cwd: ACTAUTO_PATH,
        encoding: 'utf8',
        timeout: 600000, // 10분 타임아웃
        stdio: 'pipe'
      }
    )

    console.log('스크립트 실행 로그:', output)

    // 로그에서 정보 추출
    const spreadsheetIdMatch = output.match(/SPREADSHEET_ID:([^\s\n]+)/)
    const folderIdMatch = output.match(/FOLDER_ID:([^\s\n]+)/)
    const spreadsheetUrlMatch = output.match(/SPREADSHEET_URL:(https:\/\/[^\s\n]+)/)

    if (!spreadsheetIdMatch || !folderIdMatch || !spreadsheetUrlMatch) {
      return {
        success: false,
        error: '생성된 리소스 정보를 로그에서 찾을 수 없습니다.'
      }
    }

    return {
      success: true,
      spreadsheetId: spreadsheetIdMatch[1],
      folderId: folderIdMatch[1],
      spreadsheetUrl: spreadsheetUrlMatch[1]
    }
  } catch (error: any) {
    console.error('환경 생성 스크립트 실행 오류:', error.message)
    // stdout에 로그가 있을 수 있으니 시도
    const output = error.stdout || error.stderr || ''

    const spreadsheetIdMatch = output.match(/SPREADSHEET_ID:([^\s\n]+)/)
    const folderIdMatch = output.match(/FOLDER_ID:([^\s\n]+)/)
    const spreadsheetUrlMatch = output.match(/SPREADSHEET_URL:(https:\/\/[^\s\n]+)/)

    if (spreadsheetIdMatch && folderIdMatch && spreadsheetUrlMatch) {
      return {
        success: true,
        spreadsheetId: spreadsheetIdMatch[1],
        folderId: folderIdMatch[1],
        spreadsheetUrl: spreadsheetUrlMatch[1]
      }
    }

    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 생성된 리소스 정보로 environments.json 업데이트
 */
async function updateEnvironmentsWithCreatedResources(
  envKey: string,
  result: { spreadsheetId: string; folderId: string; spreadsheetUrl: string }
) {
  const data = fs.readFileSync(ENVIRONMENTS_PATH, 'utf8')
  const config = JSON.parse(data)

  if (config.environments[envKey]) {
    config.environments[envKey] = {
      ...config.environments[envKey],
      spreadsheetId: result.spreadsheetId,
      folderId: result.folderId,
      spreadsheetUrl: result.spreadsheetUrl
    }

    fs.writeFileSync(ENVIRONMENTS_PATH, JSON.stringify(config, null, 2), 'utf8')
    console.log(`✅ ${envKey} 환경변수에 생성된 리소스 정보 업데이트 완료`)
  }
}

/**
 * Google Sheets에 생성된 리소스 정보 업데이트
 */
async function updateSheetWithCreatedResources(
  cardId: string,
  result: { spreadsheetId: string; folderId: string; spreadsheetUrl: string }
) {
  try {
    // 모든 데이터 읽기
    const values = await readSheet(`${SHEET_NAME}!A:N`)
    if (!values || values.length < 2) {
      console.warn('⚠️ Google Sheets 업데이트 실패: 데이터 없음')
      return
    }

    const [headers, ...rows] = values
    const rowIndex = rows.findIndex(row => row[0] === cardId)

    if (rowIndex === -1) {
      console.warn(`⚠️ Google Sheets 업데이트 실패: ${cardId} 찾을 수 없음`)
      return
    }

    // 현재 행 데이터 가져오기
    const currentRow = rows[rowIndex]

    // 업데이트: folderId(3), folderUrl(4), spreadsheetId(5), spreadsheetUrl(6)
    const updatedRow = [...currentRow]
    updatedRow[3] = result.folderId // folderId
    updatedRow[4] = `https://drive.google.com/drive/folders/${result.folderId}` // folderUrl
    updatedRow[5] = result.spreadsheetId // spreadsheetId
    updatedRow[6] = result.spreadsheetUrl // spreadsheetUrl
    updatedRow[11] = new Date().toISOString() // updatedAt

    // 해당 행 업데이트
    const range = `${SHEET_NAME}!A${rowIndex + 2}:N${rowIndex + 2}`
    await updateSheet(range, [updatedRow])

    console.log(`✅ Google Sheets에 ${cardId} 리소스 정보 업데이트 완료`)
  } catch (error) {
    console.error('Google Sheets 업데이트 중 오류:', error)
  }
}
