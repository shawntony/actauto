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

    // 데이터 변환 (월급여더존다운로드 전체 컬럼 읽기)
    // ⚠️ 실제 시트 구조 기준 (2026-01-31 최종 검증 완료)
    // A(0):사원코드, B(1):사원명, C(2):부서, D(3):직급, E(4):직종
    // F(5):기본급, G(6):상여, H(7):식대수당, I(8):직책수당, J(9):연장근로수당
    // K(10):연차수당, L(11):야간수당, M(12):공휴일특근수당, N(13):기타수당
    // O(14):지급액계, P(15):국민연금, Q(16):건강보험, R(17):고용보험, S(18):장기요양보험료
    // T(19):소득세, U(20):지방소득세, V(21):연말정산소득세, W(22):연말정산지방소득세
    // X(23):연말정산선불특, Y(24):학자금상환액, Z(25):공제액계, AA(26):차인지급액
    const data = rawData.map((row, index) => {
      return {
        rowIndex: index + 2,
        // 기본 정보 (A~E)
        employeeCode: String(row[0] || '').trim(),  // A: 사원코드
        name: String(row[1] || '').trim(),          // B: 사원명
        department: String(row[2] || '').trim(),    // C: 부서
        position: String(row[3] || '').trim(),      // D: 직급
        jobType: String(row[4] || '').trim(),       // E: 직종
        // 급여 항목 (F~O)
        baseSalary: Number(row[5]) || 0,            // F: 기본급
        bonus: Number(row[6]) || 0,                 // G: 상여
        mealAllowance: Number(row[7]) || 0,         // H: 식대수당
        positionAllowance: Number(row[8]) || 0,     // I: 직책수당
        overtimeAllowance: Number(row[9]) || 0,     // J: 연장근로수당
        annualLeaveAllowance: Number(row[10]) || 0, // K: 연차수당
        nightAllowance: Number(row[11]) || 0,       // L: 야간수당
        holidayAllowance: Number(row[12]) || 0,     // M: 공휴일특근수당
        otherAllowance: Number(row[13]) || 0,       // N: 기타수당
        totalSalary: Number(row[14]) || 0,          // O: 지급액계
        // 보험 항목 (P~S)
        nationalPension: Number(row[15]) || 0,      // P: 국민연금
        healthInsurance: Number(row[16]) || 0,      // Q: 건강보험
        employmentInsurance: Number(row[17]) || 0,  // R: 고용보험
        longTermCare: Number(row[18]) || 0,         // S: 장기요양보험료
        // 세금 항목 (T~U)
        incomeTax: Number(row[19]) || 0,            // T: 소득세
        localIncomeTax: Number(row[20]) || 0,       // U: 지방소득세
        // 연말정산 항목 (V~X)
        yearEndIncomeTax: Number(row[21]) || 0,     // V: 연말정산소득세
        yearEndLocalTax: Number(row[22]) || 0,      // W: 연말정산지방소득세
        yearEndAdvance: Number(row[23]) || 0,       // X: 연말정산선불특
        // 기타 공제 (Y)
        scholarshipRepay: Number(row[24]) || 0,     // Y: 학자금상환액
        // 합계 (Z~AA)
        totalDeduction: Number(row[25]) || 0,       // Z: 공제액계
        netPay: Number(row[26]) || 0                // AA: 차인지급액
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
 * @return {Array} 32개 컬럼 배열 (A~AF)
 */
function convertDazoneToPayrollDB(month, dazoneRow, bankInfo) {
  // 월지급DB 32개 컬럼 생성 (A~AF)
  // 구조: 급여기준월(A) + 월급여더존다운로드 전체(B~AB) + 입금정보(AC~AF)
  const row = new Array(32).fill('');

  // A: 급여기준월 (YYYY-MM-DD 문자열 형식)
  row[0] = month;

  // B~E: 기본 정보 (더존 A~D 복사)
  row[1] = dazoneRow.employeeCode || '';  // B: 사원코드
  row[2] = dazoneRow.name || '';          // C: 사원명
  row[3] = dazoneRow.department || '';    // D: 부서
  row[4] = dazoneRow.position || '';      // E: 직급
  row[5] = dazoneRow.jobType || '';       // F: 직종

  // G~O: 급여 항목 (더존 F~N 복사)
  row[6] = dazoneRow.baseSalary || 0;           // G: 기본급
  row[7] = dazoneRow.bonus || 0;                // H: 상여
  row[8] = dazoneRow.mealAllowance || 0;        // I: 식대수당
  row[9] = dazoneRow.positionAllowance || 0;    // J: 직책수당
  row[10] = dazoneRow.overtimeAllowance || 0;   // K: 연장근로수당
  row[11] = dazoneRow.annualLeaveAllowance || 0;// L: 연차수당
  row[12] = dazoneRow.nightAllowance || 0;      // M: 야간수당
  row[13] = dazoneRow.holidayAllowance || 0;    // N: 공휴일특근수당
  row[14] = dazoneRow.otherAllowance || 0;      // O: 기타수당

  // P: 지급액계 (더존 O 복사)
  row[15] = dazoneRow.totalSalary || 0;         // P: 지급액계

  // Q~T: 보험 항목 (더존 P~S 복사)
  row[16] = dazoneRow.nationalPension || 0;     // Q: 국민연금
  row[17] = dazoneRow.healthInsurance || 0;     // R: 건강보험
  row[18] = dazoneRow.employmentInsurance || 0; // S: 고용보험
  row[19] = dazoneRow.longTermCare || 0;        // T: 장기요양보험료

  // U~V: 세금 항목 (더존 T~U 복사)
  row[20] = dazoneRow.incomeTax || 0;           // U: 소득세
  row[21] = dazoneRow.localIncomeTax || 0;      // V: 지방소득세

  // W~Y: 연말정산 항목 (더존 V~X 복사)
  row[22] = dazoneRow.yearEndIncomeTax || 0;    // W: 연말정산소득세
  row[23] = dazoneRow.yearEndLocalTax || 0;     // X: 연말정산지방소득세
  row[24] = dazoneRow.yearEndAdvance || 0;      // Y: 연말정산선불특

  // Z: 학자금상환액 (더존 Y 복사)
  row[25] = dazoneRow.scholarshipRepay || 0;    // Z: 학자금상환액

  // AA: 공제액계 (더존 Z 복사)
  row[26] = dazoneRow.totalDeduction || 0;      // AA: 공제액계

  // AB: 차인지급액 (더존 AA 복사)
  row[27] = dazoneRow.netPay || 0;              // AB: 차인지급액

  // AC: 입금처리여부 (시스템 기본값)
  row[28] = '대기';

  // AD~AE: 은행 정보 (급여데이터에서 조회)
  row[29] = bankInfo.bank || '';                // AD: 은행
  row[30] = bankInfo.accountNumber || '';       // AE: 계좌번호

  // AF: 예금주 (사원명과 동일)
  row[31] = dazoneRow.name || '';               // AF: 예금주

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

    // 저장 완료 후 월급여더존다운로드 시트 데이터 삭제
    let deletedRows = 0;
    try {
      const downloadSheet = ss.getSheetByName('월급여더존다운로드');
      if (downloadSheet && saved.length > 0) {
        const lastRow = downloadSheet.getLastRow();
        if (lastRow >= 2) {
          // 2행부터 마지막 행까지 삭제 (헤더는 유지)
          const rowsToDelete = lastRow - 1;
          downloadSheet.deleteRows(2, rowsToDelete);
          deletedRows = rowsToDelete;
        }
      }
    } catch (deleteError) {
      Logger.log('월급여더존다운로드 삭제 오류: ' + deleteError.message);
      // 삭제 오류는 치명적이지 않으므로 계속 진행
    }

    return {
      success: true,
      saved: saved,
      duplicates: duplicates,
      errors: errors,
      summary: {
        total: selectedData.length,
        savedCount: saved.length,
        duplicateCount: duplicates.length,
        errorCount: errors.length,
        deletedRows: deletedRows
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
