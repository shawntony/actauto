#!/usr/bin/env node

/**
 * 멀티 환경 배포 스크립트
 * 여러 스프레드시트에 동일한 코드를 배포합니다.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 환경 설정 로드
const environmentsPath = path.join(__dirname, '../configs/environments.json');
const environments = JSON.parse(fs.readFileSync(environmentsPath, 'utf8'));

// 명령줄 인수 파싱
const args = process.argv.slice(2);
const targetEnv = args[0] || environments.default;

// 사용법 출력
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
사용법: node scripts/deploy.js [환경] [옵션]

환경:
  production    프로덕션 환경에 배포
  development   개발 환경에 배포
  testing       테스트 환경에 배포
  all           모든 환경에 배포

옵션:
  --help, -h    도움말 표시
  --list, -l    사용 가능한 환경 목록 표시

예시:
  node scripts/deploy.js production
  node scripts/deploy.js all
  `);
  process.exit(0);
}

// 환경 목록 출력
if (args.includes('--list') || args.includes('-l')) {
  console.log('\n사용 가능한 환경:');
  Object.entries(environments.environments).forEach(([key, env]) => {
    console.log(`  ${key.padEnd(15)} - ${env.name} (${env.description})`);
  });
  console.log('');
  process.exit(0);
}

/**
 * config.js에 환경 설정 주입
 */
function injectConfig(envName, env) {
  const configPath = path.join(__dirname, '../src/config.js');
  let configContent = fs.readFileSync(configPath, 'utf8');

  // 템플릿 변수 치환
  const replacements = {
    '{{ENVIRONMENT}}': envName,
    '{{ENVIRONMENT_NAME}}': env.name,
    '{{SPREADSHEET_ID}}': env.spreadsheetId || '',
    '{{FOLDER_ID}}': env.folderId || '',
    '{{SPREADSHEET_URL}}': env.spreadsheetUrl || '',
    '{{DEBUG_MODE}}': env.debugMode ? 'true' : 'false'
  };

  Object.entries(replacements).forEach(([placeholder, value]) => {
    configContent = configContent.replace(new RegExp(placeholder, 'g'), value);
  });

  // 임시 config 파일 생성 (배포 후 원복)
  const tempConfigPath = path.join(__dirname, '../src/config.deploy.js');
  fs.writeFileSync(tempConfigPath, configContent, 'utf8');

  // 원본 백업
  const backupPath = path.join(__dirname, '../src/config.backup.js');
  fs.copyFileSync(configPath, backupPath);

  // 배포용으로 교체
  fs.copyFileSync(tempConfigPath, configPath);
}

/**
 * config.js 원본 복구
 */
function restoreConfig() {
  const configPath = path.join(__dirname, '../src/config.js');
  const backupPath = path.join(__dirname, '../src/config.backup.js');
  const tempConfigPath = path.join(__dirname, '../src/config.deploy.js');

  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, configPath);
    fs.unlinkSync(backupPath);
  }

  if (fs.existsSync(tempConfigPath)) {
    fs.unlinkSync(tempConfigPath);
  }
}

/**
 * 특정 환경에 배포
 */
function deployToEnvironment(envName) {
  const env = environments.environments[envName];

  if (!env) {
    console.error(`❌ 환경을 찾을 수 없습니다: ${envName}`);
    return false;
  }

  console.log(`\n📦 ${env.name} 배포 시작...`);
  console.log(`   스크립트 ID: ${env.scriptId}`);

  try {
    // 1. config.js 파일에 환경 설정 주입
    console.log('   환경 설정 주입 중...');
    injectConfig(envName, env);

    // 2. .clasp.json 파일 생성
    const claspConfigPath = path.join(__dirname, '../.clasp.json');
    const claspTemplatePath = path.join(__dirname, `../configs/clasp-${envName}.json`);

    if (fs.existsSync(claspTemplatePath)) {
      fs.copyFileSync(claspTemplatePath, claspConfigPath);
    } else {
      console.warn(`⚠️  설정 파일을 찾을 수 없습니다: ${claspTemplatePath}`);
      console.log(`   기본 설정을 사용합니다.`);
    }

    // 3. clasp push 실행
    console.log('   코드 푸시 중...');
    const result = execSync('npx clasp push', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });

    console.log(result);
    console.log(`✅ ${env.name} 배포 완료!`);

    if (env.spreadsheetUrl && env.spreadsheetUrl !== 'YOUR_PRODUCTION_SPREADSHEET_URL') {
      console.log(`   스프레드시트: ${env.spreadsheetUrl}`);
    }

    // 4. config.js 원복
    console.log('   환경 설정 원복 중...');
    restoreConfig();

    return true;
  } catch (error) {
    console.error(`❌ ${env.name} 배포 실패:`, error.message);

    // 에러 발생 시에도 config.js 원복
    restoreConfig();

    return false;
  }
}

/**
 * 모든 환경에 배포
 */
function deployToAll() {
  console.log('\n🚀 모든 환경에 배포 시작...\n');

  const results = {};
  for (const envName of Object.keys(environments.environments)) {
    results[envName] = deployToEnvironment(envName);
  }

  // 결과 요약
  console.log('\n📊 배포 결과 요약:');
  Object.entries(results).forEach(([env, success]) => {
    const status = success ? '✅ 성공' : '❌ 실패';
    console.log(`   ${env.padEnd(15)} ${status}`);
  });
  console.log('');
}

// 메인 실행
if (targetEnv === 'all') {
  deployToAll();
} else {
  deployToEnvironment(targetEnv);
}
