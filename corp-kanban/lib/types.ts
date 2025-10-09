/**
 * 법인 카드 데이터 타입
 */
export interface CorporationCard {
  id: string
  /** 법인명 */
  name: string
  /** 환경 키 (예: jjqube, uniace) */
  envKey: string
  /** 은행거래내역 폴더 ID */
  folderId: string
  /** 은행거래내역 폴더 URL */
  folderUrl: string
  /** 법인재무관리 스프레드시트 ID */
  spreadsheetId: string
  /** 법인재무관리 스프레드시트 URL */
  spreadsheetUrl: string
  /** Apps Script 프로젝트 ID */
  scriptId: string
  /** Apps Script 편집 URL */
  scriptUrl: string
  /** 설명 */
  description?: string
  /** 생성일 */
  createdAt: string
  /** 수정일 */
  updatedAt: string
  /** 상태 (active, inactive, archived) */
  status: 'active' | 'inactive' | 'archived'
  /** 보드 ID */
  boardId: string
  /** 태그 */
  tags?: string[]
  /** 접근 가능한 구글 계정 목록 */
  allowedEmails?: string[]
}

/**
 * 칸반 보드 (컬럼)
 */
export interface KanbanBoard {
  id: string
  title: string
  order: number
  collapsed: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 칸반 섹션 (컬럼) - 레거시
 */
export interface KanbanSection {
  id: string
  title: string
  cards: CorporationCard[]
  order: number
}

/**
 * Google Sheets 데이터 스키마
 */
export interface SheetsData {
  /** 헤더 행 */
  headers: string[]
  /** 데이터 행들 */
  rows: any[][]
}

/**
 * 검색 필터
 */
export interface SearchFilter {
  query: string
  status?: CorporationCard['status']
  tags?: string[]
}

/**
 * 법인 추가 진행 단계
 */
export interface ProgressStep {
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  message?: string
  timestamp?: string
}

/**
 * 법인 추가 진행 상황
 */
export interface ProgressItem {
  id: string
  corpName: string
  envKey: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  steps: ProgressStep[]
  startedAt: string
  completedAt?: string
  error?: string
}

/**
 * SSE 진행 상황 이벤트
 */
export interface ProgressEvent {
  type: 'started' | 'step' | 'completed' | 'failed'
  data: ProgressItem
}
