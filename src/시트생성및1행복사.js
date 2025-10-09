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
  // 기존 진행 상황 초기화
  BatchProgress.delete('UNIFIED_PROGRESS');

  // 기존 트리거 정리
  TriggerManager.cleanup('processUnifiedBatch');

  // 소스 스프레드시트 열기
  const sourceSpreadsheet = SpreadsheetApp.openById(UNIFIED_SOURCE_SPREADSHEET_ID);
  const sourceSheets = sourceSpreadsheet.getSheets();

  // 초기 진행 상황 저장
  BatchProgress.init('UNIFIED_PROGRESS', sourceSheets.length);

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
  const timer = createExecutionTimer(UNIFIED_MAX_EXECUTION_TIME);

  // 진행 상황 로드
  const progress = BatchProgress.get('UNIFIED_PROGRESS');
  if (!progress) {
    Logger.log('진행 상황을 찾을 수 없습니다. startCreateAndCopyRow1()을 먼저 실행하세요.');
    return;
  }

  Logger.log(`배치 시작 - 시트: ${progress.currentIndex}/${progress.totalItems}`);

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
    while (progress.currentIndex < progress.totalItems && sheetsProcessedInBatch < UNIFIED_SHEETS_PER_BATCH) {
      // 시간 체크
      if (timer.isTimeExceeded()) {
        Logger.log(`실행 시간 초과 (${timer.getElapsedSeconds()}초). 다음 배치로 연기합니다.`);
        break;
      }

      const sourceSheet = sourceSheets[progress.currentIndex];
      const sheetName = sourceSheet.getName();

      Logger.log(`\n처리 중: ${sheetName} (${progress.currentIndex + 1}/${progress.totalItems})`);

      try {
        // 소스 시트의 1행 데이터 가져오기
        const lastColumn = sourceSheet.getLastColumn();
        const lastRow = sourceSheet.getLastRow();

        if (lastColumn === 0 || lastRow === 0) {
          Logger.log(`  ⊘ ${sheetName}: 빈 시트, 건너뜀`);
          BatchProgress.increment('UNIFIED_PROGRESS', 'skipped');
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
              DelayUtils.afterSheetCreation(); // 생성 대기
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
          BatchProgress.increment('UNIFIED_PROGRESS', 'success');
        } else if (successCount > 0) {
          BatchProgress.increment('UNIFIED_PROGRESS', 'success');
          Logger.log(`  ⚠️  일부만 성공 (${successCount}/${UNIFIED_TARGET_SPREADSHEETS.length})`);
        } else {
          BatchProgress.increment('UNIFIED_PROGRESS', 'failed');
        }

        DelayUtils.standard(); // 대기

      } catch (error) {
        Logger.log(`  ❌ ${sheetName} 처리 실패: ${error.message}`);
        BatchProgress.increment('UNIFIED_PROGRESS', 'failed');
      }

      sheetsProcessedInBatch++;
    }

    Logger.log(`\n이번 배치 완료: ${sheetsProcessedInBatch}개 시트 처리됨`);

    // 모든 시트 처리 완료 확인
    const updatedProgress = BatchProgress.get('UNIFIED_PROGRESS');
    if (BatchProgress.isComplete('UNIFIED_PROGRESS')) {
      Logger.log('\n=== 🎉 모든 작업 완료! ===');
      Logger.log(`✅ 성공: ${updatedProgress.results.success}개`);
      Logger.log(`❌ 실패: ${updatedProgress.results.failed}개`);
      Logger.log(`⊘ 건너뜀: ${updatedProgress.results.skipped}개`);

      BatchProgress.delete('UNIFIED_PROGRESS');
      TriggerManager.cleanup('processUnifiedBatch');

      // 완료 이메일 발송
      NotificationUtils.batchComplete(
        '시트 생성 및 1행 복사',
        updatedProgress,
        UNIFIED_TARGET_SPREADSHEETS.map(t => t.name)
      );

      return;
    }

    // 다음 배치를 위한 트리거 생성
    Logger.log('다음 배치를 1분 후에 실행합니다...');
    TriggerManager.scheduleNextBatch('processUnifiedBatch', 1);

  } catch (error) {
    Logger.log(`\n❌ 배치 처리 중 오류 발생: ${error.message}`);

    // 오류 발생 시에도 다음 배치 시도
    TriggerManager.scheduleRetry('processUnifiedBatch', 2);
  }
}

/**
 * 진행 상황 확인
 */
function checkUnifiedProgress() {
  const progressTracker = createBatchProgress('UNIFIED_PROGRESS', 0);
  const progress = progressTracker.load();

  if (!progress) {
    Logger.log('진행 중인 작업이 없습니다.');
    return;
  }

  progressTracker.logStatus();
}

/**
 * 프로세스 중지
 */
function stopUnifiedProcess() {
  BatchProgress.delete('UNIFIED_PROGRESS');
  TriggerManager.cleanup('processUnifiedBatch');
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
        DelayUtils.afterSheetCreation();
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
