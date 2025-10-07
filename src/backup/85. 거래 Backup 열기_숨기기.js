/**
 * '거래Backup' 시트의 표시 상태를 토글(숨김 ↔ 표시)합니다.
 */
function toggleTransactionBackupSheetVisibility() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const BACKUP_SHEET_NAME = '거래Backup';
  
  const backupSheet = ss.getSheetByName(BACKUP_SHEET_NAME);

  if (!backupSheet) {
    ui.alert(`오류: "${BACKUP_SHEET_NAME}" 시트를 찾을 수 없습니다.`);
    return;
  }

  const action = backupSheet.isSheetHidden() ? '표시' : '숨김';

  try {
    if (backupSheet.isSheetHidden()) {
      // 숨겨져 있으면 표시합니다.
      backupSheet.showSheet();
    } else {
      // 표시되어 있으면 숨깁니다.
      backupSheet.hideSheet();
    }
    
    ui.alert(`✅ "${BACKUP_SHEET_NAME}" 시트 ${action} 처리가 완료되었습니다.`);
    
  } catch (e) {
    ui.alert(`오류: 시트 ${action} 중 문제가 발생했습니다. ` + e.toString());
  }
}
