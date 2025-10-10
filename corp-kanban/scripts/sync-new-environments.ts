/**
 * environments.json에서 새로 추가된 환경을 corp-kanban Google Sheets에 동기화
 *
 * 실행: npx tsx scripts/sync-new-environments.ts
 */

import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { google } from 'googleapis'

// .env.local 파일 로드
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const SHEET_NAME = '법인목록'

// 새로 추가된 환경 키 목록
const NEW_ENVIRONMENTS = [
  'redfolio',
  'admonz',
  'thesmartn',
  'thesmartnmutual',
  'haerimcnp'
]

interface EnvironmentConfig {
  name: string
  scriptId: string
  spreadsheetId: string
  folderId: string
  spreadsheetUrl: string
  description: string
  debugMode: boolean
}

interface EnvironmentsJson {
  environments: {
    [key: string]: EnvironmentConfig
  }
  default: string
}

interface CorporationCard {
  id: string
  name: string
  envKey: string
  folderId: string
  folderUrl: string
  spreadsheetId: string
  spreadsheetUrl: string
  scriptId: string
  scriptUrl: string
  description: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'inactive' | 'maintenance'
  tags: string
}

async function main() {
  console.log('🔄 새로운 환경을 corp-kanban에 동기화 시작...\n')

  // 1. environments.json 읽기
  const environmentsPath = path.join(__dirname, '../../configs/environments.json')
  const environmentsData: EnvironmentsJson = JSON.parse(
    fs.readFileSync(environmentsPath, 'utf8')
  )

  // 2. 새로운 환경들 추출
  const newEnvs = NEW_ENVIRONMENTS.map(envKey => {
    const env = environmentsData.environments[envKey]
    if (!env) {
      console.warn(`⚠️  ${envKey}를 environments.json에서 찾을 수 없습니다.`)
      return null
    }

    const now = new Date().toISOString()
    const folderUrl = env.folderId
      ? `https://drive.google.com/drive/folders/${env.folderId}`
      : ''
    const scriptUrl = env.scriptId
      ? `https://script.google.com/d/${env.scriptId}/edit`
      : ''

    const card: CorporationCard = {
      id: `corp-${envKey}`,
      name: env.name,
      envKey: envKey,
      folderId: env.folderId || '',
      folderUrl: folderUrl,
      spreadsheetId: env.spreadsheetId || '',
      spreadsheetUrl: env.spreadsheetUrl || '',
      scriptId: env.scriptId || '',
      scriptUrl: scriptUrl,
      description: env.description || `${env.name} 회계 관리 시스템`,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      tags: env.debugMode ? 'debug' : ''
    }

    return card
  }).filter((card): card is CorporationCard => card !== null)

  if (newEnvs.length === 0) {
    console.log('❌ 추가할 새로운 환경이 없습니다.')
    return
  }

  console.log(`📋 ${newEnvs.length}개의 새로운 환경 발견:\n`)
  newEnvs.forEach(env => {
    console.log(`   ✅ ${env.name} (${env.envKey})`)
  })
  console.log()

  // 3. Google Sheets 인증 설정
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })

  const sheets = google.sheets({ version: 'v4', auth })
  const spreadsheetId = process.env.GOOGLE_SHEET_ID

  if (!spreadsheetId) {
    console.error('❌ GOOGLE_SHEET_ID 환경변수가 설정되지 않았습니다.')
    return
  }

  // 4. 기존 데이터 확인
  console.log('📖 기존 법인 목록 확인 중...\n')

  const readResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:N`
  })

  const existingValues = readResponse.data.values || []
  const [headers, ...existingRows] = existingValues

  const existingEnvKeys = existingRows.map(row => row[2]) // envKey는 3번째 열 (index 2)

  // 5. 새로운 환경만 필터링
  const envsToAdd = newEnvs.filter(env => !existingEnvKeys.includes(env.envKey))

  if (envsToAdd.length === 0) {
    console.log('✅ 모든 환경이 이미 Google Sheets에 존재합니다.')
    return
  }

  console.log(`📝 ${envsToAdd.length}개 환경을 Google Sheets에 추가:\n`)
  envsToAdd.forEach(env => {
    console.log(`   ➕ ${env.name} (${env.envKey})`)
  })
  console.log()

  // 6. Google Sheets에 추가
  const rows = envsToAdd.map(card => [
    card.id,
    card.name,
    card.envKey,
    card.folderId,
    card.folderUrl,
    card.spreadsheetId,
    card.spreadsheetUrl,
    card.scriptId,
    card.scriptUrl,
    card.description,
    card.createdAt,
    card.updatedAt,
    card.status,
    card.tags
  ])

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:N`,
    valueInputOption: 'RAW',
    requestBody: {
      values: rows
    }
  })

  console.log('✅ Google Sheets 업데이트 완료!\n')
  console.log('=' .repeat(60))
  console.log('🎉 동기화가 성공적으로 완료되었습니다!')
  console.log('=' .repeat(60))
  console.log(`\n추가된 환경:`)
  envsToAdd.forEach((env, index) => {
    console.log(`   ${index + 1}. ${env.name} (${env.envKey})`)
  })
  console.log()
}

// 실행
main().catch(error => {
  console.error('❌ 오류 발생:', error)
  process.exit(1)
})
