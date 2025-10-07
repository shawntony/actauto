function IntegratedProcess() {
  mapAccountsFromConfig();
  mapAccountTransactionDetails();
}

// **설정 시트의 E열에 J, K, L열을 참조하여 F/G열을 업데이트하는 함수 (내용 변경 없음)**
/**
 * 설정 시트의 E열 내용을 기준으로 J, K, L열을 참조하여 
 * F열(차변)과 G열(대변)에 계정 과목을 입력합니다.
 */
function mapAccountsFromConfig() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('설정');

    if (!configSheet) {
        SpreadsheetApp.getUi().alert('설정 시트를 찾을 수 없습니다.');
        return;
    }

    const configLastRow = configSheet.getLastRow();
    
    // 1. 설정 시트에서 전체 데이터 추출 (A2열부터 L열까지)
    const START_ROW = 2; 
    const numRows = configLastRow - START_ROW + 1;
    const configRange = configSheet.getRange(START_ROW, 1, numRows, 12); // A2:L{마지막 행}
    const configData = configRange.getValues();
    
    // 2. **검색 기준 목록 생성** (J, K, L열 데이터를 별도로 추출)
    const searchCriteria = [];
    
    for (let i = 0; i < configData.length; i++) {
        const criteria = String(configData[i][9] || '').trim();
        const accountDebit = String(configData[i][10] || '').trim();
        const accountCredit = String(configData[i][11] || '').trim();
        
        if (criteria) {
            searchCriteria.push({ criteria, accountDebit, accountCredit });
        }
    }
    
    // 3. E열 데이터를 업데이트하는 로직 실행
    const updatedConfigData = configData.map(row => {
        const contentE = String(row[4] || '').trim(); 
        
        let matchFound = false;

        for (const item of searchCriteria) {
            if (contentE.includes(item.criteria)) {
                row[5] = item.accountDebit; // F열 (차변계정과목)
                row[6] = item.accountCredit; // G열 (대변계정과목)
                matchFound = true;
                break; 
            }
        }
        
        return row;
    });

    // 4. 설정 시트에 업데이트 (A2:L{마지막 행} 범위에 덮어쓰기)
    configRange.setValues(updatedConfigData);

    // 5. E2 셀에 수식을 다시 입력하여 복구합니다.
    const formula = "=UNIQUE('은행원장'!O2:O)";
    configSheet.getRange('E2').setFormula(formula);
    
    // 6. E3셀부터 E열의 끝까지 내용을 삭제합니다.
    const eColumnRange = configSheet.getRange(3, 5, configLastRow - 2, 1);
    eColumnRange.clearContent();

    SpreadsheetApp.getUi().alert('계정 과목 매핑 처리가 완료되었습니다. (설정 시트 F열/G열 업데이트)');
}

//---

// **설정 시트의 E열에 N, O열을 참조하여 H열을 업데이트하는 함수 (내용 변경 없음)**
/**
 * 설정 시트의 E열 내용을 기준으로 N열 단어가 포함되는지 확인하고, 
 * O열의 값을 H열에 업데이트하는 함수입니다.
 */
function mapAccountTransactionDetails() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('설정');

    if (!configSheet) {
        SpreadsheetApp.getUi().alert('설정 시트를 찾을 수 없습니다.');
        return;
    }

    const configLastRow = configSheet.getLastRow();
    
    // 1. 설정 시트에서 전체 데이터 추출 (A열부터 O열까지 읽기)
    const START_ROW = 2; 
    const numRows = configLastRow - START_ROW + 1;
    
    // 데이터 추출 범위를 H열과 N, O열을 포함하도록 O열(인덱스 14)까지 읽습니다.
    const configRange = configSheet.getRange(START_ROW, 1, numRows, 15); // A2:O{마지막 행}
    const configData = configRange.getValues();
    
    // 2. **검색 기준 목록 생성** (N열, O열 데이터를 별도로 추출)
    const searchCriteria = [];
    
    for (let i = 0; i < configData.length; i++) {
        // N열을 검색 기준으로 사용 (인덱스 13)
        const criteria = String(configData[i][13] || '').trim(); 
        // O열을 업데이트 값으로 사용 (인덱스 14)
        const valueOne = String(configData[i][14] || '').trim(); 
        
        if (criteria) {
            searchCriteria.push({ criteria, valueOne });
        }
    }
    
    // 3. E열 데이터를 업데이트하는 로직 실행
    const updatedConfigData = configData.map(row => {
        // E열 내용 (2차수정거래내용 추정)은 인덱스 4
        const contentE = String(row[4] || '').trim(); 
        
        // H열 (업데이트 대상)은 인덱스 7

        let matchFound = false;

        for (const item of searchCriteria) {
            // E열 내용이 N열의 검색 기준 단어(criteria)를 포함하는지 확인
            if (contentE.includes(item.criteria)) {
                // O열의 값(valueOne)을 H열에 입력합니다.
                row[7] = item.valueOne; // H열 (인덱스 7)
                matchFound = true;
                break; 
            }
        }
        
        return row;
    });

    // 4. 설정 시트에 업데이트 (A2:O{마지막 행} 범위에 덮어쓰기)
    configRange.setValues(updatedConfigData);

    // 5. E2 셀에 수식을 다시 입력하여 복구합니다.
    const formula = "=UNIQUE('은행원장'!O2:O)";
    configSheet.getRange('E2').setFormula(formula);
    
    // 6. E3셀부터 E열의 끝까지 내용을 삭제합니다.
    const eColumnRange = configSheet.getRange(3, 5, configLastRow - 2, 1);
    eColumnRange.clearContent();

    SpreadsheetApp.getUi().alert('거래 상세 정보 매핑 처리가 완료되었습니다. (설정 시트 H열 업데이트)');
}