/**
 * 공유 환경 설정
 * 모든 스크립트에서 사용하는 스프레드시트 환경 정보
 *
 * 새 환경 추가 시 이 파일만 수정하면 됩니다.
 */

// ==================== 스프레드시트 환경 ====================

// 스프레드시트 환경 목록 (Google Apps Script 전역 변수로 var 사용)
var SPREADSHEETS = [
  {
    id: '1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8',
    name: '유니스 (소스)',
    isSource: true
  },
  {
    id: '1-gOcefZlaoDuLpIvt2LGednjbdYKmOSou25-j3_hrAI',
    name: '케이제이와이'
  },
  {
    id: '1IbuZ1rGMBtzdAYiCtekmHaTDmkN606knXmgTjGjiHYQ',
    name: '안앤드안어드바이저'
  },
  {
    id: '151gQ0GEpDvairtgMdqeYqjksQJxaNyfCJiz_-s8_sDA',
    name: '엘앤엘호라이즌'
  },
  {
    id: '1DWekXZ1i5xLuXxe-c1PgClOU9dtYGiNYOHM7NpakjO0',
    name: '티앤디'
  },
  {
    id: '1-gqj3uFZXgP272O5e6ipcEpnF8rP_eAa_H4lppv0gJI',
    name: '하누리MC'
  },
  {
    id: '1C79JTdkepkynRyBWiTo7ECtnt55nK46IDw8L6CH_k8I',
    name: '라우뎀'
  },
  {
    id: '1Zpakn6GJilSmKWRqCtbnIkYRbRH50u5uiZs30Q4STz0',
    name: '레드폴리오'
  },
  {
    id: '11l453PMDqQpdKFBOrCj3nRQ67BI8NeMENYRCN1DOLsw',
    name: '애드몬즈'
  },
  {
    id: '1AnL52eHs9E6yoXmolXLKrE-Z0kUUA2rccikgNtWSQ1Y',
    name: '더스마트앤'
  },
  {
    id: '1Y2VEEOJU9Y2n8McLRqoxtK4N979RYriWhEfoj0bY2t8',
    name: '더스마트앤협동조합'
  },
  {
    id: '1soPCWXpeniBMXdZ7UGQiW_3qHlMdBd7ss7U3wcqrclA',
    name: '해림씨앤피'
  }
];

// 소스 스프레드시트 ID (환경 생성 스크립트용)
var SOURCE_SPREADSHEET_ID = '1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8';

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

var SHEET_NAMES = {
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

var BATCH_CONFIG = {
  MAX_EXECUTION_TIME: 3 * 60 * 1000,  // 3분
  SHEETS_PER_BATCH: 3,                // 배치당 시트 수
  BATCH_DELAY: 60 * 1000              // 배치 간 대기 시간 (1분)
};

// ==================== 지연 시간 설정 ====================

var DELAY_CONFIG = {
  SHORT: 500,           // 0.5초 - 일반적인 짧은 대기
  STANDARD: 1000,       // 1초 - 기본 대기 시간
  LONG: 2000,           // 2초 - 긴 대기 시간
  AFTER_SHEET_CREATION: 3000,  // 3초 - 시트 생성 후 대기
  AFTER_COPY: 2000,     // 2초 - 복사 작업 후 대기
  BETWEEN_BATCHES: 60000  // 1분 - 배치 간 대기
};

// ==================== 알림 설정 ====================

var NOTIFICATION_CONFIG = {
  ENABLED: true,                    // 알림 활성화 여부
  SEND_ON_ERROR: true,              // 오류 발생 시 알림
  SEND_ON_COMPLETION: true,         // 완료 시 알림
  SEND_ON_WARNING: false,           // 경고 시 알림 (기본 false)
  MAX_ERROR_DETAILS: 5,             // 오류 상세 내역 최대 개수
  SUBJECT_PREFIX: '[자동화시스템]'  // 이메일 제목 접두사
};

// Google Apps Script 환경에서 전역으로 노출 (Apps Script는 var를 전역으로 만듦)
if (typeof module === 'undefined') {
  // Google Apps Script 환경 - 전역 변수로 노출
  this.SPREADSHEETS = SPREADSHEETS;
  this.SOURCE_SPREADSHEET_ID = SOURCE_SPREADSHEET_ID;
  this.SHEET_NAMES = SHEET_NAMES;
  this.BATCH_CONFIG = BATCH_CONFIG;
  this.DELAY_CONFIG = DELAY_CONFIG;
  this.NOTIFICATION_CONFIG = NOTIFICATION_CONFIG;
}

// Node.js 환경에서만 export
if (typeof module !== 'undefined' && module.exports) {
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
