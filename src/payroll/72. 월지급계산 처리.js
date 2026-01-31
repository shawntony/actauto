/**
 * [V9] '월지급계산' 시트에서 주민번호 앞 6자리를 매칭 키로 사용하여 급여 계산
 *
 * ⚠️ 변경사항 (2026-01-30): 급여기본정보 → 급여데이터 시트로 통합
 *
 * 매칭 전략:
 * - 매칭 키: 급여데이터 C열(주민등록번호) 앞 6자리 (YYMMDD)
 * - 필터 조건: A열 (월) - targetMonth와 일치하는 데이터만 처리
 *
 * 데이터 흐름:
 * 1. 급여데이터 C열(주민등록번호) 앞 6자리 추출
 * 2. 보험 시트의 주민번호 앞 6자리와 매칭:
 *    - 국민연금: 주민번호 앞 6자리 매칭 → E열 (국민연금액)
 *    - 건강보험: 주민번호 앞 6자리 매칭 → F, H열 (건강보험료, 장기요양)
 *    - 고용보험: 주민번호 앞 6자리 매칭 → G, I열 (고용보험료)
 *    - 산재보험: 주민번호 앞 6자리 매칭 → J열 (산재보험료)
 * 3. 월지급계산 시트에 기록:
 *    - B열: 근무자명 (급여데이터 B열)
 *    - C열: 재직/퇴사 (급여데이터 G열 계약종료일로 계산)
 *    - D열: 총급여 (급여데이터 R열 합계금액)
 *    - E~J열: 보험료 (매칭된 데이터)
 * 4. 최종 계산: O열 = C - E - F - G - H - K - L - M - N
 * 5. 처리된 데이터(A:O)를 '월지급DB'에 값만 복사한 후,
 *    DB 시트의 P, Q, R, S열에 추가 계산을 수행하여 기록
 *
 * @param {string} targetMonth - 처리할 월 (예: '2025-09'). 통합 함수에서 전달받음.
 */
function matchAllPayrollData_V6(targetMonth) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const PAYMENT_CALC_SHEET = '월지급계산';
  const PAYMENT_DB_SHEET = '월지급DB';
  const PAYROLL_DATA_SHEET = '급여데이터'; // 변경: 급여기본정보 → 급여데이터
  const NATIONAL_PENSION_SHEET = '국민연금';
  const HEALTH_INSURANCE_SHEET = '건강보험';
  const EMPLOYMENT_INSURANCE_SHEET = '고용보험';
  const INDUSTRIAL_ACCIDENT_SHEET = '산재보험';

  const pcSheet = ss.getSheetByName(PAYMENT_CALC_SHEET);
  const dbSheet = ss.getSheetByName(PAYMENT_DB_SHEET);
  const pdSheet = ss.getSheetByName(PAYROLL_DATA_SHEET); // 변경: piSheet → pdSheet
  const npSheet = ss.getSheetByName(NATIONAL_PENSION_SHEET);
  const hiSheet = ss.getSheetByName(HEALTH_INSURANCE_SHEET);
  const eiSheet = ss.getSheetByName(EMPLOYMENT_INSURANCE_SHEET);
  const iaSheet = ss.getSheetByName(INDUSTRIAL_ACCIDENT_SHEET);

  // --- 시트 존재 여부 검증 ---
  if (!pcSheet || !dbSheet || !pdSheet || !npSheet || !hiSheet || !eiSheet || !iaSheet) {
    ui.alert(`오류: 필수 시트 중 일부를 찾을 수 없습니다.`);
    return;
  }

  // ✅ 개별 실행 시 새로운 UI 모달 표시
  if (!targetMonth) {
    // 새로운 UI 모달 표시
    showMonthlyPayrollUI();
    return;
  }

  // 통합 실행 시에는 기존 로직 유지 (A열 업데이트)
  // ✅ A열 업데이트 (해당 시트만)
  updateSheetMonthColumn(pcSheet, targetMonth, PAYMENT_CALC_SHEET);

  const startRow = 2; // 데이터 시작 행
  const pcLastRow = pcSheet.getLastRow();

  if (pcLastRow < startRow) {
    ui.alert(`경고: "${PAYMENT_CALC_SHEET}" 시트에 처리할 데이터(2행 이하)가 없습니다.`);
    return;
  }

  // ✅ A열 확인: fillMonthDataInSheets에서 이미 입력했으므로 건너뜀
  // 참고: A열은 "YYYY-MM-DD" (말일) 형식으로 이미 채워져 있음

  // --- 월지급계산 시트 인덱스 정의 (0-based for array access) ---
  const B_COL_START = 2; // B열 (1-based index) - 쓰기 시작 위치
  const PC_DATA_COLS_WRITE = 14; // B열부터 O열까지 총 14개 열
  const PC_DATA_COLS_TOTAL = 15; // A열부터 O열까지 총 15개 열
  const C_COL_INDEX = 2; // pcKeysAndCalcData 배열에서 C열 인덱스
  const K_COL_INDEX = 10;
  const L_COL_INDEX = 11;
  const M_COL_INDEX = 12;
  const N_COL_INDEX = 13;
  const O_COL_INDEX_ARRAY = 13; // O열 index within the 14-column (B:O) writing array
  
  // 데이터 변환 헬퍼 함수
  const numberify = (value) => {
    const num = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  };
  
  // --- 1. 수식 보존을 위한 값만 읽기 (A열, C열, K~N열) ---
  const pcKeysAndCalcData = pcSheet.getRange(startRow, 1, pcLastRow - startRow + 1, N_COL_INDEX + 1).getValues();

  // --- 주민번호 앞 6자리 추출 함수 ---
  const extractResidentIdKey = (residentId) => {
    if (!residentId) return '';
    const cleaned = String(residentId).replace(/[-\s]/g, '');
    return cleaned.substring(0, 6);
  };

  // --- 2~6. 데이터 준비 ---

  // 2. 급여데이터 B, C, G, R열 읽기 (C열에서 주민번호 앞 6자리 추출)
  const pdLastRow = pdSheet.getLastRow();
  const pdDataBCGR = []; // B(근무자명), C(주민번호 앞6자리), G(계약종료일→재직/퇴사), R(합계금액)
  if (pdLastRow >= startRow) {
      // 급여데이터: B(근무자명), C(주민등록번호), G(계약종료일), R(합계금액)
      const pdRange = pdSheet.getRange(startRow, 1, pdLastRow - startRow + 1, 18); // A~R열
      const pdValues = pdRange.getValues();

      pdValues.forEach((row) => {
          const nameB = row[1];                        // B열: 근무자명
          const residentId = String(row[2]).trim();    // C열: 주민등록번호
          const idKey = extractResidentIdKey(residentId);  // 앞 6자리 추출

          // G열(계약종료일)로 재직/퇴사 판단
          const quitDate = row[6];  // G열: 계약종료일
          const statusG = (quitDate && quitDate !== '') ? '퇴사' : '재직';

          const salaryR = row[17];  // R열: 합계금액 (총급여)

          pdDataBCGR.push({
              nameB: nameB,
              idKey: idKey,
              statusG: statusG,
              salaryH: salaryR  // 변수명은 유지 (호환성)
          });
      });
  }

  // 3. 국민연금 매칭 - 주민번호 앞 6자리 기준
  const npLastRow = npSheet.getLastRow();
  const npMap = new Map();
  if (npLastRow >= startRow) {
      const npData = npSheet.getRange(startRow, 1, npLastRow - startRow + 1, 9).getValues();
      npData.forEach(row => {
          const monthValue = String(row[0]).trim();  // A열: 월
          const residentId = String(row[3]).trim();  // D열: 주민번호 ✓
          const idKey = extractResidentIdKey(residentId);  // 앞 6자리 추출

          if (monthValue && idKey) {
              const compositeKey = monthValue + "|" + idKey;
              npMap.set(compositeKey, row[8]);  // I열: 국민연금액
          }
      });
  }

  // 4. 건강보험 매칭 - 주민번호 앞 6자리 기준
  const hiLastRow = hiSheet.getLastRow();
  const hiMap = new Map();
  if (hiLastRow >= startRow) {
      const HI_DATA_COLS = 28;
      const hiData = hiSheet.getRange(startRow, 1, hiLastRow - startRow + 1, HI_DATA_COLS).getValues();
      hiData.forEach(row => {
          const monthValue = String(row[0]).trim();  // A열: 월
          const residentId = String(row[3]).trim();  // D열: 주민번호 ✓
          const idKey = extractResidentIdKey(residentId);  // 앞 6자리 추출

          if (monthValue && idKey && row.length > 27) {
              const compositeKey = monthValue + "|" + idKey;
              hiMap.set(compositeKey, {
                  valueF: row[14],  // O열: 건강보험료
                  valueH: row[27]   // AB열: 장기요양보험료
              });
          }
      });
  }

  // 5. 고용보험 매칭 - 주민번호 앞 6자리 기준
  const eiLastRow = eiSheet.getLastRow();
  const eiMap = new Map();
  if (eiLastRow >= startRow) {
      const EI_DATA_COLS = 26;
      const eiData = eiSheet.getRange(startRow, 1, eiLastRow - startRow + 1, EI_DATA_COLS).getValues();
      eiData.forEach(row => {
          const monthValue = String(row[0]).trim();  // A열: 월
          const residentId = String(row[4]).trim();  // E열: 주민번호 ✓
          const idKey = extractResidentIdKey(residentId);  // 앞 6자리 추출

          if (monthValue && idKey && row.length > 25) {
              const compositeKey = monthValue + "|" + idKey;
              eiMap.set(compositeKey, {
                  valueG: row[10],  // K열: 직원고용보험료
                  valueI: row[25]   // Z열: 사업주고안직능보험료
              });
          }
      });
  }

  // 6. 산재보험 매칭 - 주민번호 앞 6자리 기준
  const iaLastRow = iaSheet.getLastRow();
  const iaMap = new Map();
  if (iaLastRow >= startRow) {
      const IA_DATA_COLS = 15;
      const iaData = iaSheet.getRange(startRow, 1, iaLastRow - startRow + 1, IA_DATA_COLS).getValues();
      iaData.forEach(row => {
          const monthValue = String(row[0]).trim();  // A열: 월
          const residentId = String(row[3]).trim();  // D열: 주민번호 (추정)
          const idKey = extractResidentIdKey(residentId);  // 앞 6자리 추출

          if (monthValue && idKey && row.length > 14) {
              const compositeKey = monthValue + "|" + idKey;
              iaMap.set(compositeKey, row[14]);  // O열: 산재보험료
          }
      });
  }


  // --- 7. 결과 배열 생성 및 계산 ---
  const resultsToWrite = []; // B열부터 O열까지의 값을 저장할 배열

  pcKeysAndCalcData.forEach((pcRow, rowIndex) => {
    const monthValue = String(pcRow[0]).trim(); // A열: 월

    // newRow: B,C,D,E,F,G,H,I,J,K,L,M,N,O (14개 항목)
    const newRow = Array(PC_DATA_COLS_WRITE).fill('');

    // A. 급여데이터 데이터 복사 (행 순서대로)
    if (rowIndex < pdDataBCGR.length) {
        newRow[0] = pdDataBCGR[rowIndex].nameB;    // B열 <- 근무자명
        newRow[1] = pdDataBCGR[rowIndex].statusG;  // C열 <- 재직/퇴사 (계약종료일로 계산)
        newRow[2] = pdDataBCGR[rowIndex].salaryH;  // D열 <- 합계금액 (총급여)

        const idKey = pdDataBCGR[rowIndex].idKey;  // 주민번호 앞 6자리

        // B. 보험 데이터 매칭 (월 + 주민번호 앞 6자리)
        if (monthValue && idKey) {
            const compositeKey = monthValue + "|" + idKey;

            // 국민연금 매칭
            if (npMap.has(compositeKey)) newRow[3] = npMap.get(compositeKey);

            // 건강보험 매칭
            if (hiMap.has(compositeKey)) {
                const hiValues = hiMap.get(compositeKey);
                newRow[4] = hiValues.valueF;  // F열
                newRow[6] = hiValues.valueH;  // H열
            }

            // 고용보험 매칭
            if (eiMap.has(compositeKey)) {
                const eiValues = eiMap.get(compositeKey);
                newRow[5] = eiValues.valueG;  // G열
                newRow[7] = eiValues.valueI;  // I열
            }

            // 산재보험 매칭
            if (iaMap.has(compositeKey)) {
                newRow[8] = iaMap.get(compositeKey);  // J열
            }
        }
    }

    // C. K, L, M, N열 값 복사
    newRow[9] = pcRow[K_COL_INDEX];
    newRow[10] = pcRow[L_COL_INDEX];
    newRow[11] = pcRow[M_COL_INDEX];
    newRow[12] = pcRow[N_COL_INDEX];

    // D. 최종 계산 (O열) 로직: C-E-F-G-H-K-L-M-N
    // B=newRow[0], C=newRow[1], D=newRow[2], E=newRow[3], F=newRow[4], G=newRow[5], H=newRow[6],
    // I=newRow[7], J=newRow[8], K=newRow[9], L=newRow[10], M=newRow[11], N=newRow[12]

    const C = numberify(newRow[1]);
    const E = numberify(newRow[3]);
    const F = numberify(newRow[4]);
    const G = numberify(newRow[5]);
    const H = numberify(newRow[6]);
    const K = numberify(newRow[9]);
    const L = numberify(newRow[10]);
    const M = numberify(newRow[11]);
    const N = numberify(newRow[12]);

    const finalResult = C - E - F - G - H - K - L - M - N;

    // O열 (newRow 인덱스 13)에 결과 입력
    newRow[O_COL_INDEX_ARRAY] = finalResult;

    resultsToWrite.push(newRow);
  });

  // --- 8. '월지급계산' 시트에 결과 쓰기 (B열부터 O열까지) ---
  if (resultsToWrite.length > 0) {
      pcSheet.getRange(startRow, B_COL_START, resultsToWrite.length, PC_DATA_COLS_WRITE)
             .setValues(resultsToWrite);
  }
  
  // --- 9. DB 시트에 값만 복사 (A열~O열) 및 P~S열 계산 및 추가 기록 ---
  if (resultsToWrite.length > 0) {
      // 9-1. 월지급계산 시트에서 A열부터 O열까지 최종 값을 가져옵니다.
      const rowCount = resultsToWrite.length;
      const sourceDataRange = pcSheet.getRange(startRow, 1, rowCount, PC_DATA_COLS_TOTAL);
      const valuesToCopy = sourceDataRange.getValues();
      
      const dbStartRow = dbSheet.getLastRow() + 1;

      // 9-2. 월지급DB 시트에 A열부터 O열까지 값만 붙여넣기
      dbSheet.getRange(dbStartRow, 1, rowCount, PC_DATA_COLS_TOTAL)
             .setValues(valuesToCopy);

      // 9-3. P, Q, R, S열 계산 및 배열 준비
      const resultsForPQRS = [];

      // A열:0, B열:1, E열:4, F열:5, G열:6, H열:7, I열:8, J열:9, O열:14 (0-based)
      valuesToCopy.forEach(row => {

          const E = numberify(row[4]);
          const F = numberify(row[5]);
          const G = numberify(row[6]);
          const H = numberify(row[7]);
          const I = numberify(row[8]);
          const J = numberify(row[9]);
          const O = numberify(row[14]);

          // P열 계산: E열:H열 합 (공제액 합계 1)
          const P_val = E + F + G + H;

          // Q열 계산: E열:I열 합 (공제액 합계 2)
          const Q_val = P_val + I;

          // R열 계산: J열 값
          const R_val = J;

          // S열 계산: O열:R열 합
          // O열 (최종 지급액) + P열 + Q열 + R열
          const S_val = O + P_val + Q_val + R_val;
          
          // 배열 순서: P, Q, R, S
          resultsForPQRS.push([P_val, Q_val, R_val, S_val]);
      });

      // 9-4. 월지급DB 시트에 P열부터 S열까지 값만 붙여넣기
      const P_COL_START = 16; // P열 (1-based index)
      const PQRS_COLS = 4;

      dbSheet.getRange(dbStartRow, P_COL_START, rowCount, PQRS_COLS)
             .setValues(resultsForPQRS);
  }

  ui.alert(`✅ 급여 데이터 통합 매칭 및 최종 계산이 완료되었으며,
             '월지급DB' 시트에는 A열부터 S열까지 데이터가 값으로 기록되었습니다.`);

  // 월지급DB 시트의 A열 마지막 데이터 셀로 이동
  const dbLastRowA = dbSheet.getLastRow();
  if (dbLastRowA >= 1) {
    dbSheet.activate();
    dbSheet.getRange(dbLastRowA, 1).activate();
  }
}

/**
 * 단일 시트의 A열에 월 데이터 업데이트
 * B열에 데이터가 있는 행에 대해 A열을 targetMonth (말일 형식)로 업데이트
 *
 * @param {Sheet} sheet - 업데이트할 시트 객체
 * @param {string} targetMonth - 입력할 월 (예: '2026-01')
 * @param {string} sheetName - 시트 이름 (로깅용)
 */
function updateSheetMonthColumn(sheet, targetMonth, sheetName) {
  const ui = SpreadsheetApp.getUi();

  // YYYY-MM 형식을 YYYY-MM-DD (말일) 형식으로 변환
  const targetDate = convertToLastDayOfMonth(targetMonth);
  Logger.log(`[updateSheetMonthColumn] ${sheetName} - targetMonth: ${targetMonth} → targetDate: ${targetDate}`);

  const lastRow = sheet.getLastRow();

  // 2행 미만이면 데이터가 없는 것
  if (lastRow < 2) {
    Logger.log(`[${sheetName}] 데이터 없음 (lastRow < 2)`);
    return;
  }

  // A열과 B열 데이터 읽기 (2행부터 시작)
  const numRows = lastRow - 1; // 헤더 제외
  const dataRange = sheet.getRange(2, 1, numRows, 2); // A열, B열
  const data = dataRange.getValues();

  let filledCount = 0;

  // 각 행 처리: B열에 데이터가 있으면 A열을 무조건 targetDate로 업데이트
  const updatedData = data.map((row, idx) => {
    const bValue = row[1]; // B열

    // B열에 데이터가 있는지 확인
    const hasBValue = bValue !== "" && bValue !== null && typeof bValue !== 'undefined';

    // ✅ B열에 데이터가 있으면 A열을 무조건 targetDate로 업데이트
    if (hasBValue) {
      row[0] = targetDate;
      filledCount++;
    }

    return row;
  });

  Logger.log(`[${sheetName}] 업데이트: ${filledCount}행`);

  // 업데이트된 데이터 쓰기
  try {
    dataRange.setValues(updatedData);
    Logger.log(`[${sheetName}] setValues 성공`);
  } catch (e) {
    Logger.log(`[${sheetName}] setValues 오류: ${e.message}`);
    ui.alert(`❌ ${sheetName}: 데이터 쓰기 오류`);
    return;
  }

  // ✅ A열을 텍스트 형식으로 강제 설정 (날짜 자동 변환 방지)
  try {
    const aColumnRange = sheet.getRange(2, 1, numRows, 1);
    aColumnRange.setNumberFormat('@');
    Logger.log(`[${sheetName}] 텍스트 포맷 설정 성공`);
  } catch (e) {
    Logger.log(`[${sheetName}] 포맷 설정 오류: ${e.message}`);
  }

  Logger.log(`[updateSheetMonthColumn] ${sheetName} 완료 - ${filledCount}행 업데이트`);
}

/**
 * YYYY-MM 형식의 월을 YYYY-MM-DD (해당 월의 말일) 형식으로 변환
 *
 * @param {string} monthString - YYYY-MM 형식의 월 (예: '2026-01')
 * @return {string} YYYY-MM-DD 형식의 날짜 (예: '2026-01-31')
 */
function convertToLastDayOfMonth(monthString) {
  // YYYY-MM에서 년도와 월 추출
  const [year, month] = monthString.split('-').map(num => parseInt(num, 10));

  // 다음 달의 1일을 생성한 후 하루 빼면 이번 달의 말일
  const nextMonth = new Date(year, month, 1); // month는 0부터 시작하므로 month를 그대로 넣으면 다음 달
  const lastDay = new Date(nextMonth - 1); // 하루 빼기

  // YYYY-MM-DD 형식으로 반환
  const lastDayString = `${year}-${String(month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

  return lastDayString;
}

/**
 * D열(주민번호) 데이터 검증
 * 월지급계산 전에 주민번호 데이터가 올바른지 확인
 *
 * @param {Sheet} sheet - 급여기본정보 시트
 * @param {number} startRow - 시작 행
 * @param {number} lastRow - 마지막 행
 * @return {Object} 검증 결과 { valid: boolean, errors: string[] }
 */
function validateResidentIdColumn(sheet, startRow, lastRow) {
  const idData = sheet.getRange(startRow, 4, lastRow - startRow + 1, 1).getValues();
  const errors = [];

  idData.forEach((row, index) => {
    const residentId = String(row[0]).replace(/[-\s]/g, '').trim();
    if (!residentId || residentId === '') {
      errors.push(`행 ${startRow + index}: 주민번호(D열) 값이 비어있습니다.`);
    } else if (residentId.length < 6) {
      errors.push(`행 ${startRow + index}: 주민번호가 6자리 미만입니다 (${residentId})`);
    }
  });

  return { valid: errors.length === 0, errors };
}