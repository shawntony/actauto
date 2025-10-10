/**
 * 각 타겟 환경에서 불필요한 환경생성 스크립트 삭제
 *
 * 규칙:
 * - 각 환경은 자신의 환경생성 스크립트만 유지
 * - 다른 환경의 환경생성 스크립트는 삭제
 * - 공통 파일들은 모두 유지
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 환경 설정 로드
const environmentsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../configs/environments.json'), 'utf8')
);
const environments = environmentsData.environments;

// 환경명과 파일명 매핑
const ENV_SCRIPT_MAPPING = {
  'smartbiz1': '스마트비즈센터1환경생성.js',
  'smartbiz2': '스마트비즈센터2환경생성.js',
  'smartbiz': '스마트비즈센터환경생성.js',
  'kjy': '케이제이와이환경생성.js',
  'jsp': '제이에스파트너스완전자동생성.js',
  'jjqube': '제이제이큐브환경생성.js',
  'khfamilyoffice': 'KH패밀리오피스환경생성.js',
  'hskdevelop': 'HSK개발환경생성.js',
  'cycompany': '씨와이컴퍼니환경생성.js',
  'chc': '씨에이치씨환경생성.js',
  'jckim': '제이씨킴환경생성.js',
  'ahn': '안앤드안어드바이저환경생성.js',
  'lnlhorizon': '엘앤엘호라이즌환경생성.js',
  'tnd': '티앤디환경생성.js',
  'hanurumc': '하누리MC환경생성.js',
  'raudem': '라우뎀환경생성.js',
  'redfolio': '레드폴리오환경생성.js',
  'admonz': '애드몬즈환경생성.js',
  'thesmartn': '더스마트앤환경생성.js',
  'thesmartnmutual': '더스마트앤협동조합환경생성.js',
  'haerimcnp': '해림씨앤피환경생성.js'
};

// 모든 환경생성 스크립트 파일명
const ALL_ENV_SCRIPTS = Object.values(ENV_SCRIPT_MAPPING);

// 특정 환경에서 삭제할 파일 목록 계산
function getFilesToDelete(envKey) {
  const keepFile = ENV_SCRIPT_MAPPING[envKey];
  if (!keepFile) {
    console.log(`⚠️  ${envKey}에 대한 환경생성 스크립트 매핑을 찾을 수 없습니다.`);
    return ALL_ENV_SCRIPTS.filter(f => f !== '시트체크.js' && f !== '시트생성및1행복사.js');
  }

  // 자신의 환경생성 스크립트를 제외한 모든 환경생성 스크립트 + 공통 스크립트
  const filesToDelete = ALL_ENV_SCRIPTS.filter(f => f !== keepFile);

  // 공통 스크립트들도 추가 (유니스에만 필요)
  filesToDelete.push('시트체크.js');
  filesToDelete.push('시트생성및1행복사.js');

  return filesToDelete;
}

// Apps Script에서 파일 삭제 (clasp를 통해)
function deleteFilesFromEnvironment(envKey, filesToDelete) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🗑️  ${environments[envKey].name} (${envKey}) 정리 중...`);
  console.log('='.repeat(60));

  const claspConfigPath = path.join(__dirname, `../configs/clasp-${envKey}.json`);
  const tempDir = path.join(__dirname, `../temp-delete-${envKey}`);

  // 임시 디렉토리 생성
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });

  // .clasp.json 복사
  const tempClaspPath = path.join(tempDir, '.clasp.json');
  fs.copyFileSync(claspConfigPath, tempClaspPath);

  try {
    // 현재 파일 다운로드
    console.log(`📥 현재 파일 다운로드 중...`);
    execSync(`cd "${tempDir}" && clasp pull --force`, {
      stdio: 'pipe',
      encoding: 'utf8'
    });

    const srcPath = path.join(tempDir, 'src');
    let deletedCount = 0;

    // 삭제할 파일들 제거
    filesToDelete.forEach(fileName => {
      const filePath = path.join(srcPath, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`   ✅ 삭제: ${fileName}`);
        deletedCount++;
      }
    });

    if (deletedCount === 0) {
      console.log(`✅ 삭제할 파일이 없습니다.`);
      fs.rmSync(tempDir, { recursive: true, force: true });
      return 0;
    }

    // 수정된 파일들 다시 푸시
    console.log(`\n📤 변경사항 업로드 중... (${deletedCount}개 파일 삭제)`);
    execSync(`cd "${tempDir}" && clasp push --force`, {
      stdio: 'inherit'
    });

    console.log(`✅ ${environments[envKey].name} 정리 완료!`);

    // 임시 디렉토리 정리
    fs.rmSync(tempDir, { recursive: true, force: true });

    return deletedCount;

  } catch (error) {
    console.error(`❌ 오류 발생:`, error.message);
    // 임시 디렉토리 정리
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    return -1;
  }
}

// 메인 실행
async function main() {
  const envArg = process.argv[2];

  console.log('🧹 환경별 불필요한 파일 삭제 도구\n');
  console.log('각 타겟 환경에서 자신의 환경생성 스크립트만 남기고 나머지는 삭제합니다.\n');

  if (envArg) {
    // 특정 환경만 처리
    if (!environments[envArg]) {
      console.error(`❌ 환경을 찾을 수 없습니다: ${envArg}`);
      process.exit(1);
    }

    const filesToDelete = getFilesToDelete(envArg);
    console.log(`📋 삭제 대상 파일: ${filesToDelete.length}개`);
    filesToDelete.forEach(f => console.log(`   - ${f}`));

    const result = deleteFilesFromEnvironment(envArg, filesToDelete);
    if (result > 0) {
      console.log(`\n✅ ${result}개 파일 삭제 완료!`);
    }

  } else {
    // 모든 타겟 환경 처리
    const targetEnvs = Object.keys(environments).filter(key => {
      const env = environments[key];
      if (key === 'production' || env.name === '유니스') return false;
      if (env.scriptId && env.scriptId.startsWith('YOUR_')) return false;
      return true;
    });

    console.log(`🎯 처리할 환경: ${targetEnvs.length}개\n`);

    const results = {};
    let totalDeleted = 0;

    for (const envKey of targetEnvs) {
      const filesToDelete = getFilesToDelete(envKey);
      const deleted = deleteFilesFromEnvironment(envKey, filesToDelete);

      if (deleted >= 0) {
        results[envKey] = deleted;
        totalDeleted += deleted;
      } else {
        results[envKey] = -1; // 오류
      }

      // 다음 환경 처리 전 잠시 대기 (API 레이트 리밋 방지)
      if (targetEnvs.indexOf(envKey) < targetEnvs.length - 1) {
        console.log('\n⏳ 2초 대기 중...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 최종 결과 요약
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 최종 결과 요약');
    console.log('='.repeat(60));

    Object.keys(results).forEach(envKey => {
      const deleted = results[envKey];
      if (deleted === -1) {
        console.log(`❌ ${environments[envKey].name} (${envKey}): 오류 발생`);
      } else if (deleted === 0) {
        console.log(`✅ ${environments[envKey].name} (${envKey}): 이미 정리됨`);
      } else {
        console.log(`✅ ${environments[envKey].name} (${envKey}): ${deleted}개 파일 삭제`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`\n🎉 총 ${totalDeleted}개의 불필요한 파일을 삭제했습니다!`);
  }
}

// 실행
if (require.main === module) {
  main().catch(error => {
    console.error('오류 발생:', error);
    process.exit(1);
  });
}
