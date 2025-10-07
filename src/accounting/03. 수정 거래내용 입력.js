function adjustedTransactionEntry() {
    // T열 확인 로직이 updateSearchCriteria와 processLoanTransactions 내부에 행별로 구현되어 있으므로, 
    // 이 함수는 단순히 순차적으로 두 함수를 호출합니다.
    updateSearchCriteria();
    processLoanTransactions();
}

// --------------------------------------------------------------------------------------

// 수정된 'updateSearchCriteria' 함수
function updateSearchCriteria() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ledgerSheet = ss.getSheetByName('은행원장');
  const configSheet = ss.getSheetByName('설정');

  if (!ledgerSheet || !configSheet) {
    SpreadsheetApp.getUi().alert('은행원장 또는 설정 시트를 찾을 수 없습니다.');
    return;
  }

  const lastRow = ledgerSheet.getLastRow();
  // 💡 데이터 범위를 T열(인덱스 19)을 포함하도록 'A2:T'까지 확장합니다.
  const ledgerData = ledgerSheet.getRange('A2:T' + lastRow).getValues(); 
  const configData = configSheet.getRange('A2:B' + configSheet.getLastRow()).getValues();
  
  const newData = ledgerData.map(row => {
    // T열(인덱스 19)의 값을 가져옵니다.
    const statusT = String(row[19] || '').trim();

    // 🌟 [추가된 핵심 로직] T열에 '완료' 단어가 있으면 해당 행은 처리하지 않고 원본 그대로 반환합니다.
    if (statusT.includes('완료')) {
      return row; // 해당 행은 수정 없이 원본 데이터를 그대로 사용
    }

    // '거래내용'(F열)은 인덱스 5
    const contentF = String(row[5] || '').trim(); 
    // '상대계좌번호'(G열)는 인덱스 6
    const accountG = String(row[6] || '').trim();
    // '출금'(C열)은 인덱스 2, '입금'(D열)은 인덱스 3
    const withdrawalC = row[2];
    const depositD = row[3];
    
    let matchFound = false;
    const TARGET_CONTENT = '주식회사유니스';

    // 🌟 1. [최우선 규칙] 스마트비즈센터2 조건 확인 (131-114000-04-041)
    // ---------------------------------------------------------------------
    if (contentF === TARGET_CONTENT && accountG === '131-114000-04-041') {
        if (withdrawalC > 0) {
          row[14] = '스마트비즈센터2출금';
          matchFound = true;
        } else if (depositD > 0) {
          row[14] = '스마트비즈센터2입금';
          matchFound = true;
        }
    }
    // ---------------------------------------------------------------------

    // 🌟 2. [두 번째 우선 규칙] 스마트비즈센터1 조건 확인 (131-114000-04-033)
    // ---------------------------------------------------------------------
    if (!matchFound && contentF === TARGET_CONTENT && accountG === '131-114000-04-033') {
        if (withdrawalC > 0) {
          row[14] = '스마트비즈센터1출금';
          matchFound = true;
        } else if (depositD > 0) {
          row[14] = '스마트비즈센터1입금';
          matchFound = true;
        }
    }
    // ---------------------------------------------------------------------

    // 🌟 3. [세 번째 우선 규칙] 스마트비즈센터 조건 확인 (131-114000-04-026)
    // ---------------------------------------------------------------------
    if (!matchFound && contentF === TARGET_CONTENT && accountG === '131-114000-04-026') {
        if (withdrawalC > 0) {
          row[14] = '스마트비즈센터출금';
          matchFound = true;
        } else if (depositD > 0) {
          row[14] = '스마트비즈센터입금';
          matchFound = true;
        }
    }
    // ---------------------------------------------------------------------
    
    // 🌟 4. [네 번째 우선 규칙] MMF출금 조건 확인 (131-114000-96-003)
    // ---------------------------------------------------------------------
    if (!matchFound) {
        const TARGET_ACCOUNT_MMF = '131-114000-96-003';
        
        // F열, G열이 일치하고 C열 출금액이 0보다 큰 경우
        if (contentF === TARGET_CONTENT && accountG === TARGET_ACCOUNT_MMF && withdrawalC > 0) {
          row[14] = 'MMF출금'; // O열(인덱스 14)에 값 채우기
          matchFound = true;
        }
    }
    // ---------------------------------------------------------------------


    // 5. '설정' 시트 기반 검색 (위의 모든 최우선 규칙에 해당하지 않을 때만 실행)
    if (!matchFound) {
        // 기존 '거래내용'은 F열(인덱스 5)을 기준으로 사용
        const content = row[5]; 
        
        for (let i = 0; i < configData.length; i++) {
          const configContent = configData[i][0]; 
          const criteria = configData[i][1];      

          // '거래내용'이 '설정' 시트의 A열 데이터를 포함하는 경우
          if (typeof content === 'string' && content.includes(configContent) && configContent) {
            row[14] = criteria; // O열(인덱스 14)에 값 채우기
            matchFound = true;
            break; 
          }
        }
    }

    // 6. 일치 항목이 없는 경우 '거래내용'을 '수정거래내용'으로 복사
    if (!matchFound) {
      row[14] = row[5]; // O열(인덱스 14)에 F열(인덱스 5) 값 복사
    }
    return row;
  });

  // 💡 수정된 newData를 T열까지 포함하여 다시 시트에 기록합니다.
  ledgerSheet.getRange('A2:T' + lastRow).setValues(newData);
  SpreadsheetApp.getUi().alert('거래 내용 전처리가 완료되었습니다.');
}

// --------------------------------------------------------------------------------------

// 수정된 'processLoanTransactions' 함수
/**
 * '은행원장' 시트에서 '대부' 및 특정 인물 관련 거래를 분류하여 '수정거래내용'(O열)을 업데이트합니다.
 */
function processLoanTransactions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ledgerSheet = ss.getSheetByName('은행원장');

  if (!ledgerSheet) {
    SpreadsheetApp.getUi().alert('은행원장 시트를 찾을 수 없습니다.');
    return;
  }

  const lastRow = ledgerSheet.getLastRow();
  // 💡 데이터 범위를 T열(인덱스 19)을 포함하도록 'A2:T'까지 확장합니다.
  const dataRange = ledgerSheet.getRange('A2:T' + lastRow);
  const data = dataRange.getValues();

  // 가수금 처리를 위한 이름 목록
  const targetNames = ['윤태경', '윤동건', '송언주'];
  
  const updatedData = data.map(row => {
    // T열(인덱스 19)의 값을 가져옵니다.
    const statusT = String(row[19] || '').trim();

    // 🌟 [추가된 핵심 로직] T열에 '완료' 단어가 있으면 해당 행은 처리하지 않고 원본 그대로 반환합니다.
    if (statusT.includes('완료')) {
      return row; // 해당 행은 수정 없이 원본 데이터를 그대로 사용
    }

    // '수정거래내용'(O열)은 인덱스 14
    // '입금'(D열)은 인덱스 3
    // '출금'(C열)은 인덱스 2
    const initialContent = String(row[14] || ''); // 초기 내용 (수정 전 O열 값)
    const deposit = row[3];
    const withdrawal = row[2];

    // 1. 가수금 처리 로직 (윤태경, 윤동건, 송언주)
    // ----------------------------------------------------
    let isTargetPerson = targetNames.some(name => initialContent.includes(name));

    if (isTargetPerson) {
        // 현재 O열의 값을 가져와서 추가합니다. (이전 로직에 의해 이미 변경되었을 수 있음)
        let currentContent = String(row[14] || ''); 
        
        if (deposit > 0) {
            row[14] = currentContent + '가수금입금';
        } else if (withdrawal > 0) {
            row[14] = currentContent + '가수금상환';
        }
    }
    // ----------------------------------------------------

    // 2. 대부 처리 로직 (기존 로직)
    if (initialContent.includes('대부')) {
        // 현재 O열의 값을 다시 가져옵니다. (가수금 로직에 의해 변경되었을 수 있음)
        let currentContent = String(row[14] || ''); 

      if (withdrawal > 0) {
        // 출금이 0보다 크면 기존 내용에 '투자'를 추가
        row[14] = currentContent + '투자'; 
      } else if (deposit % 1000000 === 0) {
        // 입금을 1,000,000으로 나눈 나머지가 0이면 기존 내용에 '상환'을 추가
        row[14] = currentContent + '상환'; 
      } else if (deposit % 1000000 > 0) {
        // 입금을 1,000,000으로 나눈 나머지가 0보다 크면 기존 내용에 '이자'를 추가
        row[14] = currentContent + '이자'; 
      }
    }

    return row;
  });

  // 💡 수정된 데이터로 시트 업데이트
  dataRange.setValues(updatedData);
  SpreadsheetApp.getUi().alert('대부 및 가수금 거래 전처리가 완료되었습니다.');
}