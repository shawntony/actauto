/**
 * '부가세분개' 시트의 D열, E열, K, L, M, P, R, S열에 계산된 값을 입력하고,
 * Q열이 음수일 경우 L열에 반영 후 Q열은 비웁니다. U열에 검증 결과를 표시합니다.
 */
function applyVATTaxCalculation() {
  // 1. 활성 스프레드시트와 '부가세분개' 시트를 가져옵니다.
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('부가세분개');
  var ui = SpreadsheetApp.getUi();

  if (!sheet) {
    ui.alert('오류: 시트 이름 "부가세분개"를 찾을 수 없습니다. 시트 이름을 확인해 주세요.');
    return;
  }

  // 2. 데이터가 있는 마지막 행을 찾습니다.
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log('데이터가 없으므로 계산을 실행하지 않습니다.');
    return;
  }

  // 3. 계산에 필요한 B, C, F, G, H열의 데이터를 가져옵니다.
  // 범위: B열(2)부터 H열(8)까지 총 7개 열을 읽습니다. (B=0, C=1, F=4, G=5, H=6)
  var rangeToProcess = sheet.getRange(2, 2, lastRow - 1, 7); // B2:H[lastRow]
  var values = rangeToProcess.getValues();

  // 결과를 저장할 배열을 준비합니다.
  var taxValues = [];        // D열 (C열 * 0.1)
  var netValues = [];        // E열 (B열 - D열)
  var kValues = [];          // K열 (E열 값)
  var lValues = [];          // L열 (조건부 계산: F > B 및 Q열 음수 반영)
  var mValues = [];          // M열 (D열 값 복사)
  var pValues = [];          // P열 (F열 값 복사)
  var qValues = [];          // Q열 (조건부 계산: B > F. 최종적으로 비워짐)
  var rValues = [];          // R열 (G열 값 복사)
  var sValues = [];          // S열 (H열 값 복사)
  var uValues = [];          // U열 (검증 결과)

  // 안전한 숫자 변환 및 반올림 헬퍼 함수
  const numberify = (val) => (typeof val === 'number' && !isNaN(val)) ? val : parseFloat(String(val).replace(/,/g, '')) || 0;
  const round = (num) => Math.round(num * 100) / 100;

  // 4. 각 행을 순회하며 계산을 수행합니다.
  for (var i = 0; i < values.length; i++) {
    // 배열 인덱스: B=0, C=1, F=4, G=5, H=6
    var totalAmount = values[i][0]; 
    var supplyValue = values[i][1]; 
    var F_value = values[i][4];     
    var G_value = values[i][5];     
    var H_value = values[i][6];     
    
    // 계산에 사용할 숫자 값
    const B_num = numberify(totalAmount);
    const C_num = numberify(supplyValue);
    const F_num = numberify(F_value);
    const G_num = numberify(G_value);
    const H_num = numberify(H_value);

    // --- D, E, K, M, P, R, S 계산 ---
    
    // D열 (부가세)
    var D_tax = round(C_num * 0.1);
    
    // E열 (차감액)
    var E_net = round(B_num - D_tax);

    // K열: E 값 복사
    var K_val = E_net; 

    // M열: D 값 복사
    var M_val = D_tax;

    // P열: F 값 복사
    var P_val = F_value;
    const P_num = numberify(P_val);

    // R열: G 값 복사
    var R_val = G_value;
    const R_num = numberify(R_val);

    // S열: H 값 복사
    var S_val = H_value;
    const S_num = numberify(S_val);
    
    // --- L열 (1차), Q열 (1차) 계산 ---
    
    // L열 1차 계산: F > B 조건 확인 (F - B + G + H)
    var L_num = 0;
    if (F_num > B_num) {
        L_num = round(F_num - B_num + G_num + H_num);
    }
    
    // Q열 1차 계산: B > F 조건 확인 (B - F - G - H)
    var Q_num = 0;
    if (B_num > F_num) {
        Q_num = round(B_num - F_num - G_num - H_num);
    }
    
    // --- 🌟 Q열 후처리 및 L열 최종 반영 ---
    
    // Q열이 0보다 작은지 검증
    if (Q_num < 0) {
        // L열에 Q열 값 * -1 을 더함
        L_num = round(L_num + (Q_num * -1));
        // Q열의 값은 L열에 반영되었으므로 0으로 설정
        Q_num = 0; 
    }

    // L열 최종 값 설정 (조건에 해당하지 않으면 빈 문자열)
    var L_val = (L_num !== 0) ? L_num : '';
    
    // Q열 최종 값 설정 (Q열의 값은 삭제 요청에 따라 항상 빈 문자열)
    var Q_val = ''; 
    
    // --- U열 검증 계산 ---
    
    // 검증을 위해 L, Q는 최종 반영된 L_num, Q_num (0) 사용
    
    // 1. K:M 합계 (K, L, M)
    const sum_KM = round(K_val + L_num + M_val);
    
    // 2. P:S 합계 (P, Q, R, S)
    const sum_PS = round(P_num + Q_num + R_num + S_num); 
    
    // U열 검증 결과
    const U_val = (sum_KM === sum_PS) ? '일치' : '불일치';

    // 결과 배열에 값을 저장합니다.
    taxValues.push([D_tax]);
    netValues.push([E_net]);
    kValues.push([K_val]); 
    lValues.push([L_val]); // 최종 L_val
    mValues.push([M_val]);
    pValues.push([P_val]);
    qValues.push([Q_val]); // 최종 Q_val (항상 빈 문자열)
    rValues.push([R_val]); 
    sValues.push([S_val]);
    uValues.push([U_val]); 
  }

  // 5. 계산된 결과를 시트에 입력합니다.
  
  // D열 (부가세)
  sheet.getRange(2, 4, taxValues.length, 1).setValues(taxValues);

  // E열 (차감액)
  sheet.getRange(2, 5, netValues.length, 1).setValues(netValues);

  // K열 (E열 값 복사)
  sheet.getRange(2, 11, kValues.length, 1).setValues(kValues);

  // L열 (조건부 계산)
  sheet.getRange(2, 12, lValues.length, 1).setValues(lValues);
  
  // M열 (D열 값 복사)
  sheet.getRange(2, 13, mValues.length, 1).setValues(mValues);

  // P열 (F열 값 복사)
  sheet.getRange(2, 16, pValues.length, 1).setValues(pValues);
  
  // Q열 (조건부 계산 후 삭제)
  sheet.getRange(2, 17, qValues.length, 1).setValues(qValues);

  // R열 (G열 값 복사)
  sheet.getRange(2, 18, rValues.length, 1).setValues(rValues);
  
  // S열 (H열 값 복사)
  sheet.getRange(2, 19, sValues.length, 1).setValues(sValues);

  // U열 (검증 결과)
  sheet.getRange(2, 21, uValues.length, 1).setValues(uValues);

  ui.alert('✅ 성공: 계산 및 검증 로직이 완료되었습니다. Q열의 음수값은 L열에 반영된 후 Q열은 비워집니다.');
}