function findAndMoveData_V14() {
    // 스프레드시트 가져오기
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();

    // 시트 이름 설정
    const SOURCE_SHEET_NAME = "은행원장";
    const BACKUP_SHEET_NAME = "거래Backup";
    const VERIFICATION_SHEET_NAME = "거래검증"; 
    const SETTINGS_SHEET_NAME = "설정"; // 시트 이름: "설정"

    // 시트 가져오기
    const sourceSheet = ss.getSheetByName(SOURCE_SHEET_NAME);
    const settingsSheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
    let backupSheet = ss.getSheetByName(BACKUP_SHEET_NAME);
    let verificationSheet = ss.getSheetByName(VERIFICATION_SHEET_NAME);
    
    // 필수 시트 존재 여부 확인
    if (!sourceSheet) {
        ui.alert(`오류: "${SOURCE_SHEET_NAME}" 시트를 찾을 수 없습니다.`);
        return;
    }
    if (!settingsSheet) {
        ui.alert(`오류: "${SETTINGS_SHEET_NAME}" 시트를 찾을 수 없습니다. 시트 이름을 확인하거나 시트를 생성해 주세요.`);
        return;
    }
    // 대상 시트는 없으면 생성
    if (!backupSheet) {
        backupSheet = ss.insertSheet(BACKUP_SHEET_NAME);
    }
    if (!verificationSheet) {
        verificationSheet = ss.insertSheet(VERIFICATION_SHEET_NAME);
    }

    // --- '설정' 시트 S2 셀에서 필터링 값 가져오기 ---
    const rawFilterValue = settingsSheet.getRange("S2").getValue();
    
    // 쉼표(,)를 구분 기호로 사용하여 다중 선택된 값을 배열로 분리하고 공백 제거
    let filterValues = [];
    if (rawFilterValue && String(rawFilterValue).toString().trim() !== "") {
        filterValues = String(rawFilterValue).split(',').map(val => val.trim()).filter(val => val.length > 0);
    }
    
    // 유효한 필터 값이 있는지 여부
    const isFilterValuePresent = filterValues.length > 0;
    
    // '은행원장' 데이터 로드 및 시작 행 설정
    const DATA_START_ROW = 2; // 데이터가 시작하는 실제 행 번호는 2행
    const sourceRange = sourceSheet.getDataRange();
    const numRows = sourceRange.getNumRows();

    if (numRows < DATA_START_ROW) {
        ui.alert(`은행원장 시트에 처리할 데이터(2행 이하)가 없습니다.`);
        return;
    }
    
    // 💡 T열(인덱스 19)까지 포함하여 데이터를 읽기 위해 Range를 재구성합니다.
    const T_COL_INDEX = 19; 
    const numColumns = sourceRange.getNumColumns();
    const maxColumns = Math.max(numColumns, T_COL_INDEX + 1); // 최소 T열까지 읽도록 보장
    
    // 1행부터 maxColumns까지 전체 데이터를 가져옵니다.
    const allValues = sourceSheet.getRange(1, 1, numRows, maxColumns).getValues();
    
    // 2행부터 데이터가 시작하므로, 배열에서는 인덱스 1부터 시작합니다. (1행은 헤더)
    const dataRows = allValues.slice(DATA_START_ROW - 1); 
    
    const filteredData = [];
    const rowsToDelete = [];

    // 열 인덱스 (A열=0, B열=1, ...)
    const O_COL_INDEX = 14; // O열
    const P_COL_INDEX = 15; // P열
    const Q_COL_INDEX = 16; // Q열
    const R_COL_INDEX = 17; // R열
    // T열 인덱스는 이미 T_COL_INDEX=19로 설정되어 있습니다.

    // 공백 체크 함수
    const isBlank = (value) => (value === null || value === undefined || String(value).toString().trim() === "");
    
    // 데이터 필터링 및 삭제 대상 행 번호 수집
    dataRows.forEach((row, i) => {
        
        // 🌟 [추가된 핵심 로직] T열에 '완료' 단어가 있으면 해당 행은 처리하지 않습니다.
        const statusT = String(row[T_COL_INDEX] || '').trim();
        if (statusT.includes('완료')) {
            return; // 이 행은 필터링 및 이동 대상에서 제외
        }

        // 조건 2: (P열 AND Q열 모두 공백) OR (R열 공백) - PQR 조건
        const isP_Empty = isBlank(row[P_COL_INDEX]);
        const isQ_Empty = isBlank(row[Q_COL_INDEX]);
        const isR_Empty = isBlank(row[R_COL_INDEX]);
        const condition_PQR = (isP_Empty && isQ_Empty) || isR_Empty;
        
        let finalCondition = condition_PQR;

        // S2 셀에 값이 있는 경우에만 O열 조건을 OR 조건으로 추가
        if (isFilterValuePresent) {
            const oValue = String(row[O_COL_INDEX]).trim();
            
            // 조건 1: O열의 값이 필터 값들 중 하나라도 일치하는지 확인 (O 조건)
            const condition_O = filterValues.some(filterVal => oValue === filterVal);
            
            // 최종 조건: O 조건 OR PQR 조건
            finalCondition = condition_O || condition_PQR;
        }
        
        if (finalCondition) {
            filteredData.push(row);
            // 실제 시트 행 번호는 i + DATA_START_ROW
            rowsToDelete.push(i + DATA_START_ROW); 
        }
    });

    if (filteredData.length === 0) {
        const filterDesc = isFilterValuePresent ? `O열 값 (${filterValues.join(', ')}) OR PQR 조건` : `PQR 조건`;
        ui.alert(`T열 '완료'를 제외하고 ${filterDesc}에 맞는 데이터를 찾지 못했습니다.`);
        return;
    }
    
    // --- 데이터 붙여넣기 함수 (값만 추가) ---
    const appendData = (sheet, data) => {
        // getLastRow() + 1을 사용하여 기존 데이터 다음 행부터 시작
        const startRow = sheet.getLastRow() + 1; 
        const numRows = data.length;
        const numCols = data[0].length;
        const targetRange = sheet.getRange(startRow, 1, numRows, numCols);
        targetRange.setValues(data); // 값만 붙여넣습니다.
        return { startRow: startRow, endRow: startRow + numRows - 1 };
    };

    // 1. '거래Backup' 시트에 데이터 추가
    appendData(backupSheet, filteredData);

    // 2. '거래검증' 시트에 데이터 추가
    const verificationRange = appendData(verificationSheet, filteredData);

    // 3. '거래검증' 시트 정렬 (F열 기준 오름차순)
    const LAST_COLUMN = verificationSheet.getLastColumn();
    const LAST_ROW = verificationSheet.getLastRow();
    
    // 1행은 헤더이므로 2행부터 마지막 데이터까지 정렬 범위 지정
    if (LAST_ROW > 1) {
        const sortRange = verificationSheet.getRange(2, 1, LAST_ROW - 1, LAST_COLUMN);
        
        // F열은 인덱스 6번째 열 (A=1, B=2, C=3, D=4, E=5, F=6)
        const F_COL_INDEX_ONE_BASED = 6;
        
        sortRange.sort({ column: F_COL_INDEX_ONE_BASED, ascending: true });
    }


    // 4. '은행원장' 시트에서 해당 행 삭제 (잘라내기)
    rowsToDelete.sort((a, b) => b - a);
    rowsToDelete.forEach(rowNum => {
        sourceSheet.deleteRow(rowNum);
    });

    const filterUsedMsg = isFilterValuePresent 
        ? `O열 필터링 값 (${filterValues.join(', ')}) OR PQR 조건` 
        : `O열 필터링 없이 PQR 조건만 사용`;
        
    ui.alert(`✅ 성공: T열 '완료' 행을 제외하고 ${filterUsedMsg}을(를) 사용하여 조건에 맞는 ${filteredData.length}개의 데이터가 '은행원장'에서 잘라내어 두 시트에 추가되었으며, '거래검증' 시트가 F열 기준으로 정렬되었습니다.`);
}