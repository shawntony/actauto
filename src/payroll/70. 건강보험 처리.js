/**
 * [V2] '건강보험' 시트의 2행부터 시작하여 AG열에 값이 없는 행에 대해
 * M, O, Z, AB열을 합산하여 AG, AH, AI열에 계산 결과를 넣습니다.
 * AH열 = AG열 * 2, AI열 = AG열.
 *
 * @param {string} targetMonth - 처리할 월 (예: '2025-09'). 제공되지 않으면 전체 처리.
 */
function calculateAndPopulateHealthInsuranceData(targetMonth) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sheetName = '건강보험';
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    ui.alert(`오류: "${sheetName}" 시트를 찾을 수 없습니다.`);
    return;
  }

  // ✅ 개별 실행 시 월 입력 다이얼로그 및 A열 업데이트
  if (!targetMonth) {
    const response = ui.prompt(
      '건강보험 처리 - 월 입력',
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
  }

  const startRow = 2; // 데이터 시작 행
  const lastRow = sheet.getLastRow();

  if (lastRow < startRow) {
    ui.alert(`"${sheetName}" 시트에 처리할 데이터(2행 이하)가 없습니다.`);
    return;
  }

  // 1. 필요한 열 인덱스 정의 (A=0)
  const A_COL_INDEX = 0;   // A열 (월 - 필터링 기준)
  const M_COL_INDEX = 12;  // M열
  const O_COL_INDEX = 14;  // O열
  const Z_COL_INDEX = 25;  // Z열
  const AB_COL_INDEX = 27; // AB열
  const AG_COL_INDEX = 32; // AG열 (결과: 합계)
  const AH_COL_INDEX = 33; // AH열 (결과: 합계 * 2)
  const AI_COL_INDEX = 34; // AI열 (결과: 합계)

  // 데이터 읽기 범위: 필요한 최대 열(AI열)까지 포함하도록 설정
  const maxColIndex = AI_COL_INDEX + 1;
  const numRows = lastRow - startRow + 1;

  // A2부터 AI열까지의 데이터 읽기
  const dataRange = sheet.getRange(startRow, 1, numRows, maxColIndex);
  const data = dataRange.getValues();

  const updatedData = [];
  let processedCount = 0;
  let skippedByMonth = 0;
  let skippedByExisting = 0;

  // 2. 행별로 데이터 처리
  data.forEach(row => {
    // 🌟 월 필터링: targetMonth가 제공된 경우, A열이 해당 월과 일치하는 행만 처리
    // A열은 "YYYY-MM-DD" 형식, targetMonth는 "YYYY-MM" 형식
    if (targetMonth) {
      const dateValue = String(row[A_COL_INDEX]).trim();
      // "YYYY-MM-DD"에서 "YYYY-MM" 추출
      const monthValue = dateValue.substring(0, 7); // "2026-01-31" → "2026-01"
      if (monthValue !== targetMonth) {
        updatedData.push(row);
        skippedByMonth++;
        return; // 다른 월인 경우 건너뛰기
      }
    }

    // 🌟 핵심 조건: AG열(인덱스 32)에 이미 값이 있으면 해당 행은 제외합니다.
    const agValue = row[AG_COL_INDEX];
    if (agValue !== "" && agValue !== null && typeof agValue !== 'undefined') {
      updatedData.push(row);
      skippedByExisting++;
      return;
    }

    // M, O, Z, AB 열의 값 합산
    let sum = 0;

    // 유효한 숫자인지 확인하고 합산하는 헬퍼 함수
    const addIfNumber = (value) => {
      if (typeof value === 'number' && !isNaN(value)) {
        sum += value;
      }
    };

    addIfNumber(row[M_COL_INDEX]);
    addIfNumber(row[O_COL_INDEX]);
    addIfNumber(row[Z_COL_INDEX]);
    addIfNumber(row[AB_COL_INDEX]);

    // 3. 계산 결과를 AG, AH, AI 열에 기록

    // AG열: 합계
    row[AG_COL_INDEX] = sum;

    // AH열: 합계 * 2
    row[AH_COL_INDEX] = sum * 2;

    // AI열: 합계
    row[AI_COL_INDEX] = sum;

    processedCount++;
    updatedData.push(row);
  });

  // 4. 시트에 업데이트된 데이터 쓰기
  dataRange.setValues(updatedData);

  if (processedCount > 0) {
    const monthInfo = targetMonth ? ` (${targetMonth} 대상)` : '';
    ui.alert(`✅ 건강보험 시트 처리가 완료되었습니다${monthInfo}.\n\n` +
             `- 처리된 행: ${processedCount}건\n` +
             `- 다른 월로 제외: ${skippedByMonth}건\n` +
             `- 이미 처리된 행: ${skippedByExisting}건`);
  } else {
    const monthInfo = targetMonth ? ` (${targetMonth})` : '';
    ui.alert(`경고: 새로 업데이트할 행이 없습니다${monthInfo}.\n\n` +
             `- 다른 월로 제외: ${skippedByMonth}건\n` +
             `- 이미 처리된 행: ${skippedByExisting}건`);
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

  const lastRow = sheet.getLastRow();

  // 2행 미만이면 데이터가 없는 것
  if (lastRow < 2) {
    Logger.log(`[${sheetName}] 데이터 없음 (lastRow < 2)`);
    return;
  }

  // A열과 B열 데이터 읽기 (2행부터 시작)
  const numRows = lastRow - 1; // 헤더 제외
  const dataRange = sheet.getRange(2, 1, numRows, 2); // A열, B열
  const data = dataRange.getValues();

  let filledCount = 0;

  // 각 행 처리: B열에 데이터가 있으면 A열을 무조건 targetDate로 업데이트
  const updatedData = data.map((row, idx) => {
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
    const aColumnRange = sheet.getRange(2, 1, numRows, 1);
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
