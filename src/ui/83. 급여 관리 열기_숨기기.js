/**
 * '급여기본정보', '건강보험', '국민연금', '고용보험', '산재보험', 
 * '월지급계산', '월지급DB' 시트의 표시 상태를 토글합니다.
 */
function togglePayrollSheetsVisibility() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const PAYROLL_SHEET_NAMES = [
    '급여기본정보', 
    '건강보험', 
    '국민연금', 
    '고용보험', 
    '산재보험', 
    '월지급계산', 
    '월지급DB'
  ];

  let sheets = [];
  let allHidden = true;

  // 1. 시트 객체를 가져오고 상태를 확인합니다.
  for (const name of PAYROLL_SHEET_NAMES) {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      sheets.push(sheet);
      if (!sheet.isSheetHidden()) {
        allHidden = false;
      }
    }
  }
  
  if (sheets.length === 0) {
      ui.alert('오류: 지정된 급여 시트 중 유효한 시트가 스프레드시트에서 발견되지 않았습니다.');
      return;
  }

  const action = allHidden ? '표시' : '숨김';

  // 2. 상태에 따라 시트를 토글합니다.
  try {
    if (allHidden) {
      // 모두 숨겨져 있으므로, 모두 표시합니다.
      sheets.forEach(sheet => sheet.showSheet());
    } else {
      // 하나라도 표시되어 있으므로, 모두 숨깁니다.
      sheets.forEach(sheet => sheet.hideSheet());
    }
    
    ui.alert(`✅ 급여 관리 시트 ${action} 처리가 완료되었습니다.`);
    
  } catch (e) {
    ui.alert(`오류: 시트 ${action} 중 문제가 발생했습니다. ` + e.toString());
  }
}
