/**
 * 론푸드김해 환경 완전 자동 생성 스크립트
 *
 * 실행 방법:
 * 1. Apps Script 편집기에서 이 파일 열기
 * 2. create론푸드김해완전자동() 함수 실행
 */

function create론푸드김해완전자동() {
  const 법인이름 = '론푸드김해';
  const SOURCE_SPREADSHEET_ID = '1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8'; // 유니스

  Logger.log(`🚀 ${법인이름} 환경 완전 자동 생성 시작\n`);
  Logger.log('='.repeat(70));

  try {
    // Step 1: 폴더 구조 생성
    Logger.log('📁 Step 1: 폴더 구조 생성');

    const myDrive = DriveApp.getRootFolder();
    let 법인관리 = getFolderByName_LAWNFOODKIMHAE(myDrive, '법인관리') || myDrive.createFolder('법인관리');
    let 재무관리 = getFolderByName_LAWNFOODKIMHAE(법인관리, '재무관리') || 법인관리.createFolder('재무관리');
    let 법인폴더 = getFolderByName_LAWNFOODKIMHAE(재무관리, 법인이름) || 재무관리.createFolder(법인이름);
    let 은행거래내역 = getFolderByName_LAWNFOODKIMHAE(법인폴더, '은행거래내역') || 법인폴더.createFolder('은행거래내역');

    const folderId = 은행거래내역.getId();
    Logger.log(`✅ 폴더 구조 생성 완료`);
    Logger.log(`   은행거래내역 폴더 ID: ${folderId}\n`);

    // Step 2: 스프레드시트 생성
    Logger.log('📊 Step 2: 스프레드시트 생성');

    const spreadsheetName = `법인재무관리_${법인이름}`;
    let spreadsheet = getSpreadsheetByName_LAWNFOODKIMHAE(법인폴더, spreadsheetName);

    if (!spreadsheet) {
      spreadsheet = SpreadsheetApp.create(spreadsheetName);
      const file = DriveApp.getFileById(spreadsheet.getId());
      file.moveTo(법인폴더);
      Logger.log(`✅ "${spreadsheetName}" 생성 완료`);
    } else {
      Logger.log(`✓ "${spreadsheetName}" 이미 존재`);
    }

    const spreadsheetId = spreadsheet.getId();
    const spreadsheetUrl = spreadsheet.getUrl();

    Logger.log(`   스프레드시트 ID: ${spreadsheetId}`);
    Logger.log(`   URL: ${spreadsheetUrl}\n`);

    // Step 3: 소스에서 모든 시트 목록 가져오기
    Logger.log('📋 Step 3: 소스 스프레드시트에서 시트 목록 가져오기');

    const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
    const sourceSheets = sourceSpreadsheet.getSheets();

    Logger.log(`   소스 시트 개수: ${sourceSheets.length}개\n`);

    // Step 4: 모든 시트 생성 및 1행 복사
    Logger.log('🔄 Step 4: 모든 시트 생성 및 1행 복사 시작');
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

        let targetSheet = spreadsheet.getSheetByName(sheetName);

        if (!targetSheet) {
          targetSheet = spreadsheet.insertSheet(sheetName);
          Logger.log(`  ✅ 시트 생성`);
          Utilities.sleep(300);
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
      const defaultSheet = spreadsheet.getSheetByName('Sheet1');
      if (defaultSheet && spreadsheet.getSheets().length > 1) {
        spreadsheet.deleteSheet(defaultSheet);
        Logger.log('\n🗑️  기본 Sheet1 삭제');
      }
    } catch (e) {
      // 무시
    }

    // 결과 요약
    Logger.log('');
    Logger.log('='.repeat(70));
    Logger.log(`✅ ${companyName} 환경 생성 완료!`);
    Logger.log('='.repeat(70));
    Logger.log('');
    Logger.log('📊 작업 결과:');
    Logger.log(`   총 시트: ${sourceSheets.length}개`);
    Logger.log(`   ✅ 성공: ${successCount}개`);
    Logger.log(`   ⊘ 건너뜀: ${skipCount}개`);
    Logger.log(`   ❌ 실패: ${failCount}개`);
    Logger.log('');
    Logger.log('📋 생성된 환경 정보:');
    Logger.log(`   환경 이름: ${법인이름}`);
    Logger.log(`   스프레드시트 ID: ${spreadsheetId}`);
    Logger.log(`   은행거래내역 폴더 ID: ${folderId}`);
    Logger.log(`   스프레드시트 URL: ${spreadsheetUrl}`);
    Logger.log('');
    Logger.log('📝 다음 단계:');
    Logger.log('   1. 생성된 스프레드시트 열기');
    Logger.log('   2. 확장 프로그램 > Apps Script');
    Logger.log('   3. 설정 ⚙️ > 프로젝트 설정 > 스크립트 ID 복사');
    Logger.log('   4. Claude Code 자동화 스크립트 실행');
    Logger.log('');
    Logger.log('--- 복사해서 전달할 정보 ---');
    Logger.log(`scriptId: [Apps Script 프로젝트 ID]`);
    Logger.log(`ENV_KEY:lawnfoodkimhae`);
    Logger.log(`SPREADSHEET_ID:${spreadsheetId}`);
    Logger.log(`FOLDER_ID:${folderId}`);
    Logger.log(`SPREADSHEET_URL:${spreadsheetUrl}`);
    Logger.log('----------------------------');
    Logger.log('');

    return {
      success: true,
      spreadsheetId: spreadsheetId,
      folderId: folderId,
      spreadsheetUrl: spreadsheetUrl,
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

// 헬퍼 함수들 (LAWNFOODKIMHAE 전용)
function getFolderByName_LAWNFOODKIMHAE(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : null;
}

function getSpreadsheetByName_LAWNFOODKIMHAE(folder, name) {
  const files = folder.getFilesByName(name);
  if (files.hasNext()) {
    const file = files.next();
    try {
      return SpreadsheetApp.openById(file.getId());
    } catch (e) {
      return null;
    }
  }
  return null;
}
