/**
 * Notification utilities for Google Apps Script
 *
 * Provides reusable functions for sending email notifications and alerts.
 */

/**
 * Gets the current user's email address
 * @returns {string|null} Email address or null if not available
 */
function getCurrentUserEmail() {
  try {
    const email = Session.getActiveUser().getEmail();
    return email || null;
  } catch (error) {
    Logger.log(`Could not get user email: ${error.message}`);
    return null;
  }
}

/**
 * Sends a simple email notification
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {string} recipientEmail - Recipient email (optional, defaults to current user)
 * @returns {boolean} True if sent successfully
 */
function sendEmail(subject, body, recipientEmail = null) {
  const email = recipientEmail || getCurrentUserEmail();

  if (!email) {
    Logger.log('No recipient email available');
    return false;
  }

  try {
    MailApp.sendEmail(email, subject, body);
    Logger.log(`Email sent to ${email}: ${subject}`);
    return true;
  } catch (error) {
    Logger.log(`Failed to send email: ${error.message}`);
    return false;
  }
}

/**
 * Sends an email with HTML formatting
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 * @param {string} recipientEmail - Recipient email (optional, defaults to current user)
 * @returns {boolean} True if sent successfully
 */
function sendHtmlEmail(subject, htmlBody, recipientEmail = null) {
  const email = recipientEmail || getCurrentUserEmail();

  if (!email) {
    Logger.log('No recipient email available');
    return false;
  }

  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
    Logger.log(`HTML email sent to ${email}: ${subject}`);
    return true;
  } catch (error) {
    Logger.log(`Failed to send HTML email: ${error.message}`);
    return false;
  }
}

/**
 * Sends a batch completion notification
 * @param {Object} config - Notification configuration
 * @param {string} config.taskName - Name of the completed task
 * @param {Object} config.progress - Progress object with results
 * @param {Array<string>} config.targetNames - Array of target environment names
 * @param {string} config.recipientEmail - Optional recipient email
 */
function sendBatchCompletionEmail(config) {
  const { taskName, progress, targetNames, recipientEmail } = config;
  const email = recipientEmail || getCurrentUserEmail();

  if (!email) {
    Logger.log('No recipient email for batch completion notification');
    return;
  }

  const subject = `✅ ${taskName} 완료`;
  const body = `모든 작업이 완료되었습니다!

📌 작업 내용:
${taskName}

🎯 대상: ${targetNames.join(', ')}

📈 결과:
총 항목: ${progress.totalItems}개
✅ 성공: ${progress.results.success}개
❌ 실패: ${progress.results.failed}개
⊘ 건너뜀: ${progress.results.skipped}개

⏰ 완료 시간: ${new Date().toLocaleString('ko-KR')}`;

  sendEmail(subject, body, email);
}

/**
 * Sends an error notification
 * @param {string} taskName - Name of the task that failed
 * @param {Error} error - Error object
 * @param {Object} context - Optional context information
 * @param {string} recipientEmail - Optional recipient email
 */
function sendErrorEmail(taskName, error, context = {}, recipientEmail = null) {
  const email = recipientEmail || getCurrentUserEmail();

  if (!email) {
    Logger.log('No recipient email for error notification');
    return;
  }

  const subject = `❌ ${taskName} 오류 발생`;
  let body = `작업 실행 중 오류가 발생했습니다.

📌 작업: ${taskName}
❌ 오류: ${error.message}
⏰ 발생 시간: ${new Date().toLocaleString('ko-KR')}`;

  if (error.stack) {
    body += `\n\n📋 스택 트레이스:\n${error.stack}`;
  }

  if (Object.keys(context).length > 0) {
    body += `\n\n📊 컨텍스트:\n${JSON.stringify(context, null, 2)}`;
  }

  sendEmail(subject, body, email);
}

/**
 * Sends a progress update notification
 * @param {string} taskName - Name of the task
 * @param {Object} progress - Progress object
 * @param {string} recipientEmail - Optional recipient email
 */
function sendProgressEmail(taskName, progress, recipientEmail = null) {
  const email = recipientEmail || getCurrentUserEmail();

  if (!email) {
    Logger.log('No recipient email for progress notification');
    return;
  }

  const percentage = Math.round((progress.currentIndex / progress.totalItems) * 100);
  const subject = `📊 ${taskName} 진행 상황 (${percentage}%)`;
  const body = `작업이 진행 중입니다.

📌 작업: ${taskName}
📈 진행률: ${progress.currentIndex}/${progress.totalItems} (${percentage}%)

현재 결과:
✅ 성공: ${progress.results.success}개
❌ 실패: ${progress.results.failed}개
⊘ 건너뜀: ${progress.results.skipped}개

⏰ 시작 시간: ${progress.startTime}
⏰ 현재 시간: ${new Date().toLocaleString('ko-KR')}`;

  sendEmail(subject, body, email);
}

/**
 * Notification utilities object
 */
const NotificationUtils = {
  /**
   * Sends a success notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} details - Optional details object
   */
  success(title, message, details = {}) {
    const email = getCurrentUserEmail();
    if (!email) return;

    let body = `✅ ${title}\n\n${message}`;

    if (Object.keys(details).length > 0) {
      body += '\n\n상세 정보:\n';
      for (const [key, value] of Object.entries(details)) {
        body += `${key}: ${value}\n`;
      }
    }

    body += `\n⏰ ${new Date().toLocaleString('ko-KR')}`;

    sendEmail(`✅ ${title}`, body, email);
  },

  /**
   * Sends a failure notification
   * @param {string} title - Notification title
   * @param {string} message - Error message
   * @param {Object} details - Optional details object
   */
  failure(title, message, details = {}) {
    const email = getCurrentUserEmail();
    if (!email) return;

    let body = `❌ ${title}\n\n${message}`;

    if (Object.keys(details).length > 0) {
      body += '\n\n상세 정보:\n';
      for (const [key, value] of Object.entries(details)) {
        body += `${key}: ${value}\n`;
      }
    }

    body += `\n⏰ ${new Date().toLocaleString('ko-KR')}`;

    sendEmail(`❌ ${title}`, body, email);
  },

  /**
   * Sends a warning notification
   * @param {string} title - Notification title
   * @param {string} message - Warning message
   * @param {Object} details - Optional details object
   */
  warning(title, message, details = {}) {
    const email = getCurrentUserEmail();
    if (!email) return;

    let body = `⚠️ ${title}\n\n${message}`;

    if (Object.keys(details).length > 0) {
      body += '\n\n상세 정보:\n';
      for (const [key, value] of Object.entries(details)) {
        body += `${key}: ${value}\n`;
      }
    }

    body += `\n⏰ ${new Date().toLocaleString('ko-KR')}`;

    sendEmail(`⚠️ ${title}`, body, email);
  },

  /**
   * Sends a batch completion notification
   * @param {string} taskName - Task name
   * @param {Object} progress - Progress object
   * @param {Array<string>} targets - Target names
   */
  batchComplete(taskName, progress, targets) {
    sendBatchCompletionEmail({
      taskName,
      progress,
      targetNames: targets
    });
  },

  /**
   * Sends an error notification
   * @param {string} taskName - Task name
   * @param {Error} error - Error object
   * @param {Object} context - Optional context
   */
  error(taskName, error, context = {}) {
    sendErrorEmail(taskName, error, context);
  },

  /**
   * Sends a progress update
   * @param {string} taskName - Task name
   * @param {Object} progress - Progress object
   */
  progress(taskName, progress) {
    sendProgressEmail(taskName, progress);
  }
};
