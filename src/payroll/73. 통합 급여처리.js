
function payrollmanagement() {

  const DELAY_TIME_MS = 7000; // 7초 지연 시간 설정
  const ui = SpreadsheetApp.getUi();

  ui.alert("건강보험 처리 실행합니다.")

  calculateAndPopulateHealthInsuranceData();

  Utilities.sleep(DELAY_TIME_MS);

  ui.alert("국민연금 처리 실행합니다.")

  calculateAndPopulateNationalPensionData();

  Utilities.sleep(DELAY_TIME_MS);

  ui.alert("월지급계산 처리 실행합니다.")
  
  matchAllPayrollData_V6();

}