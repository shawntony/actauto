/**
 * 소스 스프레드시트의 모든 시트 1행을 대상 스프레드시트들의 동일한 시트에 복사
 *
 * 사용법:
 * 1. Apps Script 편집기에서 이 코드를 복사
 * 2. startCopyRow1() 함수를 실행
 */

// 환경 설정 - Row1 Copy
const ROW1_SOURCE_SPREADSHEET_ID = '1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8'; // 유니스

const ROW1_TARGET_SPREADSHEETS = [
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

const ROW1_MAX_EXECUTION_TIME = 3 * 60 * 1000; // 3분
const ROW1_SHEETS_PER_BATCH = 5; // 배치당 5개 시트 처리

/**
 * 1행 복사 프로세스 시작
 */
function startCopyRow1() {
  const scriptProperties = PropertiesService.getScriptProperties();

  // 기존 진행 상황 초기화
  scriptProperties.deleteProperty('ROW1_COPY_PROGRESS');

  // 기존 트리거 정리
  cleanupRow1Triggers();

  // 소스 스프레드시트 열기
  const sourceSpreadsheet = SpreadsheetApp.openById(ROW1_SOURCE_SPREADSHEET_ID);
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

  scriptProperties.setProperty('ROW1_COPY_PROGRESS', JSON.stringify(progress));

  Logger.log(`1행 복사 프로세스 시작`);
  Logger.log(`소스: 법인재무관리_유니스`);
  Logger.log(`대상: ${ROW1_TARGET_SPREADSHEETS.length}개 스프레드시트`);
  Logger.log(`시트: ${sourceSheets.length}개`);

  // 첫 번째 배치 실행
  processRow1Batch();
}

/**
 * 배치 처리 - 1행 복사
 */
function processRow1Batch() {
  const startTime = new Date().getTime();
  const scriptProperties = PropertiesService.getScriptProperties();

  // 진행 상황 로드
  const progressJson = scriptProperties.getProperty('ROW1_COPY_PROGRESS');
  if (!progressJson) {
    Logger.log('진행 상황을 찾을 수 없습니다. startCopyRow1()을 먼저 실행하세요.');
    return;
  }

  const progress = JSON.parse(progressJson);

  Logger.log(`배치 시작 - 시트: ${progress.sheetIndex}/${progress.totalSheets}`);

  try {
    // 스프레드시트 열기
    const sourceSpreadsheet = SpreadsheetApp.openById(ROW1_SOURCE_SPREADSHEET_ID);
    const sourceSheets = sourceSpreadsheet.getSheets();

    // 대상 스프레드시트들 열기
    const targetSpreadsheets = ROW1_TARGET_SPREADSHEETS.map(target => ({
      name: target.name,
      spreadsheet: SpreadsheetApp.openById(target.id)
    }));

    // 이 배치에서 처리할 시트 수
    let sheetsProcessedInBatch = 0;

    // 시트 처리 루프
    while (progress.sheetIndex < progress.totalSheets && sheetsProcessedInBatch < ROW1_SHEETS_PER_BATCH) {
      // 시간 체크
      const elapsedTime = new Date().getTime() - startTime;
      if (elapsedTime > ROW1_MAX_EXECUTION_TIME) {
        Logger.log(`실행 시간 초과 (${Math.round(elapsedTime / 1000)}초). 다음 배치로 연기합니다.`);
        break;
      }

      const sourceSheet = sourceSheets[progress.sheetIndex];
      const sheetName = sourceSheet.getName();

      Logger.log(`처리 중: ${sheetName} (${progress.sheetIndex + 1}/${progress.totalSheets})`);

      try {
        // 소스 시트의 1행 데이터 가져오기
        const lastColumn = sourceSheet.getLastColumn();
        if (lastColumn === 0) {
          Logger.log(`  ⊘ ${sheetName}: 빈 시트, 건너뜀`);
          progress.results.skipped++;
          progress.sheetIndex++;
          sheetsProcessedInBatch++;
          continue;
        }

        const row1Range = sourceSheet.getRange(1, 1, 1, lastColumn);
        const row1Values = row1Range.getValues();
        const row1Formats = row1Range.getNumberFormats();
        const row1FontWeights = row1Range.getFontWeights();
        const row1FontColors = row1Range.getFontColors();
        const row1Backgrounds = row1Range.getBackgrounds();
        const row1HorizontalAlignments = row1Range.getHorizontalAlignments();

        Logger.log(`  → 1행 데이터 (${lastColumn}개 열)`);

        // 각 대상 스프레드시트에 복사
        let successCount = 0;
        targetSpreadsheets.forEach(target => {
          try {
            const targetSheet = target.spreadsheet.getSheetByName(sheetName);

            if (!targetSheet) {
              Logger.log(`    ✗ ${target.name}: 시트 '${sheetName}' 없음`);
              return;
            }

            // 대상 시트의 1행에 복사
            const targetRange = targetSheet.getRange(1, 1, 1, lastColumn);
            targetRange.setValues(row1Values);
            targetRange.setNumberFormats(row1Formats);
            targetRange.setFontWeights(row1FontWeights);
            targetRange.setFontColors(row1FontColors);
            targetRange.setBackgrounds(row1Backgrounds);
            targetRange.setHorizontalAlignments(row1HorizontalAlignments);

            successCount++;
            Logger.log(`    ✓ ${target.name}: 복사 완료`);

          } catch (error) {
            Logger.log(`    ✗ ${target.name}: 오류 - ${error.message}`);
          }
        });

        if (successCount === ROW1_TARGET_SPREADSHEETS.length) {
          progress.results.success++;
        } else if (successCount > 0) {
          progress.results.success++;
          Logger.log(`  ⚠ 일부만 성공 (${successCount}/${ROW1_TARGET_SPREADSHEETS.length})`);
        } else {
          progress.results.failed++;
        }

        Utilities.sleep(500); // 대기

      } catch (error) {
        Logger.log(`  ✗ ${sheetName} 처리 실패: ${error.message}`);
        progress.results.failed++;
      }

      progress.sheetIndex++;
      sheetsProcessedInBatch++;

      // 진행 상황 저장
      scriptProperties.setProperty('ROW1_COPY_PROGRESS', JSON.stringify(progress));
    }

    Logger.log(`이번 배치 완료: ${sheetsProcessedInBatch}개 시트 처리됨`);

    // 모든 시트 처리 완료 확인
    if (progress.sheetIndex >= progress.totalSheets) {
      Logger.log('=== 모든 1행 복사 완료! ===');
      Logger.log(`성공: ${progress.results.success}개`);
      Logger.log(`실패: ${progress.results.failed}개`);
      Logger.log(`건너뜀: ${progress.results.skipped}개`);

      scriptProperties.deleteProperty('ROW1_COPY_PROGRESS');
      cleanupRow1Triggers();

      // 완료 이메일 발송
      const email = Session.getActiveUser().getEmail();
      if (email) {
        MailApp.sendEmail({
          to: email,
          subject: '시트 1행 복사 완료',
          body: `모든 시트의 1행이 복사되었습니다.\n\n` +
                `소스: 법인재무관리_유니스\n` +
                `대상: ${ROW1_TARGET_SPREADSHEETS.map(t => t.name).join(', ')}\n` +
                `총 시트: ${progress.totalSheets}개\n` +
                `성공: ${progress.results.success}개\n` +
                `실패: ${progress.results.failed}개\n` +
                `건너뜀: ${progress.results.skipped}개\n` +
                `완료 시간: ${new Date().toLocaleString('ko-KR')}`
        });
      }

      return;
    }

    // 다음 배치를 위한 트리거 생성
    Logger.log('다음 배치를 1분 후에 실행합니다...');
    ScriptApp.newTrigger('processRow1Batch')
      .timeBased()
      .after(1 * 60 * 1000) // 1분 후
      .create();

  } catch (error) {
    Logger.log(`배치 처리 중 오류 발생: ${error.message}`);

    // 오류 발생 시에도 다음 배치 시도
    ScriptApp.newTrigger('processRow1Batch')
      .timeBased()
      .after(2 * 60 * 1000) // 2분 후 재시도
      .create();
  }
}

/**
 * 기존 트리거 정리
 */
function cleanupRow1Triggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processRow1Batch') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  Logger.log('기존 트리거 정리 완료');
}

/**
 * 진행 상황 확인
 */
function checkRow1Progress() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const progressJson = scriptProperties.getProperty('ROW1_COPY_PROGRESS');

  if (!progressJson) {
    Logger.log('진행 중인 작업이 없습니다.');
    return;
  }

  const progress = JSON.parse(progressJson);

  Logger.log('=== 현재 진행 상황 ===');
  Logger.log(`시트: ${progress.sheetIndex}/${progress.totalSheets}`);
  Logger.log(`진행률: ${Math.round(progress.sheetIndex / progress.totalSheets * 100)}%`);
  Logger.log(`성공: ${progress.results.success}개`);
  Logger.log(`실패: ${progress.results.failed}개`);
  Logger.log(`건너뜀: ${progress.results.skipped}개`);
  Logger.log(`시작 시간: ${progress.startTime}`);
}

/**
 * 복사 프로세스 중지
 */
function stopRow1CopyProcess() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.deleteProperty('ROW1_COPY_PROGRESS');
  cleanupRow1Triggers();
  Logger.log('1행 복사 프로세스가 중지되었습니다.');
}

/**
 * 소스 스프레드시트의 모든 시트 목록 확인
 */
function listSourceSheets() {
  const sourceSpreadsheet = SpreadsheetApp.openById(ROW1_SOURCE_SPREADSHEET_ID);
  const sheets = sourceSpreadsheet.getSheets();

  Logger.log('=== 소스 스프레드시트 시트 목록 ===');
  Logger.log(`총 ${sheets.length}개 시트`);
  Logger.log('');

  sheets.forEach((sheet, index) => {
    Logger.log(`${index + 1}. "${sheet.getName()}"`);
  });
}

/**
 * 특정 시트의 1행만 복사 (테스트용)
 */
function testCopyRow1(sheetName) {
  const sourceSpreadsheet = SpreadsheetApp.openById(ROW1_SOURCE_SPREADSHEET_ID);
  const sourceSheet = sourceSpreadsheet.getSheetByName(sheetName);

  if (!sourceSheet) {
    Logger.log(`시트 '${sheetName}'을 찾을 수 없습니다.`);
    return;
  }

  const lastColumn = sourceSheet.getLastColumn();
  const row1Range = sourceSheet.getRange(1, 1, 1, lastColumn);
  const row1Values = row1Range.getValues();

  Logger.log(`소스 시트: ${sheetName}`);
  Logger.log(`1행 데이터: ${row1Values[0].join(', ')}`);

  ROW1_TARGET_SPREADSHEETS.forEach(target => {
    const targetSpreadsheet = SpreadsheetApp.openById(target.id);
    const targetSheet = targetSpreadsheet.getSheetByName(sheetName);

    if (!targetSheet) {
      Logger.log(`✗ ${target.name}: 시트 없음`);
      return;
    }

    const targetRange = targetSheet.getRange(1, 1, 1, lastColumn);
    targetRange.setValues(row1Values);

    Logger.log(`✓ ${target.name}: 복사 완료`);
  });
}

/**
 * 간편 테스트 함수 - 은행원장 시트
 */
function test은행원장() {
  testCopyRow1("은행원장");
}

/**
 * 간편 테스트 함수 - 거래처 시트
 */
function test거래처() {
  testCopyRow1("거래처");
}
