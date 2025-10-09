/**
 * 공유 환경 설정
 * 모든 스크립트에서 사용하는 스프레드시트 환경 정보
 *
 * 새 환경 추가 시 이 파일만 수정하면 됩니다.
 */

// ==================== 스프레드시트 환경 ====================

// 스프레드시트 환경 목록
const SPREADSHEETS = [
  {
    id: '1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8',
    name: '유니스 (소스)',
    isSource: true
  },
  {
    id: '1QNQwhOCU0fJpn19BkxpyNUi6bvdAYcgOIPTAM6rdwZ0',
    name: '스마트비즈센터'
  },
  {
    id: '1xmrR4KLWf2S7J4IQgHrJiIUEb4PCC9aUI7Mwbq29PcU',
    name: '스마트비즈센터1'
  },
  {
    id: '1GjeKgw6c7h5WW1Y8u-v3ixPG6LNX9owf5rZrho9zdkU',
    name: '스마트비즈센터2'
  }
];

// 소스 스프레드시트 ID (환경 생성 스크립트용)
const SOURCE_SPREADSHEET_ID = '1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8';

/**
 * 소스 스프레드시트 가져오기
 */
function getSourceSpreadsheet() {
  return SPREADSHEETS.find(s => s.isSource) || SPREADSHEETS[0];
}

/**
 * 대상 스프레드시트 목록 가져오기 (소스 제외)
 */
function getTargetSpreadsheets() {
  return SPREADSHEETS.filter(s => !s.isSource);
}

/**
 * 모든 스프레드시트 가져오기
 */
function getAllSpreadsheets() {
  return SPREADSHEETS;
}

/**
 * ID로 스프레드시트 정보 찾기
 */
function getSpreadsheetById(id) {
  return SPREADSHEETS.find(s => s.id === id);
}

/**
 * 이름으로 스프레드시트 정보 찾기
 */
function getSpreadsheetByName(name) {
  return SPREADSHEETS.find(s => s.name === name);
}

// ==================== 시트 이름 상수 ====================

const SHEET_NAMES = {
  // 공통 시트
  COMPANY_INFO: '업체정보',
  PAYROLL: '급여지급내역',
  BANK_TRANSACTIONS: '입출금내역',
  ACCOUNTING: '회계내역',

  // 자동화 관련
  AUTOMATION_LOG: '자동화로그',
  ERROR_LOG: '오류로그',
  BATCH_PROGRESS: '진행상황'
};

// ==================== 배치 처리 설정 ====================

const BATCH_CONFIG = {
  MAX_EXECUTION_TIME: 3 * 60 * 1000,  // 3분
  SHEETS_PER_BATCH: 3,                // 배치당 시트 수
  BATCH_DELAY: 60 * 1000              // 배치 간 대기 시간 (1분)
};

// ==================== 지연 시간 설정 ====================

const DELAY_CONFIG = {
  SHORT: 500,           // 0.5초 - 일반적인 짧은 대기
  STANDARD: 1000,       // 1초 - 기본 대기 시간
  LONG: 2000,           // 2초 - 긴 대기 시간
  AFTER_SHEET_CREATION: 3000,  // 3초 - 시트 생성 후 대기
  AFTER_COPY: 2000,     // 2초 - 복사 작업 후 대기
  BETWEEN_BATCHES: 60000  // 1분 - 배치 간 대기
};

// ==================== 알림 설정 ====================

const NOTIFICATION_CONFIG = {
  ENABLED: true,                    // 알림 활성화 여부
  SEND_ON_ERROR: true,              // 오류 발생 시 알림
  SEND_ON_COMPLETION: true,         // 완료 시 알림
  SEND_ON_WARNING: false,           // 경고 시 알림 (기본 false)
  MAX_ERROR_DETAILS: 5,             // 오류 상세 내역 최대 개수
  SUBJECT_PREFIX: '[자동화시스템]'  // 이메일 제목 접두사
};

// Google Apps Script 환경에서만 export (Node.js에서는 무시됨)
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 환경
  module.exports = {
    SPREADSHEETS,
    SOURCE_SPREADSHEET_ID,
    getSourceSpreadsheet,
    getTargetSpreadsheets,
    getAllSpreadsheets,
    getSpreadsheetById,
    getSpreadsheetByName,
    SHEET_NAMES,
    BATCH_CONFIG,
    DELAY_CONFIG,
    NOTIFICATION_CONFIG
  };
}
