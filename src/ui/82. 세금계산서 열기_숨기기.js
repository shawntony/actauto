/**
 * '매출세금계산서', '매출계산서', '매입세금계산서', '매입계산서', '현금영수증매입공제'
 * 시트의 표시 상태를 토글(숨김 ↔ 표시)합니다.
 */
function toggleInvoiceSheetsVisibility() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const INVOICE_SHEET_NAMES = [
    '매출세금계산서', 
    '매출계산서', 
    '매입세금계산서', 
    '매입계산서', 
    '현금영수증매입공제' // 🌟 이름 변경
  ];

  let sheets = [];
  let allHidden = true;

  // 1. 시트 객체를 가져오고 상태를 확인합니다.
  for (const name of INVOICE_SHEET_NAMES) {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      sheets.push(sheet);
      if (!sheet.isSheetHidden()) {
        allHidden = false;
      }
    }
  }
  
  if (sheets.length === 0) {
      ui.alert('오류: 지정된 세금계산서 시트를 스프레드시트에서 찾을 수 없습니다.');
      return;
  }

  const action = allHidden ? '표시' : '숨김';

  // 2. 상태에 따라 시트를 토글합니다.
  try {
    if (allHidden) {
      sheets.forEach(sheet => sheet.showSheet());
    } else {
      sheets.forEach(sheet => sheet.hideSheet());
    }
    
    ui.alert(`✅ 세금계산서 시트 ${action} 처리가 완료되었습니다: ${INVOICE_SHEET_NAMES.join(', ')}`);
    
  } catch (e) {
    ui.alert(`오류: 시트 ${action} 중 문제가 발생했습니다. ` + e.toString());
  }
}