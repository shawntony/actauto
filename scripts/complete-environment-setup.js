#!/usr/bin/env node

/**
 * 환경 설정 완료 스크립트
 *
 * 임시 정보 파일과 scriptId를 사용하여 환경 설정을 완료합니다.
 *
 * 실행 방법:
 * node scripts/complete-environment-setup.js <환경키> <scriptId>
 *
 * 예시:
 * node scripts/complete-environment-setup.js jjqube 1ABC...DEF
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length < 2) {
      log('\n사용법:', 'yellow');
      log('node scripts/complete-environment-setup.js <환경키> <scriptId>\n', 'blue');
      log('예시:', 'yellow');
      log('node scripts/complete-environment-setup.js jjqube 1ABC...DEF\n', 'green');
      process.exit(1);
    }

    const envKey = args[0];
    const scriptId = args[1];

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('     🔧 환경 설정 완료 스크립트', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

    // Step 1: 임시 정보 파일 읽기
    log('📂 Step 1: 임시 정보 파일 읽기', 'yellow');
    log('─'.repeat(60), 'blue');

    const tempInfoPath = path.join(__dirname, `../configs/temp-${envKey}-info.json`);

    if (!fs.existsSync(tempInfoPath)) {
      throw new Error(`임시 정보 파일을 찾을 수 없습니다: ${tempInfoPath}`);
    }

    const tempInfo = JSON.parse(fs.readFileSync(tempInfoPath, 'utf8'));
    log(`✅ 임시 정보 파일 로드 완료\n`, 'green');

    // Step 2: 설정 파일 생성
    log('📁 Step 2: 로컬 설정 파일 생성', 'yellow');
    log('─'.repeat(60), 'blue');

    // 2-1. clasp 설정 파일 생성
    const claspConfigPath = path.join(__dirname, `../configs/clasp-${envKey}.json`);
    const claspConfig = {
      scriptId: scriptId,
      rootDir: "src",
      scriptExtensions: [".js", ".gs"],
      htmlExtensions: [".html"],
      jsonExtensions: [".json"],
      filePushOrder: [],
      skipSubdirectories: false
    };

    fs.writeFileSync(claspConfigPath, JSON.stringify(claspConfig, null, 2), 'utf8');
    log(`✅ clasp-${envKey}.json 생성 완료`, 'green');

    // 2-2. environments.json 업데이트
    const environmentsPath = path.join(__dirname, '../configs/environments.json');
    const environments = JSON.parse(fs.readFileSync(environmentsPath, 'utf8'));

    environments.environments[envKey] = {
      name: tempInfo.envName,
      scriptId: scriptId,
      spreadsheetId: tempInfo.spreadsheetId,
      folderId: tempInfo.folderId,
      spreadsheetUrl: tempInfo.spreadsheetUrl,
      description: tempInfo.description,
      debugMode: false
    };

    fs.writeFileSync(environmentsPath, JSON.stringify(environments, null, 2), 'utf8');
    log(`✅ environments.json에 "${envKey}" 환경 추가 완료\n`, 'green');

    // Step 3: 코드 배포
    log('🚀 Step 3: 새 환경에 코드 배포', 'yellow');
    log('─'.repeat(60), 'blue');

    const claspJsonPath = path.join(__dirname, '../.clasp.json');
    fs.copyFileSync(claspConfigPath, claspJsonPath);
    log('✅ clasp 설정 전환 완료', 'green');

    try {
      const result = execSync('npx clasp push --force', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });
      log('✅ 코드 배포 완료!\n', 'green');
    } catch (error) {
      log(`❌ 배포 실패: ${error.message}`, 'red');
      log('\n수동으로 배포하려면:', 'yellow');
      log(`  node scripts/deploy.js ${envKey}\n`, 'green');
    }

    // Step 4: 임시 파일 삭제
    log('🗑️  Step 4: 임시 파일 정리', 'yellow');
    log('─'.repeat(60), 'blue');

    fs.unlinkSync(tempInfoPath);
    log(`✅ 임시 정보 파일 삭제 완료\n`, 'green');

    // 완료 요약
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('     ✅ 환경 설정 완료!', 'green');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

    log('\n📋 생성된 환경 정보:', 'bright');
    log('─'.repeat(60), 'blue');
    log(`환경 키:        ${envKey}`, 'blue');
    log(`법인 이름:      ${tempInfo.envName}`, 'blue');
    log(`설명:           ${tempInfo.description}`, 'blue');
    log(`스크립트 ID:    ${scriptId}`, 'blue');
    log(`스프레드시트:   ${tempInfo.spreadsheetUrl}`, 'blue');

    log('\n📁 생성된 파일:', 'bright');
    log('─'.repeat(60), 'blue');
    log(`✅ src/${tempInfo.envName}환경생성.js`, 'green');
    log(`✅ configs/clasp-${envKey}.json`, 'green');
    log(`✅ configs/environments.json (업데이트)`, 'green');

    log('\n🎯 다음 단계:', 'bright');
    log('─'.repeat(60), 'blue');
    log('1. 스프레드시트 열기:', 'blue');
    log(`   ${tempInfo.spreadsheetUrl}`, 'green');
    log('');
    log('2. 메뉴 확인 (새로고침 필요):', 'blue');
    log('   - 재무자료 관리', 'green');
    log('   - 도구 관리', 'green');
    log('   - 급여 관리', 'green');
    log('');
    log('3. 환경 목록 확인:', 'blue');
    log('   node scripts/deploy.js --list', 'green');
    log('');

  } catch (error) {
    log(`\n❌ 오류 발생: ${error.message}`, 'red');
    if (error.stack) {
      log(error.stack, 'red');
    }
    process.exit(1);
  }
}

main();
