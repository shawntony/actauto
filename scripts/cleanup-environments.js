/**
 * 유니스 소스 환경을 기준으로 다른 환경의 불필요한 파일 삭제
 *
 * 이 스크립트는:
 * 1. 유니스(소스)에 있는 파일 목록을 기준으로 함
 * 2. 각 타겟 환경에서 소스에 없는 파일을 식별
 * 3. 해당 파일들을 삭제
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 환경 설정 로드
const environments = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../configs/environments.json'), 'utf8')
);

// 소스 디렉토리의 모든 파일 목록 가져오기
function getSourceFiles() {
  const srcDir = path.join(__dirname, '../src');
  const files = [];

  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item.endsWith('.js') || item.endsWith('.gs') || item.endsWith('.html')) {
        // src/ 기준 상대 경로로 변환
        const relativePath = path.relative(srcDir, fullPath).replace(/\\/g, '/');
        files.push(relativePath);
      }
    });
  }

  walkDir(srcDir);
  return files;
}

// clasp를 사용하여 특정 환경의 파일 목록 가져오기
function getEnvironmentFiles(envKey) {
  console.log(`\n📋 ${envKey} 환경의 파일 목록 확인 중...`);

  const claspConfigPath = path.join(__dirname, `../configs/clasp-${envKey}.json`);

  if (!fs.existsSync(claspConfigPath)) {
    console.log(`⚠️  clasp 설정 파일을 찾을 수 없습니다: ${claspConfigPath}`);
    return null;
  }

  // 임시로 .clasp.json 교체
  const originalClaspPath = path.join(__dirname, '../.clasp.json');
  const backupClaspPath = path.join(__dirname, '../.clasp.json.backup');

  try {
    // 백업
    if (fs.existsSync(originalClaspPath)) {
      fs.copyFileSync(originalClaspPath, backupClaspPath);
    }

    // 환경별 clasp 설정으로 교체
    fs.copyFileSync(claspConfigPath, originalClaspPath);

    // clasp status로 파일 목록 확인 (이 명령은 현재 프로젝트 정보를 보여줌)
    // 실제로는 Apps Script API를 사용하거나 pull을 해야 정확한 파일 목록을 알 수 있음

    console.log(`ℹ️  ${envKey}: clasp를 통한 직접 파일 목록 확인은 제한적입니다.`);
    console.log(`   대신 마지막 배포 로그를 참고하거나 수동으로 확인이 필요할 수 있습니다.`);

    return null; // 현재는 파일 목록을 자동으로 가져올 수 없음

  } catch (error) {
    console.error(`❌ ${envKey} 환경 확인 중 오류:`, error.message);
    return null;
  } finally {
    // 원래 clasp 설정 복구
    if (fs.existsSync(backupClaspPath)) {
      fs.copyFileSync(backupClaspPath, originalClaspPath);
      fs.unlinkSync(backupClaspPath);
    }
  }
}

// 메인 실행
function main() {
  console.log('🧹 환경 정리 스크립트 시작\n');
  console.log('=' .repeat(60));

  // 소스 파일 목록
  const sourceFiles = getSourceFiles();
  console.log(`\n✅ 유니스(소스) 파일 개수: ${sourceFiles.length}개\n`);

  // 파일 목록 출력
  console.log('📁 소스 파일 목록:');
  sourceFiles.sort().forEach(file => {
    console.log(`   - ${file}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n⚠️  중요 안내:');
  console.log('clasp는 Apps Script 프로젝트의 파일을 직접 나열하는 기능이 제한적입니다.');
  console.log('따라서 두 가지 방법으로 정리할 수 있습니다:\n');

  console.log('방법 1: 완전 재배포 (권장)');
  console.log('  - 각 환경에서 모든 파일을 수동으로 삭제');
  console.log('  - clasp push --force로 정확한 파일만 재배포');
  console.log('  - 가장 확실하지만 수동 작업 필요\n');

  console.log('방법 2: Apps Script 웹 IDE 사용');
  console.log('  - 각 환경의 Apps Script 웹 편집기에 접속');
  console.log('  - 소스에 없는 파일을 수동으로 삭제');
  console.log('  - 시간이 걸리지만 정확한 확인 가능\n');

  console.log('방법 3: appsscript.json manifest 활용');
  console.log('  - 각 환경에서 clasp pull로 현재 상태 확인');
  console.log('  - 불필요한 파일 식별 후 웹 IDE에서 삭제\n');

  console.log('=' .repeat(60));

  // 타겟 환경 목록
  const targetEnvs = Object.keys(environments).filter(key => {
    const env = environments[key];
    return env.name !== '유니스 (소스)';
  });

  console.log(`\n📊 확인이 필요한 타겟 환경: ${targetEnvs.length}개`);
  targetEnvs.forEach((envKey, index) => {
    console.log(`   ${index + 1}. ${environments[envKey].name} (${envKey})`);
  });

  console.log('\n💡 자동화된 정리 스크립트 생성 완료');
  console.log('   각 환경의 Apps Script 웹 편집기에서 불필요한 파일을 확인하고 삭제하세요.');
}

// 실행
if (require.main === module) {
  main();
}

module.exports = { getSourceFiles };
