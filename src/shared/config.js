/**
 * 공유 환경 설정
 * 모든 스크립트에서 사용하는 스프레드시트 환경 정보
 *
 * 새 환경 추가 시 이 파일만 수정하면 됩니다.
 */

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

// 배치 처리 설정
const BATCH_CONFIG = {
  MAX_EXECUTION_TIME: 3 * 60 * 1000,  // 3분
  SHEETS_PER_BATCH: 3,                // 배치당 시트 수
  BATCH_DELAY: 60 * 1000              // 배치 간 대기 시간 (1분)
};

// Google Apps Script 환경에서만 export (Node.js에서는 무시됨)
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 환경
  module.exports = {
    SPREADSHEETS,
    getSourceSpreadsheet,
    getTargetSpreadsheets,
    getAllSpreadsheets,
    getSpreadsheetById,
    getSpreadsheetByName,
    BATCH_CONFIG
  };
}
