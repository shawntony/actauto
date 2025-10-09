/**
 * 제이제이큐브 환경 완전 자동 생성 스크립트
 *
 * 실행 방법:
 * 1. Apps Script 편집기에서 이 파일 열기
 * 2. create제이제이큐브완전자동() 함수 실행
 */

const SOURCE_ID = '1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8'; // 유니스

function create제이제이큐브완전자동() {
  Logger.log('🚀 제이제이큐브 환경 완전 자동 생성 시작\n');
  Logger.log('='.repeat(70));

  try {
    // Step 1: 폴더 구조 생성
    Logger.log('📁 Step 1: 폴더 구조 생성');

    const myDrive = DriveApp.getRootFolder();

    // 법인관리 폴더
    let 법인관리Folder = getFolderByName(myDrive, '법인관리');
    if (!법인관리Folder) {
      법인관리Folder = myDrive.createFolder('법인관리');
      Logger.log('  ✅ "법인관리" 폴더 생성');
    } else {
      Logger.log('  ✓ "법인관리" 폴더 존재');
    }

    // 재무관리 폴더
    let 재무관리Folder = getFolderByName(법인관리Folder, '재무관리');
    if (!재무관리Folder) {
      재무관리Folder = 법인관리Folder.createFolder('재무관리');
      Logger.log('  ✅ "재무관리" 폴더 생성');
    } else {
      Logger.log('  ✓ "재무관리" 폴더 존재');
    }

    // 제이제이큐브 폴더
    let 제이제이큐브Folder = getFolderByName(재무관리Folder, '제이제이큐브');
    if (!제이제이큐브Folder) {
      제이제이큐브Folder = 재무관리Folder.createFolder('제이제이큐브');
      Logger.log('  ✅ "제이제이큐브" 폴더 생성');
    } else {
      Logger.log('  ✓ "제이제이큐브" 폴더 존재');
    }

    // 은행거래내역 폴더
    let 은행거래내역Folder = getFolderByName(제이제이큐브Folder, '은행거래내역');
    if (!은행거래내역Folder) {
      은행거래내역Folder = 제이제이큐브Folder.createFolder('은행거래내역');
      Logger.log('  ✅ "은행거래내역" 폴더 생성');
    } else {
      Logger.log('  ✓ "은행거래내역" 폴더 존재');
    }

    const 은행거래내역FolderId = 은행거래내역Folder.getId();
    Logger.log(`  📋 은행거래내역 폴더 ID: ${은행거래내역FolderId}\n`);

    // Step 2: 스프레드시트 생성
    Logger.log('📊 Step 2: 스프레드시트 생성');

    const spreadsheetName = '법인재무관리_제이제이큐브';
    let spreadsheet = getSpreadsheetByName(제이제이큐브Folder, spreadsheetName);
    let isNewSpreadsheet = false;

    if (!spreadsheet) {
      spreadsheet = SpreadsheetApp.create(spreadsheetName);
      const file = DriveApp.getFileById(spreadsheet.getId());
      file.moveTo(제이제이큐브Folder);
      isNewSpreadsheet = true;
      Logger.log(`  ✅ "${spreadsheetName}" 생성 완료`);
    } else {
      Logger.log(`  ✓ "${spreadsheetName}" 이미 존재`);
    }

    const spreadsheetId = spreadsheet.getId();
    const spreadsheetUrl = spreadsheet.getUrl();

    Logger.log(`  📋 스프레드시트 ID: ${spreadsheetId}`);
    Logger.log(`  🔗 URL: ${spreadsheetUrl}\n`);

    // Step 3: 소스 스프레드시트에서 시트 복사
    Logger.log('📋 Step 3: 유니스에서 시트 및 1행 복사');
    Logger.log('─'.repeat(70));

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

        let targetSheet = spreadsheet.getSheetByName(sheetName);

        if (!targetSheet) {
          targetSheet = spreadsheet.insertSheet(sheetName);
          Logger.log(`  ✅ 시트 생성`);
          DelayUtils.afterSheetCreation();
        } else {
          Logger.log(`  ✓ 시트 이미 존재`);
        }

        const row1Data = getCompleteRowData(sourceSheet, 1);
        if (row1Data) {
          setCompleteRowData(targetSheet, 1, row1Data);
          Logger.log(`  ✅ 1행 복사 완료 (${row1Data.columnCount}개 열)`);
        }

        successCount++;
        DelayUtils.short();

      } catch (error) {
        Logger.log(`  ❌ 오류: ${error.message}`);
        failCount++;
      }
    });

    // 기본 시트 삭제
    if (spreadsheet.getSheets().length > 1) {
      if (deleteSheetIfExists(spreadsheet, 'Sheet1')) {
        Logger.log('\n🗑️  기본 Sheet1 삭제');
      }
    }

    // 결과 요약
    Logger.log('');
    Logger.log('='.repeat(70));
    Logger.log('✅ 제이제이큐브 환경 완전 자동 생성 완료!');
    Logger.log('='.repeat(70));
    Logger.log('');
    Logger.log('📊 시트 복사 결과:');
    Logger.log(`   총 시트: ${sourceSheets.length}개`);
    Logger.log(`   ✅ 성공: ${successCount}개`);
    Logger.log(`   ⊘ 건너뜀: ${skipCount}개`);
    Logger.log(`   ❌ 실패: ${failCount}개`);
    Logger.log('');
    Logger.log('📋 생성된 정보:');
    Logger.log(`   환경 이름: 제이제이큐브`);
    Logger.log(`   스프레드시트 ID: ${spreadsheetId}`);
    Logger.log(`   은행거래내역 폴더 ID: ${은행거래내역FolderId}`);
    Logger.log(`   스프레드시트 URL: ${spreadsheetUrl}`);
    Logger.log('');
    Logger.log('📝 다음 단계:');
    Logger.log('1. 스프레드시트를 열어서 "확장 프로그램 > Apps Script" 실행');
    Logger.log('2. Apps Script 프로젝트 ID 복사 (설정 ⚙️ > 프로젝트 설정)');
    Logger.log('');
    Logger.log('--- 자동 수집 정보 ---');
    Logger.log(`ENV_KEY:jjqube`);
    Logger.log(`SPREADSHEET_ID:${spreadsheetId}`);
    Logger.log(`FOLDER_ID:${은행거래내역FolderId}`);
    Logger.log(`SPREADSHEET_URL:${spreadsheetUrl}`);
    Logger.log('----------------------------');
    Logger.log('');

    return {
      success: true,
      envKey: 'jjqube',
      spreadsheetId: spreadsheetId,
      folderId: 은행거래내역FolderId,
      spreadsheetUrl: spreadsheetUrl,
      sheetsCopied: successCount
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

// 헬퍼 함수들
function getFolderByName(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : null;
}

function getSpreadsheetByName(folder, name) {
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
