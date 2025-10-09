/**
 * Color logging utility for Node.js scripts
 * 모든 Node.js 스크립트에서 사용하는 통합 로깅 유틸리티
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

/**
 * 기본 색상 로그
 */
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

/**
 * 헤더 출력 (큰 제목)
 */
function header(title, color = 'blue') {
  log('\n' + '━'.repeat(60), color);
  log('     ' + title, 'bright');
  log('━'.repeat(60) + '\n', color);
}

/**
 * 섹션 출력 (중간 제목)
 */
function section(title, color = 'yellow') {
  log(`\n${title}`, color);
  log('─'.repeat(60), 'blue');
}

/**
 * 성공 메시지
 */
function success(message) {
  log(`✅ ${message}`, 'green');
}

/**
 * 에러 메시지
 */
function error(message) {
  log(`❌ ${message}`, 'red');
}

/**
 * 경고 메시지
 */
function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * 정보 메시지
 */
function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * 진행 상황 출력
 */
function progress(current, total, message = '') {
  const percentage = Math.round((current / total) * 100);
  log(`[${current}/${total}] ${percentage}% ${message}`, 'blue');
}

/**
 * 단계 출력
 */
function step(number, total, description) {
  log(`\n[${number}/${total}] ${description}`, 'bright');
}

module.exports = {
  log,
  header,
  section,
  success,
  error,
  warning,
  info,
  progress,
  step,
  colors
};
