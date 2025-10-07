//const SPREADSHEET_ID = '1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8';
//const FOLDER_ID = '1m-a9B-1SNfiq4NiAqftWJSBammq0bvVR';

function processRecentUpload() {
  const ui = SpreadsheetApp.getUi();
  
  const folder = DriveApp.getFolderById(FOLDER_ID);
  
  const files = folder.getFilesByType(MimeType.MICROSOFT_EXCEL); 
  
  let latestFile = null;
  let latestDate = new Date(0);

  if (!files.hasNext()) {
    ui.alert('오류: 지정된 폴더에 엑셀 파일이 없습니다.');
    return;
  }

  while (files.hasNext()) {
    const file = files.next();
    if (!file.getName().endsWith('.xls') && !file.getName().endsWith('.xlsx')) {
        continue;
    }
    const lastUpdated = file.getLastUpdated();
    if (lastUpdated > latestDate) {
      latestDate = lastUpdated;
      latestFile = file;
    }
  }

  if (!latestFile) {
      ui.alert('오류: 최근 파일을 찾을 수 없습니다.');
      return;
  }
  
  const bankNameResponse = ui.prompt(
    '은행 종류를 선택하세요',
    `가장 최근 업로드 파일: "${latestFile.getName()}"\n파일이 어느 은행의 거래 내역입니까? (예: 기업은행, 하나은행, 우리은행)`,
    ui.ButtonSet.OK_CANCEL
  );

  if (bankNameResponse.getSelectedButton() === ui.Button.CANCEL) {
    Logger.log('사용자가 작업을 취소했습니다.');
    return;
  }
  
  const bankName = bankNameResponse.getResponseText();
  
  if (bankName !== '기업은행' && bankName !== '하나은행' && bankName !== '우리은행') {
    ui.alert('지원하는 은행 파일이 아닙니다. 작업을 중단합니다.');
    return;
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ledgerSheet = ss.getSheetByName('은행원장');
  if (!ledgerSheet) {
    ui.alert('오류: "은행원장" 시트를 찾을 수 없습니다.');
    return;
  }

  try {
    const fileBlob = latestFile.getBlob();
    
    const tempFileId = Drive.Files.insert({
      title: '임시_데이터_파일',
      mimeType: MimeType.GOOGLE_SHEETS
    }, fileBlob).id;
    
    const tempSheet = SpreadsheetApp.openById(tempFileId);
    const sheet = tempSheet.getSheets()[0];
    
    let startRowNumber;
    let endColumnLetter;
    let removeTrailer = false;
    
    // 은행에 따른 데이터 추출 설정
    if (bankName === '하나은행') {
        startRowNumber = 2; // 2행 헤더
        endColumnLetter = 'J';
        removeTrailer = true;
    } else if (bankName === '우리은행') {
        // **우리은행 설정:** 4행 헤더, J열까지, 요약행 있음
        startRowNumber = 4; // 4행 헤더
        endColumnLetter = 'J';
        removeTrailer = true; 
    } else { // 기업은행
        startRowNumber = 3; // 3행 헤더
        endColumnLetter = 'M';
        removeTrailer = true;
    }
    
    const lastRowInSheet = sheet.getLastRow();
    
    if (lastRowInSheet < startRowNumber + 1) { 
        DriveApp.getFileById(tempFileId).setTrashed(true);
        ui.alert('경고: 가져온 파일에 복사할 거래 내역이 부족합니다.');
        return;
    }

    const sourceRange = sheet.getRange(`A${startRowNumber}:${endColumnLetter}${lastRowInSheet}`); 
    let values = sourceRange.getValues();
    
    // 1. 마지막 행 제거 (요약/합계 행 제거)
    if (removeTrailer) {
        values.pop();
    }
    
    // 2. 첫 번째 행 제거 (제목행 제거)
    if (values.length > 0) {
        values.shift(); 
    }
    
    // 3. 빈 행 필터링
    values = values.filter(row => row.some(cell => String(cell).trim() !== ""));
    
    let processedValues;
    const bankCode = (bankName === '기업은행') ? '기업' : (bankName === '하나은행' ? '하나' : '우리');

    if (bankName === '기업은행') {
        processedValues = values.map(row => {
            // B열(인덱스 1) 날짜를 YYYY-MM-DD 문자열로 변환
            row[1] = formatDateToSheetString(row[1]);
            row.push(bankCode);
            return row;
        });
    } else if (bankName === '하나은행') {
        processedValues = values.map(row => {
            const newRow = new Array(14).fill(''); 
            
            newRow[0] = row[0]; 
            newRow[1] = formatDateToSheetString(row[1]); // B열 날짜 서식 처리
            
            // 하나은행 매핑 로직
            newRow[2] = row[5]; newRow[3] = row[4]; newRow[4] = row[6]; newRow[5] = row[2]; 
            newRow[8] = row[9]; newRow[12] = row[3]; 
            newRow[13] = bankCode; 

            return newRow;
        });
    } else if (bankName === '우리은행') {
        processedValues = values.map(row => {
            const newRow = new Array(14).fill(''); 
            
            // **우리은행 매핑 로직:** (원본 인덱스 -> 대상 인덱스)
            // 원본 A(0) -> A(0)
            newRow[0] = row[0]; 
            
            // 원본 B(1) -> B(1)
            newRow[1] = formatDateToSheetString(row[1]); // B열 날짜 서식 처리
            
            // 원본 E(4) -> C(2) (출금)
            newRow[2] = row[4];
            
            // 원본 F(5) -> D(3) (입금)
            newRow[3] = row[5];
            
            // 원본 G(6) -> E(4) (거래후잔액)
            newRow[4] = row[6];
            
            // 원본 D(3) -> F(5) (거래내용)
            newRow[5] = row[3];
            
            // 원본 C(2) -> J(9) (적요)
            newRow[9] = row[2]; 
            
            // 원본 I(8) -> I(8) (구분)
            newRow[8] = row[8];
            
            // 원본 J(9) -> K(10) (메모)
            newRow[10] = row[9];
            
            // 원본 H열(7)은 가져오지 않음
            
            newRow[13] = bankCode; // N열 은행명 "우리"
            
            return newRow;
        });
    }
    
    if (processedValues.length === 0) {
        DriveApp.getFileById(tempFileId).setTrashed(true);
        ui.alert('경고: 가져온 파일에 복사할 거래 내역이 없습니다.');
        return;
    }
    
    // **붙여넣기 위치**: 은행원장 시트의 마지막 데이터 다음 행을 계산
    const ledgerLastRow = ledgerSheet.getLastRow();
    const startRow = ledgerLastRow > 1 ? ledgerLastRow + 1 : 2; 

    const targetRange = ledgerSheet.getRange(startRow, 1, processedValues.length, processedValues[0].length);
    targetRange.setValues(processedValues);

    // B열 날짜 서식 적용
    const dateColumnRange = ledgerSheet.getRange(startRow, 2, processedValues.length, 1);
    dateColumnRange.setNumberFormat('yyyy.mm.dd');
    
    DriveApp.getFileById(tempFileId).setTrashed(true);
    
    ui.alert(`"${latestFile.getName()}"의 ${bankName} 거래 내역이 성공적으로 복사되었습니다. (거래 건수: ${processedValues.length})`);
    
  } catch (e) {
    Logger.log('파일 처리 중 오류가 발생했습니다: ' + e.message);
    ui.alert('파일 처리 중 오류가 발생했습니다: ' + e.message);
  }
}

/**
 * 날짜 객체 또는 문자열을 Sheets에 안정적으로 복사 가능한 YYYY-MM-DD 형식의 문자열로 변환합니다.
 */
function formatDateToSheetString(dateValue) {
    let date;
    
    if (dateValue instanceof Date) {
        date = dateValue;
    } else if (typeof dateValue === 'string' && dateValue.trim() !== '') {
        // "2025-01-02 12:09:00" 형식의 문자열을 파싱합니다.
        date = new Date(dateValue.replace(/[-.]/g, "/"));
    } else {
        return dateValue;
    }

    if (date instanceof Date && !isNaN(date)) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    return dateValue;
}