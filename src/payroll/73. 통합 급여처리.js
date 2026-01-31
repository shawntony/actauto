/**
 * [V3] 급여 통합 처리 - 월 기준 일괄 처리
 * 1. 모든 급여 시트의 A열에 월 데이터 자동 입력
 * 2. 건강보험, 국민연금, 월지급계산 순차 실행
 */

// 상수 정의
const PAYROLL_CONFIG = {
  DELAY_MS: 7000,
  SHEET_NAMES: ['건강보험', '국민연금', '고용보험', '산재보험', '월지급계산'],
  MONTH_REGEX: /^\d{4}-\d{2}$/,
  PROCESSING_STEPS: [
    { name: '건강보험', func: calculateAndPopulateHealthInsuranceData },
    { name: '국민연금', func: calculateAndPopulateNationalPensionData },
    { name: '월지급계산', func: matchAllPayrollData_V6 }
  ]
};

/**
 * 메인 급여 처리 함수
 */
function payrollmanagement() {
  const ui = SpreadsheetApp.getUi();

  // 기준월 입력 받기
  const targetMonth = getTargetMonthFromUser(ui);
  if (!targetMonth) return;

  // 1단계: 월 데이터 자동 입력
  ui.alert('1단계: 월 데이터 자동 입력을 시작합니다.');
  fillMonthDataInSheets(targetMonth);
  Utilities.sleep(PAYROLL_CONFIG.DELAY_MS);

  // 2단계: 급여 처리 실행
  const stepNames = PAYROLL_CONFIG.PROCESSING_STEPS.map(step => step.name).join(', ');
  ui.alert(`2단계: ${targetMonth} 급여 처리를 시작합니다.\n\n처리 항목: ${stepNames}`);

  executePayrollProcessing(targetMonth, ui);

  ui.alert(`✅ ${targetMonth} 급여 처리가 완료되었습니다.`);
}

/**
 * 사용자로부터 처리할 월 입력받기
 */
function getTargetMonthFromUser(ui) {
  const response = ui.prompt(
    '급여 처리 기준월 입력',
    '처리할 급여 월을 입력하세요 (예: 2025-12):\n\n' +
    '※ 모든 급여 시트의 A열에 월 데이터가 자동 입력되고,\n' +
    '   건강보험, 국민연금, 월지급계산이 처리됩니다.',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    ui.alert('취소되었습니다.');
    return null;
  }

  const targetMonth = response.getResponseText().trim();

  if (!targetMonth) {
    ui.alert('월을 입력해주세요.');
    return null;
  }

  if (!PAYROLL_CONFIG.MONTH_REGEX.test(targetMonth)) {
    ui.alert('올바른 형식으로 입력해주세요. (예: 2025-12)');
    return null;
  }

  return targetMonth;
}

/**
 * 급여 처리 단계별 실행
 */
function executePayrollProcessing(targetMonth, ui) {
  PAYROLL_CONFIG.PROCESSING_STEPS.forEach((step, index) => {
    if (index > 0) {
      Utilities.sleep(PAYROLL_CONFIG.DELAY_MS);
    }

    ui.alert(`${step.name} 처리를 실행합니다.`);
    step.func(targetMonth);
  });
}

/**
 * 모든 급여 시트의 A열에 월 데이터 자동 입력
 * B열에 데이터가 있는 행에 대해 A열을 월 데이터로 업데이트
 */
function fillMonthDataInSheets(targetMonth) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const targetDate = convertToLastDayOfMonth(targetMonth);

  Logger.log(`월 데이터 입력 시작: ${targetMonth} → ${targetDate}`);

  const results = {
    totalFilled: 0,
    summary: [],
    debugInfo: []
  };

  PAYROLL_CONFIG.SHEET_NAMES.forEach(sheetName => {
    processSheetMonthData(ss, sheetName, targetDate, results);
  });

  showMonthDataResults(ui, targetDate, results);
}

/**
 * 개별 시트의 월 데이터 처리
 */
function processSheetMonthData(ss, sheetName, targetDate, results) {
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    results.summary.push(`⚠️ ${sheetName}: 시트를 찾을 수 없습니다`);
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    results.summary.push(`⚠️ ${sheetName}: 처리할 데이터가 없습니다`);
    return;
  }

  const { updatedData, filledCount, skippedCount } = updateSheetData(sheet, lastRow, targetDate);

  if (!writeSheetData(sheet, lastRow, updatedData, sheetName, results)) {
    return;
  }

  results.totalFilled += filledCount;
  results.summary.push(`✅ ${sheetName}: ${filledCount}행 업데이트 (건너뜀: ${skippedCount})`);

  if (filledCount === 0 && lastRow > 1) {
    results.debugInfo.push(`${sheetName}: B열에 데이터가 있는 행이 없음`);
  }
}

/**
 * 시트 데이터 업데이트
 */
function updateSheetData(sheet, lastRow, targetDate) {
  const numRows = lastRow - 1;
  const dataRange = sheet.getRange(2, 1, numRows, 2);
  const data = dataRange.getValues();

  let filledCount = 0;
  let skippedCount = 0;

  const updatedData = data.map(row => {
    const hasBValue = row[1] !== "" && row[1] !== null && row[1] !== undefined;

    if (hasBValue) {
      row[0] = targetDate;
      filledCount++;
    } else {
      skippedCount++;
    }

    return row;
  });

  return { updatedData, filledCount, skippedCount };
}

/**
 * 시트에 데이터 쓰기
 */
function writeSheetData(sheet, lastRow, updatedData, sheetName, results) {
  const numRows = lastRow - 1;
  const dataRange = sheet.getRange(2, 1, numRows, 2);

  try {
    dataRange.setValues(updatedData);

    // A열을 텍스트 형식으로 설정 (날짜 자동 변환 방지)
    const aColumnRange = sheet.getRange(2, 1, numRows, 1);
    aColumnRange.setNumberFormat('@');

    return true;
  } catch (e) {
    Logger.log(`[${sheetName}] 데이터 쓰기 오류: ${e.message}`);
    results.summary.push(`❌ ${sheetName}: 데이터 쓰기 오류`);
    results.debugInfo.push(`${sheetName} 쓰기 오류: ${e.message}`);
    return false;
  }
}

/**
 * 월 데이터 입력 결과 표시
 */
function showMonthDataResults(ui, targetDate, results) {
  Logger.log(`월 데이터 입력 완료 - 총 ${results.totalFilled}행 업데이트`);

  let message = `월 데이터 자동 입력 완료 (${targetDate})\n\n` +
    results.summary.join('\n') +
    `\n\n총 ${results.totalFilled}행에 월 데이터가 입력되었습니다.`;

  if (results.debugInfo.length > 0) {
    message += '\n\n⚠️ 참고:\n' + results.debugInfo.join('\n');
  }

  ui.alert(message);
}

/**
 * YYYY-MM 형식의 월을 YYYY-MM-DD (해당 월의 말일) 형식으로 변환
 * @param {string} monthString - YYYY-MM 형식 (예: '2026-01')
 * @return {string} YYYY-MM-DD 형식 (예: '2026-01-31')
 */
function convertToLastDayOfMonth(monthString) {
  const [year, month] = monthString.split('-').map(Number);

  // 다음 달의 0일 = 이번 달의 마지막 날
  const lastDayOfMonth = new Date(year, month, 0);

  const day = String(lastDayOfMonth.getDate()).padStart(2, '0');
  const monthStr = String(month).padStart(2, '0');

  return `${year}-${monthStr}-${day}`;
}
