/**
 * Google Sheets 법인 삭제 API
 * environments.json에서도 자동으로 제거
 */

import { NextRequest, NextResponse } from 'next/server'
import { readSheet, updateSheet } from '@/lib/google-auth'
import fs from 'fs'
import path from 'path'

const SHEET_NAME = '법인목록'
const ENVIRONMENTS_PATH = path.join(process.cwd(), '../configs/environments.json')

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { id } = params

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

    // envKey 추출 (삭제 전에 저장)
    const envKey = rows[rowIndex][2]

    // 해당 행 삭제 (빈 배열로 업데이트)
    const filteredRows = rows.filter((_, i) => i !== rowIndex)

    // 전체 데이터 다시 쓰기
    await updateSheet(`${SHEET_NAME}!A2:N`, filteredRows)

    // environments.json에서도 삭제
    try {
      await deleteFromEnvironments(envKey)
      console.log(`✅ environments.json에서 ${envKey} 삭제 완료`)
    } catch (envError) {
      console.warn('⚠️ environments.json 삭제 실패:', envError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting corporation:', error)
    return NextResponse.json(
      { error: 'Failed to delete corporation' },
      { status: 500 }
    )
  }
}

/**
 * environments.json 파일에서 법인 정보 삭제
 */
async function deleteFromEnvironments(envKey: string) {
  const data = fs.readFileSync(ENVIRONMENTS_PATH, 'utf8')
  const config = JSON.parse(data)

  if (!config.environments[envKey]) {
    console.log(`⚠️ ${envKey}가 environments.json에 존재하지 않습니다.`)
    return
  }

  // envKey에 해당하는 환경 삭제
  delete config.environments[envKey]

  fs.writeFileSync(ENVIRONMENTS_PATH, JSON.stringify(config, null, 2), 'utf8')
}
