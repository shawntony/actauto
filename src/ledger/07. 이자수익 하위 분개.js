/**
 * [수정됨] '분개처리' 시트의 F열 데이터를 기준으로 '이자수익' 시트 O열에서 매칭되는 행들의
 * K열 수치를 합산하여 D열에, L열 수치를 합산하여 J열에 결과를 출력합니다.
 * F열에 데이터가 있는 행에 대해서만 처리합니다.
 */
function calculateAndTransferInterestSum() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const CRITERIA_SHEET_NAME = '분개처리';
  const DATA_SHEET_NAME = '이자수익';

  const criteriaSheet = ss.getSheetByName(CRITERIA_SHEET_NAME);
  const dataSheet = ss.getSheetByName(DATA_SHEET_NAME);

  if (!criteriaSheet || !dataSheet) {
    ui.alert(`오류: "${CRITERIA_SHEET_NAME}" 또는 "${DATA_SHEET_NAME}" 시트를 찾을 수 없습니다.`);
    return;
  }

  // 1. '분개처리' 시트의 F열 데이터 범위 설정 (F7부터 마지막 행까지)
  const criteriaStartRow = 7; // F7 시작
  const criteriaLastRow = criteriaSheet.getLastRow();

  if (criteriaLastRow < criteriaStartRow) {
    ui.alert('경고: "분개처리" 시트에 처리할 데이터(F7 이하)가 없습니다.');
    return;
  }

  const numCriteriaRows = criteriaLastRow - criteriaStartRow + 1;
  // F열 데이터만 읽기 (A=1, B=2, ..., F=6)
  const criteriaData = criteriaSheet.getRange(criteriaStartRow, 6, numCriteriaRows, 1).getValues();

  // 2. '이자수익' 시트의 K, L, O열 데이터 읽기
  const dataStartRow = 2; // 데이터가 2행부터 시작한다고 가정
  const dataLastRow = dataSheet.getLastRow();
  
  if (dataLastRow < dataStartRow) {
      ui.alert('경고: "이자수익" 시트에 처리할 데이터(2행 이하)가 없습니다.');
      return;
  }
  
  const dataRangeRows = dataLastRow - dataStartRow + 1;
  // K열 (11번째), L열 (12번째), O열 (15번째)을 포함하도록 K열부터 O열까지 5개 열을 읽습니다.
  // 읽는 데이터: [K, L, M, N, O]
  const rawData = dataSheet.getRange(dataStartRow, 11, dataRangeRows, 5).getValues(); 

  // 3. '이자수익' 데이터를 기반으로 합계 맵 생성 (Key: O열, Value: {K열 합계, L열 합계})
  // rawData 배열 내 인덱스: K=0, L=1, O=4
  const O_COL_INDEX_IN_RAW = 4;
  const K_COL_INDEX_IN_RAW = 0; 
  const L_COL_INDEX_IN_RAW = 1; 
  
  const sumMap = {};
  
  rawData.forEach(row => {
    const key = String(row[O_COL_INDEX_IN_RAW] || '').trim();
    const sumK = typeof row[K_COL_INDEX_IN_RAW] === 'number' ? row[K_COL_INDEX_IN_RAW] : 0;
    const sumL = typeof row[L_COL_INDEX_IN_RAW] === 'number' ? row[L_COL_INDEX_IN_RAW] : 0;
    
    if (key) {
      if (sumMap.hasOwnProperty(key)) {
        sumMap[key].K += sumK;
        sumMap[key].L += sumL; // L열 합계 추가
      } else {
        sumMap[key] = { K: sumK, L: sumL }; // L열 합계 초기화
      }
    }
  });

  // 4. '분개처리' F열 기준으로 합계를 찾아 D열과 J열에 기록할 데이터 준비
  let processedCount = 0;
  const resultsD = []; // D열에 들어갈 데이터 (K열 합계)
  const resultsJ = []; // J열에 들어갈 데이터 (L열 합계)
  
  criteriaData.forEach(row => {
    const searchKey = String(row[0] || '').trim(); // F열 데이터
    
    // F열에 데이터가 있는 경우에만 처리
    if (searchKey) {
        let sumK = 0;
        let sumL = 0;
        
        if (sumMap.hasOwnProperty(searchKey)) {
          sumK = sumMap[searchKey].K;
          sumL = sumMap[searchKey].L;
        }
        processedCount++;
        
        resultsD.push([sumK]); 
        resultsJ.push([sumL]); // J열 데이터 추가
    } else {
        // F열에 데이터가 없는 경우 D열과 J열 모두 공백을 반환
        resultsD.push(['']); 
        resultsJ.push(['']); 
    }
  });

  // 5. '분개처리' 시트의 D열과 J열에 결과 쓰기
  // D열 (4번째 열)의 7행부터 시작
  criteriaSheet.getRange(criteriaStartRow, 4, resultsD.length, 1).setValues(resultsD);
  
  // J열 (10번째 열)의 7행부터 시작
  criteriaSheet.getRange(criteriaStartRow, 10, resultsJ.length, 1).setValues(resultsJ);

  ui.alert(`✅ 이자수익 합계 처리가 완료되었습니다. '분개처리' F열에 데이터가 있는 ${processedCount}건에 대해 K열 합계가 D열에, L열 합계가 J열에 기록되었습니다.`);
}