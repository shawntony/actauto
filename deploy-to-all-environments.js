/**
 * 모든 환경에 코드 배포 스크립트
 * 급여 관리 코드 업데이트를 모든 환경에 전파
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// environments.json 읽기
const envPath = path.join(__dirname, 'configs', 'environments.json');
const environments = JSON.parse(fs.readFileSync(envPath, 'utf8'));

// .clasp.json 경로
const claspPath = path.join(__dirname, '.clasp.json');

// 배포 제외할 환경 (개발/테스트 환경)
const excludeEnvs = ['development', 'testing'];

// 배포할 환경 목록 생성
const deployEnvs = Object.entries(environments.environments)
  .filter(([key, env]) => !excludeEnvs.includes(key) && env.scriptId && env.scriptId !== 'YOUR_DEV_SCRIPT_ID_HERE')
  .map(([key, env]) => ({ key, ...env }));

console.log(`\n총 ${deployEnvs.length}개 환경에 배포 시작...\n`);

let successCount = 0;
let failCount = 0;
const failedEnvs = [];

deployEnvs.forEach((env, index) => {
  console.log(`[${index + 1}/${deployEnvs.length}] ${env.name} (${env.key}) 배포 중...`);

  try {
    // .clasp.json 업데이트
    const claspConfig = {
      scriptId: env.scriptId,
      rootDir: "./src"
    };

    fs.writeFileSync(claspPath, JSON.stringify(claspConfig, null, 2));

    // clasp push 실행
    const output = execSync('clasp push', {
      encoding: 'utf8',
      cwd: __dirname,
      stdio: 'pipe'
    });

    console.log(`  ✅ ${env.name} 배포 완료`);
    successCount++;

  } catch (error) {
    console.error(`  ❌ ${env.name} 배포 실패: ${error.message}`);
    failCount++;
    failedEnvs.push(env.name);
  }

  console.log('');
});

// 결과 요약
console.log('\n========================================');
console.log('배포 완료 요약');
console.log('========================================');
console.log(`✅ 성공: ${successCount}개 환경`);
console.log(`❌ 실패: ${failCount}개 환경`);

if (failedEnvs.length > 0) {
  console.log('\n실패한 환경:');
  failedEnvs.forEach(name => console.log(`  - ${name}`));
}

console.log('\n========================================\n');

// 원래 환경으로 복구 (haerimcnp)
const originalEnv = environments.environments.haerimcnp;
const originalClaspConfig = {
  scriptId: originalEnv.scriptId,
  rootDir: "./src"
};
fs.writeFileSync(claspPath, JSON.stringify(originalClaspConfig, null, 2));
console.log('원래 환경(해림씨앤피)로 복구 완료\n');
