/**
 * 위하고 업로드 파일 업데이트
 *
 * 역할:
 * - 월지급더존업로드 시트에서 데이터 읽기 (2행부터)
 * - Google Sheets 템플릿 파일에 데이터 업데이트
 * - 3행 이후 기존 데이터 삭제 후 새 데이터 붙여넣기
 *
 * 버전: 1.0
 * 작성일: 2026-02-01
 */

// ============================================
// 설정
// ============================================

const WIHAGO_UPLOAD_CONFIG = {
  // Google Sheets로 변환된 템플릿 파일명
  TEMPLATE_FILE_NAME: '주식회사 해림씨앤피-급여업로드양식',

  SOURCE_SHEET_NAME: '월지급더존업로드',
  SOURCE_START_ROW: 2, // 2행부터

  TARGET_START_ROW: 3, // 3행부터 데이터 붙여넣기
  TARGET_SHEET_INDEX: 0 // 첫 번째 시트
};

// ============================================
// 메인 함수
// ============================================

/**
 * 위하고 업로드 파일 업데이트 (메뉴에서 실행)
 */
function updateWihagoUploadFile() {
  try {
    const ui = SpreadsheetApp.getUi();

    // 확인 메시지
    const response = ui.alert(
      '위하고 업로드 파일 업데이트',
      '월지급더존업로드 데이터를 위하고 업로드 파일로 복사하시겠습니까?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      return;
    }

    // 1. 소스 데이터 읽기
    const sourceData = readSourceData();
    if (!sourceData.success) {
      ui.alert('오류', sourceData.error, ui.ButtonSet.OK);
      return;
    }

    // 2. 타겟 파일 찾기
    const targetFile = findTargetFile();
    if (!targetFile.success) {
      ui.alert('오류', targetFile.error, ui.ButtonSet.OK);
      return;
    }

    // 3. 데이터 업데이트
    const updateResult = updateTargetFile(
      targetFile.spreadsheet,
      sourceData.data,
      sourceData.lastColumn
    );

    if (!updateResult.success) {
      ui.alert('오류', updateResult.error, ui.ButtonSet.OK);
      return;
    }

    // 4. Excel 파일 자동 생성
    const excelResult = exportToExcel(targetFile.spreadsheet);

    if (!excelResult.success) {
      ui.alert('경고',
        'Google Sheets 업데이트는 완료되었으나 Excel 파일 생성 실패:\n' + excelResult.error,
        ui.ButtonSet.OK);
      return;
    }

    // 성공 메시지
    const message = `
위하고 업로드 파일이 성공적으로 업데이트되었습니다!

✅ 업데이트된 데이터: ${sourceData.rowCount}행
📁 Google Sheets: ${targetFile.fileName}
📄 Excel 파일: ${excelResult.fileName}
📍 저장 위치: ${excelResult.folderPath}

🔗 Excel 파일 열기:
Google Drive에서 "${excelResult.fileName}" 검색
또는 "최근 항목"에서 .xlsx 파일 확인

📂 다음 단계:
생성된 Excel 파일을 위하고 급여입력에서 엑셀 불러오기로 실행하세요.
    `.trim();

    ui.alert('완료', message, ui.ButtonSet.OK);

    // 파일 위치 로그
    Logger.log('Excel 파일 생성 완료:');
    Logger.log('파일명: ' + excelResult.fileName);
    Logger.log('위치: ' + excelResult.folderPath);
    Logger.log('URL: ' + excelResult.fileUrl);

  } catch (error) {
    SpreadsheetApp.getUi().alert('오류 발생: ' + error.message);
    Logger.log('위하고 업로드 파일 업데이트 오류: ' + error.message);
    Logger.log(error.stack);
  }
}

// ============================================
// 데이터 읽기
// ============================================

/**
 * 월지급더존업로드 시트에서 데이터 읽기
 * @return {Object} {success, data, rowCount, lastColumn, error}
 */
function readSourceData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(WIHAGO_UPLOAD_CONFIG.SOURCE_SHEET_NAME);

    if (!sheet) {
      return {
        success: false,
        error: `${WIHAGO_UPLOAD_CONFIG.SOURCE_SHEET_NAME} 시트를 찾을 수 없습니다.`
      };
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < WIHAGO_UPLOAD_CONFIG.SOURCE_START_ROW) {
      return {
        success: false,
        error: `${WIHAGO_UPLOAD_CONFIG.SOURCE_SHEET_NAME} 시트에 데이터가 없습니다.`
      };
    }

    const lastCol = sheet.getLastColumn();
    const rowCount = lastRow - WIHAGO_UPLOAD_CONFIG.SOURCE_START_ROW + 1;

    // 2행부터 끝까지 읽기
    const data = sheet.getRange(
      WIHAGO_UPLOAD_CONFIG.SOURCE_START_ROW,
      1,
      rowCount,
      lastCol
    ).getValues();

    return {
      success: true,
      data: data,
      rowCount: rowCount,
      lastColumn: lastCol
    };

  } catch (error) {
    return {
      success: false,
      error: '데이터 읽기 오류: ' + error.message
    };
  }
}

// ============================================
// 타겟 파일 찾기
// ============================================

/**
 * 위하고 업로드 Google Sheets 파일 찾기
 * @return {Object} {success, spreadsheet, fileName, error}
 */
function findTargetFile() {
  try {
    // 파일명으로 찾기
    const files = DriveApp.getFilesByName(WIHAGO_UPLOAD_CONFIG.TEMPLATE_FILE_NAME);

    if (!files.hasNext()) {
      return {
        success: false,
        error: `파일을 찾을 수 없습니다: ${WIHAGO_UPLOAD_CONFIG.TEMPLATE_FILE_NAME}\n\n` +
               '먼저 Excel 파일을 Google Sheets로 변환하세요:\n' +
               '1. Google Drive에서 Excel 파일 찾기\n' +
               '2. 파일 우클릭 → "Google Sheets로 열기"\n' +
               '3. 열린 상태로 저장 (자동 변환됨)'
      };
    }

    const file = files.next();
    const ss = SpreadsheetApp.open(file);

    return {
      success: true,
      spreadsheet: ss,
      fileName: file.getName()
    };

  } catch (error) {
    return {
      success: false,
      error: '파일 찾기 오류: ' + error.message
    };
  }
}

// ============================================
// 데이터 업데이트
// ============================================

/**
 * 타겟 파일에 데이터 업데이트
 * @param {Spreadsheet} targetSpreadsheet - 타겟 스프레드시트
 * @param {Array} data - 복사할 데이터
 * @param {number} columnCount - 컬럼 수
 * @return {Object} {success, error}
 */
function updateTargetFile(targetSpreadsheet, data, columnCount) {
  try {
    const sheet = targetSpreadsheet.getSheets()[WIHAGO_UPLOAD_CONFIG.TARGET_SHEET_INDEX];

    // 1. 3행 이후 기존 데이터 삭제
    const maxRows = sheet.getMaxRows();
    const headerRows = WIHAGO_UPLOAD_CONFIG.TARGET_START_ROW - 1; // 1-2행은 헤더

    if (maxRows > headerRows) {
      // 기존 데이터 영역 지우기
      const existingDataRows = maxRows - headerRows;
      const clearRange = sheet.getRange(
        WIHAGO_UPLOAD_CONFIG.TARGET_START_ROW,
        1,
        existingDataRows,
        sheet.getLastColumn()
      );
      clearRange.clearContent();
    }

    // 2. 새 데이터 붙여넣기 (값만)
    if (data.length > 0) {
      const targetRange = sheet.getRange(
        WIHAGO_UPLOAD_CONFIG.TARGET_START_ROW,
        1,
        data.length,
        columnCount
      );

      // 값만 복사 (서식 유지)
      targetRange.setValues(data);
    }

    // 3. 스프레드시트 저장
    SpreadsheetApp.flush();

    return {
      success: true
    };

  } catch (error) {
    return {
      success: false,
      error: '데이터 업데이트 오류: ' + error.message
    };
  }
}

// ============================================
// Excel 변환
// ============================================

/**
 * Google Sheets를 Excel 파일로 변환하여 저장
 * @param {Spreadsheet} spreadsheet - 변환할 스프레드시트
 * @return {Object} {success, fileName, folderPath, fileUrl, error}
 */
function exportToExcel(spreadsheet) {
  try {
    // 1. Spreadsheet를 Excel blob으로 변환
    const url = 'https://docs.google.com/feeds/download/spreadsheets/Export?key=' +
                spreadsheet.getId() + '&exportFormat=xlsx';

    const params = {
      method: 'get',
      headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, params);

    if (response.getResponseCode() !== 200) {
      return {
        success: false,
        error: 'Excel 변환 실패: HTTP ' + response.getResponseCode()
      };
    }

    const blob = response.getBlob();
    const excelFileName = WIHAGO_UPLOAD_CONFIG.TEMPLATE_FILE_NAME + '.xlsx';
    blob.setName(excelFileName);

    // 2. 타겟 폴더 찾기 (Google Sheets 파일과 같은 위치)
    const sheetFile = DriveApp.getFileById(spreadsheet.getId());
    const parents = sheetFile.getParents();

    if (!parents.hasNext()) {
      return {
        success: false,
        error: '저장할 폴더를 찾을 수 없습니다.'
      };
    }

    const folder = parents.next();

    // 3. 기존 Excel 파일이 있으면 삭제
    const existingFiles = folder.getFilesByName(excelFileName);
    while (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }

    // 4. 새 Excel 파일 생성
    const newFile = folder.createFile(blob);

    return {
      success: true,
      fileName: excelFileName,
      folderPath: getFolderPath(folder),
      fileUrl: newFile.getUrl()
    };

  } catch (error) {
    return {
      success: false,
      error: 'Excel 파일 생성 오류: ' + error.message
    };
  }
}

/**
 * 폴더 경로 가져오기
 * @param {Folder} folder - 폴더
 * @return {string} 폴더 경로
 */
function getFolderPath(folder) {
  try {
    const pathParts = [];
    let current = folder;

    // 루트까지 거슬러 올라가며 경로 수집
    while (current.getName() !== 'My Drive' && current.getParents().hasNext()) {
      pathParts.unshift(current.getName());
      current = current.getParents().next();
    }

    return pathParts.join(' > ') || folder.getName();
  } catch (error) {
    return folder.getName();
  }
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 생성된 Excel 파일 찾기
 * - 최근 생성된 Excel 파일의 위치를 확인
 */
function findWihagoExcelFile() {
  try {
    const ui = SpreadsheetApp.getUi();
    const excelFileName = WIHAGO_UPLOAD_CONFIG.TEMPLATE_FILE_NAME + '.xlsx';

    // Excel 파일 검색
    const files = DriveApp.getFilesByName(excelFileName);

    if (!files.hasNext()) {
      ui.alert(
        '파일을 찾을 수 없습니다',
        `파일명: ${excelFileName}\n\n` +
        'Excel 파일이 아직 생성되지 않았습니다.\n' +
        '"위하고 업로드 파일 업데이트" 메뉴를 먼저 실행하세요.',
        ui.ButtonSet.OK
      );
      return;
    }

    // 모든 파일 목록 (여러 개일 수 있음)
    const fileList = [];
    while (files.hasNext()) {
      const file = files.next();
      const parents = file.getParents();
      const folderName = parents.hasNext() ? parents.next().getName() : '(루트)';

      fileList.push({
        name: file.getName(),
        url: file.getUrl(),
        folder: folderName,
        modified: file.getLastUpdated()
      });
    }

    // 최근 수정된 파일 찾기
    fileList.sort((a, b) => b.modified - a.modified);
    const latest = fileList[0];

    const message = `
📄 Excel 파일을 찾았습니다!

파일명: ${latest.name}
📁 폴더: ${latest.folder}
🕐 수정 시간: ${latest.modified.toLocaleString('ko-KR')}

🔗 파일 열기:
아래 URL을 복사하여 브라우저에서 열기:
${latest.url}

${fileList.length > 1 ? `\n⚠️ 동일한 이름의 파일이 ${fileList.length}개 있습니다.\n가장 최근 파일: ${latest.modified.toLocaleString('ko-KR')}` : ''}
    `.trim();

    ui.alert('파일 찾기', message, ui.ButtonSet.OK);
    Logger.log('Excel 파일 URL: ' + latest.url);

  } catch (error) {
    SpreadsheetApp.getUi().alert('오류: ' + error.message);
  }
}

/**
 * 위하고 업로드 파일 설정 확인
 * - Excel 파일이 Google Sheets로 변환되었는지 확인
 */
function checkWihagoUploadFileSetup() {
  try {
    const ui = SpreadsheetApp.getUi();

    // 파일 찾기
    const files = DriveApp.getFilesByName(WIHAGO_UPLOAD_CONFIG.TEMPLATE_FILE_NAME);

    if (!files.hasNext()) {
      ui.alert(
        '파일을 찾을 수 없습니다',
        `파일명: ${WIHAGO_UPLOAD_CONFIG.TEMPLATE_FILE_NAME}\n\n` +
        '먼저 Excel 파일을 Google Sheets로 변환하세요:\n\n' +
        '1. Google Drive에서 다음 위치로 이동:\n' +
        '   2. 법인컨설팅 > 해림씨앤피 > 재무관리 > 급여관리 > 위하고 업로드 양식\n\n' +
        '2. Excel 파일 찾기:\n' +
        '   "주식회사 해림씨앤피-급여업로드양식.xlsx"\n\n' +
        '3. 파일 우클릭 → "Google Sheets로 열기"\n\n' +
        '4. 열린 파일이 자동으로 Google Sheets로 변환됨',
        ui.ButtonSet.OK
      );
      return;
    }

    const file = files.next();
    const fileId = file.getId();
    const url = file.getUrl();
    const mimeType = file.getMimeType();

    const message = `
✅ 파일을 찾았습니다!

📁 파일명: ${file.getName()}
📄 형식: ${mimeType}
🔗 URL: ${url}

${mimeType === MimeType.GOOGLE_SHEETS ?
  '✅ Google Sheets로 변환되어 있습니다. 사용 가능합니다!' :
  '⚠️ Excel 파일입니다. Google Sheets로 변환이 필요합니다.'
}
    `.trim();

    ui.alert('파일 확인', message, ui.ButtonSet.OK);
    Logger.log('위하고 업로드 파일 ID: ' + fileId);

  } catch (error) {
    SpreadsheetApp.getUi().alert('오류: ' + error.message);
  }
}
