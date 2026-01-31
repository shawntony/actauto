/**
 * 급여기본정보 → 급여데이터 마이그레이션 스크립트
 *
 * 목적: 급여기본정보 시트의 모든 데이터를 급여데이터 시트로 통합
 *
 * 매핑 전략:
 * - 직접 매핑: 16개 컬럼 (이름, 주민번호, 입사일, 기본급 등)
 * - 계산 매핑: 2개 컬럼 (재직/퇴사, 총급여)
 * - 메모 저장: 6개 컬럼 (ID, 직위, 차량유지비 등)
 *
 * 작성일: 2026-01-30
 */

/**
 * 주민번호에서 키 추출 (앞 6자리)
 * @param {string} residentId - 주민등록번호
 * @returns {string} 주민번호 키
 */
function extractResidentIdKey(residentId) {
  const cleaned = String(residentId).replace(/[^0-9]/g, '');
  return cleaned.substring(0, 6);
}

/**
 * 급여기본정보 → 급여데이터 마이그레이션 실행
 * @returns {Object} 마이그레이션 결과 통계
 */
function migratePayrollBasicInfoToPayrollData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const basicInfoSheet = ss.getSheetByName('급여기본정보');
  const payrollDataSheet = ss.getSheetByName('급여데이터');

  if (!basicInfoSheet) {
    throw new Error('급여기본정보 시트를 찾을 수 없습니다.');
  }

  if (!payrollDataSheet) {
    throw new Error('급여데이터 시트를 찾을 수 없습니다.');
  }

  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '마이그레이션 확인',
    '급여기본정보 → 급여데이터 마이그레이션을 시작하시겠습니까?\n\n' +
    '백업이 완료되었는지 확인하세요.',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    Logger.log('마이그레이션 취소됨');
    return null;
  }

  Logger.log('=== 마이그레이션 시작 ===');

  // 1. 급여기본정보 데이터 읽기
  const basicLastRow = basicInfoSheet.getLastRow();
  if (basicLastRow < 2) {
    throw new Error('급여기본정보에 데이터가 없습니다.');
  }

  const basicInfoData = basicInfoSheet.getRange(2, 1, basicLastRow - 1, 24).getValues();
  Logger.log(`급여기본정보 데이터: ${basicInfoData.length}건`);

  // 2. 급여데이터 인덱스 구축 (주민번호 기준)
  const payrollLastRow = payrollDataSheet.getLastRow();
  const payrollDataValues = payrollLastRow >= 2
    ? payrollDataSheet.getRange(2, 1, payrollLastRow - 1, 34).getValues()
    : [];

  const payrollIndex = {};
  payrollDataValues.forEach((row, i) => {
    const residentId = String(row[2]).trim(); // C열: 주민등록번호
    if (residentId) {
      payrollIndex[residentId] = {
        rowNum: i + 2,
        data: row
      };
    }
  });

  Logger.log(`급여데이터 인덱스: ${Object.keys(payrollIndex).length}건`);

  // 3. 마이그레이션 실행
  let updated = 0;
  let skipped = 0;
  let withUnmappable = 0;
  const updateRanges = [];
  const errors = [];

  basicInfoData.forEach((basicRow, index) => {
    const rowNum = index + 2;
    const name = basicRow[1]; // B열
    const residentId = String(basicRow[3]).trim(); // D열

    if (!residentId) {
      skipped++;
      errors.push(`행 ${rowNum} (${name}): 주민번호 없음`);
      return;
    }

    const payrollEntry = payrollIndex[residentId];
    if (!payrollEntry) {
      skipped++;
      errors.push(`행 ${rowNum} (${name}): 급여데이터에 없음`);
      return;
    }

    // 급여데이터 행 복사
    const payrollData = [...payrollEntry.data];

    // === 직접 매핑 (16개) ===
    payrollData[1] = basicRow[1];    // B: 근무자명
    payrollData[5] = basicRow[4];    // F: 계약시작일 (입사일)
    payrollData[6] = basicRow[5];    // G: 계약종료일 (퇴사일)
    payrollData[7] = basicRow[19];   // H: 시급 (시간당급여)
    payrollData[9] = basicRow[8];    // J: 기본급
    payrollData[10] = basicRow[13];  // K: 직책수당
    payrollData[11] = basicRow[18];  // L: 식대수당 (식대)
    payrollData[12] = basicRow[9];   // M: 연장근로수당 (고정연장)
    payrollData[13] = basicRow[15];  // N: 연차수당
    payrollData[14] = basicRow[11];  // O: 야간수당 (고정야간)
    payrollData[15] = basicRow[10];  // P: 공휴일특근수당 (고정휴일)
    payrollData[16] = basicRow[12];  // Q: 기타수당
    payrollData[30] = basicRow[20];  // AE: 통상임금
    payrollData[31] = basicRow[21];  // AF: 급여지급은행 (은행)
    payrollData[32] = basicRow[22];  // AG: 계좌번호
    payrollData[33] = basicRow[1];   // AH: 예금주 (근무자명)

    // === 계산 매핑 (2개) ===
    // G열(계약종료일)로 재직/퇴사 계산 - 급여데이터에서는 퇴사일 자체를 사용
    // R열(합계금액) - 급여데이터에서 자동 계산되므로 그대로 유지

    // === 매핑 불가능 데이터 메모 저장 (6개) ===
    const unmappable = {};
    if (basicRow[0]) unmappable.ID = basicRow[0];                     // A열
    if (basicRow[2]) unmappable.직위 = basicRow[2];                   // C열
    if (basicRow[14] && basicRow[14] !== 0) unmappable.차량유지비 = basicRow[14];  // O열
    if (basicRow[16] && basicRow[16] !== 0) unmappable.급여성비용 = basicRow[16];  // Q열
    if (basicRow[17] && basicRow[17] !== 0) unmappable.특별상여금 = basicRow[17];  // R열
    if (basicRow[23]) unmappable.핸드폰 = basicRow[23];               // X열

    if (Object.keys(unmappable).length > 0) {
      const existingMemo = payrollData[29] ? String(payrollData[29]).trim() : '';
      const memoPrefix = existingMemo ? existingMemo + '\n\n' : '';
      const newMemo = '[급여기본정보]\n' + JSON.stringify(unmappable, null, 2);
      payrollData[29] = memoPrefix + newMemo; // AD열: 메모
      withUnmappable++;
    }

    // 업데이트 배치에 추가
    updateRanges.push({
      rowNum: payrollEntry.rowNum,
      data: payrollData,
      name: name
    });
    updated++;
  });

  Logger.log(`처리 완료: 업데이트=${updated}, 스킵=${skipped}, 메모추가=${withUnmappable}`);

  // 4. 배치 업데이트 실행
  Logger.log('급여데이터 시트 업데이트 시작...');
  let batchCount = 0;

  updateRanges.forEach(({ rowNum, data, name }) => {
    try {
      payrollDataSheet.getRange(rowNum, 1, 1, 34).setValues([data]);
      batchCount++;

      if (batchCount % 10 === 0) {
        Logger.log(`  업데이트 진행: ${batchCount}/${updateRanges.length}`);
      }
    } catch (e) {
      errors.push(`행 업데이트 실패 (${name}): ${e.message}`);
      Logger.log(`ERROR: 행 ${rowNum} 업데이트 실패 - ${e.message}`);
    }
  });

  // 5. 결과 보고
  const result = {
    total: basicInfoData.length,
    updated: updated,
    skipped: skipped,
    withUnmappable: withUnmappable,
    errors: errors
  };

  Logger.log('=== 마이그레이션 결과 ===');
  Logger.log(JSON.stringify(result, null, 2));

  // UI 알림
  const message = `
마이그레이션 완료

✅ 업데이트: ${updated}건
⚠️ 스킵: ${skipped}건
📝 메모 추가: ${withUnmappable}건

${errors.length > 0 ? '\n오류:\n' + errors.slice(0, 5).join('\n') : ''}
${errors.length > 5 ? `\n...외 ${errors.length - 5}건` : ''}

상세 로그를 확인하세요.
  `.trim();

  ui.alert('마이그레이션 완료', message, ui.ButtonSet.OK);

  return result;
}

/**
 * 특정 주민번호의 마이그레이션 결과 확인
 * @param {string} residentId - 주민등록번호
 */
function checkMigrationResult(residentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const basicSheet = ss.getSheetByName('급여기본정보');
  const payrollSheet = ss.getSheetByName('급여데이터');

  // 급여기본정보에서 찾기
  const basicData = basicSheet.getDataRange().getValues();
  let basicRow = null;
  let basicRowNum = -1;

  for (let i = 1; i < basicData.length; i++) {
    if (String(basicData[i][3]).trim() === residentId) {
      basicRow = basicData[i];
      basicRowNum = i + 1;
      break;
    }
  }

  // 급여데이터에서 찾기
  const payrollData = payrollSheet.getDataRange().getValues();
  let payrollRow = null;
  let payrollRowNum = -1;

  for (let i = 1; i < payrollData.length; i++) {
    if (String(payrollData[i][2]).trim() === residentId) {
      payrollRow = payrollData[i];
      payrollRowNum = i + 1;
      break;
    }
  }

  // 비교 결과 출력
  if (!basicRow) {
    Logger.log(`급여기본정보에서 ${residentId}를 찾을 수 없습니다.`);
    return;
  }

  if (!payrollRow) {
    Logger.log(`급여데이터에서 ${residentId}를 찾을 수 없습니다.`);
    return;
  }

  Logger.log(`=== 마이그레이션 결과 확인: ${basicRow[1]} ===`);
  Logger.log(`급여기본정보 행: ${basicRowNum}`);
  Logger.log(`급여데이터 행: ${payrollRowNum}`);
  Logger.log('');

  const comparisons = [
    { field: '이름', basic: basicRow[1], payroll: payrollRow[1] },
    { field: '입사일', basic: basicRow[4], payroll: payrollRow[5] },
    { field: '퇴사일', basic: basicRow[5], payroll: payrollRow[6] },
    { field: '시급', basic: basicRow[19], payroll: payrollRow[7] },
    { field: '기본급', basic: basicRow[8], payroll: payrollRow[9] },
    { field: '직책수당', basic: basicRow[13], payroll: payrollRow[10] },
    { field: '은행', basic: basicRow[21], payroll: payrollRow[31] },
    { field: '계좌번호', basic: basicRow[22], payroll: payrollRow[32] }
  ];

  comparisons.forEach(c => {
    const match = String(c.basic).trim() === String(c.payroll).trim();
    const icon = match ? '✅' : '❌';
    Logger.log(`${icon} ${c.field}: ${c.basic} → ${c.payroll}`);
  });

  Logger.log('');
  Logger.log('메모(AD열):', payrollRow[29] || '(없음)');
}
