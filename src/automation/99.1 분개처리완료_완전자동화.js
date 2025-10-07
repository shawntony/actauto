/**
 * '분개처리' 시트의 조건을 읽어 '은행원장' 시트에서 일치하는 데이터를 필터링하고
 * '분개처리_결과' 시트에 출력한 후 Google Drive에 엑셀로 저장합니다.
 *
 * ✅ 수정 사항: 엑셀 저장 성공 후, 매칭된 행에 "완료" 표시를 자동으로 추가합니다.
 */
function filterAndOutputLedgerData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ledgerSheet = ss.getSheetByName('은행원장');
    const criteriaSheet = ss.getSheetByName('분개처리');
    
    if (!ledgerSheet || !criteriaSheet) {
        SpreadsheetApp.getUi().alert('오류: "은행원장" 또는 "분개처리" 시트를 찾을 수 없습니다.');
        return;
    }

    // --- 1. 기간 고정 및 조건 읽기 ---
    const criteriaLastRow = criteriaSheet.getLastRow();
    if (criteriaLastRow < 2) {
        SpreadsheetApp.getUi().alert('경고: "분개처리" 시트에 설정된 검색 조건이 없습니다 (2행부터 입력 필요).');
        return;
    }
    
    const criteriaRange = criteriaSheet.getRange(2, 1, criteriaLastRow - 1, 5);
    const criteriaData = criteriaRange.getValues()
        .filter(row => row.some(cell => cell !== null && String(cell).trim() !== "")); 

    if (criteriaData.length === 0) {
        SpreadsheetApp.getUi().alert('경고: 유효한 검색 조건이 없습니다.');
        return;
    }

    // 기간 고정 조건 추출 (2행 기준)
    const fixedCriteria = criteriaData[0]; 
    const fixedStartDate = fixedCriteria[3]; 
    const fixedEndDate = fixedCriteria[4]; 

    // 파일명 생성에 필요한 정보
    const accountNameForFileName = String(fixedCriteria[0] || '').trim();
    const isDebitCheckedForFileName = fixedCriteria[1] === true;
    const isCreditCheckedForFileName = fixedCriteria[2] === true;


    // --- 헬퍼 함수: isMatch 정의 (기간 고정, 계정 가변) ---
    const isMatch = (ledgerRow, critRow, fixedStartDate, fixedEndDate) => {
        
        // Criteria Data (계정과목 및 차변/대변)
        const accountName = String(critRow[0] || '').trim(); 
        const isDebitChecked = critRow[1] === true; 
        const isCreditChecked = critRow[2] === true; 
        
        // Ledger Data
        const txDate = ledgerRow[1]; 
        const debitAccount = String(ledgerRow[15] || '').trim(); 
        const creditAccount = String(ledgerRow[16] || '').trim();
        
        
        // 1. 고정된 날짜 범위 체크
        if (txDate === "") { 
            if (fixedStartDate || fixedEndDate) return false;
        } else if (txDate instanceof Date) {
            
            const normalizedTxDate = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());

            if (fixedStartDate && fixedStartDate instanceof Date) {
                const normalizedStartDate = new Date(fixedStartDate.getFullYear(), fixedStartDate.getMonth(), fixedStartDate.getDate());
                if (normalizedTxDate < normalizedStartDate) {
                    return false;
                }
            }
            
            if (fixedEndDate && fixedEndDate instanceof Date) {
                const normalizedEndDate = new Date(fixedEndDate.getFullYear(), fixedEndDate.getMonth(), fixedEndDate.getDate());
                if (normalizedTxDate > normalizedEndDate) {
                    return false;
                }
            }
        } else if (fixedStartDate || fixedEndDate) {
            return false;
        }
        
        // 2. 가변적인 계정 과목명 체크 및 차변/대변 체크박스 의미 반영
        let isAccountMatch = true;
        if (accountName) {
            isAccountMatch = false; 

            if (isDebitChecked) {
                if (accountName === debitAccount) isAccountMatch = true;
            } else if (isCreditChecked) {
                if (accountName === creditAccount) isAccountMatch = true;
            } else {
                if (accountName === debitAccount || accountName === creditAccount) isAccountMatch = true;
            }

            if (!isAccountMatch) {
                return false;
            }
        }

        return true; 
    };
    // --- 헬퍼 함수 정의 끝 ---


    // 3. 은행원장 데이터 읽기
    // ✅ 수정: 20개 컬럼(A~T열)까지 읽어야 T열에 "완료" 표시 가능
    const ledgerLastRow = ledgerSheet.getLastRow();
    if (ledgerLastRow < 2) {
        SpreadsheetApp.getUi().alert('경고: "은행원장" 시트에 처리할 데이터가 없습니다.');
        return;
    }
    
    const ledgerRange = ledgerSheet.getRange(2, 1, ledgerLastRow - 1, 20);
    let ledgerRows = ledgerRange.getValues();
    
    // ✅ 수정: 필터 조건도 20으로 변경 (큰따옴표 2개로 수정!)
    ledgerRows = ledgerRows.filter(row => row.length === 20 && row.some(cell => String(cell).trim() !== ""));


    // 4. 필터링 로직 실행 및 T열 업데이트 정보 수집
    const matchingRows = [];
    const rowsToMarkComplete = [];
    const LEDGER_DATA_START_ROW = 2;

    for (let i = 0; i < ledgerRows.length; i++) {
        const ledgerRow = ledgerRows[i];
        let isOverallMatch = false;

        for (const critRow of criteriaData) {
            if (isMatch(ledgerRow, critRow, fixedStartDate, fixedEndDate)) {
                isOverallMatch = true;
                break; 
            }
        }

        if (isOverallMatch) {
            // ✅ 수정: 간결한 방식으로 거래처 추출
            const 거래처 = ledgerRow[17] || '';
            
            const outputRow = [
                ledgerRow[1],  // 거래일자 (B열)
                거래처,        // 거래처 (R열)
                ledgerRow[14], // 거래내용 (O열)
                ledgerRow[3],  // 입금 (D열)
                ledgerRow[2],  // 출금 (C열)
                0              // 잔액
            ];
            matchingRows.push(outputRow);
            
            rowsToMarkComplete.push(i + LEDGER_DATA_START_ROW);
        }
    }
    
    // 5. 결과 확인
    if (matchingRows.length === 0) {
        SpreadsheetApp.getUi().alert('검색 조건에 일치하는 데이터가 없습니다.');
        return;
    }

    // 6. 결과 시트 처리 및 엑셀 저장
    const resultSheetName = '분개처리_결과';
    let resultSheet = ss.getSheetByName(resultSheetName);
    
    if (!resultSheet) {
        resultSheet = ss.insertSheet(resultSheetName);
    }
    
    const lastRow = resultSheet.getLastRow();
    if (lastRow > 1) {
        resultSheet.deleteRows(2, lastRow - 1);
    }
    
    const outputRange = resultSheet.getRange(2, 1, matchingRows.length, matchingRows[0].length);
    outputRange.setValues(matchingRows);

    // 입금, 출금, 잔액 열에 숫자 서식 적용
    resultSheet.getRange(2, 4, matchingRows.length, 1).setNumberFormat('#,##0');
    resultSheet.getRange(2, 5, matchingRows.length, 1).setNumberFormat('#,##0');
    resultSheet.getRange(2, 6, matchingRows.length, 1).setNumberFormat('#,##0');

    SpreadsheetApp.flush();
    Utilities.sleep(1000); 

    // 7. 엑셀 파일로 Google Drive에 저장
    const saveSuccess = saveAsExcelToDrive(resultSheet, accountNameForFileName, isDebitCheckedForFileName, isCreditCheckedForFileName, fixedStartDate, fixedEndDate, matchingRows.length);

    // 8. 저장 성공 시에만 은행원장 T열에 "완료" 표시
    if (saveSuccess) {
        markLedgerRowsAsComplete(ledgerSheet, rowsToMarkComplete);
        SpreadsheetApp.getUi().alert(`✅ 파일 저장 및 은행원장 완료 처리 성공! 총 ${rowsToMarkComplete.length}건에 "완료"가 표시되었습니다.`);
    }
}


/**
 * 엑셀 파일로 저장하고 성공 여부를 반환하는 함수
 */
function saveAsExcelToDrive(sheet, accountName, isDebitChecked, isCreditChecked, startDate, endDate, dataCount) {
    // 1. 파일명 생성
    let fileName = accountName || '전체';
    
    // 차변/대변 구분
    if (isDebitChecked) {
        fileName += '_차변';
    } else if (isCreditChecked) {
        fileName += '_대변';
    }
    
    // 날짜 형식 변환 (YYYY-MM-DD)
    const formatDate = (date) => {
        if (!date || !(date instanceof Date)) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    if (startDate) {
        fileName += '_' + formatDate(startDate);
    }
    if (endDate) {
        fileName += '_' + formatDate(endDate);
    }
    
    fileName += '.xlsx';
    
    // 2. 폴더 ID로 직접 접근
    const FOLDER_ID = '1Udd13kHucsc4Sogm9U_aMDEv22Ulfx9Q';
    const targetFolder = DriveApp.getFolderById(FOLDER_ID);
    
    // 3. 시트 데이터 확인
    if (sheet.getLastRow() < 2) {
        SpreadsheetApp.getUi().alert('오류: 저장할 데이터가 없습니다.');
        return false;
    }
    
    // 4. 시트를 엑셀로 변환
    const spreadsheet = sheet.getParent();
    const sheetId = sheet.getSheetId();
    const url = "https://docs.google.com/spreadsheets/d/" + spreadsheet.getId() + "/export?exportFormat=xlsx&gid=" + sheetId;
    
    const token = ScriptApp.getOAuthToken();
    
    try {
        const response = UrlFetchApp.fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        // 5. 같은 이름의 파일이 있으면 삭제
        const existingFiles = targetFolder.getFilesByName(fileName);
        while (existingFiles.hasNext()) {
            existingFiles.next().setTrashed(true);
        }
        
        // 6. 엑셀 파일로 저장
        const blob = response.getBlob().setName(fileName);
        const file = targetFolder.createFile(blob);
        
        // 7. 완료 메시지
        const fileUrl = file.getUrl();
        const folderUrl = targetFolder.getUrl();
        
        SpreadsheetApp.getUi().alert(
            `✅ 필터링 및 저장 완료!\n\n` +
            `📊 데이터: ${dataCount}건\n` +
            `📁 파일명: ${fileName}\n` +
            `💾 저장 위치: 내 드라이브 > 법인관리 > 세무관리 > 더존업무처리\n\n` +
            `📂 폴더 바로가기:\n${folderUrl}\n\n` +
            `📄 파일 바로가기:\n${fileUrl}`
        );
        return true;
        
    } catch (error) {
        SpreadsheetApp.getUi().alert('오류: 엑셀 파일 저장 중 문제가 발생했습니다.\n\n' + error.toString());
        return false;
    }
}


/**
 * 은행원장 T열에 "완료"를 일괄 표시하는 함수
 */
function markLedgerRowsAsComplete(ledgerSheet, rowNumbers) {
    if (rowNumbers.length === 0) return;
    
    // 중복 제거 및 정렬
    const uniqueRowNumbers = Array.from(new Set(rowNumbers)).sort((a, b) => a - b);
    
    // 가장 넓은 범위의 T열 데이터만 가져와서 수정 후 다시 씀 (성능 최적화)
    const minRow = uniqueRowNumbers[0];
    const maxRow = uniqueRowNumbers[uniqueRowNumbers.length - 1];
    const numRows = maxRow - minRow + 1;
    const T_COL_INDEX = 20;
    
    const rangeToRead = ledgerSheet.getRange(minRow, T_COL_INDEX, numRows, 1);
    const tValues = rangeToRead.getValues();
    
    uniqueRowNumbers.forEach(rowNum => {
        const arrayIndex = rowNum - minRow;
        if (arrayIndex >= 0 && arrayIndex < tValues.length) {
            tValues[arrayIndex][0] = '완료';
        }
    });
    
    rangeToRead.setValues(tValues);
    SpreadsheetApp.flush();
}