/**
 * 시트 생성 스크립트를 유니스에 배포하고 실행 안내
 *
 * 사용법:
 * node scripts/syncAndRunCreateSheets.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.join(__dirname, '..');

console.log('🚀 시트 생성 및 1행 복사 프로세스\n');

try {
  // 1. production 환경으로 전환
  console.log('📝 Step 1: production 환경(유니스)으로 전환');
  const claspConfigPath = path.join(PROJECT_ROOT, '.clasp.json');
  const productionConfigPath = path.join(PROJECT_ROOT, 'configs', 'clasp-production.json');

  fs.copyFileSync(productionConfigPath, claspConfigPath);
  console.log('✅ 완료\n');

  // 2. 최신 코드 확인
  console.log('📝 Step 2: 스크립트 확인');
  const scriptExists = fs.existsSync(path.join(PROJECT_ROOT, 'src', '모든시트1행 복사.js'));

  if (scriptExists) {
    console.log('✅ "모든시트1행 복사.js" 스크립트가 이미 있습니다.\n');
  } else {
    console.log('⚠️  "모든시트1행 복사.js" 스크립트가 없습니다.');
    console.log('   먼저 유니스에서 pull 받습니다.\n');

    execSync('npx clasp pull', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
  }

  // 3. 실행 안내
  console.log('\n✅ 준비 완료!\n');
  console.log('=' .repeat(60));
  console.log('📋 실행 방법:');
  console.log('=' .repeat(60));
  console.log('\n1️⃣  법인재무관리_유니스 스프레드시트 열기');
  console.log('   https://docs.google.com/spreadsheets/d/1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8\n');
  console.log('2️⃣  상단 메뉴: 확장 프로그램 > Apps Script\n');
  console.log('3️⃣  왼쪽 파일 목록에서 "모든시트1행 복사.js" 클릭\n');
  console.log('4️⃣  함수 선택: startCreateAndCopyRow1\n');
  console.log('5️⃣  실행 버튼(▶️) 클릭\n');
  console.log('=' .repeat(60));
  console.log('\n💡 참고:');
  console.log('   - 새로 추가된 "부가세검증" 시트가 3개 환경에 자동 생성됩니다');
  console.log('   - 기존 시트들은 그대로 유지되고 1행만 업데이트됩니다');
  console.log('   - 진행 상황은 로그로 확인할 수 있습니다');
  console.log('   - 완료되면 이메일 알림을 받습니다\n');

} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
}
