/**
 * 월지급계산/월지급DB 스키마 검증 테스트
 *
 * 실행 방법: Google Apps Script 에디터에서 실행
 */

/**
 * 스키마 기본 검증 테스트
 */
function testSchemas() {
  Logger.log('=== 월지급계산/월지급DB 스키마 검증 시작 ===\n');

  // 1. 월지급계산 스키마 검증
  testMonthlyPayrollCalcSchema();

  // 2. 월지급DB 스키마 검증
  testMonthlyPayrollDBSchema();

  // 3. 보험 스키마 검증
  testInsuranceSchemas();

  Logger.log('\n=== 스키마 검증 완료 ===');
}

/**
 * 월지급계산 스키마 검증
 */
function testMonthlyPayrollCalcSchema() {
  Logger.log('--- 월지급계산 스키마 검증 ---');

  // 컬럼 개수 확인
  const columnCount = Object.keys(MONTHLY_PAYROLL_CALC_SCHEMA.COLUMNS).length;
  Logger.log('✓ 총 컬럼 개수: ' + columnCount + ' (예상: 15)');

  // 인덱스 조회 테스트
  const dIndex = MONTHLY_PAYROLL_CALC_SCHEMA.getColumnIndex('D');
  Logger.log('✓ D열 인덱스: ' + dIndex + ' (예상: 3)');

  const oIndex = MONTHLY_PAYROLL_CALC_SCHEMA.getColumnIndex('O');
  Logger.log('✓ O열 인덱스: ' + oIndex + ' (예상: 14)');

  // 컬럼명 조회 테스트
  const dName = MONTHLY_PAYROLL_CALC_SCHEMA.getColumnName('D');
  Logger.log('✓ D열 이름: "' + dName + '" (예상: "총급여")');

  // 계산 테스트
  const testValues = {
    D: 5000000,  // 총급여
    E: 100000,   // 국민연금
    F: 50000,    // 건강보험
    G: 30000,    // 고용보험
    H: 10000,    // 장기요양
    K: 0,
    L: 0,
    M: 0,
    N: 0
  };
  const finalPayment = MONTHLY_PAYROLL_CALC_SCHEMA.calculateFinalPayment(testValues);
  const expected = 5000000 - 100000 - 50000 - 30000 - 10000;
  Logger.log('✓ 최종지급액 계산: ' + finalPayment + ' (예상: ' + expected + ')');

  if (finalPayment === expected) {
    Logger.log('✅ 월지급계산 스키마 검증 성공\n');
  } else {
    Logger.log('❌ 월지급계산 스키마 검증 실패: 계산 오류\n');
  }
}

/**
 * 월지급DB 스키마 검증
 */
function testMonthlyPayrollDBSchema() {
  Logger.log('--- 월지급DB 스키마 검증 ---');

  // 컬럼 개수 확인
  const columnCount = Object.keys(MONTHLY_PAYROLL_DB_SCHEMA.COLUMNS).length;
  Logger.log('✓ 추가 컬럼 개수: ' + columnCount + ' (예상: 4, P-S)');

  // 추가 계산 테스트
  const testValues = {
    E: 100000,  // 국민연금
    F: 50000,   // 건강보험
    G: 30000,   // 고용보험
    H: 10000,   // 장기요양
    I: 20000,   // 사업주고안직능
    J: 15000,   // 산재보험
    O: 4810000  // 최종지급액
  };

  const { P, Q, R, S } = MONTHLY_PAYROLL_DB_SCHEMA.calculateAdditionalColumns(testValues);

  const expectedP = 100000 + 50000 + 30000 + 10000;  // 190000
  const expectedQ = expectedP + 20000;               // 210000
  const expectedR = 15000;                           // 15000
  const expectedS = 4810000 + expectedP + expectedQ + expectedR; // 5225000

  Logger.log('✓ P (보험공제합계1): ' + P + ' (예상: ' + expectedP + ')');
  Logger.log('✓ Q (보험공제합계2): ' + Q + ' (예상: ' + expectedQ + ')');
  Logger.log('✓ R (기타공제): ' + R + ' (예상: ' + expectedR + ')');
  Logger.log('✓ S (최종실지급액): ' + S + ' (예상: ' + expectedS + ')');

  if (P === expectedP && Q === expectedQ && R === expectedR && S === expectedS) {
    Logger.log('✅ 월지급DB 스키마 검증 성공\n');
  } else {
    Logger.log('❌ 월지급DB 스키마 검증 실패: 계산 오류\n');
  }
}

/**
 * 보험 스키마 검증
 */
function testInsuranceSchemas() {
  Logger.log('--- 보험 스키마 검증 ---');

  const insuranceTypes = ['국민연금', '건강보험', '고용보험', '산재보험'];

  insuranceTypes.forEach(function(type) {
    const schema = INSURANCE_SHEET_SCHEMAS[type];
    if (schema) {
      Logger.log('✓ ' + type + ' 스키마: ');
      Logger.log('  - 월 컬럼: ' + schema.MATCHING_COLUMNS.MONTH);
      Logger.log('  - 주민번호 컬럼: ' + schema.MATCHING_COLUMNS.RESIDENT_ID);

      const dataColumns = Object.keys(schema.DATA_COLUMNS);
      Logger.log('  - 데이터 컬럼: ' + dataColumns.join(', '));
    } else {
      Logger.log('❌ ' + type + ' 스키마를 찾을 수 없습니다.');
    }
  });

  Logger.log('✅ 보험 스키마 검증 완료\n');
}

/**
 * columnLetterToIndex 함수 테스트
 */
function testColumnLetterToIndex() {
  Logger.log('--- columnLetterToIndex 테스트 ---');

  const testCases = [
    { letter: 'A', expected: 0 },
    { letter: 'D', expected: 3 },
    { letter: 'O', expected: 14 },
    { letter: 'Z', expected: 25 },
    { letter: 'AA', expected: 26 },
    { letter: 'AB', expected: 27 }
  ];

  testCases.forEach(function(test) {
    const result = columnLetterToIndex(test.letter);
    const status = result === test.expected ? '✓' : '❌';
    Logger.log(status + ' ' + test.letter + ' → ' + result + ' (예상: ' + test.expected + ')');
  });

  Logger.log('✅ columnLetterToIndex 테스트 완료\n');
}

/**
 * 전체 통합 테스트
 */
function runAllTests() {
  testSchemas();
  testColumnLetterToIndex();
}
