/**
 * 보험 시트 공통 스키마 정의
 *
 * 각 보험 시트의 구조와 매칭 컬럼 정의
 * 매칭 키: A열(월) + 주민번호 앞 6자리
 */
const INSURANCE_SHEET_SCHEMAS = {
  국민연금: {
    SHEET_NAME: '국민연금',
    MATCHING_COLUMNS: {
      MONTH: 'A',           // 월 (필터 조건)
      RESIDENT_ID: 'D',     // 주민번호 ✓ (확인됨)
      RESIDENT_ID_KEY: 'D', // 주민번호 앞 6자리 추출용
      NAME: 'E'             // 가입자명 (E열)
    },
    DATA_COLUMNS: {
      PENSION_AMOUNT: 'I'   // 국민연금액
    },
    DESCRIPTION: '국민연금 시트 - D열(주민번호) + E열(가입자명)으로 매칭, I열(국민연금액) 추출'
  },

  건강보험: {
    SHEET_NAME: '건강보험',
    MATCHING_COLUMNS: {
      MONTH: 'A',           // 월 (필터 조건)
      RESIDENT_ID: 'D',     // 주민번호 ✓ (확인됨)
      RESIDENT_ID_KEY: 'D', // 주민번호 앞 6자리 추출용
      NAME: 'E'             // 성명 (E열)
    },
    DATA_COLUMNS: {
      HEALTH_INSURANCE: 'O',   // 건강보험료 (15번째 컬럼)
      LONG_TERM_CARE: 'AB'     // 장기요양보험료 (28번째 컬럼)
    },
    DESCRIPTION: '건강보험 시트 - D열(주민번호) + E열(성명)으로 매칭, O열(건강보험료), AB열(장기요양보험료) 추출'
  },

  고용보험: {
    SHEET_NAME: '고용보험',
    MATCHING_COLUMNS: {
      MONTH: 'A',           // 월 (필터 조건)
      RESIDENT_ID: 'E',     // 주민번호 ✓ (확인됨 - 고용보험만 E열)
      RESIDENT_ID_KEY: 'E', // 주민번호 앞 6자리 추출용
      NAME: 'D'             // 근로자명 (참고용, D열)
    },
    DATA_COLUMNS: {
      EMPLOYEE_INSURANCE: 'X',  // 직원고용보험료 (24번째 컬럼)
      EMPLOYER_INSURANCE: 'Z'   // 사업주고안직능보험료 (26번째 컬럼)
    },
    DESCRIPTION: '고용보험 시트 - E열(주민번호)로 매칭, X열(직원고용보험료), Z열(사업주고안직능보험료) 추출'
  },

  산재보험: {
    SHEET_NAME: '산재보험',
    MATCHING_COLUMNS: {
      MONTH: 'A',           // 월 (필터 조건)
      RESIDENT_ID: 'D',     // 주민번호 (건강보험과 동일 추정)
      RESIDENT_ID_KEY: 'D', // 주민번호 앞 6자리 추출용
      NAME: 'E'             // 근로자명 (E열)
    },
    DATA_COLUMNS: {
      INDUSTRIAL_ACCIDENT: 'O'  // 산재보험료 (15번째 컬럼)
    },
    DESCRIPTION: '산재보험 시트 - D열(주민번호) + E열(근로자명)으로 매칭, O열(산재보험료) 추출'
  }
};

/**
 * 보험 시트 이름으로 스키마 조회
 * @param {string} sheetName - 시트 이름
 * @return {Object} 보험 시트 스키마
 */
function getInsuranceSchema(sheetName) {
  return INSURANCE_SHEET_SCHEMAS[sheetName];
}

/**
 * 보험 시트의 주민번호 컬럼 위치 조회
 * @param {string} sheetName - 시트 이름
 * @return {string} 주민번호 컬럼 문자 (D 또는 E)
 */
function getResidentIdColumn(sheetName) {
  const schema = getInsuranceSchema(sheetName);
  return schema?.MATCHING_COLUMNS?.RESIDENT_ID;
}

/**
 * 보험 시트의 월 컬럼 위치 조회
 * @param {string} sheetName - 시트 이름
 * @return {string} 월 컬럼 문자 (A)
 */
function getMonthColumn(sheetName) {
  const schema = getInsuranceSchema(sheetName);
  return schema?.MATCHING_COLUMNS?.MONTH;
}

/**
 * 보험 시트의 데이터 컬럼 조회
 * @param {string} sheetName - 시트 이름
 * @return {Object} 데이터 컬럼 정의
 */
function getDataColumns(sheetName) {
  const schema = getInsuranceSchema(sheetName);
  return schema?.DATA_COLUMNS;
}

/**
 * 컬럼 문자를 인덱스로 변환
 * @param {string} columnLetter - 컬럼 문자 (A, B, C, ..., Z, AA, AB, ...)
 * @return {number} 0-based 컬럼 인덱스
 */
function columnLetterToIndex(columnLetter) {
  let index = 0;
  for (let i = 0; i < columnLetter.length; i++) {
    index = index * 26 + (columnLetter.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * 보험 시트 매칭용 복합 키 생성
 * @param {string} month - 월 (예: "2026-01-31")
 * @param {string} residentId - 주민번호
 * @return {string} 복합 키 (예: "2026-01-31|901225")
 */
function createInsuranceMatchingKey(month, residentId) {
  if (!month || !residentId) return '';

  const monthValue = String(month).trim();
  const cleaned = String(residentId).replace(/[-\s]/g, '');
  const idKey = cleaned.substring(0, 6);

  return monthValue + '|' + idKey;
}

/**
 * 보험 시트 데이터 검증
 * @param {string} sheetName - 시트 이름
 * @param {Array<Array>} data - 보험 시트 데이터
 * @return {Object} 검증 결과 { valid: boolean, errors: string[] }
 */
function validateInsuranceData(sheetName, data) {
  const schema = getInsuranceSchema(sheetName);
  if (!schema) {
    return { valid: false, errors: [`알 수 없는 보험 시트: ${sheetName}`] };
  }

  const errors = [];
  const monthColIndex = 0; // A열
  const residentIdColLetter = schema.MATCHING_COLUMNS.RESIDENT_ID;
  const residentIdColIndex = columnLetterToIndex(residentIdColLetter);

  data.forEach((row, index) => {
    // 월 값 검증
    if (!row[monthColIndex] || String(row[monthColIndex]).trim() === '') {
      errors.push(`${sheetName} 행 ${index + 2}: 월(A열) 값이 비어있습니다.`);
    }

    // 주민번호 값 검증
    if (!row[residentIdColIndex]) {
      errors.push(`${sheetName} 행 ${index + 2}: 주민번호(${residentIdColLetter}열) 값이 비어있습니다.`);
    } else {
      const residentId = String(row[residentIdColIndex]).replace(/[-\s]/g, '');
      if (residentId.length < 6) {
        errors.push(`${sheetName} 행 ${index + 2}: 주민번호가 6자리 미만입니다 (${residentId})`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
}
