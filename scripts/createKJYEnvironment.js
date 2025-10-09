/**
 * 케이제이와이 환경 완전 자동 생성 스크립트
 *
 * 사용법:
 * node scripts/createKJYEnvironment.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const PROJECT_ROOT = path.join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 케이제이와이 환경 완전 자동 생성\n');
  console.log('=' .repeat(70));
  console.log('이 스크립트는 다음을 자동으로 수행합니다:');
  console.log('  1. 구글 드라이브에 폴더 구조 생성');
  console.log('  2. 법인재무관리_케이제이와이 스프레드시트 생성');
  console.log('  3. Apps Script 프로젝트 생성');
  console.log('  4. environments.json 업데이트');
  console.log('  5. clasp 설정 파일 생성');
  console.log('  6. 코드 배포');
  console.log('  7. 모든 시트 생성 및 1행 복사');
  console.log('=' .repeat(70));
  console.log('');

  try {
    // Step 1: production 환경으로 전환
    console.log('📝 Step 1: production 환경(유니스)으로 전환');
    const claspConfigPath = path.join(PROJECT_ROOT, '.clasp.json');
    const productionConfigPath = path.join(PROJECT_ROOT, 'configs', 'clasp-production.json');
    fs.copyFileSync(productionConfigPath, claspConfigPath);
    console.log('✅ 완료\n');

    // Step 2: 스크립트 업로드 확인
    console.log('📝 Step 2: 환경 생성 스크립트 확인');
    const scriptExists = fs.existsSync(path.join(PROJECT_ROOT, 'src', '케이제이와이환경생성.js'));

    if (!scriptExists) {
      console.log('⚠️  스크립트가 없습니다. 먼저 push 합니다.\n');
      execSync('npx clasp push', {
        cwd: PROJECT_ROOT,
        stdio: 'inherit'
      });
    } else {
      console.log('✅ 스크립트 준비됨\n');
    }

    // Step 3: 사용자에게 Apps Script 실행 안내
    console.log('📝 Step 3: Apps Script에서 환경 생성 스크립트 실행');
    console.log('=' .repeat(70));
    console.log('\n다음 단계를 진행해주세요:\n');
    console.log('1. 법인재무관리_유니스 스프레드시트 열기');
    console.log('   https://docs.google.com/spreadsheets/d/1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8\n');
    console.log('2. 확장 프로그램 > Apps Script\n');
    console.log('3. 파일: "케이제이와이환경생성.js" 선택\n');
    console.log('4. 함수: "create케이제이와이환경" 실행\n');
    console.log('5. 로그에서 다음 정보 확인:');
    console.log('   - 스프레드시트 ID');
    console.log('   - 은행거래내역 폴더 ID');
    console.log('   - 스프레드시트 URL\n');
    console.log('6. 생성된 "법인재무관리_케이제이와이" 스프레드시트 열기\n');
    console.log('7. 확장 프로그램 > Apps Script\n');
    console.log('8. 설정 ⚙️ > 프로젝트 설정 > 스크립트 ID 복사\n');
    console.log('=' .repeat(70));
    console.log('');

    const proceed = await question('위 단계를 완료하셨나요? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('\n작업을 취소합니다.');
      rl.close();
      return;
    }

    console.log('');

    // Step 4: 정보 입력 받기
    console.log('📝 Step 4: 생성된 환경 정보 입력\n');

    const scriptId = await question('Apps Script 프로젝트 ID: ');
    const spreadsheetId = await question('스프레드시트 ID: ');
    const folderId = await question('은행거래내역 폴더 ID: ');
    const spreadsheetUrl = await question('스프레드시트 URL: ');

    console.log('');

    if (!scriptId || !spreadsheetId || !folderId || !spreadsheetUrl) {
      console.log('❌ 모든 정보를 입력해주세요.');
      rl.close();
      return;
    }

    // Step 5: environments.json 업데이트
    console.log('📝 Step 5: environments.json 업데이트');

    const envConfigPath = path.join(PROJECT_ROOT, 'configs', 'environments.json');
    const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));

    envConfig.environments.kjy = {
      name: '케이제이와이',
      scriptId: scriptId.trim(),
      spreadsheetId: spreadsheetId.trim(),
      folderId: folderId.trim(),
      spreadsheetUrl: spreadsheetUrl.trim(),
      description: '케이제이와이 회계 관리 시스템',
      debugMode: false
    };

    fs.writeFileSync(envConfigPath, JSON.stringify(envConfig, null, 2));
    console.log('✅ environments.json 업데이트 완료\n');

    // Step 6: clasp-kjy.json 생성
    console.log('📝 Step 6: clasp-kjy.json 생성');

    const claspKjyConfig = {
      scriptId: scriptId.trim(),
      rootDir: 'src',
      scriptExtensions: ['.js', '.gs'],
      htmlExtensions: ['.html'],
      jsonExtensions: ['.json'],
      filePushOrder: [],
      skipSubdirectories: false
    };

    const claspKjyPath = path.join(PROJECT_ROOT, 'configs', 'clasp-kjy.json');
    fs.writeFileSync(claspKjyPath, JSON.stringify(claspKjyConfig, null, 2));
    console.log('✅ clasp-kjy.json 생성 완료\n');

    // Step 7: Git 커밋
    console.log('📝 Step 7: 변경사항 Git 커밋');

    execSync('git add .', { cwd: PROJECT_ROOT });

    const commitMessage = `feat: 케이제이와이 환경 추가

- Add kjy environment to environments.json
- Add configs/clasp-kjy.json
- Environment: 케이제이와이
- Spreadsheet: 법인재무관리_케이제이와이

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

    execSync(`git commit -m "${commitMessage}"`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });

    console.log('✅ Git 커밋 완료\n');

    // Step 8: 코드 배포
    console.log('📝 Step 8: 케이제이와이 환경에 코드 배포');

    execSync('node scripts/deploy.js kjy', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });

    console.log('');

    // Step 9: 시트 생성 안내
    console.log('📝 Step 9: 모든 시트 생성 및 1행 복사');
    console.log('=' .repeat(70));
    console.log('\n마지막 단계입니다:\n');
    console.log('1. 법인재무관리_케이제이와이 스프레드시트 열기');
    console.log(`   ${spreadsheetUrl.trim()}\n`);
    console.log('2. 확장 프로그램 > Apps Script\n');
    console.log('3. 파일: "모든시트1행 복사.js" 선택\n');
    console.log('4. 함수: "startCreateAndCopyRow1" 실행\n');
    console.log('   (이 작업은 몇 분 정도 걸립니다)\n');
    console.log('5. 완료되면 이메일 알림을 받게 됩니다\n');
    console.log('=' .repeat(70));
    console.log('');

    console.log('✅ 케이제이와이 환경 설정 완료!\n');
    console.log('📊 요약:');
    console.log(`  환경: 케이제이와이 (kjy)`);
    console.log(`  스프레드시트 ID: ${spreadsheetId.trim()}`);
    console.log(`  폴더 ID: ${folderId.trim()}`);
    console.log(`  URL: ${spreadsheetUrl.trim()}`);
    console.log('');

    const pushToGithub = await question('GitHub에 푸시하시겠습니까? (y/n): ');
    if (pushToGithub.toLowerCase() === 'y') {
      console.log('\n📝 GitHub에 푸시 중...');
      execSync('git push', {
        cwd: PROJECT_ROOT,
        stdio: 'inherit'
      });
      console.log('✅ GitHub 푸시 완료\n');
    }

    rl.close();

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
