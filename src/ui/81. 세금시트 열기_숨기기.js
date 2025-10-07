/**
 * '국세납부환급' 및 '지방세납부환급' 시트의 표시 상태를 토글(숨김 ↔ 표시)합니다.
 */
function toggleTaxSheetsVisibility() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const FEDERAL_TAX_SHEET_NAME = '국세납부환급';
  const LOCAL_TAX_SHEET_NAME = '지방세납부환급';

  const federalSheet = ss.getSheetByName(FEDERAL_TAX_SHEET_NAME);
  const localSheet = ss.getSheetByName(LOCAL_TAX_SHEET_NAME);

  if (!federalSheet || !localSheet) {
    ui.alert('오류: "국세납부환급" 또는 "지방세납부환급" 시트를 찾을 수 없습니다.');
    return;
  }

  // 두 시트가 모두 숨겨져 있으면, 표시합니다.
  if (federalSheet.isSheetHidden() || localSheet.isSheetHidden()) {
    federalSheet.showSheet();
    localSheet.showSheet();
    ui.alert(`✅ 시트가 표시되었습니다: ${FEDERAL_TAX_SHEET_NAME}, ${LOCAL_TAX_SHEET_NAME}`);
  } else {
    // 두 시트가 모두 표시되어 있으면, 숨깁니다.
    federalSheet.hideSheet();
    localSheet.hideSheet();
    ui.alert(`✅ 시트가 숨겨졌습니다: ${FEDERAL_TAX_SHEET_NAME}, ${LOCAL_TAX_SHEET_NAME}`);
  }
}