/**
 * 현재 스프레드시트의 URL을 가져와서, 크고 예쁜 버튼이 포함된 
 * 모달 창을 표시하여 사용자가 새 탭을 열도록 유도합니다.
 */
function openNewTabWithCurrentSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const currentUrl = ss.getUrl();
  
  // HTML 및 CSS 스타일 정의
  const htmlContent = `
    <style>
      body {
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        margin: 0;
        padding: 20px;
        background-color: #f8f9fa;
      }
      .custom-button {
        background-color: #4285F4; /* Google Blue */
        color: white;
        padding: 12px 25px;
        font-size: 16px;
        font-weight: bold;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.3s, transform 0.1s;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .custom-button:hover {
        background-color: #357ae8;
        box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
      }
      .info-text {
        margin-top: 15px;
        font-size: 11px;
        color: #6c757d;
        text-align: center;
      }
    </style>
    
    <button class="custom-button" onclick="window.open('${currentUrl}', '_blank'); google.script.host.close()">
      현재 스프레드시트를 새 탭에서 열기 🚀
    </button>
    
    <p class="info-text">
      *버튼 클릭 후 새 탭이 열립니다. (팝업 차단 해제 필요)
    </p>
  `;

  const html = HtmlService.createHtmlOutput(htmlContent)
      .setWidth(350) // 모달 창 너비 조정
      .setHeight(150); // 모달 창 높이 조정

  SpreadsheetApp.getUi().showModalDialog(html, '새 탭 열기');
}