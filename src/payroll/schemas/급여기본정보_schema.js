/**
 * 급여기본정보 시트 스키마 정의
 * 24개 컬럼 (A-X) 구조
 */
const PAYROLL_BASIC_INFO_SCHEMA = {
  SHEET_NAME: '급여기본정보',

  COLUMNS: {
    A: { index: 0, name: 'ID', type: 'string', description: '직원 고유 ID' },
    B: { index: 1, name: '이름', type: 'string', description: '직원 이름', primary: true },
    C: { index: 2, name: '직위', type: 'string', description: '직위/직책' },
    D: { index: 3, name: '주민번호', type: 'string', description: '주민등록번호 (매칭 키 - 앞 6자리 사용)', matchingKey: true },
    E: { index: 4, name: '입사일', type: 'date', description: '입사일자' },
    F: { index: 5, name: '퇴사일', type: 'date', description: '퇴사일자' },
    G: { index: 6, name: '재직/퇴사', type: 'string', description: '재직 상태' },
    H: { index: 7, name: '총급여', type: 'number', description: '월 총급여액' },
    I: { index: 8, name: '기본급', type: 'number', description: '기본급' },
    J: { index: 9, name: '고정연장근로수당', type: 'number', description: '고정 연장근로 수당' },
    K: { index: 10, name: '고정휴일근로수당', type: 'number', description: '고정 휴일근로 수당' },
    L: { index: 11, name: '고정야간근로수당', type: 'number', description: '고정 야간근로 수당' },
    M: { index: 12, name: '기타수당', type: 'number', description: '기타 수당' },
    N: { index: 13, name: '직책수당', type: 'number', description: '직책 수당' },
    O: { index: 14, name: '차량유지비', type: 'number', description: '차량 유지비' },
    P: { index: 15, name: '연차수당', type: 'number', description: '연차 수당' },
    Q: { index: 16, name: '급여성비용', type: 'number', description: '급여성 비용' },
    R: { index: 17, name: '특별상여금근로수당', type: 'number', description: '특별상여금 근로수당' },
    S: { index: 18, name: '식대', type: 'number', description: '식대' },
    T: { index: 19, name: '시간당급여', type: 'number', description: '시간당 급여' },
    U: { index: 20, name: '통상임금', type: 'number', description: '통상임금' },
    V: { index: 21, name: '은행', type: 'string', description: '은행명' },
    W: { index: 22, name: '계좌번호', type: 'string', description: '계좌번호' },
    X: { index: 23, name: '핸드폰', type: 'string', description: '휴대폰 번호' }
  },

  // 월지급계산에서 사용하는 컬럼
  PAYROLL_CALC_COLUMNS: {
    MATCHING_KEY: 'D',  // 주민번호 - 앞 6자리 추출하여 매칭 키로 사용
    NAME: 'B',          // 이름 - 표시용
    STATUS: 'G',        // 재직/퇴사
    SALARY: 'H'         // 총급여
  },

  // 데이터 검증 규칙
  VALIDATION: {
    REQUIRED_COLUMNS: ['B', 'D', 'G', 'H'],
    NAME_COLUMN: 'B',
    ID_COLUMN: 'D',
    UNIQUE_KEY: 'D'  // 주민번호를 고유 키로 사용 (앞 6자리)
  }
};

/**
 * 컬럼 인덱스 조회 함수
 * @param {string} columnLetter - 컬럼 문자 (A-X)
 * @return {number} 컬럼 인덱스 (0-based)
 */
function getColumnIndex(columnLetter) {
  return PAYROLL_BASIC_INFO_SCHEMA.COLUMNS[columnLetter]?.index;
}

/**
 * 컬럼명 조회 함수
 * @param {string} columnLetter - 컬럼 문자 (A-X)
 * @return {string} 컬럼명
 */
function getColumnName(columnLetter) {
  return PAYROLL_BASIC_INFO_SCHEMA.COLUMNS[columnLetter]?.name;
}

/**
 * 주민번호 앞 6자리 추출 함수
 * @param {string} residentId - 주민번호 (13자리 또는 하이픈 포함)
 * @return {string} 앞 6자리 (YYMMDD)
 */
function extractResidentIdKey(residentId) {
  if (!residentId) return '';
  const cleaned = String(residentId).replace(/[-\s]/g, '');
  return cleaned.substring(0, 6);
}

/**
 * 스키마 검증 함수
 * @param {Array<Array>} data - 급여기본정보 데이터 (2차원 배열)
 * @return {Object} 검증 결과 { valid: boolean, errors: string[] }
 */
function validatePayrollBasicInfoData(data) {
  const requiredCols = PAYROLL_BASIC_INFO_SCHEMA.VALIDATION.REQUIRED_COLUMNS;
  const errors = [];

  data.forEach((row, index) => {
    requiredCols.forEach(col => {
      const colIndex = getColumnIndex(col);
      if (!row[colIndex] || row[colIndex] === '') {
        errors.push(`행 ${index + 2}: ${getColumnName(col)} 필수 값 누락`);
      }
    });

    // 주민번호 형식 검증
    const idCol = getColumnIndex('D');
    const residentId = String(row[idCol]).replace(/[-\s]/g, '');
    if (residentId.length < 6) {
      errors.push(`행 ${index + 2}: 주민번호가 6자리 미만입니다 (${residentId})`);
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * D열(주민번호) 데이터 검증
 * 월지급계산 전에 주민번호 데이터가 올바른지 확인
 * @param {Sheet} sheet - 급여기본정보 시트
 * @param {number} startRow - 시작 행
 * @param {number} lastRow - 마지막 행
 * @return {Object} 검증 결과 { valid: boolean, errors: string[] }
 */
function validateResidentIdColumn(sheet, startRow, lastRow) {
  const idData = sheet.getRange(startRow, 4, lastRow - startRow + 1, 1).getValues();
  const errors = [];

  idData.forEach((row, index) => {
    const residentId = String(row[0]).replace(/[-\s]/g, '').trim();
    if (!residentId || residentId === '') {
      errors.push(`행 ${startRow + index}: 주민번호(D열) 값이 비어있습니다.`);
    } else if (residentId.length < 6) {
      errors.push(`행 ${startRow + index}: 주민번호가 6자리 미만입니다 (${residentId})`);
    }
  });

  return { valid: errors.length === 0, errors };
}
