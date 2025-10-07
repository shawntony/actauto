/**
 * [V6] '월지급계산' 시트의 A열을 키로 사용하여 보험 데이터를 매칭 및 최종 계산(O열)합니다.
 * B, C, D열의 기존 수식을 보존합니다.
 * 처리된 데이터(A:O)를 '월지급DB'에 값만 복사한 후,
 * DB 시트의 P, Q, R, S열에 추가 계산을 수행하여 기록합니다.
 */
function matchAllPayrollData_V6() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const PAYMENT_CALC_SHEET = '월지급계산';
  const PAYMENT_DB_SHEET = '월지급DB'; 
  const NATIONAL_PENSION_SHEET = '국민연금';
  const HEALTH_INSURANCE_SHEET = '건강보험';
  const EMPLOYMENT_INSURANCE_SHEET = '고용보험'; 
  const INDUSTRIAL_ACCIDENT_SHEET = '산재보험'; 

  const pcSheet = ss.getSheetByName(PAYMENT_CALC_SHEET);
  const dbSheet = ss.getSheetByName(PAYMENT_DB_SHEET); 
  const npSheet = ss.getSheetByName(NATIONAL_PENSION_SHEET);
  const hiSheet = ss.getSheetByName(HEALTH_INSURANCE_SHEET);
  const eiSheet = ss.getSheetByName(EMPLOYMENT_INSURANCE_SHEET); 
  const iaSheet = ss.getSheetByName(INDUSTRIAL_ACCIDENT_SHEET);  

  // --- 시트 존재 여부 검증 ---
  if (!pcSheet || !dbSheet || !npSheet || !hiSheet || !eiSheet || !iaSheet) {
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
  const E_COL_START = 5; // E열 (1-based index)
  const PC_DATA_COLS_WRITE = 11; // E열부터 O열까지 총 11개 열
  const PC_DATA_COLS_TOTAL = 15; // A열부터 O열까지 총 15개 열
  const C_COL_INDEX = 2; 
  const K_COL_INDEX = 10; 
  const L_COL_INDEX = 11; 
  const M_COL_INDEX = 12; 
  const N_COL_INDEX = 13; 
  const O_COL_INDEX_ARRAY = 10; // O열 index within the 11-column (E:O) writing array
  
  // 데이터 변환 헬퍼 함수
  const numberify = (value) => {
    const num = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  };
  
  // --- 1. 수식 보존을 위한 값만 읽기 (A열, C열, K~N열) ---
  const pcKeysAndCalcData = pcSheet.getRange(startRow, 1, pcLastRow - startRow + 1, N_COL_INDEX + 1).getValues();

  // --- 2~5. 맵 생성 (보험 데이터 매핑) ---
  
  // 2. 국민연금 (I열 -> E열)
  const npLastRow = npSheet.getLastRow();
  const npMap = new Map();
  if (npLastRow >= startRow) {
      const npData = npSheet.getRange(startRow, 1, npLastRow - startRow + 1, 9).getValues();
      npData.forEach(row => { const key = String(row[0]).trim(); if (key) npMap.set(key, row[8]); });
  }

  // 3. 건강보험 (O열 -> F열, AB열 -> H열)
  const hiLastRow = hiSheet.getLastRow();
  const hiMap = new Map();
  if (hiLastRow >= startRow) {
      const HI_DATA_COLS = 28;
      const hiData = hiSheet.getRange(startRow, 1, hiLastRow - startRow + 1, HI_DATA_COLS).getValues();
      const O_COL_INDEX = 14; const AB_COL_INDEX = 27; 
      hiData.forEach(row => {
          const key = String(row[0]).trim();
          if (key && row.length > AB_COL_INDEX) {
              hiMap.set(key, { valueF: row[O_COL_INDEX], valueH: row[AB_COL_INDEX] });
          }
      });
  }
  
  // 4. 고용보험 (K열 -> G열, Z열 -> I열)
  const eiLastRow = eiSheet.getLastRow();
  const eiMap = new Map();
  if (eiLastRow >= startRow) {
      const EI_DATA_COLS = 26;
      const eiData = eiSheet.getRange(startRow, 1, eiLastRow - startRow + 1, EI_DATA_COLS).getValues();
      const K_COL_INDEX = 10; const Z_COL_INDEX = 25; 
      eiData.forEach(row => {
          const key = String(row[0]).trim();
          if (key && row.length > Z_COL_INDEX) {
              eiMap.set(key, { valueG: row[K_COL_INDEX], valueI: row[Z_COL_INDEX] });
          }
      });
  }
  
  // 5. 산재보험 (O열 -> J열)
  const iaLastRow = iaSheet.getLastRow();
  const iaMap = new Map();
  if (iaLastRow >= startRow) {
      const IA_DATA_COLS = 15; 
      const iaData = iaSheet.getRange(startRow, 1, iaLastRow - startRow + 1, IA_DATA_COLS).getValues();
      const O_COL_INDEX = 14; 
      iaData.forEach(row => {
          const key = String(row[0]).trim();
          if (key && row.length > O_COL_INDEX) {
              iaMap.set(key, row[O_COL_INDEX]); 
          }
      });
  }


  // --- 6. 결과 배열 생성 및 계산 ---
  const resultsToWrite = []; // E열부터 O열까지의 값을 저장할 배열
  
  pcKeysAndCalcData.forEach(pcRow => {
    const searchKey = String(pcRow[0]).trim(); 
    
    // newRow: E,F,G,H,I,J,K,L,M,N,O (11개 항목)
    const newRow = Array(PC_DATA_COLS_WRITE).fill(''); 

    // A. 매칭 데이터 및 K,L,M,N 값 복사
    if (searchKey) {
        // E열 (newRow[0]) <- 국민연금 I
        if (npMap.has(searchKey)) newRow[0] = npMap.get(searchKey); 
        // F열 (newRow[1]), H열 (newRow[3]) <- 건강보험 O, AB
        if (hiMap.has(searchKey)) {
            const hiValues = hiMap.get(searchKey);
            newRow[1] = hiValues.valueF; 
            newRow[3] = hiValues.valueH; 
        }
        // G열 (newRow[2]), I열 (newRow[4]) <- 고용보험 K, Z
        if (eiMap.has(searchKey)) {
            const eiValues = eiMap.get(searchKey);
            newRow[2] = eiValues.valueG; 
            newRow[4] = eiValues.valueI; 
        }
        // J열 (newRow[5]) <- 산재보험 O
        if (iaMap.has(searchKey)) {
            newRow[5] = iaMap.get(searchKey); 
        }
    }
    
    // K, L, M, N열 값 복사
    newRow[6] = pcRow[K_COL_INDEX]; 
    newRow[7] = pcRow[L_COL_INDEX]; 
    newRow[8] = pcRow[M_COL_INDEX]; 
    newRow[9] = pcRow[N_COL_INDEX]; 
    
    // C. 최종 계산 (O열) 로직: C-E-F-G-H-K-L-M-N
    // E=newRow[0], F=newRow[1], G=newRow[2], H=newRow[3], K=newRow[6], L=newRow[7], M=newRow[8], N=newRow[9]
    
    const C = numberify(pcRow[C_COL_INDEX]); 
    const E = numberify(newRow[0]); 
    const F = numberify(newRow[1]); 
    const G = numberify(newRow[2]); 
    const H = numberify(newRow[3]); 
    const K = numberify(newRow[6]); 
    const L = numberify(newRow[7]); 
    const M = numberify(newRow[8]); 
    const N = numberify(newRow[9]); 
    
    const finalResult = C - E - F - G - H - K - L - M - N;
    
    // O열 (newRow 인덱스 10)에 결과 입력
    newRow[O_COL_INDEX_ARRAY] = finalResult;
    
    resultsToWrite.push(newRow);
  });

  // --- 7. '월지급계산' 시트에 결과 쓰기 (E열부터 O열까지) ---
  if (resultsToWrite.length > 0) {
      pcSheet.getRange(startRow, E_COL_START, resultsToWrite.length, PC_DATA_COLS_WRITE)
             .setValues(resultsToWrite); 
  }
  
  // --- 8. DB 시트에 값만 복사 (A열~O열) 및 P~S열 계산 및 추가 기록 ---
  if (resultsToWrite.length > 0) {
      // 8-1. 월지급계산 시트에서 A열부터 O열까지 최종 값을 가져옵니다.
      const rowCount = resultsToWrite.length;
      const sourceDataRange = pcSheet.getRange(startRow, 1, rowCount, PC_DATA_COLS_TOTAL);
      const valuesToCopy = sourceDataRange.getValues();
      
      const dbStartRow = dbSheet.getLastRow() + 1;
      
      // 8-2. 월지급DB 시트에 A열부터 O열까지 값만 붙여넣기
      dbSheet.getRange(dbStartRow, 1, rowCount, PC_DATA_COLS_TOTAL)
             .setValues(valuesToCopy);
             
      // 8-3. P, Q, R, S열 계산 및 배열 준비
      const resultsForPQRS = [];

      // A열:0, E열:4, F열:5, G열:6, H열:7, I열:8, J열:9, O열:14 (0-based)
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
      
      // 8-4. 월지급DB 시트에 P열부터 S열까지 값만 붙여넣기
      const P_COL_START = 16; // P열 (1-based index)
      const PQRS_COLS = 4;
      
      dbSheet.getRange(dbStartRow, P_COL_START, rowCount, PQRS_COLS)
             .setValues(resultsForPQRS);
  }

  ui.alert(`✅ 급여 데이터 통합 매칭 및 최종 계산이 완료되었으며, 
             '월지급DB' 시트에는 A열부터 S열까지 데이터가 값으로 기록되었습니다.`);
}