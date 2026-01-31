/**
 * 급여기본정보 시트 백업 스크립트
 *
 * 목적: 마이그레이션 전 급여기본정보 시트를 백업하여 롤백 가능하도록 보장
 *
 * 작성일: 2026-01-30
 */

/**
 * 급여기본정보 시트를 타임스탬프와 함께 백업
 * @returns {string} 생성된 백업 시트 이름
 */
function backupPayrollBasicInfo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName('급여기본정보');

  if (!sourceSheet) {
    throw new Error('급여기본정보 시트를 찾을 수 없습니다.');
  }

  const timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd_HHmmss');
  const backupSheetName = `급여기본정보_백업_${timestamp}`;

  // 시트 복사
  const backupSheet = sourceSheet.copyTo(ss);
  backupSheet.setName(backupSheetName);

  // 백업 시트 숨김
  backupSheet.hideSheet();

  // 백업 시트를 맨 뒤로 이동
  ss.moveActiveSheet(ss.getNumSheets());

  Logger.log(`백업 완료: ${backupSheetName}`);

  // UI 알림
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    '백업 완료',
    `급여기본정보 시트가 백업되었습니다.\n\n백업 시트: ${backupSheetName}\n(숨김 처리됨)`,
    ui.ButtonSet.OK
  );

  return backupSheetName;
}

/**
 * 백업 시트 목록 조회
 * @returns {Array<string>} 백업 시트 이름 배열
 */
function listBackupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  const backupSheets = sheets
    .filter(sheet => sheet.getName().startsWith('급여기본정보_백업_'))
    .map(sheet => sheet.getName())
    .sort()
    .reverse(); // 최신순

  Logger.log('백업 시트 목록:', backupSheets);
  return backupSheets;
}

/**
 * 특정 백업 시트 복원
 * @param {string} backupSheetName - 복원할 백업 시트 이름
 */
function restoreFromBackup(backupSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const backupSheet = ss.getSheetByName(backupSheetName);

  if (!backupSheet) {
    throw new Error(`백업 시트를 찾을 수 없습니다: ${backupSheetName}`);
  }

  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '복원 확인',
    `${backupSheetName}로 복원하시겠습니까?\n\n현재 급여기본정보 시트는 삭제됩니다.`,
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    Logger.log('복원 취소됨');
    return;
  }

  // 기존 급여기본정보 시트 삭제
  const currentSheet = ss.getSheetByName('급여기본정보');
  if (currentSheet) {
    ss.deleteSheet(currentSheet);
  }

  // 백업 시트 복사 및 이름 변경
  const restoredSheet = backupSheet.copyTo(ss);
  restoredSheet.setName('급여기본정보');
  restoredSheet.showSheet();

  // 원래 위치로 이동 (일반적으로 앞쪽)
  ss.setActiveSheet(restoredSheet);
  ss.moveActiveSheet(1);

  Logger.log(`복원 완료: ${backupSheetName} → 급여기본정보`);

  ui.alert(
    '복원 완료',
    `${backupSheetName}가 급여기본정보로 복원되었습니다.`,
    ui.ButtonSet.OK
  );
}
