# 📊 ACT Auto - 회계 자동화 시스템

구글 스프레드시트 기반 회계 및 급여 관리 자동화 시스템입니다.

## 🎯 주요 기능

### 📁 프로젝트 구조

```
actauto/
├── src/                    # 소스 코드 (공통)
│   ├── menu/              # 메뉴 관리
│   ├── bank/              # 은행 거래 내역 관리
│   ├── accounting/        # 회계 처리
│   ├── ledger/            # 원장 및 분개 처리
│   ├── payroll/           # 급여 및 4대보험 관리
│   ├── ui/                # UI 및 화면 관리
│   ├── automation/        # 자동화 스크립트
│   └── backup/            # 백업 관리
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

#### 방법 1: 대화형 설정 (권장)
```bash
npm run env:setup
```

프롬프트에 따라 다음 정보를 입력:
1. 환경 키 (예: client1, project2)
2. 환경 이름 (예: 고객사1, 프로젝트2)
3. 스크립트 ID
4. 스프레드시트 URL (선택)
5. 설명 (선택)

#### 방법 2: 수동 설정

1. **스크립트 ID 확인**
   - 구글 스프레드시트 열기
   - 확장 프로그램 → Apps Script
   - 프로젝트 설정에서 스크립트 ID 복사

2. **환경 설정 파일 수정**

   `configs/environments.json`에 새 환경 추가:
   ```json
   {
     "environments": {
       "client1": {
         "name": "고객사1",
         "scriptId": "YOUR_SCRIPT_ID_HERE",
         "spreadsheetUrl": "https://docs.google.com/spreadsheets/...",
         "description": "고객사1 회계 시스템"
       }
     }
   }
   ```

3. **Clasp 설정 파일 생성**

   `configs/clasp-client1.json` 파일 생성:
   ```json
   {
     "scriptId": "YOUR_SCRIPT_ID_HERE",
     "rootDir": "",
     "scriptExtensions": [".js", ".gs"],
     "htmlExtensions": [".html"],
     "jsonExtensions": [".json"],
     "filePushOrder": [],
     "skipSubdirectories": false
   }
   ```

4. **배포**
   ```bash
   npm run deploy client1
   ```

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

## 👤 작성자

gram (y0163824619@gmail.com)

## 🔗 관련 링크

- [Google Apps Script 문서](https://developers.google.com/apps-script)
- [Clasp 문서](https://github.com/google/clasp)
- [GitHub Repository](https://github.com/shawntony/actauto)

---

⚡ **Note**: 이 프로젝트는 Google Apps Script로 작성되었으며, 멀티 환경 배포를 지원합니다.
