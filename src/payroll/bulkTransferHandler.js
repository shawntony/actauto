/**
 * 대량이체 등록 핸들러
 *
 * 역할:
 * - 월지급DB에서 데이터 읽기
 * - 입금 대상 선택 UI 제공
 * - 대량이체 시트에 데이터 생성
 * - 은행/계좌 정보 검증
 *
 * 버전: 1.0
 * 작성일: 2026-01-31
 */

// ============================================
// UI 표시
// ============================================

/**
 * 대량이체 등록 UI 표시
 */
function showBulkTransferUI() {
  const html = HtmlService.createHtmlOutputFromFile('payroll/html/bulkTransferUI')
    .setWidth(650)
    .setHeight(700);

  SpreadsheetApp.getUi().showModalDialog(html, '대량이체 등록');
}

// ============================================
// 데이터 읽기
// ============================================

/**
 * 월지급DB에서 사용 가능한 월 목록 가져오기
 * @return {Array} ["2026-02", "2026-01", ...] (최근 순)
 */
function getAvailableMonthsFromPayrollDB() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName('월지급DB');

    if (!dbSheet) {
      return [];
    }

    const lastRow = dbSheet.getLastRow();
    if (lastRow < 2) {
      return [];
    }

    // A열(급여기준월) 읽기
    const dates = dbSheet.getRange(2, 1, lastRow - 1, 1).getValues();

    // YYYY-MM 형식으로 변환 및 중복 제거
    const months = new Set();
    dates.forEach(row => {
      if (row[0]) {
        const dateStr = formatDateToString(row[0]);
        const yearMonth = dateStr.substring(0, 7); // "YYYY-MM"
        months.add(yearMonth);
      }
    });

    // 배열로 변환 및 정렬 (최근 순)
    return Array.from(months).sort().reverse();

  } catch (error) {
    Logger.log('월 목록 조회 오류: ' + error.message);
    return [];
  }
}

/**
 * 특정 월의 월지급DB 데이터 읽기
 * @param {string} month - 급여기준월 (YYYY-MM)
 * @return {Object} {success, data[], month}
 */
function readPayrollDBByMonth(month) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName('월지급DB');

    if (!dbSheet) {
      return {
        success: false,
        error: '월지급DB 시트를 찾을 수 없습니다.'
      };
    }

    const lastRow = dbSheet.getLastRow();
    if (lastRow < 2) {
      return {
        success: false,
        error: '월지급DB에 데이터가 없습니다.'
      };
    }

    // 전체 데이터 읽기
    const dataRange = dbSheet.getRange(2, 1, lastRow - 1, dbSheet.getLastColumn());
    const rawData = dataRange.getValues();

    // 해당 월 데이터만 필터링
    const monthPrefix = month; // "YYYY-MM"
    const filteredData = rawData.filter(row => {
      const dateStr = formatDateToString(row[0]); // A: 급여기준월
      return dateStr.startsWith(monthPrefix);
    });

    // 필요한 컬럼만 추출 (v3.0 구조)
    const data = filteredData.map((row, index) => {
      return {
        rowIndex: index,
        name: String(row[2] || '').trim(),        // C: 사원명
        netPay: Number(row[27]) || 0,             // AB: 차인지급액
        bank: String(row[29] || '').trim(),       // AD: 은행
        accountNumber: String(row[30] || '').trim(), // AE: 계좌번호
        hasBank: Boolean(row[29] && row[30])      // 은행 정보 있는지
      };
    }).filter(item => item.name && item.netPay > 0); // 이름과 금액이 있는 항목만

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
// 데이터 검증
// ============================================

/**
 * 대량이체 데이터 검증
 * @param {Array} payrollData - 월지급DB 데이터
 * @return {Object} {valid, errors[], warnings[]}
 */
function validateBulkTransferData(payrollData) {
  const errors = [];
  const warnings = [];

  payrollData.forEach((item, index) => {
    // 1. 필수 항목 검증
    if (!item.name) {
      errors.push(`${index + 1}번째: 이름 없음`);
    }

    if (!item.netPay || item.netPay <= 0) {
      errors.push(`${index + 1}번째 (${item.name}): 입금액 오류`);
    }

    // 2. 은행 정보 검증 (경고)
    if (!item.bank) {
      warnings.push(`${index + 1}번째 (${item.name}): 은행 정보 없음`);
    }

    if (!item.accountNumber) {
      warnings.push(`${index + 1}번째 (${item.name}): 계좌번호 없음`);
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}

// ============================================
// 대량이체 데이터 생성
// ============================================

/**
 * 입금통장표시 생성
 * @param {string} month - 급여기준월 (YYYY-MM-DD 또는 YYYY-MM)
 * @return {string} "YYYY-MM급여"
 */
function createDepositLabel(month) {
  // "YYYY-MM-DD" 또는 "YYYY-MM"에서 "YYYY-MM" 추출
  const yearMonth = month.substring(0, 7);
  return yearMonth + '급여';
}

/**
 * 대량이체 시트에 데이터 생성
 * @param {string} month - 급여기준월 (YYYY-MM)
 * @param {Array} selectedData - 선택된 데이터 [{name, netPay, bank, accountNumber}]
 * @return {Object} {success, count, month, depositLabel}
 */
function createBulkTransferData(month, selectedData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let transferSheet = ss.getSheetByName('대량이체');

    // 시트가 없으면 생성
    if (!transferSheet) {
      transferSheet = ss.insertSheet('대량이체');

      // 헤더 추가 (실제 시트 구조에 맞춤)
      const headers = [
        '입금은행',
        '입금계좌번호',
        '입금액',
        '예상예금주',
        '입금통장표시',
        '출금통장표시',
        '메모',
        'CMS코드',
        '받는분 휴대폰번호'
      ];
      transferSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      transferSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }

    // 입금통장표시 생성
    const depositLabel = createDepositLabel(month);

    // 데이터 변환 (9개 컬럼 - 실제 시트 구조)
    const rows = selectedData.map(item => {
      return [
        item.bank || '',        // A: 입금은행
        item.accountNumber || '', // B: 입금계좌번호
        item.netPay,            // C: 입금액
        item.name,              // D: 예상예금주
        depositLabel,           // E: 입금통장표시
        depositLabel,           // F: 출금통장표시
        '',                     // G: 메모
        '',                     // H: CMS코드
        ''                      // I: 받는분 휴대폰번호
      ];
    });

    // 시트에 추가
    const lastRow = transferSheet.getLastRow();
    const startRow = lastRow + 1;

    transferSheet.getRange(startRow, 1, rows.length, 9).setValues(rows);

    // 금액 컬럼 서식 지정 (C열)
    transferSheet.getRange(startRow, 3, rows.length, 1).setNumberFormat('#,##0');

    // 월지급DB의 입금처리여부 업데이트
    const processedNames = selectedData.map(item => item.name);
    const updateResult = updatePaymentStatus(month, processedNames, '완료');

    if (!updateResult.success) {
      Logger.log('입금처리여부 업데이트 실패: ' + updateResult.error);
    }

    return {
      success: true,
      count: rows.length,
      month: month,
      depositLabel: depositLabel,
      startRow: startRow,
      endRow: startRow + rows.length - 1,
      updatedCount: updateResult.updatedCount || 0
    };

  } catch (error) {
    return {
      success: false,
      error: '대량이체 생성 오류: ' + error.message
    };
  }
}

// ============================================
// 입금처리여부 업데이트
// ============================================

/**
 * 월지급DB의 입금처리여부 업데이트
 * @param {string} month - 급여기준월 (YYYY-MM)
 * @param {Array} processedNames - 처리된 직원 이름 목록
 * @param {string} status - 상태 ("완료" 또는 "대기")
 * @return {Object} {success, updatedCount}
 */
function updatePaymentStatus(month, processedNames, status = '완료') {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName('월지급DB');

    if (!dbSheet) {
      return {
        success: false,
        error: '월지급DB 시트를 찾을 수 없습니다.'
      };
    }

    const lastRow = dbSheet.getLastRow();
    if (lastRow < 2) {
      return { success: true, updatedCount: 0 };
    }

    // 전체 데이터 읽기
    const data = dbSheet.getRange(2, 1, lastRow - 1, dbSheet.getLastColumn()).getValues();

    let updatedCount = 0;

    // 해당 월 + 이름으로 찾아서 AC열 업데이트 (v3.0 구조)
    data.forEach((row, index) => {
      const dateStr = formatDateToString(row[0]); // A: 급여기준월
      const name = String(row[2] || '').trim();   // C: 사원명

      if (dateStr.startsWith(month) && processedNames.includes(name)) {
        const rowNumber = index + 2;
        dbSheet.getRange(rowNumber, 29).setValue(status); // AC열 (28+1)
        updatedCount++;
      }
    });

    return {
      success: true,
      updatedCount: updatedCount
    };

  } catch (error) {
    return {
      success: false,
      error: '상태 업데이트 오류: ' + error.message
    };
  }
}

// ============================================
// CSV 내보내기
// ============================================

/**
 * 대량이체 시트를 CSV 파일로 내보내기
 * @return {Object} {success, csv, filename}
 */
function exportBulkTransferCSV() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transferSheet = ss.getSheetByName('대량이체');

    if (!transferSheet) {
      return {
        success: false,
        error: '대량이체 시트가 없습니다.'
      };
    }

    const lastRow = transferSheet.getLastRow();
    if (lastRow < 2) {
      return {
        success: false,
        error: '대량이체 시트에 데이터가 없습니다.'
      };
    }

    // 데이터 읽기 (헤더 포함, 9개 컬럼)
    const data = transferSheet.getRange(1, 1, lastRow, 9).getValues();

    // CSV 변환
    const csv = data.map(row => {
      return row.map(cell => {
        // 문자열에 쉼표나 따옴표가 있으면 이스케이프 처리
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return '"' + cell.replace(/"/g, '""') + '"';
        }
        return cell;
      }).join(',');
    }).join('\n');

    // BOM 추가 (Excel에서 한글 깨짐 방지)
    const csvWithBOM = '\uFEFF' + csv;

    return {
      success: true,
      csv: csvWithBOM,
      filename: '해림급여이체.csv',
      rowCount: lastRow - 1  // 헤더 제외
    };

  } catch (error) {
    return {
      success: false,
      error: 'CSV 생성 오류: ' + error.message
    };
  }
}

// ============================================
// 통계
// ============================================

/**
 * 대량이체 통계 계산
 * @param {Array} transferData - 대량이체 데이터
 * @return {Object} {count, totalAmount, avgAmount, bankBreakdown}
 */
function calculateBulkTransferStats(transferData) {
  const count = transferData.length;
  const totalAmount = transferData.reduce((sum, item) => sum + item.netPay, 0);
  const avgAmount = count > 0 ? Math.round(totalAmount / count) : 0;

  // 은행별 집계
  const bankBreakdown = {};
  transferData.forEach(item => {
    const bank = item.bank || '(정보없음)';

    if (!bankBreakdown[bank]) {
      bankBreakdown[bank] = { count: 0, total: 0 };
    }

    bankBreakdown[bank].count++;
    bankBreakdown[bank].total += item.netPay;
  });

  return {
    count: count,
    totalAmount: totalAmount,
    avgAmount: avgAmount,
    bankBreakdown: bankBreakdown
  };
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
