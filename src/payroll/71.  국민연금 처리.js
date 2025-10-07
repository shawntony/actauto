/**
 * '국민연금' 시트의 2행부터 시작하여 I열에 값이 없는 행에 대해
 * H열 값을 2로 나누어 I열에 입력합니다.
 */
function calculateAndPopulateNationalPensionData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sheetName = '국민연금';
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    ui.alert(`오류: "${sheetName}" 시트를 찾을 수 없습니다.`);
    return;
  }

  const startRow = 2; // 데이터 시작 행
  const lastRow = sheet.getLastRow();

  if (lastRow < startRow) {
    ui.alert(`"${sheetName}" 시트에 처리할 데이터(2행 이하)가 없습니다.`);
    return;
  }

  // 1. 필요한 열 인덱스 정의 (A=0)
  const H_COL_INDEX = 7;  // H열 (나누기 대상)
  const I_COL_INDEX = 8;  // I열 (결과 입력 대상)
  
  // 데이터 읽기 범위: A열부터 I열까지 읽기
  const numCols = I_COL_INDEX + 1;
  const numRows = lastRow - startRow + 1;
  
  const dataRange = sheet.getRange(startRow, 1, numRows, numCols);
  const data = dataRange.getValues();

  const updatedData = [];
  let processedCount = 0;

  // 2. 행별로 데이터 처리
  data.forEach(row => {
    // 🌟 핵심 조건: I열(인덱스 8)에 이미 값이 있으면 해당 행은 제외합니다.
    const iValue = row[I_COL_INDEX];
    if (iValue !== "" && iValue !== null && typeof iValue !== 'undefined') {
      updatedData.push(row);
      return; 
    }

    // H열 값 가져오기
    let hValue = row[H_COL_INDEX];
    
    // 유효한 숫자인지 확인하고 나눗셈 수행
    const numValue = (typeof hValue === 'number') ? hValue : parseFloat(String(hValue).replace(/,/g, ''));
    
    if (!isNaN(numValue)) {
        // I열: H열 값을 2로 나눈 결과
        row[I_COL_INDEX] = numValue / 2;
        processedCount++;
    }
    
    updatedData.push(row);
  });

  // 3. 시트에 업데이트된 데이터 쓰기
  dataRange.setValues(updatedData);

  if (processedCount > 0) {
    ui.alert(`✅ 국민연금 시트 처리가 완료되었습니다. 총 ${processedCount}건의 행이 업데이트되었습니다.`);
  } else {
    ui.alert('경고: 새로 업데이트할 행이 없거나, 모든 해당 행의 I열에 이미 값이 있었습니다.');
  }
}
