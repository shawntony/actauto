/**
 * environments.json 파일에서 법인 정보를 읽어 Google Sheets에 동기화
 */

require('dotenv').config({ path: '.env.local' })
const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')

const SHEET_NAME = '법인목록'
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID
const ENVIRONMENTS_PATH = path.join(__dirname, '../../configs/environments.json')

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

function loadEnvironments() {
  try {
    const data = fs.readFileSync(ENVIRONMENTS_PATH, 'utf8')
    const config = JSON.parse(data)
    return config.environments
  } catch (error) {
    console.error('❌ environments.json 파일 읽기 실패:', error.message)
    process.exit(1)
  }
}

function environmentToCorporation(envKey, env) {
  // development, testing 등 테스트 환경은 제외
  const skipEnvironments = ['development', 'testing']
  if (skipEnvironments.includes(envKey)) {
    return null
  }

  // ID가 YOUR_로 시작하는 것들은 설정되지 않은 환경이므로 제외
  if (env.scriptId?.startsWith('YOUR_') || env.spreadsheetId?.startsWith('YOUR_')) {
    return null
  }

  const now = new Date().toISOString()
  const folderId = env.folderId || ''
  const folderUrl = folderId ? `https://drive.google.com/drive/folders/${folderId}` : ''
  const scriptUrl = env.scriptId ? `https://script.google.com/d/${env.scriptId}/edit` : ''

  return {
    id: `corp-${envKey}`,
    name: env.name || envKey,
    envKey: envKey,
    folderId: folderId,
    folderUrl: folderUrl,
    spreadsheetId: env.spreadsheetId || '',
    spreadsheetUrl: env.spreadsheetUrl || '',
    scriptId: env.scriptId || '',
    scriptUrl: scriptUrl,
    description: env.description || '',
    createdAt: now,
    updatedAt: now,
    status: 'active',
    tags: env.debugMode ? 'debug' : 'production'
  }
}

async function syncToSheets() {
  try {
    console.log('📂 environments.json 파일 읽기 중...')
    const environments = loadEnvironments()

    console.log(`📋 총 ${Object.keys(environments).length}개 환경 발견`)

    // 환경을 법인 데이터로 변환
    const corporations = []
    for (const [envKey, env] of Object.entries(environments)) {
      const corp = environmentToCorporation(envKey, env)
      if (corp) {
        corporations.push(corp)
        console.log(`   ✓ ${corp.name} (${envKey})`)
      } else {
        console.log(`   ⊘ ${envKey} (제외됨)`)
      }
    }

    console.log(`\n✅ ${corporations.length}개 법인을 동기화합니다.\n`)

    // Google Sheets API 인증
    console.log('🔧 Google Sheets API 인증 중...')
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // 데이터 준비: 헤더 + 법인 데이터
    const rows = [
      HEADERS,
      ...corporations.map(corp => HEADERS.map(header => corp[header] || ''))
    ]

    console.log(`📊 Google Sheets에 작성 중...`)
    console.log(`   스프레드시트 ID: ${SPREADSHEET_ID}`)
    console.log(`   시트 이름: ${SHEET_NAME}`)
    console.log(`   데이터: ${corporations.length}개 법인 + 헤더`)

    // 시트에 데이터 작성 (기존 데이터 완전 덮어쓰기)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: rows
      }
    })

    console.log(`\n✅ 동기화 완료!\n`)
    console.log(`📋 등록된 법인 (${corporations.length}개):`)
    corporations.forEach((corp, index) => {
      console.log(`   ${index + 1}. ${corp.name} (${corp.envKey}) - ${corp.status}`)
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

syncToSheets()
