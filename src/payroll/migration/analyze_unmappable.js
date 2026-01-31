/**
 * 급여기본정보 매핑 불가능 데이터 분석 스크립트
 *
 * 목적: 급여데이터 시트로 직접 매핑할 수 없는 컬럼의 데이터를 분석하여
 *       메모 저장 필요성을 판단
 *
 * 매핑 불가능 컬럼:
 * - A (ID)
 * - C (직위)
 * - O (차량유지비)
 * - Q (급여성비용)
 * - R (특별상여금)
 * - X (핸드폰)
 *
 * 작성일: 2026-01-30
 */

/**
 * 매핑 불가능한 컬럼의 데이터 분석
 * @returns {Object} 각 컬럼별 데이터 존재 건수 및 샘플
 */
function analyzeUnmappableColumns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('급여기본정보');

  if (!sheet) {
    throw new Error('급여기본정보 시트를 찾을 수 없습니다.');
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('데이터가 없습니다.');
    return null;
  }

  // 전체 데이터 읽기
  const data = sheet.getRange(2, 1, lastRow - 1, 24).getValues();

  // 통계 객체 초기화
  const stats = {
    A_ID: { count: 0, samples: [] },
    C_직위: { count: 0, samples: [] },
    O_차량유지비: { count: 0, samples: [] },
    Q_급여성비용: { count: 0, samples: [] },
    R_특별상여금: { count: 0, samples: [] },
    X_핸드폰: { count: 0, samples: [] }
  };

  // 데이터 분석
  data.forEach((row, index) => {
    const rowNum = index + 2;
    const name = row[1]; // B열: 이름

    // A열: ID
    if (row[0] && String(row[0]).trim() !== '') {
      stats.A_ID.count++;
      if (stats.A_ID.samples.length < 3) {
        stats.A_ID.samples.push({ row: rowNum, name, value: row[0] });
      }
    }

    // C열: 직위
    if (row[2] && String(row[2]).trim() !== '') {
      stats.C_직위.count++;
      if (stats.C_직위.samples.length < 3) {
        stats.C_직위.samples.push({ row: rowNum, name, value: row[2] });
      }
    }

    // O열: 차량유지비 (index 14)
    if (row[14] && String(row[14]).trim() !== '' && row[14] !== 0) {
      stats.O_차량유지비.count++;
      if (stats.O_차량유지비.samples.length < 3) {
        stats.O_차량유지비.samples.push({ row: rowNum, name, value: row[14] });
      }
    }

    // Q열: 급여성비용 (index 16)
    if (row[16] && String(row[16]).trim() !== '' && row[16] !== 0) {
      stats.Q_급여성비용.count++;
      if (stats.Q_급여성비용.samples.length < 3) {
        stats.Q_급여성비용.samples.push({ row: rowNum, name, value: row[16] });
      }
    }

    // R열: 특별상여금 (index 17)
    if (row[17] && String(row[17]).trim() !== '' && row[17] !== 0) {
      stats.R_특별상여금.count++;
      if (stats.R_특별상여금.samples.length < 3) {
        stats.R_특별상여금.samples.push({ row: rowNum, name, value: row[17] });
      }
    }

    // X열: 핸드폰 (index 23)
    if (row[23] && String(row[23]).trim() !== '') {
      stats.X_핸드폰.count++;
      if (stats.X_핸드폰.samples.length < 3) {
        stats.X_핸드폰.samples.push({ row: rowNum, name, value: row[23] });
      }
    }
  });

  // 결과 로깅
  Logger.log('=== 매핑 불가능 데이터 분석 결과 ===');
  Logger.log(`총 데이터 건수: ${data.length}건`);
  Logger.log('');

  Object.keys(stats).forEach(key => {
    Logger.log(`${key}: ${stats[key].count}건`);
    if (stats[key].samples.length > 0) {
      Logger.log('  샘플:');
      stats[key].samples.forEach(sample => {
        Logger.log(`    행 ${sample.row} (${sample.name}): ${sample.value}`);
      });
    }
    Logger.log('');
  });

  // UI 표시
  const ui = SpreadsheetApp.getUi();
  const message = `
매핑 불가능 데이터 분석 결과 (총 ${data.length}건)

A_ID: ${stats.A_ID.count}건
C_직위: ${stats.C_직위.count}건
O_차량유지비: ${stats.O_차량유지비.count}건
Q_급여성비용: ${stats.Q_급여성비용.count}건
R_특별상여금: ${stats.R_특별상여금.count}건
X_핸드폰: ${stats.X_핸드폰.count}건

이 데이터들은 급여데이터 시트의 메모(AD열)에 JSON 형식으로 저장됩니다.

상세 내역은 로그를 확인하세요.
  `.trim();

  ui.alert('분석 완료', message, ui.ButtonSet.OK);

  return stats;
}

/**
 * 특정 컬럼의 상세 데이터 조회
 * @param {string} columnKey - 컬럼 키 (예: 'A_ID', 'C_직위')
 * @returns {Array} 해당 컬럼의 모든 데이터
 */
function getUnmappableColumnDetails(columnKey) {
  const columnMap = {
    'A_ID': 0,
    'C_직위': 2,
    'O_차량유지비': 14,
    'Q_급여성비용': 16,
    'R_특별상여금': 17,
    'X_핸드폰': 23
  };

  const columnIndex = columnMap[columnKey];
  if (columnIndex === undefined) {
    throw new Error(`잘못된 컬럼 키: ${columnKey}`);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('급여기본정보');
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 24).getValues();
  const details = [];

  data.forEach((row, index) => {
    const value = row[columnIndex];
    if (value && String(value).trim() !== '' && value !== 0) {
      details.push({
        row: index + 2,
        name: row[1], // B열: 이름
        residentId: row[3], // D열: 주민번호
        value: value
      });
    }
  });

  Logger.log(`${columnKey} 상세 데이터 (${details.length}건):`, details);
  return details;
}

/**
 * 메모에 저장될 JSON 샘플 생성
 * @param {number} rowIndex - 급여기본정보 행 인덱스 (0-based)
 * @returns {string} JSON 문자열
 */
function generateMemoSample(rowIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('급여기본정보');
  const row = sheet.getRange(rowIndex + 2, 1, 1, 24).getValues()[0];

  const unmappable = {};

  if (row[0]) unmappable.ID = row[0];
  if (row[2]) unmappable.직위 = row[2];
  if (row[14] && row[14] !== 0) unmappable.차량유지비 = row[14];
  if (row[16] && row[16] !== 0) unmappable.급여성비용 = row[16];
  if (row[17] && row[17] !== 0) unmappable.특별상여금 = row[17];
  if (row[23]) unmappable.핸드폰 = row[23];

  if (Object.keys(unmappable).length === 0) {
    return '(저장할 데이터 없음)';
  }

  const json = '[급여기본정보]\n' + JSON.stringify(unmappable, null, 2);

  Logger.log(`행 ${rowIndex + 2} (${row[1]}) 메모 샘플:\n${json}`);
  return json;
}
