/**
 * '분개처리' 시트의 B2, C2, H2 셀의 체크박스를 해제합니다 (값을 FALSE로 설정).
 */
function resetCriteriaCheckboxes() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    const criteriaSheet = ss.getSheetByName('분개처리');

    if (!criteriaSheet) {
        ui.alert('오류: "분개처리" 시트를 찾을 수 없습니다.');
        return;
    }

    try {
        // B2 (차변 체크박스), C2 (대변 체크박스), H2 (추가 체크박스 - H열)
        const rangeToClear = criteriaSheet.getRangeList(['B2', 'C2', 'H2']);
        
        // 체크박스 해제 (값을 FALSE로 설정)
        rangeToClear.setValues([
            [false],
            [false],
            [false]
        ]);

        ui.alert('✅ "분개처리" 시트의 B2, C2, H2 체크박스가 초기화(해제)되었습니다.');
    } catch (e) {
        ui.alert('오류 발생: 체크박스 초기화 중 문제가 발생했습니다. ' + e.toString());
    }
}
