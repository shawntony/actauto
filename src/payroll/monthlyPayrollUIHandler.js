/**
 * 월지급계산 처리 UI 핸들러 v2.0
 *
 * 역할:
 * - UI 모달 표시
 * - 급여 데이터 수집 및 계산
 * - 보험 매칭
 * - 월지급계산 시트 업데이트 (23개 컬럼)
 * - 월지급DB 저장 (30개 컬럼)
 * - 월지급더존업로드 변환 (24개 컬럼)
 *
 * 버전: 2.0
 * 업데이트: 2026-01-30
 */

// ============================================
// 스키마 정의
// ============================================

/**
 * 월지급계산 스키마 (23개 컬럼: A~W)
 */
const MONTHLY_PAYROLL_CALC_SCHEMA = {
  SHEET_NAME: '월지급계산',
  COLUMNS: {
    A: { index: 0, name: '급여기준월' },
    B: { index: 1, name: '이름' },
    C: { index: 2, name: '총급여' },
    D: { index: 3, name: '기본급' },
    E: { index: 4, name: '상여' },
    F: { index: 5, name: '식대수당' },
    G: { index: 6, name: '직책수당' },
    H: { index: 7, name: '연장근로수당' },
    I: { index: 8, name: '연차수당' },
    J: { index: 9, name: '야간수당' },
    K: { index: 10, name: '공휴일특근수당' },
    L: { index: 11, name: '기타수당' },
    M: { index: 12, name: '국민연금' },
    N: { index: 13, name: '건강보험료' },
    O: { index: 14, name: '고용보험료' },
    P: { index: 15, name: '장기요양보험료' },
    Q: { index: 16, name: '사업주추가고용보험료' },
    R: { index: 17, name: '산재보험료' },
    S: { index: 18, name: '소득세' },
    T: { index: 19, name: '지방소득세' },
    U: { index: 20, name: '연말정산 소득세' },
    V: { index: 21, name: '연말정산 지방소득세' },
    W: { index: 22, name: '세후지급액' }
  },

  /**
   * 총급여 계산: D+E+F+G+H+I+J+K+L
   */
  calculateTotalSalary: function(allowances) {
    return (allowances.basicSalary || 0) + (allowances.bonus || 0) +
           (allowances.meal || 0) + (allowances.position || 0) +
           (allowances.overtime || 0) + (allowances.annual || 0) +
           (allowances.night || 0) + (allowances.holiday || 0) +
           (allowances.other || 0);
  },

  /**
   * 세후지급액 계산: C - M - N - O - P - S - T
   */
  calculateNetPay: function(totalSalary, deductions) {
    return totalSalary -
           (deductions.nationalPension || 0) -
           (deductions.healthInsurance || 0) -
           (deductions.employmentInsurance || 0) -
           (deductions.longTermCare || 0) -
           (deductions.incomeTax || 0) -
           (deductions.localIncomeTax || 0);
  }
};

/**
 * 월지급DB 스키마 (30개 컬럼: A~AD)
 */
const MONTHLY_PAYROLL_DB_SCHEMA = {
  SHEET_NAME: '월지급DB',
  // A~W는 월지급계산과 동일
  ADDITIONAL_COLUMNS: {
    X: { index: 23, name: '차인지급액계' },
    Y: { index: 24, name: '사업주부담 １' },
    Z: { index: 25, name: '산재보험료2' },
    AA: { index: 26, name: '총비용' },
    AB: { index: 27, name: '입금처리여부' },
    AC: { index: 28, name: '은행' },
    AD: { index: 29, name: '계좌번호' }
  },

  /**
   * 추가 계산 열 생성
   */
  calculateAdditionalData: function(calcRow, employerBurden, workAccident) {
    const netPay = calcRow[22]; // W열 (세후지급액은 공란)
    const totalCost = calcRow[2] + employerBurden + workAccident; // C + Q + R

    return {
      차인지급액계: netPay,  // X = W (공란)
      사업주부담1: employerBurden,  // Y = Q
      산재보험료2: workAccident,  // Z = R
      총비용: totalCost,  // AA = C + Q + R
      입금처리여부: '대기',  // AB
      은행: '',  // AC
      계좌번호: ''  // AD
    };
  }
};

/**
 * 월지급더존업로드 스키마 (24개 컬럼: A~X)
 */
const DAZONE_UPLOAD_SCHEMA = {
  SHEET_NAME: '월지급더존업로드',
  COLUMNS: {
    A: { index: 0, name: '사원코드' },
    B: { index: 1, name: '사원명' },
    C: { index: 2, name: '부서' },
    D: { index: 3, name: '직급' },
    E: { index: 4, name: '직종' },
    F: { index: 5, name: '기본급' },
    G: { index: 6, name: '상여' },
    H: { index: 7, name: '식대수당' },
    I: { index: 8, name: '직책수당' },
    J: { index: 9, name: '연장근로수당' },
    K: { index: 10, name: '연차수당' },
    L: { index: 11, name: '야간수당' },
    M: { index: 12, name: '공휴일특근수당' },
    N: { index: 13, name: '기타수당' },
    O: { index: 14, name: '지급액계' },
    P: { index: 15, name: '국민연금' },
    Q: { index: 16, name: '건강보험' },
    R: { index: 17, name: '고용보험' },
    S: { index: 18, name: '장기요양보험료' },
    T: { index: 19, name: '소득세' },
    U: { index: 20, name: '지방소득세' },
    V: { index: 21, name: '학자금상환액' },
    W: { index: 22, name: '공제액계' },
    X: { index: 23, name: '차인지급액' }
  },

  /**
   * 월지급계산 → 월지급더존업로드 변환
   */
  convertFromPayrollCalc: function(calcRow, employeeInfo) {
    // calcRow: [A~W] 23개 컬럼
    const allowanceTotal = calcRow[2]; // C: 총급여

    // 공제액계 = 4대보험 합계 (소득세/지방소득세는 빈칸이므로 제외)
    const deductionTotal =
      (calcRow[12] || 0) +  // M: 국민연금
      (calcRow[13] || 0) +  // N: 건강보험료
      (calcRow[14] || 0) +  // O: 고용보험료
      (calcRow[15] || 0);   // P: 장기요양보험료
      // 소득세(S), 지방소득세(T)는 빈칸이므로 합계에서 제외

    const netPay = calcRow[22]; // W: 세후지급액 (공란)

    return [
      employeeInfo.employeeCode || '',  // A: 사원코드
      calcRow[1],  // B: 사원명 (이름)
      '',  // C: 부서 (빈칸)
      employeeInfo.position || '',  // D: 직급
      '',  // E: 직종 (빈칸)
      calcRow[3],  // F: 기본급
      calcRow[4],  // G: 상여
      calcRow[5],  // H: 식대수당
      calcRow[6],  // I: 직책수당
      calcRow[7],  // J: 연장근로수당
      calcRow[8],  // K: 연차수당
      calcRow[9],  // L: 야간수당
      calcRow[10], // M: 공휴일특근수당
      calcRow[11], // N: 기타수당
      allowanceTotal,  // O: 지급액계 (총급여)
      calcRow[12], // P: 국민연금
      calcRow[13], // Q: 건강보험
      calcRow[14], // R: 고용보험
      calcRow[15], // S: 장기요양보험료
      // 소득세/지방소득세는 월지급계산의 S, T열에서 가져옴 (빈칸)
      // (사용자 요청: 2026-01-30 - 계산 로직은 유지, 실제 값은 수동 입력)
      calcRow[18] || '',  // T: 소득세 (월지급계산 S열)
      calcRow[19] || '',  // U: 지방소득세 (월지급계산 T열)
      0,  // V: 학자금상환액 (기본값 0)
      deductionTotal,  // W: 공제액계
      netPay  // X: 차인지급액 (공란, 필요시 수동 입력)
    ];
  }
};

/**
 * 보험 시트 스키마
 */
// INSURANCE_SHEET_SCHEMAS는 schemas/보험시트_schema.js에서 정의됨

/**
 * 컬럼 문자를 인덱스로 변환
 */
function columnLetterToIndex(columnLetter) {
  let index = 0;
  for (let i = 0; i < columnLetter.length; i++) {
    index = index * 26 + (columnLetter.charCodeAt(i) - 64);
  }
  return index - 1;
}

// ============================================
// UI 및 데이터 가져오기
// ============================================

/**
 * 월지급계산 UI 모달 표시
 */
function showMonthlyPayrollUI() {
  const html = HtmlService.createHtmlOutputFromFile('payroll/html/monthlyPayrollUI')
    .setWidth(1000)
    .setHeight(750);

  SpreadsheetApp.getUi().showModalDialog(html, '월지급 계산 처리 v2.0');
}

/**
 * 급여데이터에서 사람 목록 가져오기
 */
function getPeopleDataForPayroll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pdSheet = ss.getSheetByName('급여데이터');

  if (!pdSheet) {
    throw new Error('급여데이터 시트를 찾을 수 없습니다.');
  }

  const lastRow = pdSheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  // A~G열 읽기: A=사번, B=이름, C=주민번호, D=근무위치, E=근무조, F=계약시작일, G=계약종료일
  const data = pdSheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const people = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 시간 부분 제거

  data.forEach((row, index) => {
    const name = row[1];  // B열
    const residentId = String(row[2]).trim();  // C열
    const workplace = String(row[3]).trim();  // D열
    const startDate = row[5];  // F열: 계약시작일
    const quitDate = row[6];  // G열: 계약종료일

    if (!name || !residentId) return;

    const workplaceType = (workplace && workplace.includes('본사')) ? 'headquarters' : 'branch';

    // 재직/퇴사 상태 판단
    let status = 'active';  // 기본값: 재직
    if (quitDate) {
      const quitDateObj = new Date(quitDate);
      quitDateObj.setHours(0, 0, 0, 0);
      // 계약종료일이 오늘 이전이면 퇴사
      if (quitDateObj < today) {
        status = 'inactive';
      }
    }

    // 계약시작일 포맷팅
    const startDateStr = startDate ? formatDate(startDate) : '';

    people.push({
      index: index,
      name: name,
      residentId: residentId,
      workplace: workplace,
      workplaceType: workplaceType,
      status: status,
      startDate: startDateStr,
      matchStatus: 'ok'
    });
  });

  Logger.log('[getPeopleDataForPayroll] 총 ' + people.length + '명 조회');
  return people;
}

// ============================================
// 메인 처리 함수
// ============================================

/**
 * 특정 사람의 월지급 계산 실행
 * @param {string} month - 처리 월 (YYYY-MM)
 * @param {string} residentId - 주민등록번호
 * @returns {Object} 실행 결과
 */
function executeMonthlyPayrollForPerson(month, residentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 시트 가져오기
  const sheets = {
    payrollData: ss.getSheetByName('급여데이터'),
    payrollCalc: ss.getSheetByName('월지급계산'),
    payrollDB: ss.getSheetByName('월지급DB'),
    dazoneUpload: ss.getSheetByName('월지급더존업로드'),
    nationalPension: ss.getSheetByName('국민연금'),
    healthInsurance: ss.getSheetByName('건강보험'),
    employmentInsurance: ss.getSheetByName('고용보험'),
    workAccident: ss.getSheetByName('산재보험')
  };

  // 필수 시트 확인
  for (const [key, sheet] of Object.entries(sheets)) {
    if (!sheet) {
      throw new Error(`${key} 시트를 찾을 수 없습니다.`);
    }
  }

  // 1. 급여데이터에서 직원 정보 가져오기
  const employeeData = getEmployeeDataFromPayroll(sheets.payrollData, residentId);
  if (!employeeData) {
    throw new Error('해당 직원을 찾을 수 없습니다: ' + residentId);
  }

  // 월을 말일 형식으로 변환 (YYYY-MM → YYYY-MM-DD)
  // 보험 시트 A열은 YYYY-MM-DD 형식이므로 매칭 키 일치를 위해 변환 필요
  const monthLastDay = convertToLastDayOfMonth(month);

  Logger.log('[executeMonthlyPayrollForPerson] 처리 시작: ' + month + ' → ' + monthLastDay + ', ' + employeeData.name);

  // 2. 보험 데이터 매칭 (변환된 월 사용)
  const insuranceData = matchInsuranceData(sheets, monthLastDay, residentId);

  // 3. 소득세 계산 (간이세액표 또는 기본 로직)
  const taxData = calculateIncomeTax(employeeData.totalSalary, insuranceData);

  // 4. 월지급계산 행 생성
  const calcRow = buildPayrollCalcRow(month, employeeData, insuranceData, taxData);

  // 5. 월지급계산 시트 업데이트
  updatePayrollCalcSheet(sheets.payrollCalc, calcRow, employeeData.rowIndex);

  // 6. 월지급DB 저장 - 별도 메뉴(5. 월지급DB 저장)로 이동
  // saveToPayrollDB(sheets.payrollDB, calcRow, insuranceData);

  // 7. 월지급더존업로드 변환
  saveToDazoneUpload(sheets.dazoneUpload, calcRow, employeeData);

  return {
    success: true,
    month: month,
    name: employeeData.name,
    netPay: calcRow[22]  // W: 세후지급액
  };
}

/**
 * 급여데이터에서 직원 정보 가져오기
 */
function getEmployeeDataFromPayroll(sheet, residentId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  // 필요한 모든 컬럼 읽기
  const data = sheet.getRange(2, 1, lastRow - 1, 35).getValues();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowResidentId = String(row[2]).trim();  // C열

    if (rowResidentId === residentId) {
      // 급여데이터 시트 실제 구조 (2026-01-30 확인)
      // A=사번, B=근무자명, C=주민등록번호, D=근무위치, E=근무조, F=계약시작일, G=계약종료일
      // J(9)=기본급, K(10)=직책수당, L(11)=식대수당, M(12)=연장근로수당
      // N(13)=연차수당, O(14)=야간수당, P(15)=공휴일특근수당, Q(16)=기타수당
      // R(17)=합계금액, AF(31)=급여 지급 은행, AG(32)=계좌 번호
      // ⚠️ 상여 열은 급여데이터에 없음 (월지급계산에만 존재)

      return {
        rowIndex: i,
        name: row[1],  // B열: 근무자명
        residentId: residentId,
        employeeCode: row[0] || '',  // A열: 사번
        workplace: row[3] || '',  // D열: 근무위치 (본사/지점)
        workShift: row[4] || '',  // E열: 근무조
        contractStart: row[5] || '',  // F열: 계약시작일
        contractEnd: row[6] || '',  // G열: 계약종료일
        bank: row[31] || '',  // AF열: 급여 지급 은행
        accountNumber: row[32] || '',  // AG열: 계좌 번호
        // 급여 항목
        basicSalary: row[9] || 0,  // J열: 기본급
        bonus: 0,  // ⚠️ 급여데이터에 없음, 월지급계산에서 직접 입력 필요
        positionAllowance: row[10] || 0,  // K열: 직책수당
        mealAllowance: row[11] || 0,  // L열: 식대수당
        overtimeAllowance: row[12] || 0,  // M열: 연장근로수당
        annualAllowance: row[13] || 0,  // N열: 연차수당
        nightAllowance: row[14] || 0,  // O열: 야간수당
        holidayAllowance: row[15] || 0,  // P열: 공휴일특근수당
        otherAllowance: row[16] || 0,  // Q열: 기타수당
        totalSalary: row[17] || 0  // R열: 합계금액
      };
    }
  }

  return null;
}

/**
 * 보험 데이터 매칭
 */
function matchInsuranceData(sheets, month, residentId) {
  const idKey = extractResidentIdKey(residentId);

  const insuranceData = {
    nationalPension: 0,
    healthInsurance: 0,
    longTermCare: 0,
    employmentInsurance: 0,
    employerInsurance: 0,
    workAccident: 0
  };

  // 국민연금
  insuranceData.nationalPension = findInsuranceValue(
    sheets.nationalPension,
    month,
    idKey,
    INSURANCE_SHEET_SCHEMAS.국민연금
  );

  // 건강보험
  const healthData = findInsuranceValues(
    sheets.healthInsurance,
    month,
    idKey,
    INSURANCE_SHEET_SCHEMAS.건강보험
  );
  insuranceData.healthInsurance = healthData.HEALTH_INSURANCE || 0;
  insuranceData.longTermCare = healthData.LONG_TERM_CARE || 0;

  // 고용보험
  const employmentData = findInsuranceValues(
    sheets.employmentInsurance,
    month,
    idKey,
    INSURANCE_SHEET_SCHEMAS.고용보험
  );
  insuranceData.employmentInsurance = employmentData.EMPLOYEE_INSURANCE || 0;
  insuranceData.employerInsurance = employmentData.EMPLOYER_INSURANCE || 0;

  // 산재보험
  insuranceData.workAccident = findInsuranceValue(
    sheets.workAccident,
    month,
    idKey,
    INSURANCE_SHEET_SCHEMAS.산재보험
  );

  Logger.log('[보험 매칭] 국민연금: ' + insuranceData.nationalPension +
             ', 건강: ' + insuranceData.healthInsurance +
             ', 고용: ' + insuranceData.employmentInsurance);

  return insuranceData;
}

/**
 * 보험 시트에서 단일 값 찾기
 */
function findInsuranceValue(sheet, month, idKey, schema) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const idColIndex = columnLetterToIndex(schema.MATCHING_COLUMNS.RESIDENT_ID);
  const dataCol = Object.values(schema.DATA_COLUMNS)[0];
  const dataColIndex = columnLetterToIndex(dataCol);
  const maxCol = Math.max(idColIndex, dataColIndex) + 1;

  const data = sheet.getRange(2, 1, lastRow - 1, maxCol).getValues();

  for (const row of data) {
    const monthValue = String(row[0]).trim();
    const rowIdKey = extractResidentIdKey(String(row[idColIndex]));

    if (monthValue === month && rowIdKey === idKey) {
      return row[dataColIndex] || 0;
    }
  }

  return 0;
}

/**
 * 보험 시트에서 여러 값 찾기
 */
function findInsuranceValues(sheet, month, idKey, schema) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};

  const idColIndex = columnLetterToIndex(schema.MATCHING_COLUMNS.RESIDENT_ID);
  const dataColumns = schema.DATA_COLUMNS;
  const dataColIndices = {};
  let maxCol = idColIndex;

  for (const [key, col] of Object.entries(dataColumns)) {
    const colIndex = columnLetterToIndex(col);
    dataColIndices[key] = colIndex;
    maxCol = Math.max(maxCol, colIndex);
  }

  const data = sheet.getRange(2, 1, lastRow - 1, maxCol + 1).getValues();

  for (const row of data) {
    const monthValue = String(row[0]).trim();
    const rowIdKey = extractResidentIdKey(String(row[idColIndex]));

    if (monthValue === month && rowIdKey === idKey) {
      const result = {};
      for (const [key, colIndex] of Object.entries(dataColIndices)) {
        result[key] = row[colIndex] || 0;
      }
      return result;
    }
  }

  return {};
}

/**
 * 주민번호 앞 6자리 추출
 */
function extractResidentIdKey(residentId) {
  if (!residentId) return '';
  const cleaned = String(residentId).replace(/[-\s]/g, '');
  return cleaned.substring(0, 6);
}

/**
 * 소득세 계산 (간이세액표)
 */
function calculateIncomeTax(totalSalary, insuranceData) {
  // 과세표준 = 총급여 - 비과세(식대 등) - 4대보험
  const taxableIncome = totalSalary -
    (insuranceData.nationalPension || 0) -
    (insuranceData.healthInsurance || 0) -
    (insuranceData.employmentInsurance || 0) -
    (insuranceData.longTermCare || 0);

  // 간단한 소득세 계산 (실제로는 간이세액표 사용)
  let incomeTax = 0;
  if (taxableIncome > 0) {
    // 예시: 과세표준의 약 5% (실제로는 간이세액표에 따라 다름)
    incomeTax = Math.floor(taxableIncome * 0.05 / 10) * 10;
  }

  // 지방소득세 = 소득세의 10%
  const localIncomeTax = Math.floor(incomeTax * 0.1 / 10) * 10;

  return {
    incomeTax: incomeTax,
    localIncomeTax: localIncomeTax,
    yearEndIncomeTax: 0,  // 연말정산 시 입력
    yearEndLocalIncomeTax: 0  // 연말정산 시 입력
  };
}

/**
 * 월지급계산 행 생성 (23개 컬럼)
 */
function buildPayrollCalcRow(month, employeeData, insuranceData, taxData) {
  const targetDate = convertToLastDayOfMonth(month);

  // 총급여 계산
  const allowances = {
    basicSalary: employeeData.basicSalary,
    bonus: employeeData.bonus,
    meal: employeeData.mealAllowance,
    position: employeeData.positionAllowance,
    overtime: employeeData.overtimeAllowance,
    annual: employeeData.annualAllowance,
    night: employeeData.nightAllowance,
    holiday: employeeData.holidayAllowance,
    other: employeeData.otherAllowance
  };
  const totalSalary = MONTHLY_PAYROLL_CALC_SCHEMA.calculateTotalSalary(allowances);

  // 세후지급액은 계산하지 않고 빈칸으로 유지
  // (사용자 요청: 2026-01-30)
  const netPay = '';  // 빈칸

  Logger.log('[계산] 총급여: ' + totalSalary + ', 세후지급액: (빈칸)');

  // 소득세/지방소득세는 계산하되 적용하지 않음 (빈칸으로 유지)
  // (사용자 요청: 2026-01-30 - 계산 로직은 유지, 실제 값은 수동 입력)

  // 23개 컬럼 행 생성 (A~W)
  return [
    targetDate,  // A: 급여기준월
    employeeData.name,  // B: 이름
    totalSalary,  // C: 총급여
    employeeData.basicSalary,  // D: 기본급
    employeeData.bonus,  // E: 상여
    employeeData.mealAllowance,  // F: 식대수당
    employeeData.positionAllowance,  // G: 직책수당
    employeeData.overtimeAllowance,  // H: 연장근로수당
    employeeData.annualAllowance,  // I: 연차수당
    employeeData.nightAllowance,  // J: 야간수당
    employeeData.holidayAllowance,  // K: 공휴일특근수당
    employeeData.otherAllowance,  // L: 기타수당
    insuranceData.nationalPension,  // M: 국민연금
    insuranceData.healthInsurance,  // N: 건강보험료
    insuranceData.employmentInsurance,  // O: 고용보험료
    insuranceData.longTermCare,  // P: 장기요양보험료
    insuranceData.employerInsurance,  // Q: 사업주추가고용보험료
    insuranceData.workAccident,  // R: 산재보험료
    '',  // S: 소득세 (빈칸 - 수동 입력)
    '',  // T: 지방소득세 (빈칸 - 수동 입력)
    '',  // U: 연말정산 소득세 (빈칸 - 수동 입력)
    '',  // V: 연말정산 지방소득세 (빈칸 - 수동 입력)
    netPay  // W: 세후지급액 (빈칸 - 수동 입력)
  ];
}

/**
 * 월지급계산 시트 업데이트
 */
function updatePayrollCalcSheet(sheet, calcRow, employeeRowIndex) {
  const targetRow = employeeRowIndex + 2;  // 헤더 제외
  const lastRow = sheet.getLastRow();

  if (targetRow <= lastRow) {
    // 기존 행 업데이트
    sheet.getRange(targetRow, 1, 1, 23).setValues([calcRow]);
    Logger.log('[월지급계산] 행 업데이트: ' + targetRow);
  } else {
    // 새 행 추가
    sheet.appendRow(calcRow);
    Logger.log('[월지급계산] 새 행 추가');
  }
}

/**
 * 월지급DB 저장 (30개 컬럼)
 */
function saveToPayrollDB(sheet, calcRow, insuranceData) {
  // 추가 데이터 계산
  const additionalData = MONTHLY_PAYROLL_DB_SCHEMA.calculateAdditionalData(
    calcRow,
    insuranceData.employerInsurance,
    insuranceData.workAccident
  );

  // 30개 컬럼 행 생성
  const dbRow = [
    ...calcRow,  // A~W (23개)
    additionalData.차인지급액계,  // X
    additionalData.사업주부담1,  // Y
    additionalData.산재보험료2,  // Z
    additionalData.총비용,  // AA
    additionalData.입금처리여부,  // AB
    additionalData.은행,  // AC
    additionalData.계좌번호  // AD
  ];

  sheet.appendRow(dbRow);
  Logger.log('[월지급DB] 저장 완료');
}

/**
 * 월지급더존업로드 변환 및 저장 (24개 컬럼)
 */
function saveToDazoneUpload(sheet, calcRow, employeeData) {
  // 급여데이터에는 부서/직급/직종 정보가 없으므로 근무위치로 대체
  // 필요시 급여기본정보 시트에서 추가 정보를 가져올 수 있음
  const employeeInfo = {
    employeeCode: employeeData.employeeCode,
    department: employeeData.workplace || '',  // 근무위치를 부서로 사용
    position: '',  // 급여데이터에 없음, 필요시 급여기본정보에서 가져오기
    jobType: employeeData.workShift || ''  // 근무조를 직종으로 사용
  };

  const dazoneRow = DAZONE_UPLOAD_SCHEMA.convertFromPayrollCalc(calcRow, employeeInfo);

  sheet.appendRow(dazoneRow);
  Logger.log('[월지급더존업로드] 변환 완료: ' + employeeData.name);
}

/**
 * YYYY-MM 형식을 YYYY-MM-DD (말일) 형식으로 변환
 */
function convertToLastDayOfMonth(monthString) {
  const [year, month] = monthString.split('-').map(num => parseInt(num, 10));
  const nextMonth = new Date(year, month, 1);
  const lastDay = new Date(nextMonth - 1);
  return Utilities.formatDate(lastDay, 'Asia/Seoul', 'yyyy-MM-dd');
}

/**
 * 날짜 포맷팅
 */
function formatDate(date) {
  if (!date) return '';
  if (date instanceof Date) {
    return Utilities.formatDate(date, 'Asia/Seoul', 'yyyy-MM-dd');
  }
  return String(date);
}
