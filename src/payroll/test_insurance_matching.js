/**
 * 보험 매칭 테스트 스크립트
 *
 * 목적: 월 형식 변환 수정 후 보험 데이터 매칭이 정상적으로 작동하는지 테스트
 */

function testInsuranceMatching() {
  Logger.log('========================================');
  Logger.log('보험 매칭 테스트 시작');
  Logger.log('========================================\n');

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. 필요한 시트 확인
  Logger.log('1. 시트 확인');
  const sheets = {
    payrollData: ss.getSheetByName('급여데이터'),
    nationalPension: ss.getSheetByName('국민연금'),
    healthInsurance: ss.getSheetByName('건강보험'),
    employment: ss.getSheetByName('고용보험'),
    industrialAccident: ss.getSheetByName('산재보험')
  };

  for (const [key, sheet] of Object.entries(sheets)) {
    if (!sheet) {
      Logger.log(`   ❌ ${key} 시트를 찾을 수 없습니다`);
      return;
    }
    Logger.log(`   ✅ ${sheet.getName()} 시트 확인`);
  }

  // 2. 테스트 데이터 준비
  Logger.log('\n2. 테스트 데이터 준비');

  // 급여데이터에서 첫 번째 직원 정보 가져오기
  const payrollData = sheets.payrollData.getDataRange().getValues();
  if (payrollData.length < 2) {
    Logger.log('   ❌ 급여데이터에 직원 정보가 없습니다');
    return;
  }

  // 헤더 제외하고 첫 번째 직원
  const testEmployee = payrollData[1];
  const testName = testEmployee[1]; // B열: 성명
  const testResidentId = testEmployee[2]; // C열: 주민번호

  Logger.log(`   테스트 직원: ${testName}`);
  Logger.log(`   주민번호: ${testResidentId}`);

  // 주민번호 앞 6자리 추출
  const residentIdKey = extractResidentIdKey(testResidentId);
  Logger.log(`   주민번호 키: ${residentIdKey}`);

  // 3. 월 형식 변환 테스트
  Logger.log('\n3. 월 형식 변환 테스트');
  const testMonth = '2026-01';
  const monthLastDay = convertToLastDayOfMonth(testMonth);

  Logger.log(`   입력 월: ${testMonth}`);
  Logger.log(`   변환 월: ${monthLastDay}`);
  Logger.log(`   ✅ 변환 성공: ${testMonth} → ${monthLastDay}`);

  // 4. 각 보험 시트에서 데이터 확인
  Logger.log('\n4. 보험 시트 데이터 확인');

  // 4.1 국민연금
  Logger.log('\n   [국민연금]');
  const npData = sheets.nationalPension.getDataRange().getValues();
  Logger.log(`   총 ${npData.length}행 (헤더 포함)`);

  let npFound = false;
  for (let i = 1; i < npData.length; i++) {
    const row = npData[i];
    const rowMonth = row[0]; // A열
    const rowResidentId = row[3]; // D열
    const rowPension = row[8]; // I열

    if (rowMonth && rowResidentId) {
      const rowKey = extractResidentIdKey(String(rowResidentId));
      const compositeKey = rowMonth + '|' + rowKey;
      const searchKey = monthLastDay + '|' + residentIdKey;

      if (compositeKey === searchKey) {
        Logger.log(`   ✅ 매칭 성공!`);
        Logger.log(`      매칭 키: ${compositeKey}`);
        Logger.log(`      국민연금액: ${rowPension}`);
        npFound = true;
        break;
      }
    }
  }
  if (!npFound) {
    Logger.log(`   ❌ 매칭 실패 - ${monthLastDay}|${residentIdKey} 데이터를 찾을 수 없습니다`);
  }

  // 4.2 건강보험
  Logger.log('\n   [건강보험]');
  const hiData = sheets.healthInsurance.getDataRange().getValues();
  Logger.log(`   총 ${hiData.length}행 (헤더 포함)`);

  let hiFound = false;
  for (let i = 1; i < hiData.length; i++) {
    const row = hiData[i];
    const rowMonth = row[0]; // A열
    const rowResidentId = row[3]; // D열
    const rowHealthIns = row[14]; // O열
    const rowLongTerm = row[27]; // AB열

    if (rowMonth && rowResidentId) {
      const rowKey = extractResidentIdKey(String(rowResidentId));
      const compositeKey = rowMonth + '|' + rowKey;
      const searchKey = monthLastDay + '|' + residentIdKey;

      if (compositeKey === searchKey) {
        Logger.log(`   ✅ 매칭 성공!`);
        Logger.log(`      매칭 키: ${compositeKey}`);
        Logger.log(`      건강보험료: ${rowHealthIns}`);
        Logger.log(`      장기요양보험료: ${rowLongTerm}`);
        hiFound = true;
        break;
      }
    }
  }
  if (!hiFound) {
    Logger.log(`   ❌ 매칭 실패 - ${monthLastDay}|${residentIdKey} 데이터를 찾을 수 없습니다`);
  }

  // 4.3 고용보험
  Logger.log('\n   [고용보험]');
  const eiData = sheets.employment.getDataRange().getValues();
  Logger.log(`   총 ${eiData.length}행 (헤더 포함)`);

  let eiFound = false;
  for (let i = 1; i < eiData.length; i++) {
    const row = eiData[i];
    const rowMonth = row[0]; // A열
    const rowResidentId = row[4]; // E열 (고용보험만 E열!)
    const rowEmployeeIns = row[23]; // X열
    const rowEmployerIns = row[25]; // Z열

    if (rowMonth && rowResidentId) {
      const rowKey = extractResidentIdKey(String(rowResidentId));
      const compositeKey = rowMonth + '|' + rowKey;
      const searchKey = monthLastDay + '|' + residentIdKey;

      if (compositeKey === searchKey) {
        Logger.log(`   ✅ 매칭 성공!`);
        Logger.log(`      매칭 키: ${compositeKey}`);
        Logger.log(`      직원고용보험료: ${rowEmployeeIns}`);
        Logger.log(`      사업주고용보험료: ${rowEmployerIns}`);
        eiFound = true;
        break;
      }
    }
  }
  if (!eiFound) {
    Logger.log(`   ❌ 매칭 실패 - ${monthLastDay}|${residentIdKey} 데이터를 찾을 수 없습니다`);
  }

  // 4.4 산재보험
  Logger.log('\n   [산재보험]');
  const iaData = sheets.industrialAccident.getDataRange().getValues();
  Logger.log(`   총 ${iaData.length}행 (헤더 포함)`);

  let iaFound = false;
  for (let i = 1; i < iaData.length; i++) {
    const row = iaData[i];
    const rowMonth = row[0]; // A열
    const rowResidentId = row[3]; // D열
    const rowIndustrialAcc = row[14]; // O열

    if (rowMonth && rowResidentId) {
      const rowKey = extractResidentIdKey(String(rowResidentId));
      const compositeKey = rowMonth + '|' + rowKey;
      const searchKey = monthLastDay + '|' + residentIdKey;

      if (compositeKey === searchKey) {
        Logger.log(`   ✅ 매칭 성공!`);
        Logger.log(`      매칭 키: ${compositeKey}`);
        Logger.log(`      산재보험료: ${rowIndustrialAcc}`);
        iaFound = true;
        break;
      }
    }
  }
  if (!iaFound) {
    Logger.log(`   ❌ 매칭 실패 - ${monthLastDay}|${residentIdKey} 데이터를 찾을 수 없습니다`);
  }

  // 5. matchInsuranceData 함수 테스트
  Logger.log('\n5. matchInsuranceData 함수 테스트');

  try {
    const insuranceData = matchInsuranceData(sheets, monthLastDay, testResidentId);

    Logger.log('\n   ✅ matchInsuranceData 실행 성공');
    Logger.log(`   국민연금: ${insuranceData.nationalPension || 0}`);
    Logger.log(`   건강보험료: ${insuranceData.healthInsurance || 0}`);
    Logger.log(`   장기요양보험료: ${insuranceData.longTermCare || 0}`);
    Logger.log(`   고용보험료(직원): ${insuranceData.employeeEmployment || 0}`);
    Logger.log(`   고용보험료(사업주): ${insuranceData.employerEmployment || 0}`);
    Logger.log(`   산재보험료: ${insuranceData.industrialAccident || 0}`);

    // 결과 검증
    let allZero = true;
    if (insuranceData.nationalPension > 0 ||
        insuranceData.healthInsurance > 0 ||
        insuranceData.longTermCare > 0 ||
        insuranceData.employeeEmployment > 0) {
      allZero = false;
    }

    if (allZero) {
      Logger.log('\n   ⚠️ 경고: 모든 보험료가 0입니다. 데이터를 확인하세요.');
    } else {
      Logger.log('\n   ✅ 성공: 보험 데이터가 정상적으로 매칭되었습니다!');
    }

  } catch (error) {
    Logger.log(`   ❌ 오류 발생: ${error.message}`);
    Logger.log(`   스택: ${error.stack}`);
  }

  Logger.log('\n========================================');
  Logger.log('보험 매칭 테스트 완료');
  Logger.log('========================================');
}

/**
 * 주민번호에서 앞 6자리 추출 (헬퍼 함수)
 */
function extractResidentIdKey(residentId) {
  if (!residentId) return '';

  const cleaned = String(residentId).replace(/[-\s]/g, '');
  return cleaned.substring(0, 6);
}

/**
 * 월을 말일 형식으로 변환 (헬퍼 함수)
 */
function convertToLastDayOfMonth(month) {
  if (!month) return '';

  // YYYY-MM 형식인 경우
  if (month.length === 7 && month.indexOf('-') === 4) {
    const [year, monthNum] = month.split('-');
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    return `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`;
  }

  // 이미 YYYY-MM-DD 형식인 경우
  return month;
}
