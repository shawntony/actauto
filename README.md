# 📊 ACT Auto - 회계 자동화 시스템

구글 스프레드시트 기반 회계 및 급여 관리 자동화 시스템입니다.

## 🎯 주요 기능

### 📁 프로젝트 구조

```
actauto/
├── src/                    # 소스 코드 (공통)
│   ├── shared/            # 공통 유틸리티 모듈 ⭐ NEW
│   │   ├── batchProgress.js       # 배치 진행 상황 추적
│   │   ├── executionTimer.js      # 실행 시간 관리
│   │   ├── delayUtils.js          # 지연 처리 유틸리티
│   │   ├── triggerManager.js      # 트리거 생명주기 관리
│   │   ├── notificationUtils.js   # 이메일 알림 시스템
│   │   ├── rangeUtils.js          # 범위 데이터 복사
│   │   ├── sheetManagement.js     # 시트 관리 유틸리티
│   │   ├── spreadsheetUtils.js    # 스프레드시트 유틸리티
│   │   └── config.js              # 환경 설정
│   ├── menu/              # 메뉴 관리
│   ├── bank/              # 은행 거래 내역 관리
│   ├── accounting/        # 회계 처리
│   ├── ledger/            # 원장 및 분개 처리
│   ├── payroll/           # 급여 및 4대보험 관리
│   ├── ui/                # UI 및 화면 관리
│   ├── automation/        # 자동화 스크립트
│   ├── backup/            # 백업 관리
│   ├── 시트생성및1행복사.js          # 통합 시트 생성 배치
│   ├── 시트체크.js                  # 시트 목록 검증
│   └── *환경생성.js                # 각 법인 환경 생성 스크립트
├── configs/               # 환경별 설정
│   ├── clasp-production.json
│   ├── clasp-development.json
│   ├── clasp-testing.json
│   └── environments.json  # 환경 관리
├── scripts/               # 배포 스크립트
│   ├── deploy.js          # 멀티 환경 배포
│   └── setup-new-environment.js
├── deployments/           # 배포 기록
├── appsscript.json        # Google Apps Script 설정
└── package.json           # 프로젝트 설정
```

## 🚀 시작하기

### 사전 요구사항

- Node.js (v14 이상)
- Google 계정
- Google Apps Script 액세스 권한

### 설치

```bash
# 의존성 설치
npm install

# Clasp 로그인
npx clasp login
```

## 🌍 멀티 환경 관리

### 개요
하나의 코드베이스로 여러 스프레드시트를 관리할 수 있습니다.

### 기본 환경
- **production**: 프로덕션 환경 (실제 운영)
- **development**: 개발 환경 (개발 및 테스트)
- **testing**: 테스트 환경 (QA)

### 환경 목록 확인
```bash
npm run env:list
```

### 특정 환경에 배포

```bash
# 개발 환경에 배포
npm run deploy:dev

# 테스트 환경에 배포
npm run deploy:test

# 프로덕션 환경에 배포
npm run deploy:prod

# 모든 환경에 배포
npm run deploy:all
```

### 새 환경 추가

**빠른 시작 (완전 자동화)**:

```bash
# 1. 자동화 스크립트 실행
node scripts/create-new-environment.js

# 2. 프롬프트에 따라 정보 입력
# 3. Apps Script에서 환경 생성 함수 실행
# 4. 생성된 정보 입력 및 자동 배포
```

**총 소요 시간**: 5-10분 (대부분 자동)

#### 상세 가이드

새로운 법인 환경 생성 과정에 대한 자세한 내용은 다음 문서를 참조하세요:
- 📘 **[새로운 환경 생성 가이드](scripts/새로운환경생성가이드.md)** - 완전 자동화 프로세스
- 📘 **[시트 복사 트러블슈팅](claudedocs/jjqube-시트복사-방법.md)** - 시트 복사 문제 해결

#### 수동 설정 (고급)

<details>
<summary>대화형 설정 또는 수동 설정 보기</summary>

##### 방법 1: 대화형 설정
```bash
npm run env:setup
```

##### 방법 2: 수동 설정

1. **`configs/environments.json`에 환경 추가**
   ```json
   {
     "environments": {
       "client1": {
         "name": "고객사1",
         "scriptId": "YOUR_SCRIPT_ID_HERE",
         "spreadsheetId": "YOUR_SPREADSHEET_ID_HERE",
         "folderId": "YOUR_FOLDER_ID_HERE",
         "description": "고객사1 회계 시스템"
       }
     }
   }
   ```

2. **`configs/clasp-client1.json` 생성**
   ```json
   {
     "scriptId": "YOUR_SCRIPT_ID_HERE",
     "rootDir": ""
   }
   ```

3. **배포**
   ```bash
   npm run deploy client1
   ```

</details>

## 🧰 공통 유틸리티 모듈 (Shared Utilities)

### 개요
`src/shared/` 폴더에는 모든 법인 환경에서 공통으로 사용하는 재사용 가능한 유틸리티 모듈이 포함되어 있습니다. 이 모듈들은 코드 중복을 제거하고 일관성을 보장하며 유지보수를 쉽게 만듭니다.

### 1. batchProgress.js - 배치 진행 상황 추적
**목적**: PropertiesService를 사용한 배치 작업 진행 상황 관리

**주요 함수**:
```javascript
// 진행 상황 초기화
BatchProgress.init(progressKey, totalItems)
// 예: BatchProgress.init('UNIFIED_PROGRESS', 100)

// 결과 증가 (success, failed, skipped)
BatchProgress.increment(progressKey, 'success')

// 현재 진행 상황 조회
const progress = BatchProgress.get(progressKey)
// 반환: { sheetIndex, totalSheets, startTime, results: { success, failed, skipped } }

// 완료 여부 확인
if (BatchProgress.isComplete(progressKey)) {
  Logger.log('배치 작업 완료!')
}

// 진행 상황 삭제
BatchProgress.delete(progressKey)
```

**사용 예시**:
```javascript
// 배치 작업 시작
BatchProgress.init('MY_BATCH', sourceSheets.length);

sourceSheets.forEach((sheet, index) => {
  try {
    processSheet(sheet);
    BatchProgress.increment('MY_BATCH', 'success');
  } catch (error) {
    BatchProgress.increment('MY_BATCH', 'failed');
  }
});

// 진행 상황 확인
const progress = BatchProgress.get('MY_BATCH');
Logger.log(`진행: ${progress.sheetIndex}/${progress.totalSheets}`);
```

### 2. executionTimer.js - 실행 시간 관리
**목적**: Apps Script 6분 실행 제한 관리

**주요 함수**:
```javascript
// 타이머 생성 (밀리초)
const timer = createExecutionTimer(300000); // 5분

// 시간 초과 여부 확인
if (timer.isTimeExceeded()) {
  Logger.log('실행 시간 초과!');
  // 다음 배치 예약
  TriggerManager.scheduleNextBatch('myFunction', 1);
}

// 경과 시간 확인 (초 단위)
const elapsed = timer.getElapsedSeconds();
Logger.log(`경과 시간: ${elapsed}초`);
```

**사용 예시**:
```javascript
const MAX_TIME = 5 * 60 * 1000; // 5분
const timer = createExecutionTimer(MAX_TIME);

for (let i = 0; i < items.length; i++) {
  if (timer.isTimeExceeded()) {
    Logger.log(`${i}번째 항목에서 시간 초과`);
    // 남은 작업을 위해 트리거 예약
    TriggerManager.scheduleNextBatch('processBatch', 1);
    return;
  }

  processItem(items[i]);
}
```

### 3. delayUtils.js - 지연 처리 유틸리티
**목적**: 일관된 지연 패턴 제공

**주요 함수**:
```javascript
DelayUtils.short()              // 200ms - 빠른 연속 작업용
DelayUtils.standard()           // 500ms - 기본 지연
DelayUtils.long()               // 1000ms - API 호출 후 대기
DelayUtils.afterSheetCreation() // 300ms - 시트 생성 후 안정화
DelayUtils.custom(milliseconds) // 사용자 정의 지연
```

**사용 예시**:
```javascript
// 시트 생성 후 안정화 대기
const newSheet = spreadsheet.insertSheet('새시트');
DelayUtils.afterSheetCreation();

// 연속 API 호출 사이 표준 지연
for (let i = 0; i < items.length; i++) {
  processItem(items[i]);
  DelayUtils.standard();
}

// 긴 작업 후 충분한 대기
heavyOperation();
DelayUtils.long();
```

### 4. triggerManager.js - 트리거 생명주기 관리
**목적**: 트리거 생성, 정리, 재시도 관리

**주요 함수**:
```javascript
// 다음 배치 예약 (분 단위)
TriggerManager.scheduleNextBatch('processBatch', 1); // 1분 후

// 특정 함수의 모든 트리거 정리
TriggerManager.cleanup('processBatch');

// 재시도 트리거 예약
TriggerManager.scheduleRetry('failedFunction', 5); // 5분 후 재시도

// 모든 트리거 삭제
TriggerManager.deleteAll();
```

**사용 예시**:
```javascript
function processBatch() {
  const timer = createExecutionTimer(300000);

  // 기존 트리거 정리
  TriggerManager.cleanup('processBatch');

  // 배치 처리
  while (hasMoreWork() && !timer.isTimeExceeded()) {
    processNextItem();
  }

  // 작업이 남았으면 다음 배치 예약
  if (hasMoreWork()) {
    TriggerManager.scheduleNextBatch('processBatch', 1);
  }
}
```

### 5. notificationUtils.js - 이메일 알림 시스템
**목적**: 구조화된 이메일 알림 발송

**주요 함수**:
```javascript
// 성공 알림
NotificationUtils.success(
  '작업 완료',
  '모든 시트가 성공적으로 생성되었습니다.',
  { '총 시트': '50개', '성공': '48개', '실패': '2개' }
);

// 오류 알림
NotificationUtils.error(
  '작업 실패',
  '시트 생성 중 오류가 발생했습니다.',
  { '오류 메시지': error.message, '파일': 'script.js' }
);

// 배치 완료 알림
NotificationUtils.batchComplete(
  '시트 생성',
  BatchProgress.get('MY_BATCH'),
  ['스프레드시트1', '스프레드시트2']
);
```

**사용 예시**:
```javascript
try {
  const result = performComplexTask();

  NotificationUtils.success(
    '데이터 처리 완료',
    `${result.count}개의 항목을 성공적으로 처리했습니다.`,
    {
      '처리 시간': `${result.duration}초`,
      '성공률': `${result.successRate}%`,
      '다음 작업': result.nextStep
    }
  );
} catch (error) {
  NotificationUtils.error(
    '데이터 처리 실패',
    error.message,
    {
      '스택 트레이스': error.stack,
      '발생 시각': new Date().toLocaleString()
    }
  );
}
```

### 6. rangeUtils.js - 범위 데이터 복사
**목적**: 값, 서식, 스타일을 포함한 완전한 범위 복사

**주요 함수**:
```javascript
// 행 데이터 읽기 (모든 서식 포함)
const rowData = getCompleteRowData(sourceSheet, 1);
// 반환: { values, formats, fontWeights, fontColors, backgrounds, alignments, columnCount }

// 행 데이터 쓰기 (모든 서식 적용)
setCompleteRowData(targetSheet, 1, rowData);
```

**사용 예시**:
```javascript
// 소스에서 헤더 행(1행) 복사
const sourceSheet = spreadsheet.getSheetByName('원본');
const targetSheet = spreadsheet.getSheetByName('대상');

const headerData = getCompleteRowData(sourceSheet, 1);
if (headerData) {
  setCompleteRowData(targetSheet, 1, headerData);
  Logger.log(`헤더 복사 완료 (${headerData.columnCount}개 열)`);
}

// 여러 행 복사
for (let row = 1; row <= 10; row++) {
  const rowData = getCompleteRowData(sourceSheet, row);
  if (rowData) {
    setCompleteRowData(targetSheet, row, rowData);
  }
}
```

### 7. sheetManagement.js - 시트 관리 유틸리티
**목적**: 시트 CRUD 작업 간소화

**주요 함수**:
```javascript
// 시트 가져오기 또는 생성
const sheet = getOrCreateSheet(spreadsheet, '새시트');

// 시트 존재 시 삭제 (안전)
const deleted = deleteSheetIfExists(spreadsheet, '임시시트');
if (deleted) {
  Logger.log('시트 삭제됨');
}

// 시트 내용 지우기 (헤더 보존 옵션)
clearSheetContent(sheet, true); // 헤더(1행) 보존
clearSheetContent(sheet, false); // 모든 내용 삭제
```

**사용 예시**:
```javascript
// 안전한 시트 초기화
const dataSheet = getOrCreateSheet(spreadsheet, '데이터');
clearSheetContent(dataSheet, true); // 헤더는 유지

// 임시 시트 정리
deleteSheetIfExists(spreadsheet, 'Temp');
deleteSheetIfExists(spreadsheet, 'Debug');

// 월별 시트 생성
const monthSheet = getOrCreateSheet(spreadsheet, '2024-01');
```

### 8. spreadsheetUtils.js - 스프레드시트 유틸리티
**목적**: 스프레드시트 접근 및 검증

**주요 함수**:
```javascript
// 소스 및 대상 스프레드시트 열기
const { source, targets } = openSourceAndTargets();
// source: 소스 스프레드시트 객체
// targets: [대상1, 대상2, ...] 배열

// 안전한 시트 가져오기 (null 반환 가능)
const sheet = getSheetSafe(spreadsheet, '시트이름');
if (!sheet) {
  Logger.log('시트를 찾을 수 없습니다.');
}
```

**사용 예시**:
```javascript
// 통합 배치 처리
const { source, targets } = openSourceAndTargets();

targets.forEach(targetSpreadsheet => {
  source.getSheets().forEach(sourceSheet => {
    const sheetName = sourceSheet.getName();
    const targetSheet = getOrCreateSheet(targetSpreadsheet, sheetName);

    // 1행 복사
    const headerData = getCompleteRowData(sourceSheet, 1);
    if (headerData) {
      setCompleteRowData(targetSheet, 1, headerData);
    }
  });
});
```

### 9. config.js - 환경 설정
**목적**: 중앙 집중식 설정 관리

**사용 예시**:
```javascript
// config.js에서 설정 가져오기
const SOURCE_SPREADSHEET_ID = Config.SOURCE_SPREADSHEET_ID;
const MAX_EXECUTION_TIME = Config.MAX_EXECUTION_TIME;
```

---

## 📋 기능 모듈

### 1. 은행 거래 관리
- 은행 거래내역 업로드
- 거래내용 수정 및 검증
- 거래 백업 관리

### 2. 회계 처리
- 계정과목 및 거래처 설정
- 거래 검증 시스템
- 통합 수정 거래 입력

### 3. 원장 및 분개
- 계정과목 입력
- 이자수익 하위 분개
- 분개 처리 및 초기화
- 원장 초기화

### 4. 급여 관리
- 4대보험 추출
- 건강보험 처리
- 국민연금 처리
- 월 지급 계산
- 통합 급여 처리

### 5. 자동화
- 분개처리 개별 자동화
- 분개처리 완전 자동화

### 6. UI 관리
- 화면 분할
- 시트 표시/숨기기
  - 세금 시트
  - 세금계산서
  - 급여 관리
  - 설정

## 💡 개발 가이드

### 유틸리티 모듈 사용 패턴

#### 패턴 1: 기본 배치 처리
```javascript
function processBatch() {
  // 1. 타이머 및 진행 상황 초기화
  const MAX_TIME = 5 * 60 * 1000; // 5분
  const timer = createExecutionTimer(MAX_TIME);
  const PROGRESS_KEY = 'MY_BATCH';

  BatchProgress.init(PROGRESS_KEY, totalItems.length);
  TriggerManager.cleanup('processBatch');

  // 2. 아이템 처리
  for (let i = 0; i < totalItems.length; i++) {
    if (timer.isTimeExceeded()) {
      Logger.log(`시간 초과, ${i}번째 항목에서 중단`);
      TriggerManager.scheduleNextBatch('processBatch', 1);
      return;
    }

    try {
      processItem(totalItems[i]);
      BatchProgress.increment(PROGRESS_KEY, 'success');
      DelayUtils.standard();
    } catch (error) {
      Logger.log(`오류: ${error.message}`);
      BatchProgress.increment(PROGRESS_KEY, 'failed');
    }
  }

  // 3. 완료 알림
  const progress = BatchProgress.get(PROGRESS_KEY);
  NotificationUtils.batchComplete('배치 처리', progress, ['대상1', '대상2']);
  BatchProgress.delete(PROGRESS_KEY);
}
```

#### 패턴 2: 시트 생성 및 데이터 복사
```javascript
function createAndCopySheets(sourceSpreadsheet, targetSpreadsheet) {
  const sourceSheets = sourceSpreadsheet.getSheets();

  sourceSheets.forEach(sourceSheet => {
    const sheetName = sourceSheet.getName();

    // 1. 시트 생성 (또는 가져오기)
    const targetSheet = getOrCreateSheet(targetSpreadsheet, sheetName);
    DelayUtils.afterSheetCreation();

    // 2. 헤더 행 복사 (서식 포함)
    const headerData = getCompleteRowData(sourceSheet, 1);
    if (headerData) {
      setCompleteRowData(targetSheet, 1, headerData);
      Logger.log(`${sheetName}: 헤더 복사 완료`);
    }

    DelayUtils.short();
  });

  // 3. 기본 시트 정리
  deleteSheetIfExists(targetSpreadsheet, 'Sheet1');
}
```

#### 패턴 3: 오류 처리 및 재시도
```javascript
function processWithRetry(maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      performOperation();

      NotificationUtils.success(
        '작업 성공',
        `${attempt + 1}번째 시도에서 성공`,
        { '시도 횟수': `${attempt + 1}/${maxRetries}` }
      );
      return;

    } catch (error) {
      attempt++;
      Logger.log(`시도 ${attempt} 실패: ${error.message}`);

      if (attempt >= maxRetries) {
        NotificationUtils.error(
          '작업 실패',
          `최대 재시도 횟수(${maxRetries})를 초과했습니다.`,
          { '마지막 오류': error.message }
        );
        throw error;
      }

      DelayUtils.long(); // 재시도 전 대기
    }
  }
}
```

#### 패턴 4: 환경 생성 스크립트
```javascript
function create법인환경완전자동() {
  const 법인이름 = '법인명';
  const SOURCE_SPREADSHEET_ID = 'SOURCE_ID';

  try {
    // 1. 폴더 구조 생성
    Logger.log('📁 폴더 구조 생성');
    const folderId = createFolderStructure(법인이름);

    // 2. 스프레드시트 생성
    Logger.log('📊 스프레드시트 생성');
    const { spreadsheetId, spreadsheetUrl } = createSpreadsheet(법인이름, folderId);

    // 3. 모든 시트 복사
    Logger.log('🔄 시트 생성 및 복사 시작');
    const stats = copyAllSheets(SOURCE_SPREADSHEET_ID, spreadsheetId);

    // 4. 완료 알림
    NotificationUtils.success(
      `${법인이름} 환경 생성 완료`,
      `${stats.success}개 시트 생성 성공`,
      {
        '스프레드시트 ID': spreadsheetId,
        '폴더 ID': folderId,
        'URL': spreadsheetUrl,
        '통계': `성공 ${stats.success} | 실패 ${stats.failed}`
      }
    );

    return { success: true, spreadsheetId, folderId, spreadsheetUrl, stats };

  } catch (error) {
    NotificationUtils.error(
      `${법인이름} 환경 생성 실패`,
      error.message,
      { '스택 트레이스': error.stack }
    );
    return { success: false, error: error.message };
  }
}
```

### 코딩 규칙
1. **모든 배치 작업**: `BatchProgress`, `ExecutionTimer`, `TriggerManager` 사용
2. **시트 작업 후 지연**: `DelayUtils.afterSheetCreation()` 필수
3. **연속 작업 사이**: `DelayUtils.standard()` 사용
4. **시트 생성**: `getOrCreateSheet()` 사용 (직접 `insertSheet()` 사용 금지)
5. **시트 삭제**: `deleteSheetIfExists()` 사용 (안전 확인)
6. **행 복사**: `getCompleteRowData()` + `setCompleteRowData()` 사용
7. **알림**: 성공/실패 시 `NotificationUtils` 사용

### 리팩토링 히스토리

#### Phase 1: Quick Win (이전 세션)
- 공통 유틸리티 모듈 8개 생성
- `src/shared/` 폴더 구조화
- 코드 재사용성 및 유지보수성 향상

#### Phase 2: 코드 중복 제거 (현재 세션)
**통계**:
- **리팩토링된 파일**: 9개 (메인 스크립트 1개 + 환경 생성 스크립트 8개)
- **제거된 라인 수**: 206줄
- **발견 및 수정된 버그**: 2개 (undefined `companyName` 변수)

**리팩토링된 파일 목록**:
1. `src/시트생성및1행복사.js` (메인 배치 처리) - **-62줄**
2. `src/제이에스파트너스완전자동생성.js` - **-25줄**
3. `src/HSK개발환경생성.js` - **-18줄**, 버그 1개 수정
4. `src/씨에이치씨환경생성.js` - **-18줄**, 버그 1개 수정
5. `src/씨와이컴퍼니환경생성.js` - **-18줄**
6. `src/KH패밀리오피스환경생성.js` - **-18줄**
7. `src/제이씨킴환경생성.js` - **-18줄**
8. `src/제이제이큐브환경생성.js` - **-23줄**
9. `src/케이제이와이환경생성.js` - **-6줄**

**적용된 리팩토링 패턴**:
- ✅ 배치 진행 상황 추적: `BatchProgress` 모듈로 대체
- ✅ 실행 시간 관리: `ExecutionTimer` 모듈로 대체
- ✅ 지연 처리: `DelayUtils` 모듈로 일관된 지연 패턴 적용
- ✅ 트리거 관리: `TriggerManager` 모듈로 생명주기 관리
- ✅ 이메일 알림: `NotificationUtils` 모듈로 구조화된 알림
- ✅ 행 데이터 복사: `rangeUtils` 모듈로 완전한 서식 복사
- ✅ 시트 관리: `sheetManagement` 모듈로 안전한 CRUD
- ✅ 스프레드시트 유틸리티: `spreadsheetUtils` 모듈로 접근 간소화

**Git 커밋 기록**:
```
262b228 - Refactor 시트생성및1행복사.js with utility modules
df36c06 - Refactor 제이에스파트너스완전자동생성.js with utility modules
055d830 - Refactor HSK개발환경생성.js with utility modules
6c23f29 - Refactor 씨에이치씨환경생성.js and 씨와이컴퍼니환경생성.js
eaa189b - Refactor remaining 4 environment creation scripts
```

**성과**:
- 코드 중복 대폭 감소 (206줄 제거)
- 코드 일관성 향상 (동일한 패턴으로 통일)
- 유지보수성 개선 (유틸리티 모듈 중앙 관리)
- 버그 발견 및 수정 (리팩토링 과정에서 2개 버그 수정)
- 가독성 향상 (복잡한 로직 → 명확한 함수 호출)

### Phase 3: 인프라 개선 (2024년)

**목표**: 문서화, 추가 유틸리티, 테스트 프레임워크, 설정 중앙화

**Phase 3-1: README 문서화**
- 542줄의 상세한 유틸리티 모듈 문서 추가
- 개발 가이드 및 코딩 패턴 4개 문서화
- Phase 1-2 리팩토링 히스토리 정리

**Phase 3-2: 추가 유틸리티 모듈 개발 (3개 모듈, 72개 함수)**
1. `uiUtils.js` (292줄, 21 함수) - UI 상호작용 표준화
   - Alert, confirm, prompt 래퍼
   - Toast 알림 시스템 (success, error, warning, info)
   - 진행 상황 toast, 사이드바, 모달 지원

2. `validationUtils.js` (384줄, 20 함수) - 데이터 검증 중앙화
   - 기본 검증 (isEmpty, requireFields)
   - 형식 검증 (email, phone, businessNumber, date, URL)
   - 복합 검증 (다중 필드 검증 엔진)

3. `driveUtils.js` (434줄, 31 함수) - Drive 작업 통합
   - 폴더 관리 (생성, 검색, 삭제)
   - 파일 작업 (복사, 이동, 이름 변경, 삭제)
   - 공유 및 권한 관리
   - 파일 메타데이터 유틸리티

**Phase 3-3: 테스트 프레임워크 구축**
1. `testUtils.js` (361줄) - Apps Script용 테스트 프레임워크
   - describe/it/skip 패턴 구현
   - 18개 assertion 함수
   - 테스트 리포트 생성 (통과율, 실패 상세)

2. `validationUtils.test.js` (263줄, 40+ 테스트)
   - ValidationUtils 전체 기능 테스트 커버리지
   - 통합 시나리오 테스트

3. `TESTING.md` (326줄) - 테스트 작성 가이드
   - 전체 assertion 함수 문서화
   - 모범 사례 및 실행 방법

📘 **[테스트 작성 가이드](src/shared/TESTING.md)** - 테스트 프레임워크 상세 사용법

**Phase 3-4: 설정 중앙화**
- `config.js` 확장 (89줄 → 130줄)
- `SHEET_NAMES`: 공통 시트 이름 상수
- `DELAY_CONFIG`: 표준화된 지연 시간 설정
- `NOTIFICATION_CONFIG`: 이메일 알림 설정
- `SOURCE_SPREADSHEET_ID`: 소스 스프레드시트 ID 중앙화

**Phase 3-5: 기존 스크립트 리팩토링 샘플**
- 2개 accounting 스크립트에 UIUtils 적용
- `SpreadsheetApp.getUi().alert()` → `UIUtils.alert()` / `UIUtils.toastSuccess()`
- 에러 처리 개선: `UIUtils.alertError()`로 통일
- 향후 다른 스크립트도 동일 패턴 적용 가능

**Git 커밋 기록**:
```
7ec2ebe - docs(readme): Phase 3-1 완료 - 유틸리티 모듈 완전 문서화
70c11a6 - feat(utils): Phase 3-2 완료 - uiUtils, validationUtils, driveUtils 추가
1eabc75 - test: Phase 3-3 완료 - 테스트 프레임워크 및 가이드 추가
cb22627 - feat(config): Phase 3-4 완료 - 설정 중앙화
8576c2d - refactor(accounting): Phase 3-5 샘플 - UIUtils 적용
```

**성과**:
- **문서화**: 상세한 유틸리티 문서로 신규 개발자 온보딩 시간 단축
- **코드 품질**: 72개 새로운 유틸리티 함수로 코드 재사용성 극대화
- **테스트 인프라**: Apps Script 환경에서 테스트 가능 (18개 assertion 함수)
- **설정 관리**: 중앙화된 설정으로 환경 변경 시 단일 파일만 수정
- **UI 일관성**: 표준화된 UI 인터랙션으로 사용자 경험 통일

---

## 🔧 개발

### 로컬 개발 워크플로우

```bash
# 코드 수정 후 개발 환경에 푸시
npm run deploy:dev

# 스크립트 에디터 열기
npm run open

# 로그 확인
npm run logs
```

### 배포 워크플로우

```
develop (개발)
    ↓ 테스트
development 환경
    ↓ 검증
testing 환경
    ↓ 승인
production 환경
```

## 📊 배포 전략

### 권장 배포 순서

1. **개발**: develop 브랜치에서 작업
2. **테스트**: development 환경에 배포 및 테스트
3. **QA**: testing 환경에 배포 및 검증
4. **프로덕션**: production 환경에 배포

```bash
# 개발 → 테스트
git checkout develop
# ... 코드 수정 ...
npm run deploy:dev

# 테스트 통과 후 QA
npm run deploy:test

# QA 통과 후 프로덕션
git checkout before-deploy
git merge develop
npm run deploy:prod

# 프로덕션 배포 후
git checkout main
git merge before-deploy
git push origin main
```

## 🛠️ NPM 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run push` | 현재 환경에 푸시 (clasp) |
| `npm run pull` | 현재 환경에서 가져오기 |
| `npm run open` | 스크립트 에디터 열기 |
| `npm run logs` | 실행 로그 확인 |
| `npm run deploy` | 기본 환경에 배포 |
| `npm run deploy:prod` | 프로덕션 배포 |
| `npm run deploy:dev` | 개발 환경 배포 |
| `npm run deploy:test` | 테스트 환경 배포 |
| `npm run deploy:all` | 모든 환경 배포 |
| `npm run env:list` | 환경 목록 확인 |
| `npm run env:setup` | 새 환경 설정 |

## 🔐 보안 주의사항

1. `.clasp.json` 파일은 Git에 커밋되지 않습니다 (민감한 스크립트 ID 포함)
2. `configs/` 폴더의 설정 파일만 버전 관리됩니다
3. 실제 스크립트 ID는 배포 시 동적으로 생성됩니다

## 📝 라이선스

ISC

## 📚 상세 가이드 문서

프로젝트의 각 주제별 상세 가이드 문서:

### 환경 관리
- 📘 **[새로운 환경 생성 가이드](scripts/새로운환경생성가이드.md)**
  - 완전 자동화된 법인 환경 생성 프로세스
  - Apps Script 함수 실행부터 자동 배포까지
  - 트러블슈팅 및 검증 방법

### 트러블슈팅
- 📘 **[시트 복사 트러블슈팅](claudedocs/jjqube-시트복사-방법.md)**
  - 시트 복사 문제 해결 방법
  - 권한 문제 및 실행 방법
  - 복사 내용 검증

### 테스트
- 📘 **[테스트 작성 가이드](src/shared/TESTING.md)**
  - Apps Script용 테스트 프레임워크 사용법
  - 18개 assertion 함수 설명
  - 실제 테스트 예시 및 모범 사례

## 👤 작성자

gram (y0163824619@gmail.com)

## 🔗 관련 링크

- [Google Apps Script 문서](https://developers.google.com/apps-script)
- [Clasp 문서](https://github.com/google/clasp)
- [GitHub Repository](https://github.com/shawntony/actauto)

---

⚡ **Note**: 이 프로젝트는 Google Apps Script로 작성되었으며, 멀티 환경 배포를 지원합니다.
