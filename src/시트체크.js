/**
 * 모든 환경의 시트 목록을 확인하는 스크립트
 *
 * 사용법:
 * 1. shared/config.js 파일을 먼저 Apps Script 프로젝트에 포함
 * 2. 이 스크립트를 Apps Script 편집기에 복사해서 실행
 *
 * 참고: 환경 설정은 shared/config.js에서 관리됩니다
 */

// 환경 설정 (shared/config.js에서 가져옴)
const SPREADSHEETS = getAllSpreadsheets();

function checkAllSheets() {
  Logger.log('='.repeat(70));
  Logger.log('📊 모든 환경의 시트 목록 확인');
  Logger.log('='.repeat(70));
  Logger.log('');

  const sourceSpreadsheet = SpreadsheetApp.openById(SPREADSHEETS[0].id);
  const sourceSheets = sourceSpreadsheet.getSheets();
  const sourceSheetNames = sourceSheets.map(s => s.getName());

  Logger.log(`📌 소스 (${SPREADSHEETS[0].name}): ${sourceSheetNames.length}개 시트`);
  sourceSheetNames.forEach((name, index) => {
    Logger.log(`   ${index + 1}. ${name}`);
  });
  Logger.log('');

  // 각 대상 환경 확인
  const results = {
    total: sourceSheetNames.length,
    missing: {},
    summary: []
  };

  for (let i = 1; i < SPREADSHEETS.length; i++) {
    const target = SPREADSHEETS[i];

    try {
      const targetSpreadsheet = SpreadsheetApp.openById(target.id);
      const targetSheets = targetSpreadsheet.getSheets();
      const targetSheetNames = targetSheets.map(s => s.getName());

      Logger.log(`📋 ${target.name}: ${targetSheetNames.length}개 시트`);

      // 누락된 시트 찾기
      const missingSheets = sourceSheetNames.filter(name => !targetSheetNames.includes(name));

      if (missingSheets.length > 0) {
        Logger.log(`   ⚠️  누락된 시트 (${missingSheets.length}개):`);
        missingSheets.forEach(name => {
          Logger.log(`      ❌ ${name}`);
        });
        results.missing[target.name] = missingSheets;
      } else {
        Logger.log(`   ✅ 모든 시트 존재`);
      }

      // 추가로 있는 시트 찾기
      const extraSheets = targetSheetNames.filter(name => !sourceSheetNames.includes(name));
      if (extraSheets.length > 0) {
        Logger.log(`   ℹ️  추가 시트 (${extraSheets.length}개):`);
        extraSheets.forEach(name => {
          Logger.log(`      + ${name}`);
        });
      }

      results.summary.push({
        name: target.name,
        total: targetSheetNames.length,
        missing: missingSheets.length,
        extra: extraSheets.length,
        status: missingSheets.length === 0 ? '✅' : '⚠️'
      });

      Logger.log('');

    } catch (error) {
      Logger.log(`   ❌ 오류: ${error.message}`);
      Logger.log('');
      results.summary.push({
        name: target.name,
        status: '❌',
        error: error.message
      });
    }
  }

  // 요약
  Logger.log('='.repeat(70));
  Logger.log('📊 요약');
  Logger.log('='.repeat(70));
  Logger.log('');

  results.summary.forEach(item => {
    if (item.error) {
      Logger.log(`${item.status} ${item.name}: 접근 오류 - ${item.error}`);
    } else {
      Logger.log(`${item.status} ${item.name}: ${item.total}개 시트 (누락: ${item.missing}, 추가: ${item.extra})`);
    }
  });

  Logger.log('');

  if (Object.keys(results.missing).length > 0) {
    Logger.log('⚠️  누락된 시트가 있습니다:');
    Object.keys(results.missing).forEach(env => {
      Logger.log(`   ${env}: ${results.missing[env].join(', ')}`);
    });
    Logger.log('');
    Logger.log('💡 해결 방법: startCreateAndCopyRow1() 함수를 다시 실행하세요.');
  } else {
    Logger.log('✅ 모든 환경이 정상입니다!');
  }

  Logger.log('');
  Logger.log('='.repeat(70));
}

function checkSpecificSheet(sheetName) {
  Logger.log(`🔍 "${sheetName}" 시트 확인\n`);

  SPREADSHEETS.forEach(env => {
    try {
      const ss = SpreadsheetApp.openById(env.id);
      const sheet = ss.getSheetByName(sheetName);

      if (sheet) {
        const lastRow = sheet.getLastRow();
        const lastColumn = sheet.getLastColumn();
        Logger.log(`✅ ${env.name}: 존재 (${lastRow}행 × ${lastColumn}열)`);
      } else {
        Logger.log(`❌ ${env.name}: 없음`);
      }
    } catch (error) {
      Logger.log(`❌ ${env.name}: 오류 - ${error.message}`);
    }
  });
}

// 부가세검증 시트만 확인
function check부가세검증() {
  checkSpecificSheet('부가세검증');
}
