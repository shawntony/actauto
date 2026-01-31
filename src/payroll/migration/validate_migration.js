/**
 * 급여기본정보 → 급여데이터 마이그레이션 검증 스크립트
 *
 * 목적: 마이그레이션 후 데이터 무결성 검증
 *
 * 검증 항목:
 * - 주민번호 매칭 확인
 * - 주요 필드 일치 확인
 * - 메모 저장 확인
 * - 누락 데이터 확인
 *
 * 작성일: 2026-01-30
 */

/**
 * 마이그레이션 검증 실행
 * @returns {Object} 검증 결과 통계
 */
function validateMigration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const basicSheet = ss.getSheetByName('급여기본정보');
  const payrollSheet = ss.getSheetByName('급여데이터');

  if (!basicSheet || !payrollSheet) {
    throw new Error('필요한 시트를 찾을 수 없습니다.');
  }

  Logger.log('=== 마이그레이션 검증 시작 ===');

  // 데이터 읽기
  const basicLastRow = basicSheet.getLastRow();
  const payrollLastRow = payrollSheet.getLastRow();

  if (basicLastRow < 2) {
    throw new Error('급여기본정보에 데이터가 없습니다.');
  }

  const basicData = basicSheet.getRange(2, 1, basicLastRow - 1, 24).getValues();
  const payrollData = payrollLastRow >= 2
    ? payrollSheet.getRange(2, 1, payrollLastRow - 1, 34).getValues()
    : [];

  Logger.log(`급여기본정보: ${basicData.length}건`);
  Logger.log(`급여데이터: ${payrollData.length}건`);

  // 급여데이터 인덱스 구축
  const payrollIndex = {};
  payrollData.forEach((row, i) => {
    const residentId = String(row[2]).trim(); // C열
    if (residentId) {
      payrollIndex[residentId] = {
        rowNum: i + 2,
        data: row
      };
    }
  });

  // 검증 실행
  let matched = 0;
  let mismatched = 0;
  let missing = 0;
  const errors = [];
  const warnings = [];

  basicData.forEach((basic, i) => {
    const rowNum = i + 2;
    const name = basic[1]; // B열
    const residentId = String(basic[3]).trim(); // D열

    if (!residentId) {
      warnings.push(`행 ${rowNum} (${name}): 주민번호 없음`);
      missing++;
      return;
    }

    const payroll = payrollIndex[residentId];
    if (!payroll) {
      errors.push(`행 ${rowNum} (${name}): 급여데이터에 없음`);
      missing++;
      return;
    }

    // 주요 필드 검증
    const checks = [
      { field: '이름', basic: basic[1], payroll: payroll.data[1], col: 'B' },
      { field: '입사일', basic: formatDate(basic[4]), payroll: formatDate(payroll.data[5]), col: 'E→F' },
      { field: '퇴사일', basic: formatDate(basic[5]), payroll: formatDate(payroll.data[6]), col: 'F→G' },
      { field: '시급', basic: parseNumber(basic[19]), payroll: parseNumber(payroll.data[7]), col: 'T→H' },
      { field: '기본급', basic: parseNumber(basic[8]), payroll: parseNumber(payroll.data[9]), col: 'I→J' },
      { field: '직책수당', basic: parseNumber(basic[13]), payroll: parseNumber(payroll.data[10]), col: 'N→K' },
      { field: '식대수당', basic: parseNumber(basic[18]), payroll: parseNumber(payroll.data[11]), col: 'S→L' },
      { field: '연장근로수당', basic: parseNumber(basic[9]), payroll: parseNumber(payroll.data[12]), col: 'J→M' },
      { field: '연차수당', basic: parseNumber(basic[15]), payroll: parseNumber(payroll.data[13]), col: 'P→N' },
      { field: '야간수당', basic: parseNumber(basic[11]), payroll: parseNumber(payroll.data[14]), col: 'L→O' },
      { field: '공휴일특근', basic: parseNumber(basic[10]), payroll: parseNumber(payroll.data[15]), col: 'K→P' },
      { field: '기타수당', basic: parseNumber(basic[12]), payroll: parseNumber(payroll.data[16]), col: 'M→Q' },
      { field: '통상임금', basic: parseNumber(basic[20]), payroll: parseNumber(payroll.data[30]), col: 'U→AE' },
      { field: '은행', basic: String(basic[21]).trim(), payroll: String(payroll.data[31]).trim(), col: 'V→AF' },
      { field: '계좌번호', basic: String(basic[22]).trim(), payroll: String(payroll.data[32]).trim(), col: 'W→AG' }
    ];

    let rowOk = true;
    checks.forEach(c => {
      if (c.basic !== c.payroll) {
        // 빈 값과 0의 경우 허용
        const bothEmpty = (!c.basic || c.basic === 0 || c.basic === '') &&
                         (!c.payroll || c.payroll === 0 || c.payroll === '');
        if (!bothEmpty) {
          errors.push(`행 ${rowNum} (${name}): ${c.field} 불일치 [${c.col}] - "${c.basic}" ≠ "${c.payroll}"`);
          rowOk = false;
        }
      }
    });

    // 메모 저장 확인
    const unmappableFields = [];
    if (basic[0]) unmappableFields.push('ID');
    if (basic[2]) unmappableFields.push('직위');
    if (basic[14] && basic[14] !== 0) unmappableFields.push('차량유지비');
    if (basic[16] && basic[16] !== 0) unmappableFields.push('급여성비용');
    if (basic[17] && basic[17] !== 0) unmappableFields.push('특별상여금');
    if (basic[23]) unmappableFields.push('핸드폰');

    if (unmappableFields.length > 0) {
      const memo = String(payroll.data[29] || '');
      if (!memo.includes('[급여기본정보]')) {
        warnings.push(`행 ${rowNum} (${name}): 메모 누락 (${unmappableFields.join(', ')})`);
      }
    }

    rowOk ? matched++ : mismatched++;
  });

  // 결과 집계
  const result = {
    total: basicData.length,
    matched: matched,
    mismatched: mismatched,
    missing: missing,
    errors: errors,
    warnings: warnings,
    successRate: ((matched / basicData.length) * 100).toFixed(2)
  };

  Logger.log('=== 검증 결과 ===');
  Logger.log(`총 건수: ${result.total}`);
  Logger.log(`✅ 일치: ${result.matched}건 (${result.successRate}%)`);
  Logger.log(`⚠️ 불일치: ${result.mismatched}건`);
  Logger.log(`❌ 누락: ${result.missing}건`);
  Logger.log('');

  if (errors.length > 0) {
    Logger.log('=== 오류 목록 ===');
    errors.slice(0, 20).forEach(err => Logger.log(err));
    if (errors.length > 20) {
      Logger.log(`...외 ${errors.length - 20}건`);
    }
    Logger.log('');
  }

  if (warnings.length > 0) {
    Logger.log('=== 경고 목록 ===');
    warnings.slice(0, 20).forEach(warn => Logger.log(warn));
    if (warnings.length > 20) {
      Logger.log(`...외 ${warnings.length - 20}건`);
    }
    Logger.log('');
  }

  // UI 알림
  const ui = SpreadsheetApp.getUi();
  const status = result.mismatched === 0 && result.missing === 0 ? '✅ 성공' : '⚠️ 확인 필요';

  const message = `
검증 ${status}

총 건수: ${result.total}
✅ 일치: ${result.matched}건 (${result.successRate}%)
⚠️ 불일치: ${result.mismatched}건
❌ 누락: ${result.missing}건

${errors.length > 0 ? '\n오류 예시:\n' + errors.slice(0, 3).join('\n') : ''}
${errors.length > 3 ? `\n...외 ${errors.length - 3}건` : ''}

${warnings.length > 0 ? '\n경고 예시:\n' + warnings.slice(0, 3).join('\n') : ''}
${warnings.length > 3 ? `\n...외 ${warnings.length - 3}건` : ''}

상세 로그를 확인하세요.
  `.trim();

  ui.alert('검증 완료', message, ui.ButtonSet.OK);

  return result;
}

/**
 * 날짜 포맷 통일
 * @param {*} value - 날짜 값
 * @returns {string} 포맷된 날짜 문자열
 */
function formatDate(value) {
  if (!value) return '';
  if (value instanceof Date) {
    return Utilities.formatDate(value, 'Asia/Seoul', 'yyyy-MM-dd');
  }
  return String(value).trim();
}

/**
 * 숫자 파싱
 * @param {*} value - 숫자 값
 * @returns {number} 파싱된 숫자
 */
function parseNumber(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const num = parseFloat(String(value).replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * 특정 필드만 검증
 * @param {string} fieldName - 필드 이름
 */
function validateSpecificField(fieldName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const basicSheet = ss.getSheetByName('급여기본정보');
  const payrollSheet = ss.getSheetByName('급여데이터');

  const fieldMap = {
    '이름': { basic: 1, payroll: 1 },
    '기본급': { basic: 8, payroll: 9 },
    '시급': { basic: 19, payroll: 7 },
    '은행': { basic: 21, payroll: 31 },
    '계좌번호': { basic: 22, payroll: 32 }
  };

  const field = fieldMap[fieldName];
  if (!field) {
    throw new Error(`알 수 없는 필드: ${fieldName}`);
  }

  const basicData = basicSheet.getRange(2, 1, basicSheet.getLastRow() - 1, 24).getValues();
  const payrollData = payrollSheet.getRange(2, 1, payrollSheet.getLastRow() - 1, 34).getValues();

  const payrollIndex = {};
  payrollData.forEach(row => {
    const residentId = String(row[2]).trim();
    if (residentId) payrollIndex[residentId] = row;
  });

  let matched = 0;
  let mismatched = 0;
  const errors = [];

  basicData.forEach((basic, i) => {
    const residentId = String(basic[3]).trim();
    const payroll = payrollIndex[residentId];

    if (!payroll) return;

    const basicVal = String(basic[field.basic]).trim();
    const payrollVal = String(payroll[field.payroll]).trim();

    if (basicVal !== payrollVal) {
      mismatched++;
      errors.push(`행 ${i + 2} (${basic[1]}): "${basicVal}" ≠ "${payrollVal}"`);
    } else {
      matched++;
    }
  });

  Logger.log(`=== ${fieldName} 필드 검증 ===`);
  Logger.log(`✅ 일치: ${matched}건`);
  Logger.log(`❌ 불일치: ${mismatched}건`);

  if (errors.length > 0) {
    Logger.log('불일치 목록:');
    errors.forEach(err => Logger.log(err));
  }

  return { fieldName, matched, mismatched, errors };
}
