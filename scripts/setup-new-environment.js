#!/usr/bin/env node

/**
 * 새 환경 설정 스크립트
 * 새로운 스프레드시트 환경을 추가합니다.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupNewEnvironment() {
  console.log('\n🔧 새 환경 설정\n');

  // 입력 받기
  const envKey = await question('환경 키 (예: client1, project2): ');
  const envName = await question('환경 이름 (예: 고객사1, 프로젝트2): ');
  const scriptId = await question('스크립트 ID: ');
  const spreadsheetUrl = await question('스프레드시트 URL (선택사항): ');
  const description = await question('설명 (선택사항): ');

  // 환경 설정 파일 업데이트
  const environmentsPath = path.join(__dirname, '../configs/environments.json');
  const environments = JSON.parse(fs.readFileSync(environmentsPath, 'utf8'));

  environments.environments[envKey] = {
    name: envName,
    scriptId: scriptId,
    spreadsheetUrl: spreadsheetUrl || `https://docs.google.com/spreadsheets/...`,
    description: description || `${envName} 환경`
  };

  fs.writeFileSync(
    environmentsPath,
    JSON.stringify(environments, null, 2),
    'utf8'
  );

  // Clasp 설정 파일 생성
  const claspConfig = {
    scriptId: scriptId,
    rootDir: "",
    scriptExtensions: [".js", ".gs"],
    htmlExtensions: [".html"],
    jsonExtensions: [".json"],
    filePushOrder: [],
    skipSubdirectories: false
  };

  const claspConfigPath = path.join(__dirname, `../configs/clasp-${envKey}.json`);
  fs.writeFileSync(
    claspConfigPath,
    JSON.stringify(claspConfig, null, 2),
    'utf8'
  );

  console.log('\n✅ 환경 설정 완료!');
  console.log(`\n배포 방법:`);
  console.log(`  npm run deploy ${envKey}`);
  console.log(`\n또는:`);
  console.log(`  node scripts/deploy.js ${envKey}`);
  console.log('');

  rl.close();
}

setupNewEnvironment().catch(console.error);
