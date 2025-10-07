/**
 * [수정됨] '분개처리' 시트의 조건을 읽어 '은행원장' 시트에서 일치하는 데이터를 필터링하고
 * '분개처리_결과' 시트에 출력한 후 Google Drive에 엑셀로 저장합니다.
 * T열에 '완료' 표시가 있는 행은 필터링 대상에서 제외됩니다.
 * 새 데이터 작성 전에 '분개처리_결과' 시트 A2:F 범위의 내용을 삭제합니다.
 */
function filterAndOutputLedgerData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ledgerSheet = ss.getSheetByName('은행원장');
    const criteriaSheet = ss.getSheetByName('분개처리');
    
    if (!ledgerSheet || !criteriaSheet) {
        SpreadsheetApp.getUi().alert('오류: "은행원장" 또는 "분개처리" 시트를 찾을 수 없습니다.');
        return;
    }

    // --- 헬퍼 함수: isMatch 정의 ---
    const isMatch = (ledgerRow, critRow) => {
        const accountName = String(critRow[0] || '').trim();     
        const isDebitChecked = critRow[1] === true;              
        const isCreditChecked = critRow[2] === true;             
        const startDate = critRow[3];                            
        const endDate = critRow[4];                              
        
        const txDate = ledgerRow[1];                             
        const debitAccount = String(ledgerRow[15] || '').trim(); 
        const creditAccount = String(ledgerRow[16] || '').trim();
        
        // 1. 계정 과목명 체크
        if (accountName) {
            let isAccountMatch = false;

            if (isDebitChecked) {
                if (accountName === debitAccount) {
                    isAccountMatch = true;
                }
            } else if (isCreditChecked) {
                if (accountName === creditAccount) {
                    isAccountMatch = true;
                }
            } else {
                if (accountName === debitAccount || accountName === creditAccount) {
                    isAccountMatch = true;
                }
            }
            if (!isAccountMatch) return false;
        }
        
        // 2. 날짜 범위 체크 
        if (txDate !== "" && txDate instanceof Date) {
            const normalizedTxDate = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
            if (startDate && startDate instanceof Date) {
                const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                if (normalizedTxDate < normalizedStartDate) return false;
            }
            if (endDate && endDate instanceof Date) {
                const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                if (normalizedTxDate > normalizedEndDate) return false;
            }
        } else if (startDate || endDate) {
             return false;
        }

        return true;
    };
    // --- 헬퍼 함수 정의 끝 ---


    // 1. 기준 시트에서 검색 조건 읽기
    const criteriaLastRow = criteriaSheet.getLastRow();
    if (criteriaLastRow < 2) {
        SpreadsheetApp.getUi().alert('경고: "분개처리" 시트에 설정된 검색 조건이 없습니다.');
        return;
    }
    const criteriaRange = criteriaSheet.getRange(2, 1, criteriaLastRow - 1, 5);
    const criteriaData = criteriaRange.getValues()
        .filter(row => row.some(cell => cell !== null && String(cell).trim() !== "")); 

    if (criteriaData.length === 0) {
        SpreadsheetApp.getUi().alert('경고: 유효한 검색 조건이 없습니다.');
        return;
    }

    const firstCriteria = criteriaData[0]; 
    const accountName = String(firstCriteria[0] || '').trim();
    const isDebitChecked = firstCriteria[1] === true;
    const isCreditChecked = firstCriteria[2] === true;
    const startDate = firstCriteria[3];
    const endDate = firstCriteria[4];

    // 2. 은행원장 데이터 읽기
    const ledgerLastRow = ledgerSheet.getLastRow();
    if (ledgerLastRow < 2) {
        SpreadsheetApp.getUi().alert('경고: "은행원장" 시트에 처리할 데이터가 없습니다.');
        return;
    }
    
    const T_COL_INDEX = 19;
    // T열까지 데이터를 읽습니다.
    const ledgerRange = ledgerSheet.getRange(2, 1, ledgerLastRow - 1, T_COL_INDEX + 1); 
    let ledgerRows = ledgerRange.getValues();
    
    ledgerRows = ledgerRows.filter(row => row.length > 0 && row.some(cell => String(cell).trim() !== ""));


    // 3. 필터링 로직 실행
    const matchingRows = [];
    
    for (const ledgerRow of ledgerRows) {
        // T열에 '완료' 단어가 있으면 해당 행은 처리하지 않습니다.
        const statusT = String(ledgerRow[T_COL_INDEX] || '').trim();
        if (statusT.includes('완료')) {
            continue; 
        }
        
        let isOverallMatch = false;
        for (const critRow of criteriaData) {
            if (isMatch(ledgerRow, critRow)) {
                isOverallMatch = true;
                break; 
            }
        }

        if (isOverallMatch) {
            const 거래처 = ledgerRow[17]; 
            
            const outputRow = [
                ledgerRow[1],  // B열 (날짜)
                거래처,        // R열 (거래처)
                ledgerRow[14], // O열 (수정거래내용)
                ledgerRow[3],  // D열 (입금)
                ledgerRow[2],  // C열 (출금)
                0              // 잔액 (빈 값)
            ];
            matchingRows.push(outputRow);
        }
    }
    
    // 4. 결과 확인
    if (matchingRows.length === 0) {
        SpreadsheetApp.getUi().alert('검색 조건에 일치하는 데이터가 없습니다. (T열 "완료" 행 제외)');
        return;
    }

    // 5. 결과 시트 처리
    const resultSheetName = '분개처리_결과';
    let resultSheet = ss.getSheetByName(resultSheetName);
    
    if (!resultSheet) {
        resultSheet = ss.insertSheet(resultSheetName);
    }
    
    const lastRow = resultSheet.getLastRow();

    // 🌟 핵심: 새 데이터 작성 전에 A2:F 범위의 셀 내용만 지웁니다.
    if (lastRow > 1) {
        // A열(1)부터 F열(6)까지, 2행부터 마지막 행까지의 범위를 지정
        const clearRange = resultSheet.getRange(2, 1, lastRow - 1, 6); 
        clearRange.clearContent(); // 내용만 삭제
    }
    
    const outputRange = resultSheet.getRange(2, 1, matchingRows.length, matchingRows[0].length);
    outputRange.setValues(matchingRows);

    // 숫자 서식 적용
    resultSheet.getRange(2, 4, matchingRows.length, 1).setNumberFormat('#,##0'); 
    resultSheet.getRange(2, 5, matchingRows.length, 1).setNumberFormat('#,##0'); 
    resultSheet.getRange(2, 6, matchingRows.length, 1).setNumberFormat('#,##0'); 

    SpreadsheetApp.flush();
    Utilities.sleep(1000); 

    // 6. 엑셀 파일로 Google Drive에 저장 (saveAsExcelToDrive 함수는 하단에 포함)
    saveAsExcelToDrive(resultSheet, accountName, isDebitChecked, isCreditChecked, startDate, endDate, matchingRows.length);
}

/**
 * 결과 시트를 엑셀로 변환하여 Google Drive에 저장
 */
function saveAsExcelToDrive(sheet, accountName, isDebitChecked, isCreditChecked, startDate, endDate, dataCount) {
    let fileName = accountName || '전체';
    
    if (isDebitChecked) { fileName += '_차변'; } else if (isCreditChecked) { fileName += '_대변'; }
    
    const formatDate = (date) => {
        if (!date || !(date instanceof Date)) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    if (startDate) { fileName += '_' + formatDate(startDate); }
    if (endDate) { fileName += '_' + formatDate(endDate); }
    fileName += '.xlsx';
    
    const FOLDER_ID = '1Udd13kHucsc4Sogm9U_aMDEv22Ulfx9Q';
    const targetFolder = DriveApp.getFolderById(FOLDER_ID);
    
    if (sheet.getLastRow() < 2) {
        SpreadsheetApp.getUi().alert('오류: 저장할 데이터가 없습니다. 시트를 확인해주세요.');
        return;
    }
    
    const spreadsheet = sheet.getParent();
    const sheetId = sheet.getSheetId();
    const url = "https://docs.google.com/spreadsheets/d/" + spreadsheet.getId() + "/export?exportFormat=xlsx&gid=" + sheetId;
    
    const token = ScriptApp.getOAuthToken();
    
    try {
        const response = UrlFetchApp.fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const existingFiles = targetFolder.getFilesByName(fileName);
        while (existingFiles.hasNext()) {
            existingFiles.next().setTrashed(true);
        }
        
        const blob = response.getBlob().setName(fileName);
        const file = targetFolder.createFile(blob);
        
        const fileUrl = file.getUrl();
        const folderUrl = targetFolder.getUrl();
        
        SpreadsheetApp.getUi().alert(
            `✅ 필터링 및 저장 완료!\n\n` +
            `📊 데이터: ${dataCount}건 (T열 "완료" 행 제외)\n` +
            `📁 파일명: ${fileName}\n` +
            `💾 저장 위치: 내 드라이브 > 법인관리 > 세무관리 > 더존업무처리\n\n` +
            `📂 폴더 바로가기:\n${folderUrl}\n\n` +
            `📄 파일 바로가기:\n${fileUrl}`
        );
        
    } catch (error) {
        SpreadsheetApp.getUi().alert('오류: 엑셀 파일 저장 중 문제가 발생했습니다.\n\n' + error.toString());
    }
}