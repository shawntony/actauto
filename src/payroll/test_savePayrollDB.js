/**
 * 월지급DB 저장 기능 테스트 스크립트
 *
 * 사용법:
 * 1. Google Apps Script 편집기에서 이 파일 실행
 * 2. createSampleDazoneData() - 샘플 데이터 생성
 * 3. 급여 관리 메뉴 → 5. 월지급DB 저장 실행
 * 4. verifyResults() - 결과 검증
 */

/**
 * 1단계: 샘플 데이터 생성
 */
function createSampleDazoneData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 월급여더존다운로드 시트 생성 또는 가져오기
  let sheet = ss.getSheetByName('월급여더존다운로드');

  if (!sheet) {
    sheet = ss.insertSheet('월급여더존다운로드');
    Logger.log('✅ 월급여더존다운로드 시트 생성됨');
  } else {
    // 기존 데이터 삭제
    sheet.clear();
    Logger.log('✅ 기존 데이터 삭제됨');
  }

  // 헤더 설정 (더존 형식 기준)
  const headers = [
    '사원코드',      // A (0)
    '사원명',        // B (1)
    '부서',          // C (2)
    '직급',          // D (3)
    '기본급',        // E (4)
    '상여',          // F (5)
    '식대수당',      // G (6)
    '직책수당',      // H (7)
    '연장근로수당',  // I (8)
    '연차수당',      // J (9)
    '야간수당',      // K (10)
    '공휴일특근수당',// L (11)
    '기타수당',      // M (12)
    '총지급액',      // N (13)
    '국민연금',      // O (14)
    '건강보험',      // P (15)
    '고용보험',      // Q (16)
    '장기요양보험',  // R (17)
    '소득세',        // S (18)
    '지방소득세',    // T (19)
    '사업주고용보험',// U (20)
    '산재보험료',    // V (21)
    '차인지급액'     // W (22)
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');

  // 샘플 데이터 (3명의 직원)
  const sampleData = [
    // 홍길동
    [
      'EMP001',           // 사원코드
      '홍길동',           // 사원명
      '개발팀',           // 부서
      '대리',             // 직급
      3000000,            // 기본급
      500000,             // 상여
      200000,             // 식대수당
      300000,             // 직책수당
      150000,             // 연장근로수당
      0,                  // 연차수당
      0,                  // 야간수당
      0,                  // 공휴일특근수당
      0,                  // 기타수당
      4150000,            // 총지급액 (E~M 합계)
      148500,             // 국민연금
      124650,             // 건강보험
      49800,              // 고용보험
      16196,              // 장기요양보험
      180000,             // 소득세
      18000,              // 지방소득세
      66400,              // 사업주고용보험
      41500,              // 산재보험료
      3612854             // 차인지급액 (N - O~T 합계)
    ],

    // 김철수
    [
      'EMP002',
      '김철수',
      '영업팀',
      '과장',
      3500000,
      600000,
      200000,
      400000,
      200000,
      100000,
      0,
      0,
      0,
      5000000,
      179100,
      149850,
      60000,
      19479,
      220000,
      22000,
      80000,
      50000,
      4349571
    ],

    // 이영희
    [
      'EMP003',
      '이영희',
      '기획팀',
      '사원',
      2500000,
      300000,
      200000,
      0,
      0,
      0,
      0,
      0,
      0,
      3000000,
      107550,
      89910,
      36000,
      11688,
      120000,
      12000,
      48000,
      30000,
      2622852
    ]
  ];

  sheet.getRange(2, 1, sampleData.length, headers.length).setValues(sampleData);

  // 숫자 컬럼 서식 지정
  sheet.getRange(2, 5, sampleData.length, 19).setNumberFormat('#,##0');

  // 컬럼 너비 자동 조정
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  Logger.log('✅ 샘플 데이터 생성 완료:');
  Logger.log(`   - 직원 수: ${sampleData.length}명`);
  Logger.log(`   - 홍길동: ₩${sampleData[0][22].toLocaleString()}`);
  Logger.log(`   - 김철수: ₩${sampleData[1][22].toLocaleString()}`);
  Logger.log(`   - 이영희: ₩${sampleData[2][22].toLocaleString()}`);

  // 급여데이터 시트에 은행 정보 추가
  addBankInfoToPayrollData();

  SpreadsheetApp.getUi().alert(
    '✅ 샘플 데이터 생성 완료\n\n' +
    '월급여더존다운로드 시트에 3명의 샘플 데이터가 생성되었습니다.\n\n' +
    '다음 단계:\n' +
    '1. 급여 관리 메뉴 → 5. 월지급DB 저장\n' +
    '2. 급여기준월: 2026-01-31 입력\n' +
    '3. 불러오기 클릭\n' +
    '4. 직원 선택 후 저장'
  );
}

/**
 * 급여데이터 시트에 은행 정보 추가
 */
function addBankInfoToPayrollData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('급여데이터');

  if (!sheet) {
    Logger.log('⚠️ 급여데이터 시트가 없습니다. 은행 정보를 추가할 수 없습니다.');
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('⚠️ 급여데이터 시트에 데이터가 없습니다.');
    return;
  }

  // B열(이름)에서 샘플 직원 찾기
  const names = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  const testNames = ['홍길동', '김철수', '이영희'];

  // 급여데이터 시트 스키마: AF(32열)=은행, AG(33열)=계좌번호, AH(34열)=예금주
  // 1-based 컬럼 인덱스: A=1, B=2, ..., AF=32, AG=33, AH=34
  const BANK_COL = 32;      // AF열 (1-based)
  const ACCOUNT_COL = 33;   // AG열 (1-based)
  const DEPOSITOR_COL = 34; // AH열 (1-based)

  testNames.forEach(testName => {
    const rowIndex = names.findIndex(row => row[0] === testName);

    if (rowIndex !== -1) {
      const actualRow = rowIndex + 2;

      // 은행 정보 설정 (정확한 컬럼 인덱스 사용)
      if (testName === '홍길동') {
        sheet.getRange(actualRow, BANK_COL).setValue('국민은행');
        sheet.getRange(actualRow, ACCOUNT_COL).setValue('123-45-678910');
        sheet.getRange(actualRow, DEPOSITOR_COL).setValue('홍길동'); // 예금주
      } else if (testName === '김철수') {
        sheet.getRange(actualRow, BANK_COL).setValue('신한은행');
        sheet.getRange(actualRow, ACCOUNT_COL).setValue('987-65-432100');
        sheet.getRange(actualRow, DEPOSITOR_COL).setValue('김철수'); // 예금주
      } else if (testName === '이영희') {
        // 이영희는 은행 정보 없음 (빈칸 테스트용)
        sheet.getRange(actualRow, BANK_COL).setValue('');
        sheet.getRange(actualRow, ACCOUNT_COL).setValue('');
        sheet.getRange(actualRow, DEPOSITOR_COL).setValue(''); // 예금주도 빈칸
      }

      Logger.log(`✅ ${testName} 은행 정보 추가됨 (행 ${actualRow}, AF=${BANK_COL}, AG=${ACCOUNT_COL}, AH=${DEPOSITOR_COL})`);
    }
  });
}

/**
 * 2단계: 월지급DB 저장 전 상태 확인
 */
function checkBeforeSave() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 월급여더존다운로드 확인
  const dazoneSheet = ss.getSheetByName('월급여더존다운로드');
  if (!dazoneSheet) {
    Logger.log('❌ 월급여더존다운로드 시트가 없습니다.');
    return;
  }

  const dazoneRows = dazoneSheet.getLastRow() - 1;
  Logger.log(`✅ 월급여더존다운로드: ${dazoneRows}개 데이터`);

  // 월지급DB 확인
  const dbSheet = ss.getSheetByName('월지급DB');
  if (!dbSheet) {
    Logger.log('⚠️ 월지급DB 시트가 없습니다 (자동 생성될 예정)');
  } else {
    const dbRows = dbSheet.getLastRow() - 1;
    Logger.log(`✅ 월지급DB: ${dbRows}개 데이터 (저장 전)`);
  }

  // 급여데이터 확인
  const payrollSheet = ss.getSheetByName('급여데이터');
  if (!payrollSheet) {
    Logger.log('⚠️ 급여데이터 시트가 없습니다 (은행 정보 조회 불가)');
  } else {
    Logger.log('✅ 급여데이터 시트 존재 (은행 정보 조회 가능)');
  }

  SpreadsheetApp.getUi().alert(
    '📊 저장 전 상태 확인\n\n' +
    `월급여더존다운로드: ${dazoneRows}개 데이터\n` +
    `월지급DB: ${dbSheet ? dbSheet.getLastRow() - 1 : 0}개 데이터\n\n` +
    '이제 Menu 5 (월지급DB 저장)를 실행하세요.'
  );
}

/**
 * 3단계: 결과 검증
 */
function verifyResults() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dbSheet = ss.getSheetByName('월지급DB');

  if (!dbSheet) {
    Logger.log('❌ 월지급DB 시트가 생성되지 않았습니다.');
    SpreadsheetApp.getUi().alert('❌ 테스트 실패\n\n월지급DB 시트가 없습니다.');
    return;
  }

  const lastRow = dbSheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('❌ 월지급DB에 데이터가 저장되지 않았습니다.');
    SpreadsheetApp.getUi().alert('❌ 테스트 실패\n\n월지급DB에 데이터가 없습니다.');
    return;
  }

  // 데이터 읽기
  const data = dbSheet.getRange(2, 1, lastRow - 1, 30).getValues();

  // 검증 결과
  const results = {
    totalRows: data.length,
    validRows: 0,
    errors: [],
    details: []
  };

  data.forEach((row, index) => {
    const rowNum = index + 2;
    const month = row[0];
    const name = row[1];
    const totalSalary = row[2];
    const netPay = row[22]; // W열
    const depositLabel = row[27]; // AB열
    const bank = row[28]; // AC열
    const account = row[29]; // AD열

    let isValid = true;
    const errors = [];

    // 검증 1: 급여기준월
    if (!month || !(month instanceof Date)) {
      errors.push('급여기준월 오류');
      isValid = false;
    }

    // 검증 2: 이름
    if (!name || typeof name !== 'string') {
      errors.push('이름 오류');
      isValid = false;
    }

    // 검증 3: 총급여
    if (!totalSalary || totalSalary <= 0) {
      errors.push('총급여 오류');
      isValid = false;
    }

    // 검증 4: 세후지급액
    if (!netPay || netPay <= 0) {
      errors.push('세후지급액 오류');
      isValid = false;
    }

    // 검증 5: 입금처리여부
    if (depositLabel !== '대기') {
      errors.push('입금처리여부 오류 (예상: "대기")');
      isValid = false;
    }

    if (isValid) {
      results.validRows++;
    } else {
      results.errors.push(`행 ${rowNum}: ${errors.join(', ')}`);
    }

    results.details.push({
      row: rowNum,
      name: name,
      month: month,
      totalSalary: totalSalary,
      netPay: netPay,
      bank: bank || '(없음)',
      account: account || '(없음)',
      status: depositLabel,
      valid: isValid
    });
  });

  // 결과 출력
  Logger.log('========================================');
  Logger.log('📊 월지급DB 저장 결과 검증');
  Logger.log('========================================');
  Logger.log(`총 행 수: ${results.totalRows}`);
  Logger.log(`정상: ${results.validRows}`);
  Logger.log(`오류: ${results.errors.length}`);
  Logger.log('');

  results.details.forEach(detail => {
    const status = detail.valid ? '✅' : '❌';
    Logger.log(`${status} 행 ${detail.row}: ${detail.name}`);
    Logger.log(`   급여기준월: ${detail.month}`);
    Logger.log(`   총급여: ₩${detail.totalSalary?.toLocaleString()}`);
    Logger.log(`   세후지급액: ₩${detail.netPay?.toLocaleString()}`);
    Logger.log(`   은행: ${detail.bank}`);
    Logger.log(`   계좌: ${detail.account}`);
    Logger.log(`   상태: ${detail.status}`);
    Logger.log('');
  });

  if (results.errors.length > 0) {
    Logger.log('오류 목록:');
    results.errors.forEach(err => Logger.log(`  - ${err}`));
  }

  // UI 알림
  const message = results.validRows === results.totalRows
    ? `✅ 테스트 성공!\n\n` +
      `저장된 데이터: ${results.totalRows}개\n` +
      `모든 데이터가 정상적으로 저장되었습니다.\n\n` +
      `상세 내용은 로그를 확인하세요.`
    : `⚠️ 테스트 완료 (일부 오류)\n\n` +
      `저장된 데이터: ${results.totalRows}개\n` +
      `정상: ${results.validRows}개\n` +
      `오류: ${results.errors.length}개\n\n` +
      `상세 내용은 로그를 확인하세요.`;

  SpreadsheetApp.getUi().alert(message);
}

/**
 * 4단계: 중복 저장 테스트
 */
function testDuplicateCheck() {
  Logger.log('========================================');
  Logger.log('🔄 중복 체크 테스트');
  Logger.log('========================================');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dbSheet = ss.getSheetByName('월지급DB');

  if (!dbSheet || dbSheet.getLastRow() < 2) {
    Logger.log('❌ 먼저 데이터를 저장하세요.');
    SpreadsheetApp.getUi().alert('먼저 Menu 5로 데이터를 저장하세요.');
    return;
  }

  // 기존 데이터 확인
  const existingRows = dbSheet.getLastRow() - 1;
  Logger.log(`기존 데이터: ${existingRows}개`);

  SpreadsheetApp.getUi().alert(
    '🔄 중복 체크 테스트\n\n' +
    `현재 월지급DB: ${existingRows}개 데이터\n\n` +
    '다음 단계:\n' +
    '1. Menu 5 (월지급DB 저장) 다시 실행\n' +
    '2. 동일한 급여기준월 (2026-01-31) 입력\n' +
    '3. 불러오기 클릭\n' +
    '4. 중복 표시 확인 (⚠️ 중복 배지)\n' +
    '5. 중복된 항목은 체크박스 비활성화 확인'
  );
}

/**
 * 5단계: 정리
 */
function cleanupTestData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const result = SpreadsheetApp.getUi().alert(
    '⚠️ 테스트 데이터 삭제',
    '월급여더존다운로드와 월지급DB의 테스트 데이터를 삭제하시겠습니까?\n\n' +
    '이 작업은 되돌릴 수 없습니다.',
    SpreadsheetApp.getUi().ButtonSet.YES_NO
  );

  if (result !== SpreadsheetApp.getUi().Button.YES) {
    return;
  }

  // 월급여더존다운로드 삭제
  const dazoneSheet = ss.getSheetByName('월급여더존다운로드');
  if (dazoneSheet) {
    ss.deleteSheet(dazoneSheet);
    Logger.log('✅ 월급여더존다운로드 시트 삭제됨');
  }

  // 월지급DB에서 테스트 데이터만 삭제 (2026-01-31)
  const dbSheet = ss.getSheetByName('월지급DB');
  if (dbSheet) {
    const lastRow = dbSheet.getLastRow();
    if (lastRow > 1) {
      const data = dbSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      const testMonth = new Date('2026-01-31');

      // 역순으로 삭제 (행 번호 변경 방지)
      for (let i = data.length - 1; i >= 0; i--) {
        const rowDate = data[i][0];
        if (rowDate instanceof Date &&
            rowDate.getFullYear() === testMonth.getFullYear() &&
            rowDate.getMonth() === testMonth.getMonth()) {
          dbSheet.deleteRow(i + 2);
          Logger.log(`✅ 월지급DB 행 ${i + 2} 삭제됨`);
        }
      }
    }
  }

  SpreadsheetApp.getUi().alert('✅ 테스트 데이터 정리 완료');
}

/**
 * 전체 테스트 실행 (자동)
 */
function runFullTest() {
  Logger.log('========================================');
  Logger.log('🧪 월지급DB 저장 전체 테스트 시작');
  Logger.log('========================================');

  // 1. 샘플 데이터 생성
  Logger.log('\n[1/3] 샘플 데이터 생성 중...');
  createSampleDazoneData();

  // 2. 상태 확인
  Logger.log('\n[2/3] 저장 전 상태 확인 중...');
  checkBeforeSave();

  // 3. 안내 메시지
  Logger.log('\n[3/3] 수동 테스트 준비 완료');

  SpreadsheetApp.getUi().alert(
    '🧪 테스트 준비 완료\n\n' +
    '샘플 데이터가 생성되었습니다.\n\n' +
    '다음 단계를 직접 실행하세요:\n' +
    '1. 급여 관리 → 5. 월지급DB 저장\n' +
    '2. 급여기준월: 2026-01-31\n' +
    '3. 직원 선택 후 저장\n' +
    '4. verifyResults() 함수 실행하여 결과 확인'
  );
}
