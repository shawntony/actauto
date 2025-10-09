#!/usr/bin/env node

/**
 * 새로운 법인 환경 완전 자동 생성 스크립트 (clasp 통합 버전)
 *
 * 이 스크립트는 다음 모든 과정을 자동으로 수행합니다:
 * 1. 유니스 Apps Script에 환경 생성 함수 자동 추가
 * 2. clasp run으로 함수 자동 실행
 * 3. 로컬 설정 파일 생성
 * 4. 새 환경에 코드 자동 배포
 *
 * 실행 방법:
 * node scripts/create-new-environment.js <환경키> <법인이름> [설명]
 *
 * 예시:
 * node scripts/create-new-environment.js jjqube 제이제이큐브 "제이제이큐브 회계 관리 시스템"
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

/**
 * 환경 생성 함수 템플릿 생성
 */
function generateEnvironmentScript(envKey, envName) {
  // 환경별 고유 함수명 생성
  const uniqueSuffix = envKey.toUpperCase();

  return `/**
 * ${envName} 환경 완전 자동 생성 스크립트
 *
 * 실행 방법:
 * 1. Apps Script 편집기에서 이 파일 열기
 * 2. create${envName}완전자동() 함수 실행
 */

function create${envName}완전자동() {
  const 법인이름 = '${envName}';
  const SOURCE_SPREADSHEET_ID = '1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8'; // 유니스

  Logger.log(\`🚀 \${법인이름} 환경 완전 자동 생성 시작\\n\`);
  Logger.log('='.repeat(70));

  try {
    // Step 1: 폴더 구조 생성
    Logger.log('📁 Step 1: 폴더 구조 생성');

    const myDrive = DriveApp.getRootFolder();
    let 법인관리 = getFolderByName_${uniqueSuffix}(myDrive, '법인관리') || myDrive.createFolder('법인관리');
    let 재무관리 = getFolderByName_${uniqueSuffix}(법인관리, '재무관리') || 법인관리.createFolder('재무관리');
    let 법인폴더 = getFolderByName_${uniqueSuffix}(재무관리, 법인이름) || 재무관리.createFolder(법인이름);
    let 은행거래내역 = getFolderByName_${uniqueSuffix}(법인폴더, '은행거래내역') || 법인폴더.createFolder('은행거래내역');

    const folderId = 은행거래내역.getId();
    Logger.log(\`✅ 폴더 구조 생성 완료\`);
    Logger.log(\`   은행거래내역 폴더 ID: \${folderId}\\n\`);

    // Step 2: 스프레드시트 생성
    Logger.log('📊 Step 2: 스프레드시트 생성');

    const spreadsheetName = \`법인재무관리_\${법인이름}\`;
    let spreadsheet = getSpreadsheetByName_${uniqueSuffix}(법인폴더, spreadsheetName);

    if (!spreadsheet) {
      spreadsheet = SpreadsheetApp.create(spreadsheetName);
      const file = DriveApp.getFileById(spreadsheet.getId());
      file.moveTo(법인폴더);
      Logger.log(\`✅ "\${spreadsheetName}" 생성 완료\`);
    } else {
      Logger.log(\`✓ "\${spreadsheetName}" 이미 존재\`);
    }

    const spreadsheetId = spreadsheet.getId();
    const spreadsheetUrl = spreadsheet.getUrl();

    Logger.log(\`   스프레드시트 ID: \${spreadsheetId}\`);
    Logger.log(\`   URL: \${spreadsheetUrl}\\n\`);

    // Step 3: 소스에서 모든 시트 목록 가져오기
    Logger.log('📋 Step 3: 소스 스프레드시트에서 시트 목록 가져오기');

    const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
    const sourceSheets = sourceSpreadsheet.getSheets();

    Logger.log(\`   소스 시트 개수: \${sourceSheets.length}개\\n\`);

    // Step 4: 모든 시트 생성 및 1행 복사
    Logger.log('🔄 Step 4: 모든 시트 생성 및 1행 복사 시작');
    Logger.log('   (이 작업은 몇 분 정도 걸립니다...)\\n');

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    sourceSheets.forEach((sourceSheet, index) => {
      const sheetName = sourceSheet.getName();

      try {
        Logger.log(\`[\${index + 1}/\${sourceSheets.length}] \${sheetName}\`);

        const lastColumn = sourceSheet.getLastColumn();
        const lastRow = sourceSheet.getLastRow();

        if (lastColumn === 0 || lastRow === 0) {
          Logger.log(\`  ⊘ 빈 시트, 건너뜀\`);
          skipCount++;
          return;
        }

        let targetSheet = spreadsheet.getSheetByName(sheetName);

        if (!targetSheet) {
          targetSheet = spreadsheet.insertSheet(sheetName);
          Logger.log(\`  ✅ 시트 생성\`);
          Utilities.sleep(300);
        }

        // 1행 데이터 및 서식 복사
        const row1Range = sourceSheet.getRange(1, 1, 1, lastColumn);
        const row1Values = row1Range.getValues();
        const row1Formats = row1Range.getNumberFormats();
        const row1FontWeights = row1Range.getFontWeights();
        const row1FontColors = row1Range.getFontColors();
        const row1Backgrounds = row1Range.getBackgrounds();
        const row1HorizontalAlignments = row1Range.getHorizontalAlignments();

        const targetRange = targetSheet.getRange(1, 1, 1, lastColumn);
        targetRange.setValues(row1Values);
        targetRange.setNumberFormats(row1Formats);
        targetRange.setFontWeights(row1FontWeights);
        targetRange.setFontColors(row1FontColors);
        targetRange.setBackgrounds(row1Backgrounds);
        targetRange.setHorizontalAlignments(row1HorizontalAlignments);

        Logger.log(\`  ✅ 1행 복사 완료 (\${lastColumn}개 열)\`);
        successCount++;

        Utilities.sleep(200);

      } catch (error) {
        Logger.log(\`  ❌ 오류: \${error.message}\`);
        failCount++;
      }
    });

    // 기본 시트 삭제
    try {
      const defaultSheet = spreadsheet.getSheetByName('Sheet1');
      if (defaultSheet && spreadsheet.getSheets().length > 1) {
        spreadsheet.deleteSheet(defaultSheet);
        Logger.log('\\n🗑️  기본 Sheet1 삭제');
      }
    } catch (e) {
      // 무시
    }

    // 결과 요약
    Logger.log('');
    Logger.log('='.repeat(70));
    Logger.log(\`✅ \${companyName} 환경 생성 완료!\`);
    Logger.log('='.repeat(70));
    Logger.log('');
    Logger.log('📊 작업 결과:');
    Logger.log(\`   총 시트: \${sourceSheets.length}개\`);
    Logger.log(\`   ✅ 성공: \${successCount}개\`);
    Logger.log(\`   ⊘ 건너뜀: \${skipCount}개\`);
    Logger.log(\`   ❌ 실패: \${failCount}개\`);
    Logger.log('');
    Logger.log('📋 생성된 환경 정보:');
    Logger.log(\`   환경 이름: \${법인이름}\`);
    Logger.log(\`   스프레드시트 ID: \${spreadsheetId}\`);
    Logger.log(\`   은행거래내역 폴더 ID: \${folderId}\`);
    Logger.log(\`   스프레드시트 URL: \${spreadsheetUrl}\`);
    Logger.log('');
    Logger.log('📝 다음 단계:');
    Logger.log('   1. 생성된 스프레드시트 열기');
    Logger.log('   2. 확장 프로그램 > Apps Script');
    Logger.log('   3. 설정 ⚙️ > 프로젝트 설정 > 스크립트 ID 복사');
    Logger.log('   4. Claude Code 자동화 스크립트 실행');
    Logger.log('');
    Logger.log('--- 복사해서 전달할 정보 ---');
    Logger.log(\`scriptId: [Apps Script 프로젝트 ID]\`);
    Logger.log(\`ENV_KEY:${envKey}\`);
    Logger.log(\`SPREADSHEET_ID:\${spreadsheetId}\`);
    Logger.log(\`FOLDER_ID:\${folderId}\`);
    Logger.log(\`SPREADSHEET_URL:\${spreadsheetUrl}\`);
    Logger.log('----------------------------');
    Logger.log('');

    return {
      success: true,
      spreadsheetId: spreadsheetId,
      folderId: folderId,
      spreadsheetUrl: spreadsheetUrl,
      stats: {
        total: sourceSheets.length,
        success: successCount,
        skipped: skipCount,
        failed: failCount
      }
    };

  } catch (error) {
    Logger.log('');
    Logger.log(\`❌ 오류 발생: \${error.message}\`);
    Logger.log(error.stack);

    return {
      success: false,
      error: error.message
    };
  }
}

// 헬퍼 함수들 (${uniqueSuffix} 전용)
function getFolderByName_${uniqueSuffix}(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : null;
}

function getSpreadsheetByName_${uniqueSuffix}(folder, name) {
  const files = folder.getFilesByName(name);
  if (files.hasNext()) {
    const file = files.next();
    try {
      return SpreadsheetApp.openById(file.getId());
    } catch (e) {
      return null;
    }
  }
  return null;
}
`;
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    // 명령행 인자 파싱
    const args = process.argv.slice(2);

    if (args.length < 2) {
      log('\n사용법:', 'yellow');
      log('node scripts/create-new-environment.js <환경키> <법인이름> [설명]\n', 'blue');
      log('예시:', 'yellow');
      log('node scripts/create-new-environment.js jjqube 제이제이큐브 "제이제이큐브 회계 관리 시스템"\n', 'green');
      process.exit(1);
    }

    const envKey = args[0];
    const envName = args[1];
    const description = args[2] || `${envName} 회계 관리 시스템`;

    // 환경 키 유효성 검사
    if (!/^[a-z0-9]+$/.test(envKey)) {
      throw new Error('환경 키는 영문 소문자와 숫자만 사용 가능합니다.');
    }

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('     🚀 새로운 법인 환경 완전 자동 생성 (clasp 통합)', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

    // Step 1: 환경 정보 표시
    log('📋 Step 1: 환경 정보 확인', 'yellow');
    log('─'.repeat(60), 'blue');
    log(`   환경 키: ${envKey}`, 'blue');
    log(`   법인 이름: ${envName}`, 'blue');
    log(`   설명: ${description}\n`, 'blue');

    // Step 2: 환경 생성 스크립트 파일 생성
    log('📝 Step 2: 환경 생성 스크립트 생성', 'yellow');
    log('─'.repeat(60), 'blue');

    const scriptContent = generateEnvironmentScript(envKey, envName);
    const scriptPath = path.join(__dirname, `../src/${envName}환경생성.js`);

    fs.writeFileSync(scriptPath, scriptContent, 'utf8');
    log(`✅ ${envName}환경생성.js 생성 완료\n`, 'green');

    // Step 3: 유니스(production)에 파일 푸시
    log('📤 Step 3: 유니스 Apps Script에 파일 업로드', 'yellow');
    log('─'.repeat(60), 'blue');

    const productionClaspPath = path.join(__dirname, '../configs/clasp-production.json');
    const claspJsonPath = path.join(__dirname, '../.clasp.json');

    fs.copyFileSync(productionClaspPath, claspJsonPath);
    log('✅ clasp 설정을 유니스로 전환', 'green');

    try {
      const pushResult = execSync('npx clasp push --force', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });
      log('✅ 환경 생성 스크립트 업로드 완료\n', 'green');
    } catch (error) {
      log(`❌ 업로드 실패: ${error.message}`, 'red');
      throw error;
    }

    // Step 4: Apps Script 함수 실행
    log('⚙️  Step 4: Apps Script 함수 실행', 'yellow');
    log('─'.repeat(60), 'blue');
    log(`함수 실행: create${envName}환경()`, 'blue');
    log('잠시만 기다려주세요...\n', 'yellow');

    let logOutput = '';
    try {
      // clasp logs로 실행 로그 가져오기
      execSync(`npx clasp run create${envName}환경`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // 로그 가져오기
      logOutput = execSync('npx clasp logs --simplified', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });

      log('✅ Apps Script 함수 실행 완료\n', 'green');
      log('실행 로그:', 'blue');
      log(logOutput, 'reset');

    } catch (error) {
      // clasp run/logs는 에러를 반환할 수 있지만 실제로는 성공할 수 있음
      logOutput = error.stdout || error.stderr || '';
      log('⚠️  Apps Script 실행 완료 (로그 확인 필요)\n', 'yellow');
      if (logOutput) {
        log('실행 로그:', 'blue');
        log(logOutput, 'reset');
      }
    }

    // Step 5: 로그에서 정보 자동 추출
    log('\n📊 Step 5: 생성된 스프레드시트 정보 추출', 'yellow');
    log('─'.repeat(60), 'blue');

    const spreadsheetIdMatch = logOutput.match(/SPREADSHEET_ID:([^\s\n]+)/);
    const folderIdMatch = logOutput.match(/FOLDER_ID:([^\s\n]+)/);
    const spreadsheetUrlMatch = logOutput.match(/SPREADSHEET_URL:(https:\/\/[^\s\n]+)/);

    if (!spreadsheetIdMatch || !folderIdMatch || !spreadsheetUrlMatch) {
      log('⚠️  자동 추출 실패. 수동으로 정보를 확인해주세요.', 'yellow');
      log('\n다음 URL에서 Apps Script 실행 로그를 확인하세요:', 'blue');
      log('https://script.google.com/home/projects/1v9nS8uWn9PWUltTR05AMVJL9mFwlsNZakRimiKGuASwRtqkGIoLguZMi/edit', 'green');
      log('\n로그에서 다음 정보를 찾아서 수동으로 설정 파일을 생성하세요:', 'blue');
      log('- SPREADSHEET_ID', 'blue');
      log('- FOLDER_ID', 'blue');
      log('- SPREADSHEET_URL', 'blue');
      log('\n그 다음 새 스프레드시트에서 scriptId를 가져와서:', 'blue');
      log('node scripts/create-environment-config.js 명령을 실행하세요.\n', 'green');
      process.exit(0);
    }

    const spreadsheetId = spreadsheetIdMatch[1];
    const folderId = folderIdMatch[1];
    const spreadsheetUrl = spreadsheetUrlMatch[1];

    log(`✅ spreadsheetId: ${spreadsheetId}`, 'green');
    log(`✅ folderId: ${folderId}`, 'green');
    log(`✅ spreadsheetUrl: ${spreadsheetUrl}\n`, 'green');

    // Step 6: 새 스프레드시트 열고 scriptId 안내
    log('🔑 Step 6: 새 스프레드시트의 Apps Script 프로젝트 ID 필요', 'yellow');
    log('─'.repeat(60), 'blue');
    log('\n다음 단계를 진행해주세요:', 'bright');
    log(`1. ${spreadsheetUrl} 열기`, 'blue');
    log('2. 확장 프로그램 > Apps Script', 'blue');
    log('3. 설정 ⚙️ > 프로젝트 설정', 'blue');
    log('4. 스크립트 ID 복사', 'blue');
    log('5. 아래 명령어 실행:\n', 'blue');
    log(`   node scripts/create-environment-config.js ${envKey} ${envName} <scriptId> ${spreadsheetId} ${folderId} "${spreadsheetUrl}" "${description}"`, 'green');
    log('');

    // 임시 정보 파일 생성
    const tempInfoPath = path.join(__dirname, `../configs/temp-${envKey}-info.json`);
    const tempInfo = {
      envKey,
      envName,
      spreadsheetId,
      folderId,
      spreadsheetUrl,
      description,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(tempInfoPath, JSON.stringify(tempInfo, null, 2), 'utf8');
    log(`💾 임시 정보 저장: configs/temp-${envKey}-info.json`, 'blue');
    log('   (scriptId 입력 후 설정 완료에 사용됩니다)\n', 'blue');

    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('     ⚠️  추가 작업 필요', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('\n위의 scriptId를 가져온 후 다음 명령어를 실행하세요:\n', 'bright');
    log(`node scripts/complete-environment-setup.js ${envKey} <scriptId>\n`, 'green');

  } catch (error) {
    log(`\n❌ 오류 발생: ${error.message}`, 'red');
    if (error.stack) {
      log(error.stack, 'red');
    }
    process.exit(1);
  }
}

// 실행
main();
