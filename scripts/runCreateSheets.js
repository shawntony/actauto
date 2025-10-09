/**
 * 로컬에서 createSheetsAndCopyRow1 스크립트를 실행
 *
 * 사용법:
 * node scripts/runCreateSheets.js
 *
 * 참고: 환경 설정은 src/shared/config.js에서 관리됩니다
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 환경 설정 (src/shared/config.js에서 가져옴)
const { getSourceSpreadsheet, getTargetSpreadsheets, BATCH_CONFIG } = require('../src/shared/config');

const SOURCE_SPREADSHEET_ID = getSourceSpreadsheet().id;
const TARGET_SPREADSHEETS = getTargetSpreadsheets();

// 임시 스크립트 파일 생성
function createTempScript() {
  const scriptContent = `
// 환경 설정
const UNIFIED_SOURCE_SPREADSHEET_ID = '${SOURCE_SPREADSHEET_ID}';

const UNIFIED_TARGET_SPREADSHEETS = ${JSON.stringify(TARGET_SPREADSHEETS, null, 2)};

const UNIFIED_MAX_EXECUTION_TIME = ${BATCH_CONFIG.MAX_EXECUTION_TIME};
const UNIFIED_SHEETS_PER_BATCH = ${BATCH_CONFIG.SHEETS_PER_BATCH};

${fs.readFileSync(path.join(__dirname, 'createSheetsAndCopyRow1.js'), 'utf8').split('\n').slice(21).join('\n')}

// 실행
startCreateAndCopyRow1();
`;

  const tempFile = path.join(__dirname, '..', 'src', 'temp-create-sheets.js');
  fs.writeFileSync(tempFile, scriptContent);
  return tempFile;
}

async function run() {
  console.log('🚀 시트 생성 및 1행 복사 프로세스 시작...\n');

  // 1. production 환경으로 전환
  console.log('📝 Step 1: production 환경으로 전환');
  const claspConfigPath = path.join(__dirname, '..', '.clasp.json');
  const productionConfigPath = path.join(__dirname, '..', 'configs', 'clasp-production.json');

  fs.copyFileSync(productionConfigPath, claspConfigPath);
  console.log('✅ production 환경으로 전환 완료\n');

  // 2. 임시 스크립트 파일 생성
  console.log('📝 Step 2: 실행 스크립트 생성');
  const tempScript = createTempScript();
  console.log('✅ 스크립트 생성 완료\n');

  // 3. clasp run으로 실행
  console.log('📝 Step 3: Apps Script 실행 중...');
  console.log('⏳ 이 작업은 몇 분 정도 걸릴 수 있습니다...\n');

  return new Promise((resolve, reject) => {
    exec('npx clasp run startCreateAndCopyRow1', {
      cwd: path.join(__dirname, '..')
    }, (error, stdout, stderr) => {
      // 4. 임시 파일 정리
      try {
        fs.unlinkSync(tempScript);
        console.log('🧹 임시 파일 정리 완료\n');
      } catch (e) {
        // 무시
      }

      if (error) {
        console.error('❌ 실행 오류:', error.message);
        console.error('\n📌 참고: clasp run은 OAuth 인증이 필요합니다.');
        console.error('대신 Apps Script 편집기에서 직접 실행하는 것을 권장합니다.\n');

        console.log('📋 대안 방법:');
        console.log('1. 법인재무관리_유니스 스프레드시트 열기');
        console.log('2. 확장 프로그램 > Apps Script 열기');
        console.log('3. startCreateAndCopyRow1() 함수 실행\n');

        reject(error);
        return;
      }

      console.log('✅ 실행 완료!\n');
      console.log(stdout);
      if (stderr) {
        console.error('경고:', stderr);
      }

      resolve();
    });
  });
}

// 실행
run().catch(error => {
  console.error('\n실행 실패');
  process.exit(1);
});
