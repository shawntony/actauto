function onOpen() {
  const ui = SpreadsheetApp.getUi();

  // 1. '재무자료 관리' 메뉴 정의 
  ui.createMenu('재무자료 관리')
      .addItem('통합 데이터 전처리', 'runAllTransactionProcess') 
      .addSeparator() 
      .addItem('은행거래내역 업로드', 'processRecentUpload')
      .addSeparator() 
      .addSubMenu(ui.createMenu('데이터 전처리')
          .addItem('1. 설정 초기화', 'clearF2toHColumnInConfig') 
          .addItem('2. 수정거래내용 입력', 'adjustedTransactionEntry') 
          .addItem('3. 설정 계정과목_거래처', 'IntegratedProcess') 
          .addItem('4. 원장 계정과목 입력', 'mapLedgerAccountsFromConfig') 
          .addItem('5. 연금,건강 정리', 'extractAndMarkInsuranceDataEfficient') 
          .addItem('6. 수작업 거래 추출', 'findAndMoveData_V14')) 
      .addSeparator() 
      .addSubMenu(ui.createMenu('데이터 후처리')
          // 🌟 새로운 '0. 부가세 거래 검증' 메뉴가 추가되었습니다.
          .addItem('0. 부가세 거래 검증', 'applyVATTaxCalculation')
          .addItem('1. 거래검증완료 데이터 환원', 'moveVerifiedTransactions')) 
      .addSeparator() 
      .addSubMenu(ui.createMenu('분개')      
          .addItem('1. 분개 초기화', 'resetCriteriaCheckboxes') 
          .addItem('2. 분개처리', 'filterAndOutputLedgerData')
          .addItem('3. 이자수익 하위 분개', 'calculateAndTransferInterestSum')) 
      .addSeparator()       
      .addItem('9. 원장 계정과목 등 초기화', 'clearP2toRColumnInLedger')
      .addSeparator() 
      .addSubMenu(ui.createMenu('거래종류별 추출')      
          .addItem('이자수익 하위 분개', 'extractAndMarkLoanData')) 
      .addSeparator() 
      .addToUi(); 

  // 2. '도구 관리' 메뉴 정의 
  ui.createMenu('도구 관리')
      .addItem('새 탭 열기', 'openNewTabWithCurrentSheet')
      .addItem('세금시트 열기/숨기기', 'toggleTaxSheetsVisibility') 
      .addItem('세금계산서 시트 열기/숨기기', 'toggleInvoiceSheetsVisibility')
      .addItem('급여 관리 열기/숨기기', 'togglePayrollSheetsVisibility')
      .addItem('설정 열기/숨기기', 'toggleConfigSheetVisibility') 
      .addItem('거래Backup 열기/숨기기', 'toggleTransactionBackupSheetVisibility') 
      .addToUi(); 
      
  // 3. '급여 관리' 메뉴 정의 (기존 유지)
  ui.createMenu('급여 관리')
      .addItem('0. 통합 급여 처리', 'payrollmanagement') 
      .addItem('1. 건강보험 처리', 'calculateAndPopulateHealthInsuranceData')
      .addItem('2. 국민연금 처리', 'calculateAndPopulateNationalPensionData') 
      .addItem('3. 월지급 계산', 'matchAllPayrollData_V6') 
      .addToUi();
}