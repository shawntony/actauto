function runAllTransactionProcess() {
    const DELAY_TIME_MS = 7000; // 7초 지연 시간 설정
    const ui = SpreadsheetApp.getUi();

    // 0. 은행거래내역 업로드() 실행
    ui.alert("0/6: processRecentUpload() 실행 시작");
    processRecentUpload();

    // 🌟 핵심 해결책: setValues() 등의 쓰기 작업을 즉시 완료하도록 강제합니다.
    SpreadsheetApp.flush(); 
    
    ui.alert("1/6: 은행거래내역 업로드 완료 및 데이터 동기화 완료.");
    
    // 이 시점에서는 데이터가 시트에 완전히 반영된 상태입니다.

    // 1. clearF2toHColumnInConfig() 실행
    ui.alert("2/6: clearF2toHColumnInConfig() 실행 시작");
    clearF2toHColumnInConfig();
    
    Utilities.sleep(DELAY_TIME_MS);

    // 2. adjustedTransactionEntry() 실행
    ui.alert("3/6: adjustedTransactionEntry() 실행 시작");
    adjustedTransactionEntry();
    
    Utilities.sleep(DELAY_TIME_MS);

    // 3. IntegratedProcess() 실행 계정과목, 거래처 설정
    ui.alert("4/6: IntegratedProcess() 실행 시작");
    IntegratedProcess();
    
    Utilities.sleep(DELAY_TIME_MS);

    // 4. mapLedgerAccountsFromConfig() 실행 원장 계정과목 입력
    ui.alert("5/6: mapLedgerAccountsFromConfig() 실행 시작");
    mapLedgerAccountsFromConfig();
    
    Utilities.sleep(DELAY_TIME_MS);

    // 5. extractAndMarkInsuranceDataEfficient() 실행 연금,건강보험 추출
    ui.alert("5/6: extractAndMarkInsuranceDataEfficient() 실행 시작");
    extractAndMarkInsuranceDataEfficient();


    // 6. findAndMoveData_V14() 수작업 거래 추출
    ui.alert("6/6: findAndMoveData_V14() 실행 시작");
    findAndMoveData_V14();
    
    ui.alert("✅ 모든 트랜잭션 프로세스 실행 완료.");
}