function clearF2toHColumnInConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('설정');
  
  if (!configSheet) {
    UIUtils.alertError(new Error('"설정" 시트를 찾을 수 없습니다.'), '설정 초기화');
    return;
  }
  
  // H열까지의 삭제 범위를 설정하기 위해 getLastRow()를 사용합니다.
  const lastRow = configSheet.getLastRow();
  
  // F2셀부터 H열의 마지막 행까지의 범위를 설정합니다. (F2:H{마지막 행})
  // 시작 행: 2 (F2셀)
  // 시작 열: 6 (F열)
  // 너비: 3 (F열, G열, H열) <-- 이 부분이 수정되었습니다.
  const rangeToClear = configSheet.getRange(2, 6, lastRow > 1 ? lastRow - 1 : 1, 3);
  
  // 범위의 내용(값)만 삭제합니다.
  rangeToClear.clearContent();

  UIUtils.toastSuccess('설정 시트의 F2셀부터 H열 데이터가 성공적으로 삭제되었습니다.');
}