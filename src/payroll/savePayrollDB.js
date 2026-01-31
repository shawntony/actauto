/**
 * 월지급DB 저장 핸들러
 *
 * 역할:
 * - 월급여더존다운로드 시트에서 데이터 읽기
 * - 중복 체크 (급여기준월 + 이름)
 * - 월지급DB 형식으로 변환 저장
 * - 급여데이터에서 은행/계좌 정보 조회
 *
 * 버전: 1.0
 * 작성일: 2026-01-31
 */

// ============================================
// UI 표시
// ============================================

/**
 * 월지급DB 저장 UI 표시
 */
function showSavePayrollDBUI() {
  const html = HtmlService.createHtmlOutputFromFile('payroll/html/savePayrollDBUI')
    .setWidth(650)
    .setHeight(700);

  SpreadsheetApp.getUi().showModalDialog(html, '월지급DB 저장');
}

// ============================================
// 데이터 읽기
// ============================================

/**
 * 월급여더존다운로드 시트에서 데이터 읽기
 * @param {string} month - 급여기준월 (YYYY-MM-DD)
 * @return {Object} {success, data[], month}
 */
function readDazoneDownloadData(month) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('월급여더존다운로드');

    if (!sheet) {
      return {
        success: false,
        error: '월급여더존다운로드 시트를 찾을 수 없습니다.'
      };
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return {
        success: false,
        error: '월급여더존다운로드 시트에 데이터가 없습니다.'
      };
    }

    // 전체 데이터 읽기 (헤더 제외)
    const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    const rawData = dataRange.getValues();

    // 데이터 변환 (필요한 컬럼만 추출)
    const data = rawData.map((row, index) => {
      return {
        rowIndex: index + 2,
        name: String(row[1] || '').trim(),          // B: 사원명
        totalSalary: Number(row[13]) || 0,          // N: 총지급액
        baseSalary: Number(row[4]) || 0,            // E: 기본급
        bonus: Number(row[5]) || 0,                 // F: 상여
        mealAllowance: Number(row[6]) || 0,         // G: 식대수당
        positionAllowance: Number(row[7]) || 0,     // H: 직책수당
        overtimeAllowance: Number(row[8]) || 0,     // I: 연장근로수당
        annualLeaveAllowance: Number(row[9]) || 0,  // J: 연차수당
        nightAllowance: Number(row[10]) || 0,       // K: 야간수당
        holidayAllowance: Number(row[11]) || 0,     // L: 공휴일특근수당
        otherAllowance: Number(row[12]) || 0,       // M: 기타수당
        nationalPension: Number(row[14]) || 0,      // O: 국민연금
        healthInsurance: Number(row[15]) || 0,      // P: 건강보험
        employmentInsurance: Number(row[16]) || 0,  // Q: 고용보험
        longTermCare: Number(row[17]) || 0,         // R: 장기요양보험
        employerInsurance: Number(row[20]) || 0,    // U: 사업주고용보험
        industrialAccident: Number(row[21]) || 0,   // V: 산재보험료
        incomeTax: Number(row[18]) || 0,            // S: 소득세
        localIncomeTax: Number(row[19]) || 0,       // T: 지방소득세
        netPay: Number(row[22]) || 0                // W: 차인지급액
      };
    }).filter(item => item.name); // 이름이 있는 항목만

    return {
      success: true,
      data: data,
      month: month,
      count: data.length
    };

  } catch (error) {
    return {
      success: false,
      error: '데이터 읽기 오류: ' + error.message
    };
  }
}

// ============================================
// 중복 체크
// ============================================

/**
 * 월지급DB에 중복 데이터 확인
 * @param {string} month - 급여기준월 (YYYY-MM-DD)
 * @param {string} name - 직원 이름
 * @return {boolean} 중복 여부
 */
function checkDuplicateInPayrollDB(month, name) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName('월지급DB');

    if (!dbSheet) return false;

    const lastRow = dbSheet.getLastRow();
    if (lastRow < 2) return false;

    // A열(급여기준월), B열(이름) 읽기
    const data = dbSheet.getRange(2, 1, lastRow - 1, 2).getValues();

    // 급여기준월 형식 통일 (YYYY-MM-DD)
    const targetMonth = formatDateToString(month);

    for (const row of data) {
      const dbMonth = formatDateToString(row[0]);
      const dbName = String(row[1]).trim();

      // 중복 기준: 급여기준월 + 이름
      if (dbMonth === targetMonth && dbName === name) {
        return true;
      }
    }

    return false;

  } catch (error) {
    Logger.log('중복 체크 오류: ' + error.message);
    return false;
  }
}

/**
 * 중복 체크 (일괄)
 * @param {string} month - 급여기준월
 * @param {Array} dazoneData - 더존 다운로드 데이터
 * @return {Array} [{name, status: 'duplicate'|'new', data}]
 */
function checkBulkDuplicates(month, dazoneData) {
  try {
    const result = dazoneData.map(item => {
      const isDuplicate = checkDuplicateInPayrollDB(month, item.name);

      return {
        name: item.name,
        status: isDuplicate ? 'duplicate' : 'new',
        data: item,
        netPay: item.netPay || 0
      };
    });

    return result;

  } catch (error) {
    Logger.log('일괄 중복 체크 오류: ' + error.message);
    return [];
  }
}

// ============================================
// 은행 정보 조회
// ============================================

/**
 * 급여데이터 시트에서 은행 정보 가져오기
 * @param {string} name - 직원 이름
 * @return {Object} {bank, accountNumber}
 */
function getEmployeeBankInfo(name) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('급여데이터');

    if (!sheet) {
      return { bank: '', accountNumber: '' };
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { bank: '', accountNumber: '' };
    }

    // 전체 데이터 읽기
    const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

    // 이름으로 찾기 (B열 = 이름)
    for (const row of data) {
      const employeeName = String(row[1] || '').trim();

      if (employeeName === name) {
        // 급여데이터 시트 스키마: AF(31)=은행, AG(32)=계좌번호, AH(33)=예금주
        // 0-based index: A=0, B=1, ..., AF=31, AG=32, AH=33
        const bank = String(row[31] || '').trim();           // AF열: 급여 지급 은행
        const accountNumber = String(row[32] || '').trim();  // AG열: 계좌 번호
        const depositor = String(row[33] || '').trim();      // AH열: 예금주

        // 예금주 이름이 직원 이름과 다르면 경고 (데이터 검증)
        if (depositor && depositor !== name) {
          Logger.log(`⚠️ 예금주 불일치 감지: 직원명="${name}" vs 예금주="${depositor}"`);
        }

        return { bank, accountNumber };
      }
    }

    return { bank: '', accountNumber: '' };

  } catch (error) {
    Logger.log('은행 정보 조회 오류: ' + error.message);
    return { bank: '', accountNumber: '' };
  }
}

// ============================================
// 데이터 변환
// ============================================

/**
 * 더존 데이터를 월지급DB 형식으로 변환
 * @param {string} month - 급여기준월 (YYYY-MM-DD)
 * @param {Object} dazoneRow - 더존 다운로드 행
 * @param {Object} bankInfo - 은행 정보 {bank, accountNumber}
 * @return {Array} 30개 컬럼 배열 (A~AD)
 */
function convertDazoneToPayrollDB(month, dazoneRow, bankInfo) {
  // 월지급DB 30개 컬럼 생성
  const row = new Array(30).fill('');

  // A: 급여기준월 (YYYY-MM-DD 말일)
  row[0] = new Date(month);

  // B: 이름
  row[1] = dazoneRow.name;

  // C: 총급여
  row[2] = dazoneRow.totalSalary;

  // D~L: 급여 항목 (10개)
  row[3] = dazoneRow.baseSalary;
  row[4] = dazoneRow.bonus;
  row[5] = dazoneRow.mealAllowance;
  row[6] = dazoneRow.positionAllowance;
  row[7] = dazoneRow.overtimeAllowance;
  row[8] = dazoneRow.annualLeaveAllowance;
  row[9] = dazoneRow.nightAllowance;
  row[10] = dazoneRow.holidayAllowance;
  row[11] = dazoneRow.otherAllowance;

  // M~R: 보험 항목 (6개)
  row[12] = dazoneRow.nationalPension;
  row[13] = dazoneRow.healthInsurance;
  row[14] = dazoneRow.employmentInsurance;
  row[15] = dazoneRow.longTermCare;
  row[16] = dazoneRow.employerInsurance;  // 사업주추가고용보험료
  row[17] = dazoneRow.industrialAccident; // 산재보험료

  // S~V: 세금 항목 (4개)
  row[18] = dazoneRow.incomeTax;
  row[19] = dazoneRow.localIncomeTax;
  row[20] = 0; // U: 연말정산 소득세 (빈칸)
  row[21] = 0; // V: 연말정산 지방소득세 (빈칸)

  // W: 세후지급액
  row[22] = dazoneRow.netPay || '';

  // X: 차인지급액계 (W와 동일)
  row[23] = dazoneRow.netPay || '';

  // Y: 사업주부담1 (Q와 동일)
  row[24] = dazoneRow.employerInsurance;

  // Z: 산재보험료2 (R와 동일)
  row[25] = dazoneRow.industrialAccident;

  // AA: 총비용 (C + Q + R)
  row[26] = (dazoneRow.totalSalary || 0) +
            (dazoneRow.employerInsurance || 0) +
            (dazoneRow.industrialAccident || 0);

  // AB: 입금처리여부
  row[27] = '대기';

  // AC~AD: 은행 정보
  row[28] = bankInfo.bank || '';
  row[29] = bankInfo.accountNumber || '';

  return row;
}

// ============================================
// 저장
// ============================================

/**
 * 월지급DB에 저장
 * @param {string} month - 급여기준월
 * @param {Array} selectedData - 선택된 데이터 [{name, data}]
 * @return {Object} {success, saved[], duplicates[], errors[]}
 */
function saveToPayrollDBFromDazone(month, selectedData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName('월지급DB');

    if (!dbSheet) {
      return {
        success: false,
        error: '월지급DB 시트를 찾을 수 없습니다.'
      };
    }

    const saved = [];
    const duplicates = [];
    const errors = [];

    // 각 직원별 처리
    selectedData.forEach(item => {
      try {
        const name = item.name;
        const data = item.data;

        // 1. 중복 체크
        if (checkDuplicateInPayrollDB(month, name)) {
          duplicates.push({ name, reason: '이미 존재함' });
          return;
        }

        // 2. 은행 정보 조회
        const bankInfo = getEmployeeBankInfo(name);

        // 3. 데이터 변환
        const dbRow = convertDazoneToPayrollDB(month, data, bankInfo);

        // 4. 시트에 추가
        dbSheet.appendRow(dbRow);

        saved.push({
          name,
          netPay: data.netPay,
          bank: bankInfo.bank,
          accountNumber: bankInfo.accountNumber
        });

      } catch (error) {
        errors.push({
          name: item.name,
          error: error.message
        });
      }
    });

    return {
      success: true,
      saved: saved,
      duplicates: duplicates,
      errors: errors,
      summary: {
        total: selectedData.length,
        savedCount: saved.length,
        duplicateCount: duplicates.length,
        errorCount: errors.length
      }
    };

  } catch (error) {
    return {
      success: false,
      error: '저장 오류: ' + error.message
    };
  }
}

// ============================================
// 유틸리티
// ============================================

/**
 * 날짜를 YYYY-MM-DD 문자열로 변환
 * @param {Date|string} date - 날짜
 * @return {string} YYYY-MM-DD
 */
function formatDateToString(date) {
  if (!date) return '';

  if (typeof date === 'string') {
    // 이미 문자열이면 YYYY-MM-DD 형식 추출
    return date.substring(0, 10);
  }

  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return '';
}

/**
 * 월 말일 날짜 생성
 * @param {string} yearMonth - YYYY-MM
 * @return {string} YYYY-MM-DD (말일)
 */
function getMonthLastDay(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}
