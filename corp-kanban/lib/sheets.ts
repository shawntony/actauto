/**
 * Google Sheets API 연동 라이브러리
 */

import { CorporationCard, SheetsData } from './types'

const SHEET_NAME = '법인목록'

/**
 * Google Sheets에서 법인 데이터 가져오기
 */
export async function fetchCorporations(): Promise<CorporationCard[]> {
  try {
    const response = await fetch('/api/sheets/read')
    if (!response.ok) throw new Error('Failed to fetch corporations')

    const data: SheetsData = await response.json()
    return parseSheetsToCorporations(data)
  } catch (error) {
    console.error('Error fetching corporations:', error)
    return []
  }
}

/**
 * 새 법인 카드 추가
 */
export async function addCorporation(card: Omit<CorporationCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<CorporationCard> {
  const response = await fetch('/api/sheets/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card)
  })

  if (!response.ok) throw new Error('Failed to add corporation')
  return response.json()
}

/**
 * 법인 카드 업데이트
 */
export async function updateCorporation(id: string, updates: Partial<CorporationCard>): Promise<CorporationCard> {
  const response = await fetch(`/api/sheets/update/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })

  if (!response.ok) throw new Error('Failed to update corporation')
  return response.json()
}

/**
 * 법인 카드 삭제
 */
export async function deleteCorporation(id: string): Promise<void> {
  const response = await fetch(`/api/sheets/delete/${id}`, {
    method: 'DELETE'
  })

  if (!response.ok) throw new Error('Failed to delete corporation')
}

/**
 * Sheets 데이터를 CorporationCard 배열로 변환
 */
function parseSheetsToCorporations(data: SheetsData): CorporationCard[] {
  const { headers, rows } = data

  // 헤더에서 인덱스 찾기
  const getIndex = (header: string) => headers.indexOf(header)

  return rows.map((row, index) => ({
    id: row[getIndex('id')] || `corp-${index}`,
    name: row[getIndex('name')] || '',
    envKey: row[getIndex('envKey')] || '',
    folderId: row[getIndex('folderId')] || '',
    folderUrl: row[getIndex('folderUrl')] || '',
    spreadsheetId: row[getIndex('spreadsheetId')] || '',
    spreadsheetUrl: row[getIndex('spreadsheetUrl')] || '',
    scriptId: row[getIndex('scriptId')] || '',
    scriptUrl: row[getIndex('scriptUrl')] || '',
    description: row[getIndex('description')] || '',
    createdAt: row[getIndex('createdAt')] || new Date().toISOString(),
    updatedAt: row[getIndex('updatedAt')] || new Date().toISOString(),
    status: (row[getIndex('status')] || 'active') as CorporationCard['status'],
    tags: row[getIndex('tags')]?.split(',').map((t: string) => t.trim()) || []
  }))
}

/**
 * CorporationCard를 Sheets 행으로 변환
 */
export function corporationToSheetRow(card: CorporationCard): any[] {
  return [
    card.id,
    card.name,
    card.envKey,
    card.folderId,
    card.folderUrl,
    card.spreadsheetId,
    card.spreadsheetUrl,
    card.scriptId,
    card.scriptUrl,
    card.description || '',
    card.createdAt,
    card.updatedAt,
    card.status,
    card.tags?.join(', ') || ''
  ]
}

/**
 * Sheets 헤더 정의
 */
export const SHEET_HEADERS = [
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
