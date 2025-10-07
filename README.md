# 📊 ACT Auto - 회계 자동화 시스템

구글 스프레드시트 기반 회계 및 급여 관리 자동화 시스템입니다.

## 🎯 주요 기능

### 📁 프로젝트 구조

```
actauto/
├── src/
│   ├── menu/           # 메뉴 관리
│   ├── bank/           # 은행 거래 내역 관리
│   ├── accounting/     # 회계 처리
│   ├── ledger/         # 원장 및 분개 처리
│   ├── payroll/        # 급여 및 4대보험 관리
│   ├── ui/             # UI 및 화면 관리
│   ├── automation/     # 자동화 스크립트
│   └── backup/         # 백업 관리
├── appsscript.json     # Google Apps Script 설정
├── .clasp.json         # Clasp 설정
└── package.json        # 프로젝트 설정
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

# 스크립트 배포
npx clasp push
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

### Clasp 명령어

```bash
# 로컬 변경사항을 Google Apps Script에 푸시
npx clasp push

# Google Apps Script에서 최신 버전 가져오기
npx clasp pull

# 스크립트 에디터 열기
npx clasp open

# 로그 확인
npx clasp logs
```

### 배포

```bash
# 새 버전 배포
npx clasp deploy

# 배포 목록 확인
npx clasp deployments
```

## 📝 라이선스

ISC

## 👤 작성자

gram (y0163824619@gmail.com)

## 🔗 관련 링크

- [Google Apps Script 문서](https://developers.google.com/apps-script)
- [Clasp 문서](https://github.com/google/clasp)

---

⚡ **Note**: 이 프로젝트는 Google Apps Script로 작성되었으며, 로컬 개발을 위해 Clasp을 사용합니다.
