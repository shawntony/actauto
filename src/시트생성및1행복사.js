/**
 * 소스 스프레드시트의 모든 시트를 대상 스프레드시트들에 생성하고 1행을 복사
 *
 * 사용법:
 * 1. shared/config.js 파일을 먼저 Apps Script 프로젝트에 포함
 * 2. Apps Script 편집기에서 이 코드를 복사
 * 3. startCreateAndCopyRow1() 함수를 실행
 *
 * 참고: 환경 설정은 shared/config.js에서 관리됩니다
 */

// 환경 설정 (shared/config.js에서 가져옴)
const UNIFIED_SOURCE_SPREADSHEET_ID = getSourceSpreadsheet().id;
const UNIFIED_TARGET_SPREADSHEETS = getTargetSpreadsheets();

// 배치 처리 설정 (shared/config.js에서 가져옴)
const UNIFIED_MAX_EXECUTION_TIME = BATCH_CONFIG.MAX_EXECUTION_TIME;
const UNIFIED_SHEETS_PER_BATCH = BATCH_CONFIG.SHEETS_PER_BATCH;

/**
 * 통합 프로세스 시작 - 시트 생성 + 1행 복사
 */
function startCreateAndCopyRow1() {
  const scriptProperties = PropertiesService.getScriptProperties();

  // 기존 진행 상황 초기화
  scriptProperties.deleteProperty('UNIFIED_PROGRESS');

  // 기존 트리거 정리
  cleanupUnifiedTriggers();

  // 소스 스프레드시트 열기
  const sourceSpreadsheet = SpreadsheetApp.openById(UNIFIED_SOURCE_SPREADSHEET_ID);
  const sourceSheets = sourceSpreadsheet.getSheets();

  // 초기 진행 상황 저장
  const progress = {
    sheetIndex: 0,
    totalSheets: sourceSheets.length,
    startTime: new Date().toISOString(),
    results: {
      success: 0,
      failed: 0,
      skipped: 0
    }
  };

  scriptProperties.setProperty('UNIFIED_PROGRESS', JSON.stringify(progress));

  Logger.log(`=== 통합 프로세스 시작 ===`);
  Logger.log(`작업: 시트 생성 + 1행 복사`);
  Logger.log(`소스: 법인재무관리_유니스`);
  Logger.log(`대상: ${UNIFIED_TARGET_SPREADSHEETS.length}개 스프레드시트`);
  Logger.log(`시트: ${sourceSheets.length}개`);

  // 첫 번째 배치 실행
  processUnifiedBatch();
}

/**
 * 배치 처리 - 시트 생성 + 1행 복사
 */
function processUnifiedBatch() {
  const startTime = new Date().getTime();
  const scriptProperties = PropertiesService.getScriptProperties();

  // 진행 상황 로드
  const progressJson = scriptProperties.getProperty('UNIFIED_PROGRESS');
  if (!progressJson) {
    Logger.log('진행 상황을 찾을 수 없습니다. startCreateAndCopyRow1()을 먼저 실행하세요.');
    return;
  }

  const progress = JSON.parse(progressJson);

  Logger.log(`배치 시작 - 시트: ${progress.sheetIndex}/${progress.totalSheets}`);

  try {
    // 스프레드시트 열기
    const sourceSpreadsheet = SpreadsheetApp.openById(UNIFIED_SOURCE_SPREADSHEET_ID);
    const sourceSheets = sourceSpreadsheet.getSheets();

    // 대상 스프레드시트들 열기
    const targetSpreadsheets = UNIFIED_TARGET_SPREADSHEETS.map(target => ({
      name: target.name,
      spreadsheet: SpreadsheetApp.openById(target.id)
    }));

    // 이 배치에서 처리할 시트 수
    let sheetsProcessedInBatch = 0;

    // 시트 처리 루프
    while (progress.sheetIndex < progress.totalSheets && sheetsProcessedInBatch < UNIFIED_SHEETS_PER_BATCH) {
      // 시간 체크
      const elapsedTime = new Date().getTime() - startTime;
      if (elapsedTime > UNIFIED_MAX_EXECUTION_TIME) {
        Logger.log(`실행 시간 초과 (${Math.round(elapsedTime / 1000)}초). 다음 배치로 연기합니다.`);
        break;
      }

      const sourceSheet = sourceSheets[progress.sheetIndex];
      const sheetName = sourceSheet.getName();

      Logger.log(`\n처리 중: ${sheetName} (${progress.sheetIndex + 1}/${progress.totalSheets})`);

      try {
        // 소스 시트의 1행 데이터 가져오기
        const lastColumn = sourceSheet.getLastColumn();
        const lastRow = sourceSheet.getLastRow();

        if (lastColumn === 0 || lastRow === 0) {
          Logger.log(`  ⊘ ${sheetName}: 빈 시트, 건너뜀`);
          progress.results.skipped++;
          progress.sheetIndex++;
          sheetsProcessedInBatch++;
          continue;
        }

        // 1행 데이터 및 서식 가져오기
        const row1Range = sourceSheet.getRange(1, 1, 1, lastColumn);
        const row1Values = row1Range.getValues();
        const row1Formats = row1Range.getNumberFormats();
        const row1FontWeights = row1Range.getFontWeights();
        const row1FontColors = row1Range.getFontColors();
        const row1Backgrounds = row1Range.getBackgrounds();
        const row1HorizontalAlignments = row1Range.getHorizontalAlignments();

        Logger.log(`  📊 1행 데이터: ${lastColumn}개 열`);

        // 각 대상 스프레드시트 처리
        let successCount = 0;
        targetSpreadsheets.forEach(target => {
          try {
            let targetSheet = target.spreadsheet.getSheetByName(sheetName);

            // 시트가 없으면 생성
            if (!targetSheet) {
              Logger.log(`    📝 ${target.name}: 시트 생성 중...`);
              targetSheet = target.spreadsheet.insertSheet(sheetName);
              Utilities.sleep(500); // 생성 대기
            }

            // 1행에 데이터 복사
            const targetRange = targetSheet.getRange(1, 1, 1, lastColumn);
            targetRange.setValues(row1Values);
            targetRange.setNumberFormats(row1Formats);
            targetRange.setFontWeights(row1FontWeights);
            targetRange.setFontColors(row1FontColors);
            targetRange.setBackgrounds(row1Backgrounds);
            targetRange.setHorizontalAlignments(row1HorizontalAlignments);

            successCount++;
            Logger.log(`    ✅ ${target.name}: 완료`);

          } catch (error) {
            Logger.log(`    ❌ ${target.name}: 오류 - ${error.message}`);
          }
        });

        if (successCount === UNIFIED_TARGET_SPREADSHEETS.length) {
          progress.results.success++;
        } else if (successCount > 0) {
          progress.results.success++;
          Logger.log(`  ⚠️  일부만 성공 (${successCount}/${UNIFIED_TARGET_SPREADSHEETS.length})`);
        } else {
          progress.results.failed++;
        }

        Utilities.sleep(500); // 대기

      } catch (error) {
        Logger.log(`  ❌ ${sheetName} 처리 실패: ${error.message}`);
        progress.results.failed++;
      }

      progress.sheetIndex++;
      sheetsProcessedInBatch++;

      // 진행 상황 저장
      scriptProperties.setProperty('UNIFIED_PROGRESS', JSON.stringify(progress));
    }

    Logger.log(`\n이번 배치 완료: ${sheetsProcessedInBatch}개 시트 처리됨`);

    // 모든 시트 처리 완료 확인
    if (progress.sheetIndex >= progress.totalSheets) {
      Logger.log('\n=== 🎉 모든 작업 완료! ===');
      Logger.log(`✅ 성공: ${progress.results.success}개`);
      Logger.log(`❌ 실패: ${progress.results.failed}개`);
      Logger.log(`⊘ 건너뜀: ${progress.results.skipped}개`);

      scriptProperties.deleteProperty('UNIFIED_PROGRESS');
      cleanupUnifiedTriggers();

      // 완료 이메일 발송
      const email = Session.getActiveUser().getEmail();
      if (email) {
        MailApp.sendEmail({
          to: email,
          subject: '📋 시트 생성 및 1행 복사 완료',
          body: `모든 작업이 완료되었습니다!\n\n` +
                `📌 작업 내용:\n` +
                `- 시트 생성 (없는 경우)\n` +
                `- 1행 데이터 및 서식 복사\n\n` +
                `📊 소스: 법인재무관리_유니스\n` +
                `🎯 대상: ${UNIFIED_TARGET_SPREADSHEETS.map(t => t.name).join(', ')}\n\n` +
                `📈 결과:\n` +
                `총 시트: ${progress.totalSheets}개\n` +
                `✅ 성공: ${progress.results.success}개\n` +
                `❌ 실패: ${progress.results.failed}개\n` +
                `⊘ 건너뜀: ${progress.results.skipped}개\n\n` +
                `⏰ 완료 시간: ${new Date().toLocaleString('ko-KR')}`
        });
      }

      return;
    }

    // 다음 배치를 위한 트리거 생성
    Logger.log('다음 배치를 1분 후에 실행합니다...');
    ScriptApp.newTrigger('processUnifiedBatch')
      .timeBased()
      .after(1 * 60 * 1000) // 1분 후
      .create();

  } catch (error) {
    Logger.log(`\n❌ 배치 처리 중 오류 발생: ${error.message}`);

    // 오류 발생 시에도 다음 배치 시도
    ScriptApp.newTrigger('processUnifiedBatch')
      .timeBased()
      .after(2 * 60 * 1000) // 2분 후 재시도
      .create();
  }
}

/**
 * 기존 트리거 정리
 */
function cleanupUnifiedTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processUnifiedBatch') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  Logger.log('기존 트리거 정리 완료');
}

/**
 * 진행 상황 확인
 */
function checkUnifiedProgress() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const progressJson = scriptProperties.getProperty('UNIFIED_PROGRESS');

  if (!progressJson) {
    Logger.log('진행 중인 작업이 없습니다.');
    return;
  }

  const progress = JSON.parse(progressJson);

  Logger.log('=== 📊 현재 진행 상황 ===');
  Logger.log(`시트: ${progress.sheetIndex}/${progress.totalSheets}`);
  Logger.log(`진행률: ${Math.round(progress.sheetIndex / progress.totalSheets * 100)}%`);
  Logger.log(`✅ 성공: ${progress.results.success}개`);
  Logger.log(`❌ 실패: ${progress.results.failed}개`);
  Logger.log(`⊘ 건너뜀: ${progress.results.skipped}개`);
  Logger.log(`⏰ 시작 시간: ${progress.startTime}`);
}

/**
 * 프로세스 중지
 */
function stopUnifiedProcess() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.deleteProperty('UNIFIED_PROGRESS');
  cleanupUnifiedTriggers();
  Logger.log('작업이 중지되었습니다.');
}

/**
 * 특정 시트만 테스트 (시트 생성 + 1행 복사)
 */
function testUnifiedCopy(sheetName) {
  const sourceSpreadsheet = SpreadsheetApp.openById(UNIFIED_SOURCE_SPREADSHEET_ID);
  const sourceSheet = sourceSpreadsheet.getSheetByName(sheetName);

  if (!sourceSheet) {
    Logger.log(`❌ 시트 '${sheetName}'을 찾을 수 없습니다.`);
    return;
  }

  const lastColumn = sourceSheet.getLastColumn();

  if (lastColumn === 0) {
    Logger.log(`⊘ ${sheetName}: 빈 시트입니다.`);
    return;
  }

  // 1행 데이터 가져오기
  const row1Range = sourceSheet.getRange(1, 1, 1, lastColumn);
  const row1Values = row1Range.getValues();
  const row1Formats = row1Range.getNumberFormats();
  const row1FontWeights = row1Range.getFontWeights();
  const row1FontColors = row1Range.getFontColors();
  const row1Backgrounds = row1Range.getBackgrounds();
  const row1HorizontalAlignments = row1Range.getHorizontalAlignments();

  Logger.log(`\n📋 소스 시트: ${sheetName}`);
  Logger.log(`📊 1행 데이터: ${row1Values[0].join(', ')}`);
  Logger.log('');

  UNIFIED_TARGET_SPREADSHEETS.forEach(target => {
    try {
      const targetSpreadsheet = SpreadsheetApp.openById(target.id);
      let targetSheet = targetSpreadsheet.getSheetByName(sheetName);

      // 시트가 없으면 생성
      if (!targetSheet) {
        Logger.log(`📝 ${target.name}: 시트 생성 중...`);
        targetSheet = targetSpreadsheet.insertSheet(sheetName);
      }

      // 1행 복사
      const targetRange = targetSheet.getRange(1, 1, 1, lastColumn);
      targetRange.setValues(row1Values);
      targetRange.setNumberFormats(row1Formats);
      targetRange.setFontWeights(row1FontWeights);
      targetRange.setFontColors(row1FontColors);
      targetRange.setBackgrounds(row1Backgrounds);
      targetRange.setHorizontalAlignments(row1HorizontalAlignments);

      Logger.log(`✅ ${target.name}: 완료`);

    } catch (error) {
      Logger.log(`❌ ${target.name}: 오류 - ${error.message}`);
    }
  });

  Logger.log('\n테스트 완료!');
}

/**
 * 간편 테스트 함수 - 은행원장
 */
function test은행원장통합() {
  testUnifiedCopy("은행원장");
}

/**
 * 간편 테스트 함수 - 거래처
 */
function test거래처통합() {
  testUnifiedCopy("거래처");
}

/**
 * 소스 시트 목록 확인
 */
function listUnifiedSourceSheets() {
  const sourceSpreadsheet = SpreadsheetApp.openById(UNIFIED_SOURCE_SPREADSHEET_ID);
  const sheets = sourceSpreadsheet.getSheets();

  Logger.log('=== 📋 소스 스프레드시트 시트 목록 ===');
  Logger.log(`총 ${sheets.length}개 시트\n`);

  sheets.forEach((sheet, index) => {
    const lastColumn = sheet.getLastColumn();
    const lastRow = sheet.getLastRow();
    Logger.log(`${index + 1}. "${sheet.getName()}" (${lastRow}행 × ${lastColumn}열)`);
  });
}
