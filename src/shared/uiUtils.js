/**
 * UI 유틸리티
 *
 * SpreadsheetApp.getUi() 작업을 위한 래퍼 함수 제공
 * - 알림 (Alert)
 * - 확인 (Confirm)
 * - 프롬프트 (Prompt)
 * - 토스트 메시지
 *
 * @module UIUtils
 */

const UIUtils = {
  /**
   * UI 객체 가져오기 (캐싱)
   * @private
   * @returns {GoogleAppsScript.Base.Ui} UI 객체
   */
  _getUi() {
    if (!this._ui) {
      this._ui = SpreadsheetApp.getUi();
    }
    return this._ui;
  },

  /**
   * 정보 알림 표시
   * @param {string} title - 알림 제목
   * @param {string} message - 알림 메시지
   * @example
   * UIUtils.alert('완료', '작업이 성공적으로 완료되었습니다.');
   */
  alert(title, message) {
    this._getUi().alert(title, message, this._getUi().ButtonSet.OK);
  },

  /**
   * 확인 대화상자 표시
   * @param {string} title - 확인 제목
   * @param {string} message - 확인 메시지
   * @returns {boolean} 사용자가 확인을 누르면 true, 취소를 누르면 false
   * @example
   * if (UIUtils.confirm('삭제 확인', '정말로 삭제하시겠습니까?')) {
   *   performDelete();
   * }
   */
  confirm(title, message) {
    const response = this._getUi().alert(
      title,
      message,
      this._getUi().ButtonSet.YES_NO
    );
    return response === this._getUi().Button.YES;
  },

  /**
   * 예/아니오/취소 확인 대화상자 표시
   * @param {string} title - 확인 제목
   * @param {string} message - 확인 메시지
   * @returns {'YES'|'NO'|'CANCEL'} 사용자 선택
   * @example
   * const answer = UIUtils.confirmYesNoCancel('저장', '변경사항을 저장하시겠습니까?');
   * if (answer === 'YES') {
   *   save();
   * } else if (answer === 'NO') {
   *   discard();
   * }
   */
  confirmYesNoCancel(title, message) {
    const response = this._getUi().alert(
      title,
      message,
      this._getUi().ButtonSet.YES_NO_CANCEL
    );

    if (response === this._getUi().Button.YES) return 'YES';
    if (response === this._getUi().Button.NO) return 'NO';
    return 'CANCEL';
  },

  /**
   * 입력 프롬프트 표시
   * @param {string} title - 프롬프트 제목
   * @param {string} message - 프롬프트 메시지
   * @param {string} [defaultValue=''] - 기본값
   * @returns {string|null} 사용자 입력 (취소 시 null)
   * @example
   * const name = UIUtils.prompt('이름 입력', '사용자 이름을 입력하세요:', '홍길동');
   * if (name) {
   *   Logger.log('입력된 이름: ' + name);
   * }
   */
  prompt(title, message, defaultValue = '') {
    const response = this._getUi().prompt(
      title,
      message + (defaultValue ? `\n(기본값: ${defaultValue})` : ''),
      this._getUi().ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() === this._getUi().Button.OK) {
      const text = response.getResponseText().trim();
      return text || defaultValue || null;
    }

    return null;
  },

  /**
   * 토스트 메시지 표시 (우하단 알림)
   * @param {string} message - 메시지 내용
   * @param {string} [title='알림'] - 메시지 제목
   * @param {number} [timeoutSeconds=5] - 표시 시간 (초)
   * @example
   * UIUtils.toast('저장 완료', '데이터 저장', 3);
   */
  toast(message, title = '알림', timeoutSeconds = 5) {
    SpreadsheetApp.getActiveSpreadsheet().toast(message, title, timeoutSeconds);
  },

  /**
   * 성공 토스트 메시지 (✅ 이모지 포함)
   * @param {string} message - 메시지 내용
   * @param {number} [timeoutSeconds=3] - 표시 시간 (초)
   * @example
   * UIUtils.toastSuccess('파일 업로드 완료');
   */
  toastSuccess(message, timeoutSeconds = 3) {
    this.toast(`✅ ${message}`, '성공', timeoutSeconds);
  },

  /**
   * 오류 토스트 메시지 (❌ 이모지 포함)
   * @param {string} message - 메시지 내용
   * @param {number} [timeoutSeconds=5] - 표시 시간 (초)
   * @example
   * UIUtils.toastError('파일을 찾을 수 없습니다.');
   */
  toastError(message, timeoutSeconds = 5) {
    this.toast(`❌ ${message}`, '오류', timeoutSeconds);
  },

  /**
   * 경고 토스트 메시지 (⚠️ 이모지 포함)
   * @param {string} message - 메시지 내용
   * @param {number} [timeoutSeconds=4] - 표시 시간 (초)
   * @example
   * UIUtils.toastWarning('일부 데이터가 누락되었습니다.');
   */
  toastWarning(message, timeoutSeconds = 4) {
    this.toast(`⚠️ ${message}`, '경고', timeoutSeconds);
  },

  /**
   * 정보 토스트 메시지 (ℹ️ 이모지 포함)
   * @param {string} message - 메시지 내용
   * @param {number} [timeoutSeconds=3] - 표시 시간 (초)
   * @example
   * UIUtils.toastInfo('처리 중입니다. 잠시만 기다려주세요.');
   */
  toastInfo(message, timeoutSeconds = 3) {
    this.toast(`ℹ️ ${message}`, '정보', timeoutSeconds);
  },

  /**
   * 선택 목록 대화상자 표시 (HTML 기반)
   * @param {string} title - 대화상자 제목
   * @param {string} message - 안내 메시지
   * @param {Array<string>} options - 선택 옵션 배열
   * @returns {string|null} 선택된 옵션 (취소 시 null)
   * @example
   * const selected = UIUtils.selectFromList(
   *   '법인 선택',
   *   '작업할 법인을 선택하세요:',
   *   ['유니스', '제이에스파트너스', 'HSK개발']
   * );
   */
  selectFromList(title, message, options) {
    if (!options || options.length === 0) {
      this.toastError('선택 가능한 옵션이 없습니다.');
      return null;
    }

    if (options.length === 1) {
      return options[0];
    }

    // HTML 기반 선택 대화상자 생성
    const html = `
      <style>
        body { font-family: Arial, sans-serif; padding: 10px; }
        .option { padding: 8px; margin: 5px 0; cursor: pointer; border: 1px solid #ddd; border-radius: 4px; }
        .option:hover { background-color: #f0f0f0; }
        .message { margin-bottom: 15px; color: #333; }
      </style>
      <div class="message">${message}</div>
      ${options.map((opt, idx) => `
        <div class="option" onclick="google.script.host.close('${opt}')">${idx + 1}. ${opt}</div>
      `).join('')}
      <br>
      <button onclick="google.script.host.close(null)">취소</button>
    `;

    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(400)
      .setHeight(Math.min(300, 50 + options.length * 45));

    const response = this._getUi().showModalDialog(htmlOutput, title);
    return response;
  },

  /**
   * 진행 중 토스트 (자동 갱신)
   * @param {string} taskName - 작업 이름
   * @param {number} current - 현재 진행
   * @param {number} total - 전체 개수
   * @example
   * for (let i = 0; i < items.length; i++) {
   *   UIUtils.progressToast('데이터 처리', i + 1, items.length);
   *   processItem(items[i]);
   * }
   */
  progressToast(taskName, current, total) {
    const percent = Math.round((current / total) * 100);
    this.toast(
      `${current}/${total} (${percent}%)`,
      `🔄 ${taskName}`,
      2
    );
  },

  /**
   * 사이드바 표시
   * @param {string} htmlContent - HTML 콘텐츠
   * @param {string} title - 사이드바 제목
   * @param {number} [width=300] - 사이드바 너비
   * @example
   * const html = '<div>사이드바 내용</div>';
   * UIUtils.showSidebar(html, '도움말', 350);
   */
  showSidebar(htmlContent, title, width = 300) {
    const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
      .setTitle(title)
      .setWidth(width);

    this._getUi().showSidebar(htmlOutput);
  },

  /**
   * 모달 대화상자 표시
   * @param {string} htmlContent - HTML 콘텐츠
   * @param {string} title - 대화상자 제목
   * @param {number} [width=600] - 대화상자 너비
   * @param {number} [height=400] - 대화상자 높이
   * @example
   * const html = '<div>대화상자 내용</div>';
   * UIUtils.showModal(html, '상세 정보', 700, 500);
   */
  showModal(htmlContent, title, width = 600, height = 400) {
    const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
      .setWidth(width)
      .setHeight(height);

    this._getUi().showModalDialog(htmlOutput, title);
  },

  /**
   * 오류 알림 (상세 정보 포함)
   * @param {Error|string} error - 오류 객체 또는 메시지
   * @param {string} [context='작업'] - 오류 발생 컨텍스트
   * @example
   * try {
   *   performOperation();
   * } catch (error) {
   *   UIUtils.alertError(error, '데이터 처리');
   * }
   */
  alertError(error, context = '작업') {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    this.alert(
      `❌ ${context} 실패`,
      `오류가 발생했습니다:\n\n${errorMessage}\n\n관리자에게 문의하세요.`
    );

    // 로그에 상세 정보 기록
    Logger.log(`[오류] ${context} - ${errorMessage}`);
    if (errorStack) {
      Logger.log(`[스택 트레이스]\n${errorStack}`);
    }
  }
};
