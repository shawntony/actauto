/**
 * Google Sheets API 인증 및 클라이언트
 */

import { google } from 'googleapis'

// 환경변수에서 스프레드시트 ID 가져오기
export const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || ''

/**
 * Google Sheets API 클라이언트 생성
 */
export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })

  const authClient = await auth.getClient()
  const sheets = google.sheets({ version: 'v4', auth: authClient as any })

  return sheets
}

/**
 * 시트에서 데이터 읽기
 */
export async function readSheet(range: string) {
  const sheets = await getGoogleSheetsClient()

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range
  })

  return response.data.values || []
}

/**
 * 시트에 데이터 추가
 */
export async function appendToSheet(range: string, values: any[][]) {
  const sheets = await getGoogleSheetsClient()

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  })

  return response.data
}

/**
 * 시트 데이터 업데이트
 */
export async function updateSheet(range: string, values: any[][]) {
  const sheets = await getGoogleSheetsClient()

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  })

  return response.data
}

/**
 * 시트 데이터 삭제 (행 비우기)
 */
export async function clearSheet(range: string) {
  const sheets = await getGoogleSheetsClient()

  const response = await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range
  })

  return response.data
}
