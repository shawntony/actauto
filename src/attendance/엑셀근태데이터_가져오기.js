/**
 * 엑셀 근태 데이터 가져오기
 *
 * Google Drive 폴더의 엑셀 파일에서 근태 데이터를 읽어
 * 비앤비케이 스프레드시트의 '근태기록' 시트로 복사합니다.
 *
 * 소스 폴더 ID: 1MFlIX2nhAHE_H0k1MsXhBvbIL6ULCbTB
 * 대상 스프레드시트 ID: 1o2F_b_w2ZOcs27JSoP6VVN7id8QoujI73yzV2ngqFh4 (비앤비케이)
 * 대상 시트: 근태기록
 */

// 설정값
const ATTENDANCE_SOURCE_FOLDER_ID = '1MFlIX2nhAHE_H0k1MsXhBvbIL6ULCbTB';
const ATTENDANCE_TARGET_SPREADSHEET_ID = '1o2F_b_w2ZOcs27JSoP6VVN7id8QoujI73yzV2ngqFh4';
const ATTENDANCE_TARGET_SHEET_NAME = '근태기록';

// 대상 헤더 (첫 번째 행)
const ATTENDANCE_HEADERS = ['법인명', '직원', '직무', '날짜', '출근시간', '퇴근시간', '일근무시간', '적용년월'];

// 소스 열 인덱스 (0-based)
const SOURCE_COLUMN_INDEX = {
  조직: 2,      // C열
  직원: 1,      // B열
  직무: 3,      // D열
  날짜: 4,      // E열
  출근시간: 5,  // F열
  퇴근시간: 6,  // G열
  총시간: 11    // L열
};

/**
 * 근무시간을 HH:MM 형식으로 변환
 * @param {any} value - 시간 값 (숫자, 문자열, Date 등)
 * @returns {string} - HH:MM 형식 문자열
 */
function formatWorkingTime(value) {
  if (!value && value !== 0) return '';

  // Date 객체인 경우 (출근/퇴근 시간은 Date로 들어올 수 있음)
  if (value instanceof Date) {
    const hours = value.getHours().toString().padStart(2, '0');
    const minutes = value.getMinutes().toString().padStart(2, '0');
    return hours + ':' + minutes;
  }

  // "X시간 YY분" 형식인 경우 (예: "9시간 03분" → "09:03")
  if (typeof value === 'string') {
    const koreanMatch = value.match(/(\d+)시간\s*(\d+)분/);
    if (koreanMatch) {
      const hours = koreanMatch[1].padStart(2, '0');
      const minutes = koreanMatch[2].padStart(2, '0');
      return hours + ':' + minutes;
    }
  }

  // 이미 HH:MM 형식인 경우
  if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value)) {
    const parts = value.split(':');
    return parts[0].padStart(2, '0') + ':' + parts[1];
  }

  // 숫자인 경우 (시간 단위, 예: 9.05 = 9시간 3분)
  if (typeof value === 'number') {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    return hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
  }

  return String(value);
}

/**
 * 날짜에서 적용년월(yyyy-mm) 추출
 * @param {any} dateValue - 날짜 값
 * @returns {string} - yyyy-mm 형식 문자열
 */
function extractYearMonth(dateValue) {
  if (!dateValue) return '';

  let date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string') {
    date = new Date(dateValue.replace(/[-.]/g, '/'));
  } else {
    return '';
  }

  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 소스 행을 대상 열 순서로 매핑
 * @param {Array} sourceRow - 소스 데이터 행
 * @returns {Array} - 매핑된 대상 행
 */
function mapAttendanceRow(sourceRow) {
  const dateValue = sourceRow[SOURCE_COLUMN_INDEX.날짜];
  // 조직명에서 [현장] 제거
  const orgValue = String(sourceRow[SOURCE_COLUMN_INDEX.조직] || '').replace('[현장]', '').trim();
  return [
    orgValue,                                                   // A: 법인명
    sourceRow[SOURCE_COLUMN_INDEX.직원],                        // B: 직원
    sourceRow[SOURCE_COLUMN_INDEX.직무],                        // C: 직무
    dateValue,                                                  // D: 날짜
    formatWorkingTime(sourceRow[SOURCE_COLUMN_INDEX.출근시간]), // E: 출근시간 (HH:MM)
    formatWorkingTime(sourceRow[SOURCE_COLUMN_INDEX.퇴근시간]), // F: 퇴근시간 (HH:MM)
    formatWorkingTime(sourceRow[SOURCE_COLUMN_INDEX.총시간]),   // G: 일근무시간 (HH:MM)
    extractYearMonth(dateValue)                                 // H: 적용년월 (yyyy-mm)
  ];
}

/**
 * 폴더에서 가장 최근에 수정된 엑셀 파일을 찾습니다.
 * @param {Folder} folder - 검색할 폴더
 * @returns {File|null} - 가장 최근 엑셀 파일 또는 null
 */
function findLatestExcelFile(folder) {
  const files = folder.getFilesByType(MimeType.MICROSOFT_EXCEL);

  let latestFile = null;
  let latestDate = new Date(0);

  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();

    // .xls 또는 .xlsx 파일만 처리
    if (!fileName.endsWith('.xls') && !fileName.endsWith('.xlsx')) {
      continue;
    }

    const lastUpdated = file.getLastUpdated();
    if (lastUpdated > latestDate) {
      latestDate = lastUpdated;
      latestFile = file;
    }
  }

  return latestFile;
}

/**
 * 엑셀 파일을 임시 구글 시트로 변환
 * @param {File} excelFile - 엑셀 파일
 * @returns {string} - 임시 스프레드시트 ID
 */
function convertExcelToSheet(excelFile) {
  const fileBlob = excelFile.getBlob();

  const tempFile = Drive.Files.insert({
    title: '임시_근태_데이터_' + new Date().getTime(),
    mimeType: MimeType.GOOGLE_SHEETS
  }, fileBlob);

  return tempFile.id;
}

/**
 * 엑셀 근태 데이터를 스프레드시트로 가져옵니다.
 * 메뉴에서 호출하는 메인 함수
 */
function importAttendanceFromExcel() {
  const ui = SpreadsheetApp.getUi();

  try {
    // 1. 소스 폴더 접근
    const folder = DriveApp.getFolderById(ATTENDANCE_SOURCE_FOLDER_ID);

    // 2. 가장 최근 엑셀 파일 찾기
    const latestFile = findLatestExcelFile(folder);

    if (!latestFile) {
      ui.alert('오류', '지정된 폴더에 엑셀 파일(.xls, .xlsx)이 없습니다.', ui.ButtonSet.OK);
      return;
    }

    // 3. 사용자 확인
    const confirmResult = ui.alert(
      '근태 데이터 가져오기',
      `파일 "${latestFile.getName()}"의 데이터를 가져오시겠습니까?\n\n` +
      `• 2행은 건너뛰고 1행(제목)과 3행 이후 데이터를 복사합니다.\n` +
      `• 열 매핑: 조직→법인명, 직원→직원, 직무→직무, 날짜→날짜, 출근시간→출근시간, 퇴근시간→퇴근시간, 총시간→일근무시간`,
      ui.ButtonSet.OK_CANCEL
    );

    if (confirmResult !== ui.Button.OK) {
      return;
    }

    // 4. 엑셀을 임시 구글 시트로 변환
    const tempSheetId = convertExcelToSheet(latestFile);

    try {
      // 5. 임시 시트에서 데이터 읽기
      const tempSpreadsheet = SpreadsheetApp.openById(tempSheetId);
      const sourceSheet = tempSpreadsheet.getSheets()[0];

      const lastRow = sourceSheet.getLastRow();
      const lastCol = sourceSheet.getLastColumn();

      if (lastRow < 3) {
        ui.alert('경고', '가져올 데이터가 없습니다. (최소 3행 이상 필요)', ui.ButtonSet.OK);
        DriveApp.getFileById(tempSheetId).setTrashed(true);
        return;
      }

      // 모든 데이터 읽기
      const allData = sourceSheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();

      // 6. 데이터 처리: 1행(헤더)과 3행 이후만 사용, 2행 건너뜀
      const processedData = [];

      for (let i = 0; i < allData.length; i++) {
        // 2행(인덱스 1) 건너뛰기
        if (i === 1) continue;

        const mappedRow = mapAttendanceRow(allData[i]);

        // 빈 행 체크 (모든 셀이 비어있으면 건너뜀)
        const hasData = mappedRow.some(cell => cell !== '' && cell !== null && cell !== undefined);
        if (hasData) {
          processedData.push(mappedRow);
        }
      }

      if (processedData.length <= 1) {
        ui.alert('경고', '가져올 데이터 행이 없습니다.', ui.ButtonSet.OK);
        DriveApp.getFileById(tempSheetId).setTrashed(true);
        return;
      }

      // 7. 대상 스프레드시트 열기
      const targetSpreadsheet = SpreadsheetApp.openById(ATTENDANCE_TARGET_SPREADSHEET_ID);
      let targetSheet = targetSpreadsheet.getSheetByName(ATTENDANCE_TARGET_SHEET_NAME);

      // 시트가 없으면 생성
      if (!targetSheet) {
        targetSheet = targetSpreadsheet.insertSheet(ATTENDANCE_TARGET_SHEET_NAME);
      }

      const targetLastRow = targetSheet.getLastRow();

      // 8. 데이터 쓰기
      let dataToWrite;
      let startRow;

      if (targetLastRow === 0) {
        // 빈 시트: 헤더 포함 전체 데이터 쓰기
        dataToWrite = processedData;
        startRow = 1;
      } else {
        // 기존 데이터 있음: 헤더 제외하고 데이터만 추가
        dataToWrite = processedData.slice(1); // 첫 행(헤더) 제외
        startRow = targetLastRow + 1;
      }

      if (dataToWrite.length > 0) {
        const targetRange = targetSheet.getRange(startRow, 1, dataToWrite.length, dataToWrite[0].length);
        targetRange.setValues(dataToWrite);
      }

      // 9. 임시 파일 삭제
      DriveApp.getFileById(tempSheetId).setTrashed(true);

      // 10. 완료 메시지
      const dataCount = targetLastRow === 0 ? processedData.length - 1 : dataToWrite.length;
      ui.alert(
        '완료',
        `"${latestFile.getName()}"에서 ${dataCount}건의 근태 데이터를 가져왔습니다.`,
        ui.ButtonSet.OK
      );

    } catch (e) {
      // 오류 발생 시 임시 파일 정리
      try {
        DriveApp.getFileById(tempSheetId).setTrashed(true);
      } catch (cleanupError) {
        // 정리 실패는 무시
      }
      throw e;
    }

  } catch (e) {
    Logger.log('근태 데이터 가져오기 오류: ' + e.message);
    ui.alert('오류', '근태 데이터 가져오기 중 오류가 발생했습니다:\n' + e.message, ui.ButtonSet.OK);
  }
}
