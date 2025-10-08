/**
 * 법인재무관리_유니스의 모든 시트를 새로 생성된 스프레드시트들에 복사
 * 초보수적 접근: 한 번에 하나의 대상, 배치당 3개 시트만 복사
 *
 * 사용법:
 * 1. Apps Script 편집기에서 이 코드를 복사
 * 2. startCopyProcess() 함수를 실행
 */

// 환경 설정
const SOURCE_SPREADSHEET_ID = '1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8'; // 유니스

const TARGET_SPREADSHEETS = [
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

const SHEETS_PER_BATCH = 3; // 배치당 3개 시트만 복사
const MAX_EXECUTION_TIME = 3 * 60 * 1000; // 3분 (더 보수적)

/**
 * 복사 프로세스 시작
 */
function startCopyProcess() {
  const scriptProperties = PropertiesService.getScriptProperties();

  // 기존 진행 상황 초기화
  scriptProperties.deleteProperty('COPY_PROGRESS');

  // 기존 트리거 정리
  cleanupTriggers();

  // 소스 스프레드시트 열기
  const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
  const sourceSheets = sourceSpreadsheet.getSheets();

  // 초기 진행 상황 저장
  const progress = {
    targetIndex: 0,
    sheetIndex: 0,
    totalSheets: sourceSheets.length,
    totalTargets: TARGET_SPREADSHEETS.length,
    startTime: new Date().toISOString()
  };

  scriptProperties.setProperty('COPY_PROGRESS', JSON.stringify(progress));

  Logger.log(`복사 프로세스 시작`);
  Logger.log(`대상: ${TARGET_SPREADSHEETS.length}개 스프레드시트`);
  Logger.log(`시트: ${sourceSheets.length}개`);

  // 첫 번째 배치 실행
  processBatchConservative();
}

/**
 * 배치 처리 - 초보수적 접근
 */
function processBatchConservative() {
  const startTime = new Date().getTime();
  const scriptProperties = PropertiesService.getScriptProperties();

  // 진행 상황 로드
  const progressJson = scriptProperties.getProperty('COPY_PROGRESS');
  if (!progressJson) {
    Logger.log('진행 상황을 찾을 수 없습니다. startCopyProcess()를 먼저 실행하세요.');
    return;
  }

  const progress = JSON.parse(progressJson);

  Logger.log(`배치 시작 - 대상: ${TARGET_SPREADSHEETS[progress.targetIndex].name}, 시트: ${progress.sheetIndex}/${progress.totalSheets}`);

  try {
    // 스프레드시트 열기
    const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
    const sourceSheets = sourceSpreadsheet.getSheets();

    // 현재 대상 스프레드시트
    const currentTarget = TARGET_SPREADSHEETS[progress.targetIndex];
    const targetSpreadsheet = SpreadsheetApp.openById(currentTarget.id);

    // 이 배치에서 처리할 시트 수
    let sheetsProcessedInBatch = 0;

    // 시트 복사 루프
    while (progress.sheetIndex < progress.totalSheets && sheetsProcessedInBatch < SHEETS_PER_BATCH) {
      // 시간 체크 (더 자주)
      const elapsedTime = new Date().getTime() - startTime;
      if (elapsedTime > MAX_EXECUTION_TIME) {
        Logger.log(`실행 시간 초과 (${Math.round(elapsedTime / 1000)}초). 다음 배치로 연기합니다.`);
        break;
      }

      const sourceSheet = sourceSheets[progress.sheetIndex];
      const sheetName = sourceSheet.getName();

      Logger.log(`복사 중: ${sheetName} (${progress.sheetIndex + 1}/${progress.totalSheets})`);

      try {
        // 기존 시트가 있으면 삭제
        const existingSheet = targetSpreadsheet.getSheetByName(sheetName);
        if (existingSheet) {
          targetSpreadsheet.deleteSheet(existingSheet);
          Utilities.sleep(500); // 삭제 대기
        }

        // 시트 복사
        sourceSheet.copyTo(targetSpreadsheet).setName(sheetName);
        Utilities.sleep(1000); // 복사 대기

        Logger.log(`✓ ${sheetName} 복사 완료`);

      } catch (error) {
        Logger.log(`✗ ${sheetName} 복사 실패: ${error.message}`);
      }

      progress.sheetIndex++;
      sheetsProcessedInBatch++;

      // 진행 상황 저장
      scriptProperties.setProperty('COPY_PROGRESS', JSON.stringify(progress));
    }

    Logger.log(`이번 배치 완료: ${sheetsProcessedInBatch}개 시트 처리됨`);

    // 현재 대상 스프레드시트의 모든 시트를 복사했는지 확인
    if (progress.sheetIndex >= progress.totalSheets) {
      // 다음 대상으로 이동
      progress.targetIndex++;
      progress.sheetIndex = 0;

      if (progress.targetIndex >= progress.totalTargets) {
        // 모든 작업 완료
        Logger.log('=== 모든 시트 복사 완료! ===');
        scriptProperties.deleteProperty('COPY_PROGRESS');
        cleanupTriggers();

        // 완료 이메일 발송
        const email = Session.getActiveUser().getEmail();
        if (email) {
          MailApp.sendEmail({
            to: email,
            subject: '시트 복사 완료',
            body: `모든 시트가 성공적으로 복사되었습니다.\n\n` +
                  `소스: 법인재무관리_유니스\n` +
                  `대상: ${TARGET_SPREADSHEETS.map(t => t.name).join(', ')}\n` +
                  `시트 수: ${progress.totalSheets}개\n` +
                  `완료 시간: ${new Date().toLocaleString('ko-KR')}`
          });
        }

        return;
      }

      Logger.log(`다음 대상으로 이동: ${TARGET_SPREADSHEETS[progress.targetIndex].name}`);
      scriptProperties.setProperty('COPY_PROGRESS', JSON.stringify(progress));
    }

    // 다음 배치를 위한 트리거 생성
    Logger.log('다음 배치를 1분 후에 실행합니다...');
    ScriptApp.newTrigger('processBatchConservative')
      .timeBased()
      .after(1 * 60 * 1000) // 1분 후
      .create();

  } catch (error) {
    Logger.log(`배치 처리 중 오류 발생: ${error.message}`);

    // 오류 발생 시에도 다음 배치 시도
    ScriptApp.newTrigger('processBatchConservative')
      .timeBased()
      .after(2 * 60 * 1000) // 2분 후 재시도
      .create();
  }
}

/**
 * 기존 트리거 정리
 */
function cleanupTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processBatchConservative') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  Logger.log('기존 트리거 정리 완료');
}

/**
 * 진행 상황 확인
 */
function checkProgress() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const progressJson = scriptProperties.getProperty('COPY_PROGRESS');

  if (!progressJson) {
    Logger.log('진행 중인 작업이 없습니다.');
    return;
  }

  const progress = JSON.parse(progressJson);
  const currentTarget = TARGET_SPREADSHEETS[progress.targetIndex];

  Logger.log('=== 현재 진행 상황 ===');
  Logger.log(`대상: ${currentTarget.name} (${progress.targetIndex + 1}/${progress.totalTargets})`);
  Logger.log(`시트: ${progress.sheetIndex}/${progress.totalSheets}`);
  Logger.log(`진행률: ${Math.round((progress.targetIndex * progress.totalSheets + progress.sheetIndex) / (progress.totalTargets * progress.totalSheets) * 100)}%`);
  Logger.log(`시작 시간: ${progress.startTime}`);
}

/**
 * 복사 프로세스 중지
 */
function stopCopyProcess() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.deleteProperty('COPY_PROGRESS');
  cleanupTriggers();
  Logger.log('복사 프로세스가 중지되었습니다.');
}

/**
 * 테스트: 기본 시트만 남기고 모두 삭제
 */
function cleanupDefaultSheets() {
  TARGET_SPREADSHEETS.forEach(target => {
    const ss = SpreadsheetApp.openById(target.id);
    const sheets = ss.getSheets();

    Logger.log(`${target.name}: ${sheets.length}개 시트 정리 중...`);

    sheets.forEach(sheet => {
      if (sheet.getName() === '시트1' || sheet.getName() === 'Sheet1') {
        // 기본 시트는 유지
      } else {
        try {
          ss.deleteSheet(sheet);
          Logger.log(`  삭제: ${sheet.getName()}`);
        } catch (error) {
          Logger.log(`  삭제 실패: ${sheet.getName()}`);
        }
      }
    });
  });

  Logger.log('정리 완료');
}
