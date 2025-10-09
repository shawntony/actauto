/**
 * 제이에스파트너스 환경 자동 생성 스크립트
 *
 * 실행 방법:
 * 1. Apps Script 편집기에서 이 파일 열기
 * 2. create제이에스파트너스환경() 함수 실행
 */

function create제이에스파트너스환경() {
  Logger.log('🚀 제이에스파트너스 환경 생성 시작\n');

  try {
    // 1. 기본 폴더 구조 찾기 또는 생성
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

    // 제이에스파트너스 폴더
    let 제이에스파트너스Folder = getFolderByName(재무관리Folder, '제이에스파트너스');
    if (!제이에스파트너스Folder) {
      제이에스파트너스Folder = 재무관리Folder.createFolder('제이에스파트너스');
      Logger.log('  ✅ "제이에스파트너스" 폴더 생성');
    } else {
      Logger.log('  ✓ "제이에스파트너스" 폴더 존재');
    }

    // 은행거래내역 폴더
    let 은행거래내역Folder = getFolderByName(제이에스파트너스Folder, '은행거래내역');
    if (!은행거래내역Folder) {
      은행거래내역Folder = 제이에스파트너스Folder.createFolder('은행거래내역');
      Logger.log('  ✅ "은행거래내역" 폴더 생성');
    } else {
      Logger.log('  ✓ "은행거래내역" 폴더 존재');
    }

    const 은행거래내역FolderId = 은행거래내역Folder.getId();
    Logger.log(`  📋 은행거래내역 폴더 ID: ${은행거래내역FolderId}\n`);

    // 2. 스프레드시트 생성
    Logger.log('📊 Step 2: 스프레드시트 생성');

    const spreadsheetName = '법인재무관리_제이에스파트너스';
    let spreadsheet = getSpreadsheetByName(제이에스파트너스Folder, spreadsheetName);

    if (!spreadsheet) {
      // 새 스프레드시트 생성
      spreadsheet = SpreadsheetApp.create(spreadsheetName);

      // 제이에스파트너스 폴더로 이동
      const file = DriveApp.getFileById(spreadsheet.getId());
      file.moveTo(제이에스파트너스Folder);

      Logger.log(`  ✅ "${spreadsheetName}" 생성 완료`);
    } else {
      Logger.log(`  ✓ "${spreadsheetName}" 이미 존재`);
    }

    const spreadsheetId = spreadsheet.getId();
    const spreadsheetUrl = spreadsheet.getUrl();

    Logger.log(`  📋 스프레드시트 ID: ${spreadsheetId}`);
    Logger.log(`  🔗 URL: ${spreadsheetUrl}\n`);

    // 3. Apps Script 프로젝트 생성 (스프레드시트에 바인딩)
    Logger.log('⚙️  Step 3: Apps Script 프로젝트 확인');

    // 스프레드시트를 열어서 스크립트 에디터를 통해 프로젝트가 생성되도록 함
    Logger.log('  ℹ️  스프레드시트를 열고 "확장 프로그램 > Apps Script"를 실행하면');
    Logger.log('     Apps Script 프로젝트가 자동으로 생성됩니다.\n');

    // 4. 결과 요약
    Logger.log('='.repeat(70));
    Logger.log('✅ 제이에스파트너스 환경 생성 완료!');
    Logger.log('='.repeat(70));
    Logger.log('');
    Logger.log('📋 생성된 정보:');
    Logger.log('');
    Logger.log(`환경 이름: 제이에스파트너스`);
    Logger.log(`스프레드시트 ID: ${spreadsheetId}`);
    Logger.log(`은행거래내역 폴더 ID: ${은행거래내역FolderId}`);
    Logger.log(`스프레드시트 URL: ${spreadsheetUrl}`);
    Logger.log('');
    Logger.log('📝 다음 단계:');
    Logger.log('1. 스프레드시트를 열어서 "확장 프로그램 > Apps Script" 실행');
    Logger.log('2. Apps Script 프로젝트 ID 복사 (설정 ⚙️ > 프로젝트 설정)');
    Logger.log('3. 아래 정보를 Claude Code에 전달:');
    Logger.log('');
    Logger.log('--- 복사해서 전달할 정보 ---');
    Logger.log(`scriptId: [Apps Script 프로젝트 ID]`);
    Logger.log(`spreadsheetId: ${spreadsheetId}`);
    Logger.log(`folderId: ${은행거래내역FolderId}`);
    Logger.log(`spreadsheetUrl: ${spreadsheetUrl}`);
    Logger.log('----------------------------');
    Logger.log('');

    return {
      success: true,
      spreadsheetId: spreadsheetId,
      folderId: 은행거래내역FolderId,
      spreadsheetUrl: spreadsheetUrl,
      message: '스프레드시트를 열고 Apps Script 프로젝트 ID를 확인해주세요.'
    };

  } catch (error) {
    Logger.log(`❌ 오류 발생: ${error.message}`);
    Logger.log(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 폴더 이름으로 폴더 찾기
 */
function getFolderByName(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : null;
}

/**
 * 스프레드시트 이름으로 찾기
 */
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

/**
 * 생성된 정보 확인
 */
function check제이에스파트너스환경() {
  Logger.log('🔍 제이에스파트너스 환경 확인\n');

  try {
    const myDrive = DriveApp.getRootFolder();
    const 법인관리 = getFolderByName(myDrive, '법인관리');

    if (!법인관리) {
      Logger.log('❌ 법인관리 폴더가 없습니다.');
      return;
    }

    const 재무관리 = getFolderByName(법인관리, '재무관리');
    if (!재무관리) {
      Logger.log('❌ 재무관리 폴더가 없습니다.');
      return;
    }

    const 제이에스파트너스 = getFolderByName(재무관리, '제이에스파트너스');
    if (!제이에스파트너스) {
      Logger.log('❌ 제이에스파트너스 폴더가 없습니다.');
      return;
    }

    const 은행거래내역 = getFolderByName(제이에스파트너스, '은행거래내역');
    const spreadsheet = getSpreadsheetByName(제이에스파트너스, '법인재무관리_제이에스파트너스');

    Logger.log('📁 폴더 구조:');
    Logger.log(`  ✅ 법인관리/${법인관리.getId()}`);
    Logger.log(`  ✅ 재무관리/${재무관리.getId()}`);
    Logger.log(`  ✅ 제이에스파트너스/${제이에스파트너스.getId()}`);

    if (은행거래내역) {
      Logger.log(`  ✅ 은행거래내역/${은행거래내역.getId()}`);
    } else {
      Logger.log('  ❌ 은행거래내역 폴더 없음');
    }

    Logger.log('');
    Logger.log('📊 스프레드시트:');
    if (spreadsheet) {
      Logger.log(`  ✅ 법인재무관리_제이에스파트너스`);
      Logger.log(`     ID: ${spreadsheet.getId()}`);
      Logger.log(`     URL: ${spreadsheet.getUrl()}`);
    } else {
      Logger.log('  ❌ 스프레드시트 없음');
    }

  } catch (error) {
    Logger.log(`❌ 오류: ${error.message}`);
  }
}
