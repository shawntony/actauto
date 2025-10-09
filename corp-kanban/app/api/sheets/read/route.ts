/**
 * Google Sheets 데이터 읽기 API
 */

import { NextResponse } from 'next/server'
import { readSheet } from '@/lib/google-auth'
import { SHEET_HEADERS } from '@/lib/sheets'

const SHEET_NAME = '법인목록'

export async function GET() {
  try {
    const values = await readSheet(`${SHEET_NAME}!A:N`)

    if (!values || values.length === 0) {
      return NextResponse.json({
        headers: SHEET_HEADERS,
        rows: []
      })
    }

    const [headers, ...rows] = values

    return NextResponse.json({
      headers: headers || SHEET_HEADERS,
      rows
    })
  } catch (error) {
    console.error('Error reading sheet:', error)
    return NextResponse.json(
      { error: 'Failed to read sheet' },
      { status: 500 }
    )
  }
}
