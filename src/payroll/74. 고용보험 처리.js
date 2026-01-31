/**
 * 고용보험 시트의 A열에 월 데이터 입력
 * K열(직원고용보험료), Z열(사업주고안직능보험료)은 기존 값 유지
 *
 * @param {string} targetMonth - 처리할 월 (예: '2026-01'). 제공되지 않으면 사용자 입력 받음.
 */
function calculateAndPopulateEmploymentInsuranceData(targetMonth) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sheetName = '고용보험';
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    ui.alert(`오류: "${sheetName}" 시트를 찾을 수 없습니다.`);
    return;
  }

  // ✅ 개별 실행 시 월 입력 다이얼로그
  if (!targetMonth) {
    const response = ui.prompt(
      '고용보험 처리 - 월 입력',
      '처리할 월을 입력하세요 (예: 2026-01):',
      ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() !== ui.Button.OK) {
      ui.alert('취소되었습니다.');
      return;
    }

    targetMonth = response.getResponseText().trim();

    if (!targetMonth) {
      ui.alert('월을 입력해주세요.');
      return;
    }

    if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
      ui.alert('올바른 형식으로 입력해주세요. (예: 2026-01)');
      return;
    }

    // ✅ A열 업데이트 (해당 시트만)
    updateSheetMonthColumn(sheet, targetMonth, sheetName);

    ui.alert(`✅ 고용보험 시트 A열에 월 데이터 입력 완료.\n\n` +
             `대상 월: ${targetMonth}\n` +
             `K열(직원고용보험료), Z열(사업주고안직능보험료)의 기존 값은 유지됩니다.`);
  }
}

/**
 * 단일 시트의 A열에 월 데이터 업데이트
 * B열에 데이터가 있는 행에 대해 A열을 targetMonth (말일 형식)로 업데이트
 *
 * @param {Sheet} sheet - 업데이트할 시트 객체
 * @param {string} targetMonth - 입력할 월 (예: '2026-01')
 * @param {string} sheetName - 시트 이름 (로깅용)
 */
function updateSheetMonthColumn(sheet, targetMonth, sheetName) {
  const ui = SpreadsheetApp.getUi();

  // YYYY-MM 형식을 YYYY-MM-DD (말일) 형식으로 변환
  const targetDate = convertToLastDayOfMonth(targetMonth);
  Logger.log(`[updateSheetMonthColumn] ${sheetName} - targetMonth: ${targetMonth} → targetDate: ${targetDate}`);

  const startRow = 2;
  const lastRow = sheet.getLastRow();

  // 2행 미만이면 데이터가 없는 것
  if (lastRow < startRow) {
    Logger.log(`[${sheetName}] 데이터 없음 (lastRow < 2)`);
    return;
  }

  // A열과 B열 데이터 읽기 (2행부터 시작)
  const numRows = lastRow - startRow + 1;
  const dataRange = sheet.getRange(startRow, 1, numRows, 2); // A열, B열
  const data = dataRange.getValues();

  let filledCount = 0;

  // 각 행 처리: B열에 데이터가 있으면 A열을 무조건 targetDate로 업데이트
  const updatedData = data.map(row => {
    const bValue = row[1]; // B열

    // B열에 데이터가 있는지 확인
    const hasBValue = bValue !== "" && bValue !== null && typeof bValue !== 'undefined';

    // ✅ B열에 데이터가 있으면 A열을 무조건 targetDate로 업데이트
    if (hasBValue) {
      row[0] = targetDate;
      filledCount++;
    }

    return row;
  });

  Logger.log(`[${sheetName}] 업데이트: ${filledCount}행`);

  // 업데이트된 데이터 쓰기
  try {
    dataRange.setValues(updatedData);
    Logger.log(`[${sheetName}] setValues 성공`);
  } catch (e) {
    Logger.log(`[${sheetName}] setValues 오류: ${e.message}`);
    ui.alert(`❌ ${sheetName}: 데이터 쓰기 오류`);
    return;
  }

  // ✅ A열을 텍스트 형식으로 강제 설정 (날짜 자동 변환 방지)
  try {
    const aColumnRange = sheet.getRange(startRow, 1, numRows, 1);
    aColumnRange.setNumberFormat('@');
    Logger.log(`[${sheetName}] 텍스트 포맷 설정 성공`);
  } catch (e) {
    Logger.log(`[${sheetName}] 포맷 설정 오류: ${e.message}`);
  }

  Logger.log(`[updateSheetMonthColumn] ${sheetName} 완료 - ${filledCount}행 업데이트`);
}

/**
 * YYYY-MM 형식의 월을 YYYY-MM-DD (해당 월의 말일) 형식으로 변환
 *
 * @param {string} monthString - YYYY-MM 형식의 월 (예: '2026-01')
 * @return {string} YYYY-MM-DD 형식의 날짜 (예: '2026-01-31')
 */
function convertToLastDayOfMonth(monthString) {
  // YYYY-MM에서 년도와 월 추출
  const [year, month] = monthString.split('-').map(num => parseInt(num, 10));

  // 다음 달의 1일을 생성한 후 하루 빼면 이번 달의 말일
  const nextMonth = new Date(year, month, 1); // month는 0부터 시작하므로 month를 그대로 넣으면 다음 달
  const lastDay = new Date(nextMonth - 1); // 하루 빼기

  // YYYY-MM-DD 형식으로 반환
  const lastDayString = `${year}-${String(month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

  return lastDayString;
}
