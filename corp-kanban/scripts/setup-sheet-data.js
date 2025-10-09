/**
 * Google Sheets 초기 데이터 설정 스크립트
 * smartbiz, smartbiz1, smartbiz2 법인 데이터 추가
 */

require('dotenv').config({ path: '.env.local' })
const { google } = require('googleapis')

const SHEET_NAME = '법인목록'
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID

// 헤더 정의
const HEADERS = [
  'id',
  'name',
  'envKey',
  'folderId',
  'folderUrl',
  'spreadsheetId',
  'spreadsheetUrl',
  'scriptId',
  'scriptUrl',
  'description',
  'createdAt',
  'updatedAt',
  'status',
  'tags'
]

// 법인 데이터
const CORPORATIONS = [
  {
    id: 'corp-smartbiz',
    name: 'smartbiz',
    envKey: 'smartbiz',
    folderId: '',
    folderUrl: '',
    spreadsheetId: '',
    spreadsheetUrl: '',
    scriptId: '',
    scriptUrl: '',
    description: 'smartbiz 법인',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    tags: 'production'
  },
  {
    id: 'corp-smartbiz1',
    name: 'smartbiz1',
    envKey: 'smartbiz1',
    folderId: '',
    folderUrl: '',
    spreadsheetId: '',
    spreadsheetUrl: '',
    scriptId: '',
    scriptUrl: '',
    description: 'smartbiz1 법인',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    tags: 'production'
  },
  {
    id: 'corp-smartbiz2',
    name: 'smartbiz2',
    envKey: 'smartbiz2',
    folderId: '',
    folderUrl: '',
    spreadsheetId: '',
    spreadsheetUrl: '',
    scriptId: '',
    scriptUrl: '',
    description: 'smartbiz2 법인',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    tags: 'production'
  }
]

async function setupSheetData() {
  try {
    console.log('🔧 Google Sheets API 인증 중...')

    // Service Account 인증
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })

    const sheets = google.sheets({ version: 'v4', auth })

    console.log(`📊 스프레드시트 ID: ${SPREADSHEET_ID}`)
    console.log(`📋 시트 이름: ${SHEET_NAME}`)

    // 데이터 준비: 헤더 + 법인 데이터
    const rows = [
      HEADERS,
      ...CORPORATIONS.map(corp => HEADERS.map(header => corp[header] || ''))
    ]

    console.log(`\n✏️ 데이터 작성 중...`)
    console.log(`   - 헤더: ${HEADERS.length}개 컬럼`)
    console.log(`   - 데이터: ${CORPORATIONS.length}개 법인`)

    // 시트에 데이터 작성
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: rows
      }
    })

    console.log(`\n✅ 데이터 작성 완료!`)
    console.log(`\n📋 등록된 법인:`)
    CORPORATIONS.forEach((corp, index) => {
      console.log(`   ${index + 1}. ${corp.name} (${corp.status})`)
    })

    console.log(`\n🌐 확인: http://localhost:3006`)

  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    if (error.response) {
      console.error('상세:', error.response.data)
    }
    process.exit(1)
  }
}

setupSheetData()
