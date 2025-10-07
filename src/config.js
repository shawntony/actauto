/**
 * 환경별 설정 관리
 *
 * 각 환경(프로덕션, 개발, 테스트)별로 다른 설정값을 관리합니다.
 * 배포 시 환경에 맞는 설정이 자동으로 주입됩니다.
 */

// 환경 설정 - 배포 스크립트에서 자동 주입됨
const CONFIG = {
  // 현재 환경 (production, development, testing 등)
  ENVIRONMENT: '{{ENVIRONMENT}}',

  // 스프레드시트 ID
  SPREADSHEET_ID: '{{SPREADSHEET_ID}}',

  // 구글 드라이브 폴더 ID (은행거래내역 업로드용)
  FOLDER_ID: '{{FOLDER_ID}}',

  // 스프레드시트 URL (참조용)
  SPREADSHEET_URL: '{{SPREADSHEET_URL}}',

  // 환경 이름
  ENVIRONMENT_NAME: '{{ENVIRONMENT_NAME}}',

  // 디버그 모드 (개발/테스트 환경에서만 활성화)
  DEBUG_MODE: '{{DEBUG_MODE}}' === 'true'
};

// 설정 검증 함수
function validateConfig() {
  const requiredFields = ['SPREADSHEET_ID', 'FOLDER_ID'];
  const missingFields = requiredFields.filter(field =>
    !CONFIG[field] || CONFIG[field].startsWith('{{')
  );

  if (missingFields.length > 0) {
    throw new Error(
      `설정 오류: 다음 필드가 설정되지 않았습니다: ${missingFields.join(', ')}\n` +
      `현재 환경: ${CONFIG.ENVIRONMENT}\n` +
      `configs/environments.json에서 해당 환경의 설정을 확인하세요.`
    );
  }
}

// 설정 값 가져오기
function getConfig(key) {
  if (!(key in CONFIG)) {
    throw new Error(`알 수 없는 설정 키: ${key}`);
  }
  return CONFIG[key];
}

// 전역 변수로 노출 (기존 코드 호환성)
var SPREADSHEET_ID = CONFIG.SPREADSHEET_ID;
var FOLDER_ID = CONFIG.FOLDER_ID;

// 설정 정보 출력 (디버그용)
function showConfigInfo() {
  const ui = SpreadsheetApp.getUi();
  const info = `
현재 환경 설정:
━━━━━━━━━━━━━━━━━━━━
환경: ${CONFIG.ENVIRONMENT_NAME} (${CONFIG.ENVIRONMENT})
스프레드시트 ID: ${CONFIG.SPREADSHEET_ID}
폴더 ID: ${CONFIG.FOLDER_ID}
디버그 모드: ${CONFIG.DEBUG_MODE ? '활성' : '비활성'}
  `.trim();

  ui.alert('환경 설정 정보', info, ui.ButtonSet.OK);
}
