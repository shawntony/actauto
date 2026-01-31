/**
 * 디버그: 건강보험 시트 A, B열 상태 확인
 */
function debugCheckHealthInsuranceSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sheet = ss.getSheetByName('건강보험');

  if (!sheet) {
    ui.alert('오류: 건강보험 시트를 찾을 수 없습니다.');
    return;
  }

  const lastRow = sheet.getLastRow();
  ui.alert(`건강보험 시트 정보:\n마지막 행: ${lastRow}`);

  if (lastRow < 2) {
    ui.alert('데이터가 없습니다 (2행 미만)');
    return;
  }

  // A, B열 데이터 읽기 (처음 5행만)
  const numRows = Math.min(5, lastRow - 1);
  const dataRange = sheet.getRange(2, 1, numRows, 2);
  const data = dataRange.getValues();

  let report = `건강보험 시트 상태 (처음 ${numRows}행):\n\n`;

  data.forEach((row, idx) => {
    const aValue = row[0];
    const bValue = row[1];
    const aEmpty = aValue === "" || aValue === null || typeof aValue === 'undefined';
    const bHasData = bValue !== "" && bValue !== null && typeof bValue !== 'undefined';

    report += `행 ${idx + 2}:\n`;
    report += `  A열: "${aValue}" (비어있음: ${aEmpty})\n`;
    report += `  B열: "${bValue}" (데이터있음: ${bHasData})\n`;
    report += `  입력조건 충족: ${aEmpty && bHasData}\n\n`;
  });

  ui.alert(report);
}

/**
 * 디버그: 월 데이터 입력 테스트
 */
function debugFillMonthTest() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    '디버그 테스트',
    '입력할 월을 입력하세요 (예: 2026-01):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    ui.alert('취소되었습니다.');
    return;
  }

  const testMonth = response.getResponseText().trim();

  // fillMonthDataInSheets 함수 호출
  fillMonthDataInSheets(testMonth);
}
