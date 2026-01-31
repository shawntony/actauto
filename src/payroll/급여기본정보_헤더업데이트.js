/**
 * 급여기본정보 시트의 제목행을 업데이트합니다.
 * 비앤비케이 스프레드시트와 동일한 형식으로 맞춥니다.
 */
function updatePayrollBasicInfoHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('급여기본정보');

  if (!sheet) {
    SpreadsheetApp.getUi().alert('급여기본정보 시트를 찾을 수 없습니다.');
    return;
  }

  // 새 제목행 (비앤비케이 기준)
  const headers = [
    'ID',
    '이름',
    '직위',
    '주민번호',
    '입사일',
    '퇴사일',
    '재직/퇴사',
    '총급여',
    '기본급',
    '고정연장근로수당',
    '고용휴일근로수당',
    '고정야간근로수당',
    '기타수당',
    '직책수당',
    '차량유지비',
    '연차수당',
    '급여성비용',
    '특별상여금근로수당',
    '식대',
    '시간당급여',
    '통상임금',
    '은행',
    '계좌번호',
    '핸드폰'
  ];

  // A1:X1 범위에 제목행 설정
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);

  SpreadsheetApp.getUi().alert('급여기본정보 시트의 제목행이 업데이트되었습니다.');
}
