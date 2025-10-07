function extractAndMarkInsuranceDataEfficient() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ledgerSheet = ss.getSheetByName('은행원장');
  const backupSheet = ss.getSheetByName('거래Backup'); 

  if (!ledgerSheet || !backupSheet) {
    let missingSheets = [];
    if (!ledgerSheet) missingSheets.push('은행원장');
    if (!backupSheet) missingSheets.push('거래Backup');
    SpreadsheetApp.getUi().alert(`다음 시트 중 하나 이상을 찾을 수 없습니다: ${missingSheets.join(', ')}. 모든 시트가 존재하는지 확인해 주세요.`);
    return;
  }

  const lastRow = ledgerSheet.getLastRow();
  const lastColumn = ledgerSheet.getLastColumn();
  
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('은행원장 시트에 데이터(헤더 제외)가 없습니다.');
    return;
  }

  // 💡 데이터 읽기 범위: T열(인덱스 19)을 확인하기 위해 lastColumn 대신 충분한 열을 지정하거나 (최소 T열 인덱스 + 1)
  // 현재 코드처럼 lastColumn이 T열을 포함하도록 가정하고 T열 인덱스를 활용합니다. 
  // (실제 데이터에 T열까지 값이 있는지 확인하기 어려우므로, 안전하게 T열까지 읽는다고 가정하고 진행합니다.)
  // T열은 인덱스 19입니다. (A=0)
  const T_COLUMN_INDEX = 19;
  const targetColumnCount = Math.max(lastColumn, T_COLUMN_INDEX + 1); // 최소 T열까지 읽도록 보장
  
  const ledgerData = ledgerSheet.getRange(2, 1, lastRow - 1, targetColumnCount).getValues();

  const insuranceDataToCopy = [];
  // 행 삭제 시 인덱스가 바뀌므로, 나중에 역순으로 삭제하기 위해 행 번호(1-based)를 저장합니다.
  const rowsToDelete = []; 
  let splitDataToCopy = [];

  const contentColIndex = 14; // O열
  const withdrawalColIndex = 2; // C열
  const pColumnIndex = 15; // P열
  const rColumnIndex = 17; // R열
  const statusColIndex = 18;  // S열
  const sortIndex = 5; // F열 (0-based index)
  // 🌟 T열(처리완료) 인덱스
  // T열이 targetColumnCount 내에 있는지 확인
  if (T_COLUMN_INDEX >= targetColumnCount) {
      SpreadsheetApp.getUi().alert(`오류: '은행원장' 시트의 마지막 열이 T열(${T_COLUMN_INDEX + 1}번째 열)을 포함하지 않습니다. T열이 있는지 확인해 주세요.`);
      return;
  }
  
  const insuranceKeywords = ['국민연금', '국민건강'];

  // 1. 데이터 추출 및 분개 처리
  ledgerData.forEach((row, index) => {
    const transactionContent = row[contentColIndex];
    const statusContent = row[statusColIndex]; 
    
    // 🌟 추가된 로직: T열 확인 (T열의 값이 '완료'를 포함하는 경우 건너뜁니다.)
    const statusT = String(row[T_COLUMN_INDEX] || '').trim();
    if (statusT.includes('완료')) {
        return; // 이 행은 처리 대상에서 제외
    }

    const isInsurance = transactionContent && typeof transactionContent === 'string' && insuranceKeywords.includes(transactionContent);
    const isAlreadyExtracted = statusContent && typeof statusContent === 'string' && statusContent.includes('추출');
    
    if (isInsurance && !isAlreadyExtracted) {
      
      // 백업 및 삭제 대상은 T열에 '완료'가 없는 원본 행만
      insuranceDataToCopy.push(row);
      rowsToDelete.push(index + 2); // 2행부터 시작하므로 +2
      
      const originalWithdrawal = row[withdrawalColIndex];
      const splitWithdrawal = (typeof originalWithdrawal === 'number' && !isNaN(originalWithdrawal)) 
                              ? originalWithdrawal / 2 
                              : originalWithdrawal; 
      
      let counterparty = (transactionContent === '국민건강') ? '건강보험공단' : '국민연금';
      const statusValue = '추출';

      // 1-A. 복리후생비 행 생성
      // 💡 분개된 데이터도 T열의 '완료' 상태는 복사되지 않도록 주의해야 하지만,
      // 어차피 T열이 '완료'인 행은 이 블록에 도달하지 않으므로 기존 로직 유지
      const welfareRow = [...row];
      welfareRow[withdrawalColIndex] = splitWithdrawal; 
      welfareRow[pColumnIndex] = '복리후생비';         
      welfareRow[rColumnIndex] = counterparty; 
      welfareRow[statusColIndex] = statusValue;
      splitDataToCopy.push(welfareRow);
      
      // 1-B. 예수금 행 생성
      const depositRow = [...row];
      depositRow[withdrawalColIndex] = splitWithdrawal; 
      depositRow[pColumnIndex] = '예수금';             
      depositRow[rColumnIndex] = counterparty; 
      depositRow[statusColIndex] = statusValue;
      splitDataToCopy.push(depositRow);
    }
  });

  // 2. 컷팅/추출할 데이터가 있는 경우에만 처리 시작
  if (insuranceDataToCopy.length > 0) {
    
    // 데이터 너비는 T열까지 포함된 targetColumnCount으로 사용
    const dataWidth = targetColumnCount; 
    const originalRowsProcessed = insuranceDataToCopy.length;
    const totalSplitRows = splitDataToCopy.length;

    // A. '거래Backup'으로 데이터 백업 (값만)
    const backupStartRow = backupSheet.getLastRow() > 1 ? backupSheet.getLastRow() + 1 : 2;
    // 💡 백업 범위도 T열까지 확장
    const backupRange = backupSheet.getRange(backupStartRow, 1, originalRowsProcessed, dataWidth);
    backupRange.setValues(insuranceDataToCopy);

    // B. '은행원장'에서 해당 행 삭제 (컷팅)
    rowsToDelete.sort((a, b) => b - a); // 큰 행 번호부터 삭제하여 인덱스 오류 방지
    rowsToDelete.forEach(rowNum => {
      ledgerSheet.deleteRow(rowNum);
    });
    
    // C. 메모리 상에서 F열 기준으로 정렬 
    splitDataToCopy.sort((a, b) => {
      const valA = String(a[sortIndex]).toLowerCase();
      const valB = String(b[sortIndex]).toLowerCase();
      
      if (valA < valB) return -1;
      if (valA > valB) return 1;
      return 0;
    });

    // D. 분개 데이터 '은행원장' 시트의 현재 마지막 행에 값만 붙여넣기
    const ledgerNextRow = ledgerSheet.getLastRow() + 1;
    // 💡 붙여넣기 범위도 T열까지 확장
    ledgerSheet.getRange(ledgerNextRow, 1, totalSplitRows, dataWidth).setValues(splitDataToCopy);

    SpreadsheetApp.getUi().alert(`${originalRowsProcessed}건의 신규 내역이 백업/삭제되었고, ${totalSplitRows}건의 분개 데이터가 생성/정렬되어 '은행원장' 시트에 최종 추가되었습니다.`);
  } else {
    SpreadsheetApp.getUi().alert('새로 처리할 국민연금 및 국민건강 납부 내역이 발견되지 않았습니다. (이미 추출된 내역 및 T열에 "완료" 표시된 내역 제외)');
  }
}