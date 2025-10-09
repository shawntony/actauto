# 법인 관리 칸반보드 - 빠른 시작 가이드

## ✅ 업데이트 내역 (최신)

### 법인 카드 개선
각 법인 카드에 이제 다음 정보가 표시됩니다:

#### 📋 표시 정보
1. **은행거래내역 폴더**
   - 📁 폴더 링크 (클릭하여 열기)
   - 📝 폴더 ID (복사 버튼 포함)
   - 🔗 폴더 URL (복사 버튼 포함)

2. **법인재무관리 스프레드시트**
   - 📊 스프레드시트 링크 (클릭하여 열기)
   - 📝 스프레드시트 ID (복사 버튼 포함)
   - 🔗 스프레드시트 URL (복사 버튼 포함)

3. **Apps Script 프로젝트**
   - 💻 Apps Script 링크 (클릭하여 열기)
   - 📝 Script ID (복사 버튼 포함)
   - 🔗 Script URL (복사 버튼 포함)

#### 🎯 사용 방법
- **링크 클릭**: 해당 리소스가 새 탭에서 열립니다
- **복사 버튼 클릭**: ID 또는 URL이 클립보드에 복사됩니다
- **복사 확인**: 복사 버튼이 체크마크(✓)로 2초간 변경됩니다

## 🚀 로컬 개발 환경 실행

### 1. 환경변수 설정 (필수)

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Google Service Account 정보
GOOGLE_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# Google Sheets 문서 ID
GOOGLE_SHEET_ID=1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8
```

### 2. 개발 서버 실행

```bash
cd actauto/corp-kanban
npm run dev
```

브라우저에서 http://localhost:3000 열기

### 3. 테스트 데이터 추가

웹 페이지에서 우측 상단 "새 법인 추가" 버튼을 클릭하여 테스트 데이터를 입력하세요.

#### 예시 데이터
```
법인명: 유니스
환경키: uniace
폴더 ID: 1ABC123xyz
폴더 URL: https://drive.google.com/drive/folders/1ABC123xyz
스프레드시트 ID: 1DEF456abc
스프레드시트 URL: https://docs.google.com/spreadsheets/d/1DEF456abc
Apps Script ID: 1GHI789def
Apps Script URL: https://script.google.com/home/projects/1GHI789def
설명: 유니스 회계 관리 시스템
상태: 활성
태그: 주식회사, 서울
```

## 🎨 카드 UI 미리보기

```
┌────────────────────────────────────────┐
│ 유니스                          ⋮     │
│ 환경키: uniace                         │
│                                        │
│ 유니스 회계 관리 시스템                 │
│                                        │
│ 📁 은행거래내역 폴더            ↗     │
│   ID: 1ABC123xyz               📋     │
│   URL: https://drive.google... 📋     │
│                                        │
│ 📊 법인재무관리_유니스          ↗     │
│   ID: 1DEF456abc               📋     │
│   URL: https://docs.google...  📋     │
│                                        │
│ 💻 Apps Script                 ↗     │
│   ID: 1GHI789def               📋     │
│   URL: https://script.google.. 📋     │
│                                        │
│ 🏷️ 주식회사  서울                     │
│ 🟢 활성                                │
└────────────────────────────────────────┘
```

## 💡 주요 기능

### 1. 검색 및 필터
- 법인명으로 검색: "유니스" 입력
- 환경키로 검색: "uniace" 입력
- 상태 필터: 활성/비활성/보관

### 2. 법인 관리
- **추가**: 우측 상단 "새 법인 추가" 버튼
- **수정**: 카드 우측 상단 메뉴(⋮) → "수정"
- **삭제**: 카드 우측 상단 메뉴(⋮) → "삭제"

### 3. 빠른 접근
- **링크 클릭**: 리소스가 새 탭에서 열림
- **ID/URL 복사**: 복사 버튼 클릭으로 즉시 복사

### 4. 실시간 동기화
- 모든 변경사항이 Google Sheets에 즉시 저장됨
- 다른 사용자의 변경사항도 새로고침 시 반영

## 🔧 문제 해결

### 데이터가 로드되지 않을 때
1. `.env.local` 파일 확인
2. Google Service Account 권한 확인
3. 스프레드시트 공유 설정 확인
4. 브라우저 콘솔에서 오류 확인 (F12)

### 복사 버튼이 작동하지 않을 때
- HTTPS 환경에서만 작동 (localhost는 OK)
- 브라우저 클립보드 권한 확인

### 링크가 열리지 않을 때
- 팝업 차단 설정 확인
- URL이 올바른지 확인

## 📱 모바일에서 테스트

### 로컬 네트워크에서 모바일 접속
1. 개발 서버 실행: `npm run dev`
2. PC의 IP 주소 확인: `ipconfig` (Windows) 또는 `ifconfig` (Mac/Linux)
3. 모바일 브라우저에서 `http://[PC-IP]:3000` 접속

### PWA 설치 테스트
- iOS Safari: 공유 → 홈 화면에 추가
- Android Chrome: 메뉴 → 홈 화면에 추가

## 🌐 프로덕션 배포

### Vercel 배포
```bash
# Git 저장소 생성
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [your-repo-url]
git push -u origin main

# Vercel 배포
# 1. vercel.com 접속
# 2. GitHub 저장소 연결
# 3. 환경변수 설정
# 4. Deploy 클릭
```

### 환경변수 설정 (Vercel)
Vercel 프로젝트 → Settings → Environment Variables:
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`

## 📊 성능 메트릭

현재 빌드 결과:
- **First Load JS**: ~108 KB
- **Page Size**: ~6.3 KB
- **빌드 시간**: ~30초
- **정적 페이지**: 6개
- **API 라우트**: 4개

## 🎯 다음 단계

1. ✅ 로컬 개발 환경 실행
2. ✅ 테스트 데이터 추가
3. ✅ 기능 테스트 (추가/수정/삭제)
4. ✅ ID/URL 복사 기능 테스트
5. 📱 모바일 반응형 테스트
6. 🌐 프로덕션 배포
7. 🚀 실제 데이터 마이그레이션

## 💬 피드백 및 문의

개선 사항이나 버그를 발견하면 이슈를 등록해주세요!

---

**마지막 업데이트**: 2025-10-08
**버전**: v1.1.0 (ID/URL 표시 기능 추가)
