/**
 * '건강보험' 시트의 2행부터 시작하여 AG열에 값이 없는 행에 대해
 * M, O, Z, AB열을 합산하여 AG, AH, AI열에 계산 결과를 넣습니다.
 * AH열 = AG열 * 2, AI열 = AG열.
 */
function calculateAndPopulateHealthInsuranceData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sheetName = '건강보험';
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
  const M_COL_INDEX = 12;  // M열
  const O_COL_INDEX = 14;  // O열
  const Z_COL_INDEX = 25;  // Z열
  const AB_COL_INDEX = 27; // AB열
  const AG_COL_INDEX = 32; // AG열 (결과: 합계)
  const AH_COL_INDEX = 33; // AH열 (결과: 합계 * 2)
  const AI_COL_INDEX = 34; // AI열 (결과: 합계)
  
  // 데이터 읽기 범위: 필요한 최대 열(AI열)까지 포함하도록 설정
  const maxColIndex = AI_COL_INDEX + 1;
  const numRows = lastRow - startRow + 1;
  
  // A2부터 AI열까지의 데이터 읽기
  const dataRange = sheet.getRange(startRow, 1, numRows, maxColIndex);
  const data = dataRange.getValues();

  const updatedData = [];
  let processedCount = 0;

  // 2. 행별로 데이터 처리
  data.forEach(row => {
    // 🌟 핵심 조건: AG열(인덱스 32)에 이미 값이 있으면 해당 행은 제외합니다.
    const agValue = row[AG_COL_INDEX];
    if (agValue !== "" && agValue !== null && typeof agValue !== 'undefined') {
      updatedData.push(row);
      return; 
    }

    // M, O, Z, AB 열의 값 합산
    let sum = 0;
    
    // 유효한 숫자인지 확인하고 합산하는 헬퍼 함수
    const addIfNumber = (value) => {
      if (typeof value === 'number' && !isNaN(value)) {
        sum += value;
      }
    };

    addIfNumber(row[M_COL_INDEX]);
    addIfNumber(row[O_COL_INDEX]);
    addIfNumber(row[Z_COL_INDEX]);
    addIfNumber(row[AB_COL_INDEX]);
    
    // 3. 계산 결과를 AG, AH, AI 열에 기록
    
    // AG열: 합계
    row[AG_COL_INDEX] = sum;
    
    // AH열: 합계 * 2
    row[AH_COL_INDEX] = sum * 2;
    
    // AI열: 합계
    row[AI_COL_INDEX] = sum;
    
    processedCount++;
    updatedData.push(row);
  });

  // 4. 시트에 업데이트된 데이터 쓰기
  dataRange.setValues(updatedData);

  if (processedCount > 0) {
    ui.alert(`✅ 건강보험 시트 처리가 완료되었습니다. 총 ${processedCount}건의 행이 업데이트되었습니다.`);
  } else {
    ui.alert('경고: 새로 업데이트할 행이 없거나, 모든 해당 행의 AG열에 이미 값이 있었습니다.');
  }
}
