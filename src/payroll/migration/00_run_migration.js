/**
 * 급여기본정보 → 급여데이터 마이그레이션 마스터 스크립트
 *
 * 목적: 마이그레이션 전체 프로세스를 단계별로 실행하고 검증
 *
 * 실행 순서:
 * 1. 사전 준비 (백업, 분석)
 * 2. 데이터 마이그레이션
 * 3. 검증
 * 4. 월지급계산 테스트
 * 5. 완료 처리
 *
 * 작성일: 2026-01-30
 */

/**
 * 마이그레이션 전체 프로세스 실행
 * @returns {Object} 마이그레이션 결과
 */
function runFullMigration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  Logger.log('==================================================');
  Logger.log('급여기본정보 → 급여데이터 마이그레이션 시작');
  Logger.log('==================================================');

  // 환경 확인
  const spreadsheetId = ss.getId();
  Logger.log(`Spreadsheet ID: ${spreadsheetId}`);

  // haerimcnp 환경 확인 (선택사항 - 안전장치)
  const expectedId = '1soPCWXpeniBMXdZ7UGQiW_3qHlMdBd7ss7U3wcqrclA';
  if (spreadsheetId !== expectedId) {
    const response = ui.alert(
      '환경 확인',
      `이 스크립트는 haerimcnp 환경에서만 실행하도록 설계되었습니다.\n\n` +
      `현재 Spreadsheet ID: ${spreadsheetId}\n` +
      `예상 ID: ${expectedId}\n\n` +
      `계속 진행하시겠습니까?`,
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      Logger.log('마이그레이션 취소됨 (환경 불일치)');
      return null;
    }
  }

  const result = {
    steps: [],
    success: false,
    errors: []
  };

  try {
    // ===== STEP 1: 백업 =====
    Logger.log('\n[1/5] 백업 생성 중...');
    ui.alert('1/5 단계', '급여기본정보 시트를 백업합니다.', ui.ButtonSet.OK);

    let backupName;
    try {
      backupName = backupPayrollBasicInfo();
      result.steps.push({ step: 1, name: '백업', status: 'success', data: backupName });
      Logger.log(`✅ 백업 완료: ${backupName}`);
    } catch (e) {
      result.steps.push({ step: 1, name: '백업', status: 'failed', error: e.message });
      result.errors.push(`백업 실패: ${e.message}`);
      throw new Error(`백업 실패: ${e.message}`);
    }

    // ===== STEP 2: 매핑 불가능 데이터 분석 =====
    Logger.log('\n[2/5] 매핑 불가능 데이터 분석 중...');
    ui.alert('2/5 단계', '매핑 불가능한 데이터를 분석합니다.', ui.ButtonSet.OK);

    let unmappableStats;
    try {
      unmappableStats = analyzeUnmappableColumns();
      result.steps.push({ step: 2, name: '데이터 분석', status: 'success', data: unmappableStats });
      Logger.log('✅ 데이터 분석 완료');
    } catch (e) {
      result.steps.push({ step: 2, name: '데이터 분석', status: 'failed', error: e.message });
      result.errors.push(`데이터 분석 실패: ${e.message}`);
      // 분석 실패는 치명적이지 않으므로 계속 진행
      Logger.log(`⚠️ 데이터 분석 실패 (계속 진행): ${e.message}`);
    }

    // ===== STEP 3: 마이그레이션 실행 =====
    Logger.log('\n[3/5] 마이그레이션 실행 중...');
    ui.alert('3/5 단계', '급여기본정보 데이터를 급여데이터로 마이그레이션합니다.', ui.ButtonSet.OK);

    let migrationResult;
    try {
      migrationResult = migratePayrollBasicInfoToPayrollData();
      result.steps.push({ step: 3, name: '마이그레이션', status: 'success', data: migrationResult });
      Logger.log(`✅ 마이그레이션 완료: ${migrationResult.updated}건 업데이트`);

      if (migrationResult.errors && migrationResult.errors.length > 0) {
        Logger.log(`⚠️ ${migrationResult.errors.length}건의 오류 발생`);
        result.errors.push(...migrationResult.errors);
      }
    } catch (e) {
      result.steps.push({ step: 3, name: '마이그레이션', status: 'failed', error: e.message });
      result.errors.push(`마이그레이션 실패: ${e.message}`);
      throw new Error(`마이그레이션 실패: ${e.message}`);
    }

    // ===== STEP 4: 검증 =====
    Logger.log('\n[4/5] 마이그레이션 검증 중...');
    ui.alert('4/5 단계', '마이그레이션 결과를 검증합니다.', ui.ButtonSet.OK);

    let validationResult;
    try {
      validationResult = validateMigration();
      result.steps.push({ step: 4, name: '검증', status: 'success', data: validationResult });
      Logger.log(`✅ 검증 완료: 일치율 ${validationResult.successRate}%`);

      if (validationResult.mismatched > 0 || validationResult.missing > 0) {
        Logger.log(`⚠️ 불일치: ${validationResult.mismatched}건, 누락: ${validationResult.missing}건`);
        result.errors.push(...validationResult.errors);
      }
    } catch (e) {
      result.steps.push({ step: 4, name: '검증', status: 'failed', error: e.message });
      result.errors.push(`검증 실패: ${e.message}`);
      Logger.log(`⚠️ 검증 실패 (계속 진행): ${e.message}`);
    }

    // ===== STEP 5: 월지급계산 테스트 =====
    Logger.log('\n[5/5] 월지급계산 테스트 중...');
    ui.alert('5/5 단계', '월지급계산 스크립트를 테스트합니다.', ui.ButtonSet.OK);

    let testResult;
    try {
      // 다음 달로 테스트
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const testMonth = Utilities.formatDate(nextMonth, 'Asia/Seoul', 'yyyy-MM');

      testResult = testMonthlyPayrollAfterMigration(testMonth);
      result.steps.push({ step: 5, name: '월지급계산 테스트', status: 'success', data: testResult });

      if (testResult.success) {
        Logger.log(`✅ 월지급계산 테스트 성공: ${testResult.processedCount}건 처리`);
      } else {
        Logger.log(`⚠️ 월지급계산 테스트 실패: ${testResult.error}`);
        result.errors.push(`월지급계산 테스트 실패: ${testResult.error}`);
      }
    } catch (e) {
      result.steps.push({ step: 5, name: '월지급계산 테스트', status: 'failed', error: e.message });
      result.errors.push(`월지급계산 테스트 실패: ${e.message}`);
      Logger.log(`⚠️ 월지급계산 테스트 실패: ${e.message}`);
    }

    // ===== 최종 결과 =====
    result.success = result.errors.length === 0;

    Logger.log('\n==================================================');
    Logger.log('마이그레이션 완료');
    Logger.log('==================================================');

    // 결과 보고
    const finalMessage = `
마이그레이션 ${result.success ? '✅ 성공' : '⚠️ 완료 (경고 있음)'}

1. 백업: ${result.steps[0].status === 'success' ? '✅' : '❌'} ${backupName}
2. 데이터 분석: ${result.steps[1]?.status === 'success' ? '✅' : '⚠️'}
3. 마이그레이션: ${result.steps[2].status === 'success' ? '✅' : '❌'} ${migrationResult?.updated || 0}건
4. 검증: ${result.steps[3]?.status === 'success' ? '✅' : '⚠️'} ${validationResult?.successRate || 0}%
5. 월지급계산: ${result.steps[4]?.status === 'success' ? '✅' : '⚠️'}

${result.errors.length > 0 ? '\n경고/오류:\n' + result.errors.slice(0, 5).join('\n') : ''}
${result.errors.length > 5 ? `\n...외 ${result.errors.length - 5}건` : ''}

${result.success ? '\n✅ 모든 단계가 성공적으로 완료되었습니다.' : '\n⚠️ 일부 경고가 있습니다. 로그를 확인하세요.'}

${result.success ? '\n다음 단계:\n1. 1주일간 모니터링\n2. 문제 없으면 급여기본정보 시트 숨김\n3. 1개월 후 최종 삭제' : ''}
    `.trim();

    ui.alert('마이그레이션 완료', finalMessage, ui.ButtonSet.OK);

  } catch (e) {
    Logger.log(`\n❌ 마이그레이션 실패: ${e.message}`);
    Logger.log(e.stack);

    ui.alert(
      '마이그레이션 실패',
      `마이그레이션 중 오류가 발생했습니다:\n\n${e.message}\n\n` +
      `백업 시트를 사용하여 복원할 수 있습니다.\n\n` +
      `로그를 확인하여 상세 내용을 파악하세요.`,
      ui.ButtonSet.OK
    );

    result.success = false;
  }

  return result;
}

/**
 * 급여기본정보 시트 숨김 (마이그레이션 완료 후)
 */
function hidePayrollBasicInfoSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sheet = ss.getSheetByName('급여기본정보');

  if (!sheet) {
    ui.alert('급여기본정보 시트를 찾을 수 없습니다.');
    return;
  }

  const response = ui.alert(
    '시트 숨김 확인',
    '급여기본정보 시트를 숨기시겠습니까?\n\n' +
    '마이그레이션이 완료되고 1주일간 문제가 없었을 때만 실행하세요.',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    Logger.log('시트 숨김 취소됨');
    return;
  }

  sheet.hideSheet();
  Logger.log('급여기본정보 시트 숨김 완료');

  ui.alert(
    '완료',
    '급여기본정보 시트가 숨겨졌습니다.\n\n' +
    '1개월 후 문제가 없으면 시트를 삭제할 수 있습니다.',
    ui.ButtonSet.OK
  );
}

/**
 * 마이그레이션 상태 확인
 */
function checkMigrationStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const basicSheet = ss.getSheetByName('급여기본정보');
  const payrollSheet = ss.getSheetByName('급여데이터');

  if (!basicSheet || !payrollSheet) {
    ui.alert('필요한 시트를 찾을 수 없습니다.');
    return null;
  }

  const basicCount = basicSheet.getLastRow() - 1;
  const payrollCount = payrollSheet.getLastRow() - 1;
  const basicHidden = basicSheet.isSheetHidden();

  const backupSheets = listBackupSheets();

  const message = `
마이그레이션 상태 확인

급여기본정보:
- 데이터: ${basicCount}건
- 상태: ${basicHidden ? '숨김' : '표시'}
- 백업: ${backupSheets.length}개

급여데이터:
- 데이터: ${payrollCount}건

${backupSheets.length > 0 ? '\n최근 백업:\n' + backupSheets.slice(0, 3).join('\n') : ''}

${basicHidden ? '\n✅ 급여기본정보 시트가 숨겨져 있습니다.' : '\n⚠️ 급여기본정보 시트가 아직 표시 중입니다.'}
  `.trim();

  ui.alert('상태 확인', message, ui.ButtonSet.OK);

  return {
    basicCount,
    payrollCount,
    basicHidden,
    backupCount: backupSheets.length,
    backupSheets
  };
}
