/**
 * '거래검증' 시트의 U열에 '1'이 있는 행을 '은행원장' 시트의 마지막 행에
 * 값만 붙여넣고, '거래검증' 시트에서는 해당 행들을 잘라냅니다.
 * 이 때, 잘라내고 붙여넣는 데이터 범위는 A열부터 T열까지(20개 열)로 제한됩니다.
 */
function moveVerifiedTransactions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const SOURCE_SHEET_NAME = "거래검증";
  const TARGET_SHEET_NAME = "은행원장";

  const sourceSheet = ss.getSheetByName(SOURCE_SHEET_NAME);
  const targetSheet = ss.getSheetByName(TARGET_SHEET_NAME);

  if (!sourceSheet || !targetSheet) {
    ui.alert(`오류: "${SOURCE_SHEET_NAME}" 또는 "${TARGET_SHEET_NAME}" 시트를 찾을 수 없습니다.`);
    return;
  }

  const numRows = sourceSheet.getLastRow();
  
  if (numRows < 2) {
    ui.alert('거래검증 시트에 처리할 데이터(2행 이상)가 없습니다.');
    return;
  }

  // 💡 인덱스 정의
  const U_COL_INDEX = 20; // U열 인덱스 (이동 조건 확인용)
  const T_COL_INDEX = 19; // T열 인덱스
  
  // A열부터 T열까지의 데이터 너비 (총 20개 열)
  const DATA_COLUMNS_TO_MOVE = T_COL_INDEX + 1; 
  
  // 데이터 읽기 범위는 U열까지 포함
  const DATA_COLUMNS_TO_READ = U_COL_INDEX + 1;

  // 1행은 헤더이므로 2행부터 U열까지 데이터 로드
  const sourceData = sourceSheet.getRange(2, 1, numRows - 1, DATA_COLUMNS_TO_READ).getValues();

  const verifiedDataToMove = [];
  const rowsToDelete = [];
  
  // 1. U열에 '1'이 있는 행을 식별하고, 이동할 데이터(A열부터 T열까지)를 준비
  sourceData.forEach((row, i) => {
    // U열의 값 (인덱스 20)을 가져와서 확인합니다.
    const uValue = row.length > U_COL_INDEX ? row[U_COL_INDEX] : null; 
    
    // 값의 타입에 관계없이 '1'과 일치하는지 확인
    if (uValue == 1) { 
      // 🌟 핵심 수정: 이동할 데이터는 A열부터 T열까지(인덱스 0부터 19까지) 자릅니다.
      verifiedDataToMove.push(row.slice(0, DATA_COLUMNS_TO_MOVE));
      
      // 실제 시트 행 번호 (i + 2)를 저장 (2행부터 시작)
      rowsToDelete.push(i + 2); 
    }
  });

  if (verifiedDataToMove.length === 0) {
    ui.alert('거래검증 시트 U열에서 이동할 "1" 표시 데이터를 찾지 못했습니다.');
    return;
  }

  // 2. '은행원장' 시트에 데이터 붙여넣기
  const dataToMoveCount = verifiedDataToMove.length;
  const targetStartRow = targetSheet.getLastRow() + 1; 
  // 데이터 너비는 A열부터 T열까지 20개
  const dataWidth = verifiedDataToMove[0].length; 

  // '은행원장' 시트의 마지막 행에 값만 붙여넣기 (A열부터 T열까지)
  targetSheet.getRange(targetStartRow, 1, dataToMoveCount, dataWidth)
             .setValues(verifiedDataToMove);

  // 3. '거래검증' 시트에서 해당 행 삭제 (잘라내기)
  rowsToDelete.sort((a, b) => b - a); // 큰 행 번호부터 삭제
  rowsToDelete.forEach(rowNum => {
    sourceSheet.deleteRow(rowNum);
  });

  ui.alert(`✅ 성공: '거래검증' 시트 U열의 ${dataToMoveCount}건 데이터가 A열부터 T열까지 범위로 '은행원장' 시트로 이동되었습니다.`);
}