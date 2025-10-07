function clearP2toRColumnInLedger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ledgerSheet = ss.getSheetByName('은행원장');
  
  if (!ledgerSheet) {
    SpreadsheetApp.getUi().alert('오류: "은행원장" 시트를 찾을 수 없습니다.');
    return;
  }
  
  // R열까지의 삭제 범위를 설정하기 위해 getLastRow()를 사용합니다.
  const lastRow = ledgerSheet.getLastRow();
  
  // P2셀부터 R열의 마지막 행까지의 범위를 설정합니다. (P2:R{마지막 행})
  // P열은 16번째 열입니다. R열은 18번째 열입니다.
  // 시작 행: 2 (P2셀)
  // 시작 열: 16 (P열)
  // 너비: 3 (P열, Q열, R열)
  const rangeToClear = ledgerSheet.getRange(2, 16, lastRow > 1 ? lastRow - 1 : 1, 3);
  
  // 범위의 내용(값)만 삭제합니다.
  rangeToClear.clearContent();
  
  SpreadsheetApp.getUi().alert('은행원장 시트의 P2셀부터 R열 데이터가 성공적으로 삭제되었습니다.');
}