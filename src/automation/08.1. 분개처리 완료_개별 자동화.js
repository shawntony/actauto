/**
 * ✅ 체크박스 변경 감지 (자동 실행)
 * "분개처리" 시트의 H2 셀이 체크되면 markAsComplete를 실행합니다.
 */
function onEdit(e) {
    const sheet = e.source.getActiveSheet();
    const range = e.range;
    
    // *** 조건 1: 체크 감지는 '분개처리' 시트 H2에서 ***
    if (sheet.getName() === '분개처리' && 
        range.getA1Notation() === 'H2') {
        
        const isChecked = range.getValue();
        
        // 체크박스가 TRUE(체크됨)일 때만 실행
        if (isChecked === true) {
            markAsComplete();
        }
    }
}

//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------

/**
 * ✅ 분개처리_결과 시트의 데이터를 은행원장에서 찾아 "완료" 표시
 */
function markAsComplete() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // *** 체크 시트와 데이터 시트를 명확히 구분 ***
    const CHECK_SHEET_NAME = '분개처리'; // H2 체크박스 위치
    const DATA_SHEET_NAME = '분개처리_결과'; // 데이터를 읽어올 위치
    const LEDGER_SHEET_NAME = '은행원장';
    
    const checkSheet = ss.getSheetByName(CHECK_SHEET_NAME);
    const resultSheet = ss.getSheetByName(DATA_SHEET_NAME);
    const ledgerSheet = ss.getSheetByName(LEDGER_SHEET_NAME);
    
    if (!checkSheet || !resultSheet || !ledgerSheet) {
        SpreadsheetApp.getUi().alert('오류: 필요한 시트("분개처리", "분개처리_결과", "은행원장") 중 일부를 찾을 수 없습니다.');
        return;
    }
    
    // 1. H2 체크박스 확인 (체크 시트에서 확인)
    const isChecked = checkSheet.getRange('H2').getValue();
    if (isChecked !== true) {
        SpreadsheetApp.getUi().alert(`"${CHECK_SHEET_NAME}" 시트의 H2 셀을 체크해주세요.`);
        return;
    }
    
    // 2. 분개처리_결과 시트에서 데이터 읽기 (2행부터)
    const resultLastRow = resultSheet.getLastRow(); // *** resultSheet에서 데이터 읽기 ***
    if (resultLastRow < 2) {
        SpreadsheetApp.getUi().alert('완료 처리할 데이터가 없습니다.');
        return;
    }
    
    // A:F 열 읽기 (거래일자, 거래처, 거래내용, 입금, 출금, 잔액)
    const resultData = resultSheet.getRange(2, 1, resultLastRow - 1, 6).getValues();
    
    // 빈 행 제거
    const filteredResultData = resultData.filter(row => 
        row.some(cell => cell !== null && String(cell).trim() !== "")
    );
    
    if (filteredResultData.length === 0) {
        SpreadsheetApp.getUi().alert('완료 처리할 데이터가 없습니다.');
        return;
    }
    
    // 3. 은행원장 시트에서 데이터 읽기 (A:T 열, 20개 열)
    const ledgerLastRow = ledgerSheet.getLastRow();
    if (ledgerLastRow < 2) {
        SpreadsheetApp.getUi().alert('은행원장에 데이터가 없습니다.');
        return;
    }
    
    const ledgerData = ledgerSheet.getRange(2, 1, ledgerLastRow - 1, 20).getValues();
    
    // 4. 매칭 및 완료 표시 (매칭 로직은 그대로 유지)
    let matchCount = 0;
    
    // 성능 최적화를 위해 시트 쓰기를 일괄 처리할 배열
    const rangeToUpdate = [];
    const START_ROW_LEDGER = 2;

    for (let i = 0; i < filteredResultData.length; i++) {
        const resultRow = filteredResultData[i];
        
        // 분개처리_결과의 데이터
        const r_거래일자 = resultRow[0]; // A열
        const r_거래처 = String(resultRow[1] || '').trim(); // B열
        const r_거래내용 = String(resultRow[2] || '').trim(); // C열
        const r_입금 = resultRow[3]; // D열
        const r_출금 = resultRow[4]; // E열
        
        // 은행원장에서 일치하는 행 찾기
        for (let j = 0; j < ledgerData.length; j++) {
            const ledgerRow = ledgerData[j];
            
            // 은행원장의 데이터 (인덱스는 0부터 시작)
            const l_거래일자 = ledgerRow[1]; // B열 (인덱스 1)
            const l_출금 = ledgerRow[2]; // C열 (인덱스 2)
            const l_입금 = ledgerRow[3]; // D열 (인덱스 3)
            const l_거래내용 = String(ledgerRow[14] || '').trim(); // O열 (인덱스 14)
            const l_거래처 = String(ledgerRow[17] || '').trim(); // R열 (인덱스 17)
            const l_완료상태 = ledgerRow[19]; // T열 (인덱스 19)
            
            // 날짜 비교 함수
            const isSameDate = (date1, date2) => {
                // 유효한 Date 객체인지 확인
                if (!(date1 instanceof Date) || isNaN(date1.getTime()) ||
                    !(date2 instanceof Date) || isNaN(date2.getTime())) return false;
                // 날짜만 비교 (시간 요소 무시)
                return date1.toDateString() === date2.toDateString();
            };
            
            // 모든 조건이 일치하는지 확인
            const isMatch = 
                isSameDate(r_거래일자, l_거래일자) &&
                r_거래처 === l_거래처 &&
                r_거래내용 === l_거래내용 &&
                r_입금 === l_입금 &&
                r_출금 === l_출금;
            
            if (isMatch) {
                // T열(20번째 열)에 "완료" 입력할 행의 정보 저장
                rangeToUpdate.push({ row: j + START_ROW_LEDGER, value: '완료' });
                matchCount++;
                break; // 일치하는 행을 찾았으면 다음 결과 데이터로
            }
        }
    }
    
    // 5. 일괄 쓰기 (매칭된 행에 "완료" 표시)
    if (rangeToUpdate.length > 0) {
        // T열의 기존 데이터를 가져와서 필요한 부분만 수정
        const tColIndex = 20;
        const tValues = ledgerSheet.getRange(START_ROW_LEDGER, tColIndex, ledgerData.length, 1).getValues();
        
        rangeToUpdate.forEach(update => {
            // j는 0부터 시작하는 인덱스, update.row는 2부터 시작하는 행 번호
            const index = update.row - START_ROW_LEDGER; 
            if (index >= 0 && index < tValues.length) {
                tValues[index][0] = update.value;
            }
        });

        // 수정된 T열 값을 한 번에 시트에 적용
        ledgerSheet.getRange(START_ROW_LEDGER, tColIndex, ledgerData.length, 1).setValues(tValues);
    }

    // 6. 완료 메시지
    SpreadsheetApp.getUi().alert(
        `✅ 완료 처리가 완료되었습니다!\n\n` +
        `📊 처리된 건수: ${matchCount}건 / 총 ${filteredResultData.length}건\n\n` +
        `은행원장 시트의 T열에 "완료"가 표시되었습니다.`
    );
    
    // 7. 체크박스 해제 (선택사항)
    // checkSheet.getRange('H2').setValue(false);
}