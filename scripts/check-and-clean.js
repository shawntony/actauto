/**
 * 환경별 파일 비교 및 정리 가이드 생성
 *
 * 이 스크립트는:
 * 1. 각 타겟 환경에서 clasp pull로 파일을 가져옴
 * 2. 소스와 비교하여 불필요한 파일 식별
 * 3. 정리 가이드 생성
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 환경 설정 로드
const environmentsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../configs/environments.json'), 'utf8')
);
const environments = environmentsData.environments;

// 소스 파일 목록
function getSourceFiles() {
  const srcDir = path.join(__dirname, '../src');
  const files = new Set();

  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item.endsWith('.js') || item.endsWith('.gs') || item.endsWith('.html')) {
        // src/ 제거하고 파일명만 저장 (Apps Script는 평면 구조)
        const fileName = item;
        files.add(fileName);
      }
    });
  }

  walkDir(srcDir);
  return files;
}

// 특정 환경의 파일 확인
function checkEnvironment(envKey) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 ${environments[envKey].name} (${envKey}) 확인 중...`);
  console.log('='.repeat(60));

  const claspConfigPath = path.join(__dirname, `../configs/clasp-${envKey}.json`);
  const pullDir = path.join(__dirname, `../temp-pull-${envKey}`);

  // 임시 디렉토리 생성
  if (fs.existsSync(pullDir)) {
    fs.rmSync(pullDir, { recursive: true, force: true });
  }
  fs.mkdirSync(pullDir, { recursive: true });

  // .clasp.json 복사
  const tempClaspPath = path.join(pullDir, '.clasp.json');
  fs.copyFileSync(claspConfigPath, tempClaspPath);

  try {
    // clasp pull 실행
    console.log(`📥 파일 다운로드 중...`);
    execSync(`cd "${pullDir}" && clasp pull --force`, {
      stdio: 'pipe',
      encoding: 'utf8'
    });

    // 다운로드된 파일 목록 (src 하위 디렉토리에서 가져오기)
    const pulledFiles = new Set();
    const srcPath = path.join(pullDir, 'src');

    if (fs.existsSync(srcPath)) {
      function scanDir(dir) {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else if (item.endsWith('.js') || item.endsWith('.gs') || item.endsWith('.html')) {
            pulledFiles.add(item);
          }
        });
      }
      scanDir(srcPath);
    }

    console.log(`✅ 다운로드 완료: ${pulledFiles.size}개 파일`);

    // 임시 디렉토리 정리
    fs.rmSync(pullDir, { recursive: true, force: true });

    return pulledFiles;

  } catch (error) {
    console.error(`❌ 오류 발생:`, error.message);
    // 임시 디렉토리 정리
    if (fs.existsSync(pullDir)) {
      fs.rmSync(pullDir, { recursive: true, force: true });
    }
    return null;
  }
}

// 삭제할 파일 생성 스크립트 생성
function generateDeletionScript(extraFiles) {
  if (extraFiles.size === 0) {
    console.log(`\n✅ 삭제할 파일이 없습니다!`);
    return;
  }

  console.log(`\n⚠️  삭제가 필요한 파일: ${extraFiles.size}개`);
  console.log('\n삭제할 파일 목록:');

  const fileList = Array.from(extraFiles).sort();
  fileList.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });

  // Apps Script 삭제 함수 생성
  console.log('\n🔧 Apps Script 웹 편집기에서 실행할 삭제 함수:');
  console.log('=' .repeat(60));
  console.log(`
function deleteExtraFiles() {
  const filesToDelete = [
${fileList.map(f => `    "${f}"`).join(',\n')}
  ];

  const scriptId = ScriptApp.getScriptId();
  Logger.log('Script ID: ' + scriptId);
  Logger.log('삭제할 파일: ' + filesToDelete.length + '개');

  // 주의: Apps Script 웹 편집기에서 파일을 수동으로 삭제해야 합니다.
  // 프로그래매틱 삭제는 Apps Script API가 필요합니다.

  Logger.log('다음 파일들을 수동으로 삭제하세요:');
  filesToDelete.forEach(function(file, index) {
    Logger.log((index + 1) + '. ' + file);
  });
}
  `.trim());
  console.log('=' .repeat(60));
}

// 메인 실행
async function main() {
  const envArg = process.argv[2];

  console.log('🧹 환경 파일 비교 및 정리 도구\n');

  // 소스 파일 목록
  const sourceFiles = getSourceFiles();
  console.log(`📚 유니스(소스) 기준 파일: ${sourceFiles.size}개`);

  if (envArg) {
    // 특정 환경만 확인
    if (!environments[envArg]) {
      console.error(`❌ 환경을 찾을 수 없습니다: ${envArg}`);
      process.exit(1);
    }

    const envFiles = checkEnvironment(envArg);
    if (envFiles) {
      const extraFiles = new Set([...envFiles].filter(f => !sourceFiles.has(f) && f !== 'appsscript.json'));
      generateDeletionScript(extraFiles);
    }

  } else {
    // 모든 타겟 환경 확인 (production 제외, 플레이스홀더 환경 제외)
    const targetEnvs = Object.keys(environments).filter(key => {
      const env = environments[key];
      // production(유니스)은 제외
      if (key === 'production' || env.name === '유니스') return false;
      // 플레이스홀더 환경 제외 (YOUR_로 시작하는 scriptId)
      if (env.scriptId && env.scriptId.startsWith('YOUR_')) return false;
      return true;
    });

    console.log(`\n🎯 확인할 환경: ${targetEnvs.length}개\n`);

    const allResults = {};

    for (const envKey of targetEnvs) {
      const envFiles = checkEnvironment(envKey);
      if (envFiles) {
        const extraFiles = new Set([...envFiles].filter(f => !sourceFiles.has(f) && f !== 'appsscript.json'));
        allResults[envKey] = {
          name: environments[envKey].name,
          totalFiles: envFiles.size,
          extraFiles: extraFiles
        };
      }
    }

    // 결과 요약
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 최종 결과 요약');
    console.log('='.repeat(60));

    let totalExtra = 0;
    Object.keys(allResults).forEach(envKey => {
      const result = allResults[envKey];
      const status = result.extraFiles.size === 0 ? '✅' : '⚠️';
      console.log(`\n${status} ${result.name} (${envKey})`);
      console.log(`   전체: ${result.totalFiles}개, 불필요: ${result.extraFiles.size}개`);

      if (result.extraFiles.size > 0) {
        console.log(`   삭제 대상: ${Array.from(result.extraFiles).join(', ')}`);
        totalExtra += result.extraFiles.size;
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`\n총 ${totalExtra}개의 불필요한 파일이 발견되었습니다.`);

    if (totalExtra > 0) {
      console.log('\n💡 다음 단계:');
      console.log('1. 각 환경의 Apps Script 웹 편집기에 접속');
      console.log('2. 위에 나열된 파일들을 수동으로 삭제');
      console.log('3. 또는 node scripts/check-and-clean.js <환경명>으로 개별 확인');
    } else {
      console.log('\n🎉 모든 환경이 깨끗합니다!');
    }
  }
}

// 실행
if (require.main === module) {
  main().catch(error => {
    console.error('오류 발생:', error);
    process.exit(1);
  });
}
