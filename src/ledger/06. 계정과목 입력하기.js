/**
 * 은행원장 O열의 수정거래내용을 설정시트 E열에서 찾아 
 * 설정시트 F, G, H열의 내용을 은행원장의 P, Q, R열에 넣어주는 함수입니다.
 */
function mapLedgerAccountsFromConfig() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ledgerSheet = ss.getSheetByName('은행원장');
    const configSheet = ss.getSheetByName('설정');

    if (!ledgerSheet || !configSheet) {
        SpreadsheetApp.getUi().alert('오류: 은행원장 또는 설정 시트를 찾을 수 없습니다.');
        return;
    }

    // 1. 설정 시트에서 매핑 기준 데이터 추출 (E, F, G, H열)
    // E열(검색 대상, 인덱스 4)부터 H열(업데이트 값, 인덱스 7)까지 읽습니다.
    const configLastRow = configSheet.getLastRow();
    const configData = configSheet.getRange('E2:H' + configLastRow).getValues();

    // 2. 검색 기준 목록 생성
    // 설정 시트의 E열을 검색 키(Key)로 사용합니다.
    const configMap = {};
    for (const row of configData) {
        const criteriaE = String(row[0] || '').trim(); // E열 (인덱스 0: 읽어온 범위의 첫 번째 열)
        const valueF = String(row[1] || '').trim();  // F열 (인덱스 1)
        const valueG = String(row[2] || '').trim();  // G열 (인덱스 2)
        const valueH = String(row[3] || '').trim();  // H열 (인덱스 3)
        
        if (criteriaE) {
            // E열의 내용을 키로 사용합니다.
            configMap[criteriaE] = { valueF, valueG, valueH };
        }
    }
    
    // 3. 은행원장 데이터 추출 및 업데이트 (P, Q, R, T열을 포함하도록 확장)
    const ledgerLastRow = ledgerSheet.getLastRow();
    // 💡 A열부터 T열(인덱스 19)까지 읽도록 범위를 확장합니다.
    const ledgerRange = ledgerSheet.getRange('A2:T' + ledgerLastRow);
    const ledgerData = ledgerRange.getValues();

    const updatedLedgerData = ledgerData.map(row => {
        // T열(처리완료)은 인덱스 19
        const statusT = String(row[19] || '').trim(); 

        // 🌟 [추가된 핵심 로직] T열에 '완료' 단어가 있으면 해당 행은 P, Q, R열을 수정하지 않고 원본 그대로 반환합니다.
        if (statusT.includes('완료')) {
            return row; 
        }

        // 은행원장 O열 내용 (수정거래내용)은 인덱스 14
        const contentO = String(row[14] || '').trim(); 
        
        // **O열 내용이 설정 시트의 E열 목록에 정확히 존재하는지 확인합니다.**
        if (configMap.hasOwnProperty(contentO)) {
            const values = configMap[contentO];
            
            // P열 (인덱스 15)에 F열 값 입력 (차변계정과목)
            row[15] = values.valueF; 
            
            // Q열 (인덱스 16)에 G열 값 입력 (대변계정과목)
            row[16] = values.valueG; 
            
            // R열 (인덱스 17)에 H열 값 입력 (거래처)
            row[17] = values.valueH; 
        }
        
        return row;
    });

    // 4. 은행원장 시트에 업데이트
    // 💡 T열까지 업데이트 범위에 포함하여 기록합니다.
    ledgerRange.setValues(updatedLedgerData);
    SpreadsheetApp.getUi().alert('은행원장 P, Q, R열 업데이트가 완료되었습니다. (설정 E열 기반 매핑)');
}