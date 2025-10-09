/**
 * Google Sheets 법인 업데이트 API
 * environments.json에도 자동으로 동기화
 */

import { NextRequest, NextResponse } from 'next/server'
import { readSheet, updateSheet } from '@/lib/google-auth'
import { corporationToSheetRow } from '@/lib/sheets'
import fs from 'fs'
import path from 'path'

const SHEET_NAME = '법인목록'
const ENVIRONMENTS_PATH = path.join(process.cwd(), '../configs/environments.json')

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { id } = params
    const updates = await request.json()

    // 모든 데이터 읽기
    const values = await readSheet(`${SHEET_NAME}!A:N`)
    if (!values || values.length < 2) {
      return NextResponse.json(
        { error: 'Corporation not found' },
        { status: 404 }
      )
    }

    const [headers, ...rows] = values
    const rowIndex = rows.findIndex(row => row[0] === id)

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Corporation not found' },
        { status: 404 }
      )
    }

    // 기존 데이터와 업데이트 병합
    const currentRow = rows[rowIndex]
    const updatedCard = {
      id: currentRow[0],
      name: updates.name ?? currentRow[1],
      envKey: updates.envKey ?? currentRow[2],
      folderId: updates.folderId ?? currentRow[3],
      folderUrl: updates.folderUrl ?? currentRow[4],
      spreadsheetId: updates.spreadsheetId ?? currentRow[5],
      spreadsheetUrl: updates.spreadsheetUrl ?? currentRow[6],
      scriptId: updates.scriptId ?? currentRow[7],
      scriptUrl: updates.scriptUrl ?? currentRow[8],
      description: updates.description ?? currentRow[9],
      createdAt: currentRow[10],
      updatedAt: new Date().toISOString(),
      status: updates.status ?? currentRow[12],
      tags: updates.tags ?? (currentRow[13]?.split(',').map((t: string) => t.trim()) || [])
    }

    const newRow = corporationToSheetRow(updatedCard)

    // 해당 행만 업데이트 (rowIndex + 2는 헤더를 포함하기 때문)
    const range = `${SHEET_NAME}!A${rowIndex + 2}:N${rowIndex + 2}`
    await updateSheet(range, [newRow])

    // environments.json도 업데이트
    try {
      await updateEnvironments(updatedCard)
      console.log(`✅ environments.json에 ${updatedCard.envKey} 업데이트 완료`)
    } catch (envError) {
      console.warn('⚠️ environments.json 업데이트 실패:', envError)
    }

    return NextResponse.json(updatedCard)
  } catch (error) {
    console.error('Error updating corporation:', error)
    return NextResponse.json(
      { error: 'Failed to update corporation' },
      { status: 500 }
    )
  }
}

/**
 * environments.json 파일의 법인 정보 업데이트
 */
async function updateEnvironments(card: any) {
  const data = fs.readFileSync(ENVIRONMENTS_PATH, 'utf8')
  const config = JSON.parse(data)

  if (!config.environments[card.envKey]) {
    console.log(`⚠️ ${card.envKey}가 environments.json에 존재하지 않습니다.`)
    return
  }

  // 기존 정보 업데이트
  config.environments[card.envKey] = {
    ...config.environments[card.envKey],
    name: card.name,
    scriptId: card.scriptId || '',
    spreadsheetId: card.spreadsheetId || '',
    folderId: card.folderId || '',
    spreadsheetUrl: card.spreadsheetUrl || '',
    description: card.description || '',
    debugMode: Array.isArray(card.tags) ? card.tags.includes('debug') : card.tags?.includes('debug') || false
  }

  fs.writeFileSync(ENVIRONMENTS_PATH, JSON.stringify(config, null, 2), 'utf8')
}
