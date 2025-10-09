/**
 * 제이에스파트너스 환경 완전 자동 생성 스크립트 (Google Apps Script 직접 실행)
 *
 * 사용법:
 * node scripts/createJSPEnvironmentAuto.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.join(__dirname, '..');

// Google Apps Script API를 통해 직접 환경 생성
async function main() {
  console.log('🚀 제이에스파트너스 환경 완전 자동 생성\n');
  console.log('=' .repeat(70));
  console.log('이 스크립트는 다음을 자동으로 수행합니다:');
  console.log('  1. 구글 드라이브에 폴더 구조 생성');
  console.log('  2. 법인재무관리_제이에스파트너스 스프레드시트 생성');
  console.log('  3. Apps Script 프로젝트 생성 및 코드 배포');
  console.log('  4. environments.json 업데이트');
  console.log('  5. clasp 설정 파일 생성');
  console.log('  6. 모든 시트 생성 및 1행 복사');
  console.log('=' .repeat(70));
  console.log('');

  try {
    // Step 1: clasp을 사용해서 새 프로젝트 생성
    console.log('📝 Step 1: 새 Apps Script 프로젝트 생성');

    // 임시 디렉토리 생성
    const tempDir = path.join(PROJECT_ROOT, 'temp-jsp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 새 standalone 프로젝트 생성
    console.log('  새 Apps Script 프로젝트 생성 중...');
    const createResult = execSync('npx clasp create --type standalone --title "법인재무관리_제이에스파트너스" --rootDir .', {
      cwd: tempDir,
      encoding: 'utf8'
    });

    console.log(createResult);

    // .clasp.json에서 scriptId 추출
    const tempClaspPath = path.join(tempDir, '.clasp.json');
    const tempClaspConfig = JSON.parse(fs.readFileSync(tempClaspPath, 'utf8'));
    const newScriptId = tempClaspConfig.scriptId;

    console.log(`✅ Apps Script 프로젝트 생성 완료`);
    console.log(`   Script ID: ${newScriptId}\n`);

    // Step 2: 생성 스크립트를 임시 프로젝트에 복사하고 실행
    console.log('📝 Step 2: 폴더 및 스프레드시트 생성');

    // 환경 생성 스크립트 복사
    const envCreateScript = fs.readFileSync(
      path.join(PROJECT_ROOT, 'src', '제이에스파트너스환경생성.js'),
      'utf8'
    );

    fs.writeFileSync(
      path.join(tempDir, '환경생성.js'),
      envCreateScript
    );

    // 스크립트 푸시
    execSync('npx clasp push', {
      cwd: tempDir,
      stdio: 'inherit'
    });

    console.log('✅ 환경 생성 스크립트 배포 완료\n');

    // Step 3: Apps Script 함수 실행
    console.log('📝 Step 3: 환경 생성 함수 실행');
    console.log('  폴더 구조 및 스프레드시트 생성 중...\n');

    const functionResult = execSync('npx clasp run create제이에스파트너스환경', {
      cwd: tempDir,
      encoding: 'utf8'
    });

    console.log(functionResult);

    // 결과 파싱 (여기서는 수동으로 입력받는 방식으로 대체)
    console.log('');
    console.log('=' .repeat(70));
    console.log('📋 Apps Script 실행 결과');
    console.log('=' .repeat(70));
    console.log('');
    console.log('위 로그에서 다음 정보를 확인하고 입력해주세요:');
    console.log('');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise((resolve) => {
      rl.question(prompt, resolve);
    });

    const spreadsheetId = await question('스프레드시트 ID: ');
    const folderId = await question('은행거래내역 폴더 ID: ');
    const spreadsheetUrl = await question('스프레드시트 URL: ');

    console.log('');

    if (!spreadsheetId || !folderId || !spreadsheetUrl) {
      console.log('❌ 모든 정보를 입력해주세요.');
      rl.close();
      return;
    }

    // Step 4: environments.json 업데이트
    console.log('📝 Step 4: environments.json 업데이트');

    const envConfigPath = path.join(PROJECT_ROOT, 'configs', 'environments.json');
    const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));

    envConfig.environments.jsp = {
      name: '제이에스파트너스',
      scriptId: newScriptId,
      spreadsheetId: spreadsheetId.trim(),
      folderId: folderId.trim(),
      spreadsheetUrl: spreadsheetUrl.trim(),
      description: '제이에스파트너스 회계 관리 시스템',
      debugMode: false
    };

    fs.writeFileSync(envConfigPath, JSON.stringify(envConfig, null, 2));
    console.log('✅ environments.json 업데이트 완료\n');

    // Step 5: clasp-jsp.json 생성
    console.log('📝 Step 5: clasp-jsp.json 생성');

    const claspJspConfig = {
      scriptId: newScriptId,
      rootDir: 'src',
      scriptExtensions: ['.js', '.gs'],
      htmlExtensions: ['.html'],
      jsonExtensions: ['.json'],
      filePushOrder: [],
      skipSubdirectories: false
    };

    const claspJspPath = path.join(PROJECT_ROOT, 'configs', 'clasp-jsp.json');
    fs.writeFileSync(claspJspPath, JSON.stringify(claspJspConfig, null, 2));
    console.log('✅ clasp-jsp.json 생성 완료\n');

    // Step 6: 전체 코드 배포
    console.log('📝 Step 6: 제이에스파트너스 환경에 전체 코드 배포');

    execSync('node scripts/deploy.js jsp', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });

    console.log('');

    // Step 7: Git 커밋
    console.log('📝 Step 7: 변경사항 Git 커밋');

    execSync('git add .', { cwd: PROJECT_ROOT });

    const commitMessage = `feat: 제이에스파트너스 환경 추가

- Add jsp environment to environments.json
- Add configs/clasp-jsp.json
- Environment: 제이에스파트너스
- Spreadsheet: 법인재무관리_제이에스파트너스
- Script ID: ${newScriptId}
- Spreadsheet ID: ${spreadsheetId.trim()}
- Folder ID: ${folderId.trim()}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

    execSync(`git commit -m "${commitMessage}"`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });

    console.log('✅ Git 커밋 완료\n');

    // Step 8: 시트 생성 안내
    console.log('📝 Step 8: 모든 시트 생성 및 1행 복사');
    console.log('=' .repeat(70));
    console.log('\n마지막 단계입니다:\n');
    console.log('1. 법인재무관리_제이에스파트너스 스프레드시트 열기');
    console.log(`   ${spreadsheetUrl.trim()}\n`);
    console.log('2. 확장 프로그램 > Apps Script\n');
    console.log('3. 파일: "시트생성및1행복사.js" 선택\n');
    console.log('4. 함수: "startCreateAndCopyRow1" 실행\n');
    console.log('   (이 작업은 몇 분 정도 걸립니다)\n');
    console.log('5. 완료되면 이메일 알림을 받게 됩니다\n');
    console.log('=' .repeat(70));
    console.log('');

    console.log('✅ 제이에스파트너스 환경 설정 완료!\n');
    console.log('📊 요약:');
    console.log(`  환경: 제이에스파트너스 (jsp)`);
    console.log(`  스크립트 ID: ${newScriptId}`);
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

    // 임시 디렉토리 정리
    console.log('🧹 임시 파일 정리 중...');
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('✅ 정리 완료\n');

    rl.close();

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
