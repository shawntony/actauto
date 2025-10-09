/**
 * 제이제이큐브 스프레드시트에 직접 붙여넣기용 스크립트
 *
 * 사용 방법:
 * 1. 법인재무관리_제이제이큐브 열기
 * 2. 확장 프로그램 > Apps Script
 * 3. 이 코드 전체 복사해서 붙여넣기
 * 4. copyAllSheetsFromUnis() 함수 실행
 */

const SOURCE_ID = '1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8'; // 유니스

function copyAllSheetsFromUnis() {
  Logger.log('🚀 유니스에서 제이제이큐브로 시트 복사 시작\n');
  Logger.log('='.repeat(70));

  try {
    // 현재 스프레드시트 (제이제이큐브)
    const targetSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // 소스 스프레드시트 (유니스)
    const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_ID);
    const sourceSheets = sourceSpreadsheet.getSheets();

    Logger.log(`📋 소스 시트 개수: ${sourceSheets.length}개\n`);
    Logger.log('🔄 모든 시트 생성 및 1행 복사 시작');
    Logger.log('   (이 작업은 몇 분 정도 걸립니다...)\n');

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    sourceSheets.forEach((sourceSheet, index) => {
      const sheetName = sourceSheet.getName();

      try {
        Logger.log(`[${index + 1}/${sourceSheets.length}] ${sheetName}`);

        const lastColumn = sourceSheet.getLastColumn();
        const lastRow = sourceSheet.getLastRow();

        if (lastColumn === 0 || lastRow === 0) {
          Logger.log(`  ⊘ 빈 시트, 건너뜀`);
          skipCount++;
          return;
        }

        let targetSheet = targetSpreadsheet.getSheetByName(sheetName);

        if (!targetSheet) {
          targetSheet = targetSpreadsheet.insertSheet(sheetName);
          Logger.log(`  ✅ 시트 생성`);
          Utilities.sleep(300);
        } else {
          Logger.log(`  ✓ 시트 이미 존재`);
        }

        // 1행 데이터 및 서식 복사
        const row1Range = sourceSheet.getRange(1, 1, 1, lastColumn);
        const row1Values = row1Range.getValues();
        const row1Formats = row1Range.getNumberFormats();
        const row1FontWeights = row1Range.getFontWeights();
        const row1FontColors = row1Range.getFontColors();
        const row1Backgrounds = row1Range.getBackgrounds();
        const row1HorizontalAlignments = row1Range.getHorizontalAlignments();

        const targetRange = targetSheet.getRange(1, 1, 1, lastColumn);
        targetRange.setValues(row1Values);
        targetRange.setNumberFormats(row1Formats);
        targetRange.setFontWeights(row1FontWeights);
        targetRange.setFontColors(row1FontColors);
        targetRange.setBackgrounds(row1Backgrounds);
        targetRange.setHorizontalAlignments(row1HorizontalAlignments);

        Logger.log(`  ✅ 1행 복사 완료 (${lastColumn}개 열)`);
        successCount++;

        Utilities.sleep(200);

      } catch (error) {
        Logger.log(`  ❌ 오류: ${error.message}`);
        failCount++;
      }
    });

    // 기본 시트 삭제
    try {
      const defaultSheet = targetSpreadsheet.getSheetByName('Sheet1');
      if (defaultSheet && targetSpreadsheet.getSheets().length > 1) {
        targetSpreadsheet.deleteSheet(defaultSheet);
        Logger.log('\n🗑️  기본 Sheet1 삭제');
      }
    } catch (e) {
      // 무시
    }

    // 결과 요약
    Logger.log('');
    Logger.log('='.repeat(70));
    Logger.log('✅ 시트 복사 완료!');
    Logger.log('='.repeat(70));
    Logger.log('');
    Logger.log('📊 작업 결과:');
    Logger.log(`   총 시트: ${sourceSheets.length}개`);
    Logger.log(`   ✅ 성공: ${successCount}개`);
    Logger.log(`   ⊘ 건너뜀: ${skipCount}개`);
    Logger.log(`   ❌ 실패: ${failCount}개`);
    Logger.log('');

    return {
      success: true,
      stats: {
        total: sourceSheets.length,
        success: successCount,
        skipped: skipCount,
        failed: failCount
      }
    };

  } catch (error) {
    Logger.log('');
    Logger.log(`❌ 오류 발생: ${error.message}`);
    Logger.log(error.stack);

    return {
      success: false,
      error: error.message
    };
  }
}
