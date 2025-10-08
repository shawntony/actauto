/**
 * 누락된 "부가세분개" 시트를 3개 환경에 생성하고 1행 복사
 */

const MISSING_SOURCE_ID = '1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8'; // 유니스

const MISSING_TARGETS = [
  {
    id: '1QNQwhOCU0fJpn19BkxpyNUi6bvdAYcgOIPTAM6rdwZ0',
    name: '스마트비즈센터'
  },
  {
    id: '1xmrR4KLWf2S7J4IQgHrJiIUEb4PCC9aUI7Mwbq29PcU',
    name: '스마트비즈센터1'
  },
  {
    id: '1GjeKgw6c7h5WW1Y8u-v3ixPG6LNX9owf5rZrho9zdkU',
    name: '스마트비즈센터2'
  }
];

function create부가세분개시트() {
  const sheetName = '부가세분개';

  Logger.log(`🔧 "${sheetName}" 시트 생성 시작\n`);

  try {
    // 소스에서 시트 정보 가져오기
    const sourceSpreadsheet = SpreadsheetApp.openById(MISSING_SOURCE_ID);
    const sourceSheet = sourceSpreadsheet.getSheetByName(sheetName);

    if (!sourceSheet) {
      Logger.log(`❌ 소스에 "${sheetName}" 시트가 없습니다.`);
      return;
    }

    const lastColumn = sourceSheet.getLastColumn();
    const lastRow = sourceSheet.getLastRow();

    Logger.log(`📊 소스 시트 정보: ${lastRow}행 × ${lastColumn}열\n`);

    if (lastColumn === 0 || lastRow === 0) {
      Logger.log(`⚠️  소스 시트가 비어있습니다.`);
      return;
    }

    // 1행 데이터 및 서식 가져오기
    const row1Range = sourceSheet.getRange(1, 1, 1, lastColumn);
    const row1Values = row1Range.getValues();
    const row1Formats = row1Range.getNumberFormats();
    const row1FontWeights = row1Range.getFontWeights();
    const row1FontColors = row1Range.getFontColors();
    const row1Backgrounds = row1Range.getBackgrounds();
    const row1HorizontalAlignments = row1Range.getHorizontalAlignments();

    Logger.log(`📋 1행 데이터: ${row1Values[0].join(', ')}\n`);

    // 각 대상 환경에 시트 생성
    let successCount = 0;
    let failCount = 0;

    MISSING_TARGETS.forEach(target => {
      try {
        const targetSpreadsheet = SpreadsheetApp.openById(target.id);
        let targetSheet = targetSpreadsheet.getSheetByName(sheetName);

        // 시트가 없으면 생성
        if (!targetSheet) {
          Logger.log(`📝 ${target.name}: 시트 생성 중...`);
          targetSheet = targetSpreadsheet.insertSheet(sheetName);
          Utilities.sleep(500);
        } else {
          Logger.log(`ℹ️  ${target.name}: 시트가 이미 존재합니다.`);
        }

        // 1행 복사
        const targetRange = targetSheet.getRange(1, 1, 1, lastColumn);
        targetRange.setValues(row1Values);
        targetRange.setNumberFormats(row1Formats);
        targetRange.setFontWeights(row1FontWeights);
        targetRange.setFontColors(row1FontColors);
        targetRange.setBackgrounds(row1Backgrounds);
        targetRange.setHorizontalAlignments(row1HorizontalAlignments);

        Logger.log(`✅ ${target.name}: 완료\n`);
        successCount++;

      } catch (error) {
        Logger.log(`❌ ${target.name}: 오류 - ${error.message}\n`);
        failCount++;
      }
    });

    // 결과 요약
    Logger.log('='.repeat(60));
    Logger.log('📊 결과 요약');
    Logger.log('='.repeat(60));
    Logger.log(`✅ 성공: ${successCount}개`);
    Logger.log(`❌ 실패: ${failCount}개`);
    Logger.log('');

    if (successCount === MISSING_TARGETS.length) {
      Logger.log('🎉 모든 환경에 시트가 성공적으로 생성되었습니다!');
    } else if (successCount > 0) {
      Logger.log('⚠️  일부 환경에만 성공했습니다.');
    } else {
      Logger.log('❌ 모든 환경에서 실패했습니다.');
    }

  } catch (error) {
    Logger.log(`❌ 전체 오류: ${error.message}`);
  }
}

// 생성 후 바로 확인
function create부가세분개시트And확인() {
  create부가세분개시트();

  Logger.log('\n');
  Logger.log('='.repeat(60));
  Logger.log('🔍 생성 확인');
  Logger.log('='.repeat(60));
  Logger.log('');

  const sheetName = '부가세분개';

  // 소스 확인
  try {
    const sourceSpreadsheet = SpreadsheetApp.openById(MISSING_SOURCE_ID);
    const sourceSheet = sourceSpreadsheet.getSheetByName(sheetName);
    if (sourceSheet) {
      Logger.log(`✅ 유니스: ${sourceSheet.getLastRow()}행 × ${sourceSheet.getLastColumn()}열`);
    }
  } catch (error) {
    Logger.log(`❌ 유니스: ${error.message}`);
  }

  // 대상 확인
  MISSING_TARGETS.forEach(target => {
    try {
      const targetSpreadsheet = SpreadsheetApp.openById(target.id);
      const targetSheet = targetSpreadsheet.getSheetByName(sheetName);

      if (targetSheet) {
        Logger.log(`✅ ${target.name}: ${targetSheet.getLastRow()}행 × ${targetSheet.getLastColumn()}열`);
      } else {
        Logger.log(`❌ ${target.name}: 시트 없음`);
      }
    } catch (error) {
      Logger.log(`❌ ${target.name}: ${error.message}`);
    }
  });
}
