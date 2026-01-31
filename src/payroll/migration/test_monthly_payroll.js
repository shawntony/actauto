/**
 * 월지급계산 처리 테스트 스크립트
 *
 * 목적: 마이그레이션 후 월지급계산 스크립트가 정상 작동하는지 검증
 *
 * 테스트 항목:
 * - 급여데이터 시트 읽기
 * - 월지급계산 시트 생성
 * - 데이터 매핑 정확성
 * - 계산 로직 정상 작동
 *
 * 작성일: 2026-01-30
 */

/**
 * 월지급계산 테스트 실행
 * @param {string} testMonth - 테스트할 월 (예: '2026-02')
 * @returns {Object} 테스트 결과
 */
function testMonthlyPayrollAfterMigration(testMonth = null) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // 테스트 월 설정 (기본값: 다음 달)
  if (!testMonth) {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    testMonth = Utilities.formatDate(nextMonth, 'Asia/Seoul', 'yyyy-MM');
  }

  Logger.log(`=== 월지급계산 테스트: ${testMonth} ===`);

  // 1. 사전 검증: 필요한 시트 확인
  const requiredSheets = [
    '급여데이터',
    '월지급계산',
    '국민연금',
    '건강보험',
    '고용보험',
    '근태데이터'
  ];

  const missingSheets = [];
  requiredSheets.forEach(sheetName => {
    if (!ss.getSheetByName(sheetName)) {
      missingSheets.push(sheetName);
    }
  });

  if (missingSheets.length > 0) {
    const error = `필요한 시트가 없습니다: ${missingSheets.join(', ')}`;
    Logger.log(`ERROR: ${error}`);
    ui.alert('테스트 실패', error, ui.ButtonSet.OK);
    return { success: false, error };
  }

  // 2. 급여데이터 시트 데이터 확인
  const payrollDataSheet = ss.getSheetByName('급여데이터');
  const pdLastRow = payrollDataSheet.getLastRow();

  if (pdLastRow < 2) {
    const error = '급여데이터 시트에 데이터가 없습니다.';
    Logger.log(`ERROR: ${error}`);
    ui.alert('테스트 실패', error, ui.ButtonSet.OK);
    return { success: false, error };
  }

  const pdDataCount = pdLastRow - 1;
  Logger.log(`급여데이터: ${pdDataCount}건`);

  // 3. 월지급계산 백업 (테스트 전)
  const pcSheet = ss.getSheetByName('월지급계산');
  const pcBackupName = `월지급계산_테스트백업_${Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd_HHmmss')}`;
  const pcBackup = pcSheet.copyTo(ss);
  pcBackup.setName(pcBackupName);
  pcBackup.hideSheet();
  Logger.log(`월지급계산 백업 생성: ${pcBackupName}`);

  // 4. 월지급계산 실행
  let executionResult = null;
  let executionError = null;

  try {
    Logger.log('월지급계산 실행 중...');

    // matchAllPayrollData_V6 함수 호출
    // 주의: 실제 함수 이름 확인 필요
    if (typeof matchAllPayrollData_V6 === 'function') {
      executionResult = matchAllPayrollData_V6(testMonth);
    } else {
      throw new Error('matchAllPayrollData_V6 함수를 찾을 수 없습니다.');
    }

    Logger.log('월지급계산 실행 완료');
  } catch (e) {
    executionError = e.message;
    Logger.log(`ERROR: 월지급계산 실행 실패 - ${executionError}`);
  }

  // 5. 결과 검증
  if (executionError) {
    ui.alert(
      '테스트 실패',
      `월지급계산 실행 중 오류 발생:\n\n${executionError}\n\n백업 시트를 확인하세요: ${pcBackupName}`,
      ui.ButtonSet.OK
    );

    return {
      success: false,
      error: executionError,
      backupSheet: pcBackupName
    };
  }

  // 6. 결과 데이터 확인
  const pcDataAfter = pcSheet.getRange(2, 1, pcSheet.getLastRow() - 1, 15).getValues();
  const processedCount = pcDataAfter.length;

  Logger.log(`월지급계산 결과: ${processedCount}건 처리`);

  // 7. 샘플 데이터 검증
  const samples = [];
  const sampleSize = Math.min(3, processedCount);

  for (let i = 0; i < sampleSize; i++) {
    const row = pcDataAfter[i];
    samples.push({
      이름: row[1],
      재직상태: row[2],
      총급여: row[3],
      실지급액: row[14]
    });
  }

  Logger.log('샘플 데이터:');
  samples.forEach((s, i) => {
    Logger.log(`  ${i + 1}. ${s.이름} (${s.재직상태}) - 총급여: ${s.총급여}, 실지급: ${s.실지급액}`);
  });

  // 8. 데이터 품질 검증
  let validCount = 0;
  let invalidCount = 0;
  const issues = [];

  pcDataAfter.forEach((row, i) => {
    const rowNum = i + 2;
    const name = row[1];
    const salary = row[3];
    const netPay = row[14];

    // 기본 검증
    if (!name || name === '') {
      issues.push(`행 ${rowNum}: 이름 없음`);
      invalidCount++;
      return;
    }

    if (!salary || salary === 0) {
      issues.push(`행 ${rowNum} (${name}): 총급여 없음`);
      invalidCount++;
      return;
    }

    validCount++;
  });

  Logger.log(`데이터 품질: 유효=${validCount}, 무효=${invalidCount}`);

  if (issues.length > 0) {
    Logger.log('데이터 품질 이슈:');
    issues.slice(0, 10).forEach(issue => Logger.log(`  - ${issue}`));
    if (issues.length > 10) {
      Logger.log(`  ...외 ${issues.length - 10}건`);
    }
  }

  // 9. 결과 보고
  const result = {
    success: true,
    testMonth: testMonth,
    payrollDataCount: pdDataCount,
    processedCount: processedCount,
    validCount: validCount,
    invalidCount: invalidCount,
    samples: samples,
    issues: issues,
    backupSheet: pcBackupName
  };

  const successRate = ((validCount / processedCount) * 100).toFixed(2);

  const message = `
테스트 ${invalidCount === 0 ? '✅ 성공' : '⚠️ 경고'}

테스트 월: ${testMonth}
급여데이터: ${pdDataCount}건
처리 건수: ${processedCount}건
유효 데이터: ${validCount}건 (${successRate}%)
무효 데이터: ${invalidCount}건

${samples.length > 0 ? '\n샘플:\n' + samples.map((s, i) =>
  `${i + 1}. ${s.이름} (${s.재직상태}) - ${s.실지급액}원`
).join('\n') : ''}

${issues.length > 0 ? '\n이슈:\n' + issues.slice(0, 3).join('\n') : ''}
${issues.length > 3 ? `\n...외 ${issues.length - 3}건` : ''}

백업: ${pcBackupName}
상세 로그를 확인하세요.
  `.trim();

  ui.alert('테스트 완료', message, ui.ButtonSet.OK);

  return result;
}

/**
 * 간단한 테스트 (현재 월 기준)
 */
function quickTestMonthlyPayroll() {
  const today = new Date();
  const currentMonth = Utilities.formatDate(today, 'Asia/Seoul', 'yyyy-MM');
  return testMonthlyPayrollAfterMigration(currentMonth);
}

/**
 * 테스트 결과 롤백
 * @param {string} backupSheetName - 백업 시트 이름
 */
function rollbackTestResult(backupSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const backupSheet = ss.getSheetByName(backupSheetName);
  if (!backupSheet) {
    ui.alert('오류', `백업 시트를 찾을 수 없습니다: ${backupSheetName}`, ui.ButtonSet.OK);
    return;
  }

  const response = ui.alert(
    '롤백 확인',
    `테스트 결과를 롤백하고 ${backupSheetName}로 복원하시겠습니까?`,
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    Logger.log('롤백 취소됨');
    return;
  }

  // 현재 월지급계산 시트 삭제
  const pcSheet = ss.getSheetByName('월지급계산');
  if (pcSheet) {
    ss.deleteSheet(pcSheet);
  }

  // 백업 복원
  const restoredSheet = backupSheet.copyTo(ss);
  restoredSheet.setName('월지급계산');
  restoredSheet.showSheet();

  Logger.log(`롤백 완료: ${backupSheetName} → 월지급계산`);

  ui.alert('롤백 완료', '테스트 결과가 롤백되었습니다.', ui.ButtonSet.OK);
}

/**
 * 급여데이터 기반 월지급계산 데이터 검증
 * @param {string} month - 검증할 월
 */
function validatePayrollDataIntegration(month) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pdSheet = ss.getSheetByName('급여데이터');
  const pcSheet = ss.getSheetByName('월지급계산');

  Logger.log(`=== 급여데이터 통합 검증: ${month} ===`);

  // 급여데이터에서 주민번호와 이름 읽기
  const pdData = pdSheet.getRange(2, 1, pdSheet.getLastRow() - 1, 34).getValues();
  const pdIndex = {};

  pdData.forEach(row => {
    const name = row[1]; // B열
    const residentId = String(row[2]).trim(); // C열
    if (residentId) {
      const idKey = residentId.substring(0, 6);
      pdIndex[idKey] = {
        name: name,
        residentId: residentId,
        salary: row[17] // R열: 합계금액
      };
    }
  });

  // 월지급계산에서 데이터 읽기
  const pcData = pcSheet.getRange(2, 1, pcSheet.getLastRow() - 1, 15).getValues();

  let matched = 0;
  let mismatched = 0;
  const issues = [];

  pcData.forEach((row, i) => {
    const rowNum = i + 2;
    const pcMonth = row[0];

    // 해당 월만 검증
    if (pcMonth !== month) return;

    const pcName = row[1];
    const pcSalary = row[3];

    // 급여데이터에서 찾기 (이름으로 검색)
    let found = false;
    Object.keys(pdIndex).forEach(idKey => {
      if (pdIndex[idKey].name === pcName) {
        found = true;
        // 급여 비교 (허용 오차: 1원)
        if (Math.abs(pdIndex[idKey].salary - pcSalary) <= 1) {
          matched++;
        } else {
          mismatched++;
          issues.push(
            `행 ${rowNum} (${pcName}): 급여 불일치 - ` +
            `급여데이터=${pdIndex[idKey].salary}, 월지급계산=${pcSalary}`
          );
        }
      }
    });

    if (!found) {
      issues.push(`행 ${rowNum} (${pcName}): 급여데이터에서 찾을 수 없음`);
      mismatched++;
    }
  });

  Logger.log(`검증 결과: 일치=${matched}, 불일치=${mismatched}`);

  if (issues.length > 0) {
    Logger.log('이슈 목록:');
    issues.forEach(issue => Logger.log(`  - ${issue}`));
  }

  return { matched, mismatched, issues };
}
