/**
 * [V6] '월지급계산' 시트의 B열(월)을 키로 사용하여 급여기본정보 및 보험 데이터를 매칭 및 최종 계산(O열)합니다.
 * A열의 기존 데이터를 보존하고, B~O열에 데이터를 씁니다.
 * - 급여기본정보 B열 → 월지급계산 B열 (행 순서대로)
 * - 급여기본정보 G열 → 월지급계산 C열 (행 순서대로)
 * - 급여기본정보 H열 → 월지급계산 D열 (행 순서대로)
 * - 건강보험 E열, 국민연금 E열 매칭 → E~F, H열
 * - 고용보험 D열, 산재보험 D열 매칭 → G, I, J열
 * 처리된 데이터(A:O)를 '월지급DB'에 값만 복사한 후,
 * DB 시트의 P, Q, R, S열에 추가 계산을 수행하여 기록합니다.
 */
function matchAllPayrollData_V6() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const PAYMENT_CALC_SHEET = '월지급계산';
  const PAYMENT_DB_SHEET = '월지급DB';
  const PAYROLL_INFO_SHEET = '급여기본정보'; // 추가
  const NATIONAL_PENSION_SHEET = '국민연금';
  const HEALTH_INSURANCE_SHEET = '건강보험';
  const EMPLOYMENT_INSURANCE_SHEET = '고용보험';
  const INDUSTRIAL_ACCIDENT_SHEET = '산재보험';

  const pcSheet = ss.getSheetByName(PAYMENT_CALC_SHEET);
  const dbSheet = ss.getSheetByName(PAYMENT_DB_SHEET);
  const piSheet = ss.getSheetByName(PAYROLL_INFO_SHEET); // 추가
  const npSheet = ss.getSheetByName(NATIONAL_PENSION_SHEET);
  const hiSheet = ss.getSheetByName(HEALTH_INSURANCE_SHEET);
  const eiSheet = ss.getSheetByName(EMPLOYMENT_INSURANCE_SHEET);
  const iaSheet = ss.getSheetByName(INDUSTRIAL_ACCIDENT_SHEET);

  // --- 시트 존재 여부 검증 ---
  if (!pcSheet || !dbSheet || !piSheet || !npSheet || !hiSheet || !eiSheet || !iaSheet) {
    ui.alert(`오류: 필수 시트 중 일부를 찾을 수 없습니다.`);
    return;
  }

  const startRow = 2; // 데이터 시작 행
  const pcLastRow = pcSheet.getLastRow();

  if (pcLastRow < startRow) {
    ui.alert(`경고: "${PAYMENT_CALC_SHEET}" 시트에 처리할 데이터(2행 이하)가 없습니다.`);
    return;
  }

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

  // --- 2~6. 데이터 준비 ---

  // 2. 급여기본정보 B, G, H열 전체 읽기 (행 순서대로 사용)
  const piLastRow = piSheet.getLastRow();
  const piDataBGH = []; // B, G, H열 데이터 배열
  if (piLastRow >= startRow) {
      // B열(2), G열(7), H열(8) 읽기
      const piRangeB = piSheet.getRange(startRow, 2, piLastRow - startRow + 1, 1);
      const piRangeGH = piSheet.getRange(startRow, 7, piLastRow - startRow + 1, 2);
      const piValuesB = piRangeB.getValues();
      const piValuesGH = piRangeGH.getValues();

      piValuesB.forEach((rowB, index) => {
          piDataBGH.push({
              valueB: rowB[0],
              valueC: piValuesGH[index][0],
              valueD: piValuesGH[index][1]
          });
      });
  }

  // 3. 국민연금 (I열 -> E열) - A열과 E열(월) 복합 키
  const npLastRow = npSheet.getLastRow();
  const npMap = new Map();
  if (npLastRow >= startRow) {
      const npData = npSheet.getRange(startRow, 1, npLastRow - startRow + 1, 9).getValues();
      npData.forEach(row => {
          const keyA = String(row[0]).trim();
          const keyE = String(row[4]).trim(); // E열(index 4) - 월
          if (keyA && keyE) {
              const compositeKey = keyA + "|" + keyE;
              npMap.set(compositeKey, row[8]); // I열(index 8)
          }
      });
  }

  // 4. 건강보험 (O열 -> F열, AB열 -> H열) - A열과 E열(월) 복합 키
  const hiLastRow = hiSheet.getLastRow();
  const hiMap = new Map();
  if (hiLastRow >= startRow) {
      const HI_DATA_COLS = 28;
      const hiData = hiSheet.getRange(startRow, 1, hiLastRow - startRow + 1, HI_DATA_COLS).getValues();
      const E_COL_INDEX = 4; const O_COL_INDEX = 14; const AB_COL_INDEX = 27;
      hiData.forEach(row => {
          const keyA = String(row[0]).trim();
          const keyE = String(row[E_COL_INDEX]).trim(); // E열 - 월
          if (keyA && keyE && row.length > AB_COL_INDEX) {
              const compositeKey = keyA + "|" + keyE;
              hiMap.set(compositeKey, { valueF: row[O_COL_INDEX], valueH: row[AB_COL_INDEX] });
          }
      });
  }

  // 5. 고용보험 (K열 -> G열, Z열 -> I열) - A열과 D열(월) 복합 키
  const eiLastRow = eiSheet.getLastRow();
  const eiMap = new Map();
  if (eiLastRow >= startRow) {
      const EI_DATA_COLS = 26;
      const eiData = eiSheet.getRange(startRow, 1, eiLastRow - startRow + 1, EI_DATA_COLS).getValues();
      const D_COL_INDEX = 3; const K_COL_INDEX = 10; const Z_COL_INDEX = 25;
      eiData.forEach(row => {
          const keyA = String(row[0]).trim();
          const keyD = String(row[D_COL_INDEX]).trim(); // D열 - 월
          if (keyA && keyD && row.length > Z_COL_INDEX) {
              const compositeKey = keyA + "|" + keyD;
              eiMap.set(compositeKey, { valueG: row[K_COL_INDEX], valueI: row[Z_COL_INDEX] });
          }
      });
  }

  // 6. 산재보험 (O열 -> J열) - A열과 D열(월) 복합 키
  const iaLastRow = iaSheet.getLastRow();
  const iaMap = new Map();
  if (iaLastRow >= startRow) {
      const IA_DATA_COLS = 15;
      const iaData = iaSheet.getRange(startRow, 1, iaLastRow - startRow + 1, IA_DATA_COLS).getValues();
      const D_COL_INDEX = 3; const O_COL_INDEX = 14;
      iaData.forEach(row => {
          const keyA = String(row[0]).trim();
          const keyD = String(row[D_COL_INDEX]).trim(); // D열 - 월
          if (keyA && keyD && row.length > O_COL_INDEX) {
              const compositeKey = keyA + "|" + keyD;
              iaMap.set(compositeKey, row[O_COL_INDEX]);
          }
      });
  }


  // --- 7. 결과 배열 생성 및 계산 ---
  const resultsToWrite = []; // B열부터 O열까지의 값을 저장할 배열

  pcKeysAndCalcData.forEach((pcRow, rowIndex) => {
    const keyA = String(pcRow[0]).trim(); // A열 값

    // newRow: B,C,D,E,F,G,H,I,J,K,L,M,N,O (14개 항목)
    const newRow = Array(PC_DATA_COLS_WRITE).fill('');

    // A. 급여기본정보 데이터 복사 (행 순서대로)
    if (rowIndex < piDataBGH.length) {
        newRow[0] = piDataBGH[rowIndex].valueB; // B열 <- 급여기본정보 B열
        newRow[1] = piDataBGH[rowIndex].valueC; // C열 <- 급여기본정보 G열
        newRow[2] = piDataBGH[rowIndex].valueD; // D열 <- 급여기본정보 H열
    }

    // B. 보험 데이터 매칭 (A열 + B열 복합 키)
    if (keyA) {
        const keyB = String(newRow[0]).trim(); // 방금 복사한 B열 값 사용
        const compositeKey = keyA + "|" + keyB;

        // E열 (newRow[3]) <- 국민연금 I (A열 + E열 매칭)
        if (npMap.has(compositeKey)) newRow[3] = npMap.get(compositeKey);

        // F열 (newRow[4]), H열 (newRow[6]) <- 건강보험 O, AB (A열 + E열 매칭)
        if (hiMap.has(compositeKey)) {
            const hiValues = hiMap.get(compositeKey);
            newRow[4] = hiValues.valueF;
            newRow[6] = hiValues.valueH;
        }

        // G열 (newRow[5]), I열 (newRow[7]) <- 고용보험 K, Z (A열 + D열 매칭)
        if (eiMap.has(compositeKey)) {
            const eiValues = eiMap.get(compositeKey);
            newRow[5] = eiValues.valueG;
            newRow[7] = eiValues.valueI;
        }

        // J열 (newRow[8]) <- 산재보험 O (A열 + D열 매칭)
        if (iaMap.has(compositeKey)) {
            newRow[8] = iaMap.get(compositeKey);
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
}