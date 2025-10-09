# 법인 관리 칸반보드

Google Sheets를 데이터베이스로 활용하는 법인 환경 관리 칸반보드 웹앱입니다.

## ✨ 주요 기능

### 🎨 UI/UX
- **다크모드 지원**: Light / Dark / System 테마 자동 전환
- **모던한 UI**: 그라데이션, 애니메이션, 프로스티드 글래스 효과
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 완벽 지원
- **접근성**: ARIA 레이블, 키보드 네비게이션 지원

### 📋 칸반보드 관리
- **드래그 앤 드롭**: 직관적인 카드 이동 및 보드 재정렬
- **커스터마이저블 보드**: 사용자 정의 보드 생성/수정/삭제
- **보드 접기/펼치기**: 작업 공간 최적화
- **실시간 시각 피드백**: 드래그 중 애니메이션 효과

### 🔍 검색 및 필터
- **통합 검색**: 법인명, 환경키 실시간 검색
- **상태 필터**: 활성/비활성/보관 상태별 필터링
- **스마트 UI**: 검색어 입력 시 실시간 하이라이팅

### 🔗 리소스 관리
- **원클릭 링크**: 폴더, 스프레드시트, Apps Script 바로가기
- **접근 권한 관리**: Google 계정별 권한 부여
- **자동 권한 동기화**: 저장 시 자동으로 권한 업데이트

### 📊 데이터 연동
- **Google Sheets 연동**: 실시간 데이터 동기화
- **자동 환경 구축**: 법인 추가 시 자동 폴더/시트 생성
- **진행 상황 추적**: 법인 생성 프로세스 실시간 모니터링

### 📱 PWA 지원
- **모바일 앱**: 홈 화면에 설치 가능
- **오프라인 지원**: 기본 기능 오프라인 작동
- **푸시 알림**: 중요 이벤트 알림 (계획 중)

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Google Sheets API 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. Google Sheets API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. 법인 관리용 Google Sheets 생성
5. 서비스 계정에 스프레드시트 편집 권한 부여

### 3. 환경변수 설정

`.env.local` 파일 생성:

```bash
cp .env.local.example .env.local
```

`.env.local` 파일에 실제 값 입력:

```env
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-spreadsheet-id
```

### 4. Google Sheets 스키마 설정

스프레드시트에 "법인목록" 시트를 생성하고 다음 헤더를 추가:

| id | name | envKey | folderId | folderUrl | spreadsheetId | spreadsheetUrl | scriptId | scriptUrl | description | createdAt | updatedAt | status | tags | boardId | allowedEmails |
|----|------|--------|----------|-----------|---------------|----------------|----------|-----------|-------------|-----------|-----------|--------|------|---------|---------------|

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 📁 프로젝트 구조

```
corp-kanban/
├── app/                    # Next.js 앱 라우터
│   ├── api/               # API 라우트
│   │   ├── sheets/        # Google Sheets CRUD
│   │   ├── corporations/  # 법인 자동 생성
│   │   └── permissions/   # 권한 관리
│   ├── progress/          # 법인 추가 진행 상황
│   ├── settings/          # 설정 페이지
│   ├── layout.tsx         # 루트 레이아웃 (ThemeProvider)
│   ├── page.tsx           # 메인 칸반보드
│   └── globals.css        # 전역 스타일
├── components/            # React 컴포넌트
│   ├── Sidebar.tsx            # 사이드바 네비게이션
│   ├── ThemeProvider.tsx      # 테마 컨텍스트
│   ├── ThemeToggle.tsx        # 테마 전환 버튼
│   ├── CorporationCard.tsx    # 법인 카드
│   ├── DraggableCard.tsx      # 드래그 가능 카드
│   ├── DroppableBoard.tsx     # 드롭 영역 보드
│   ├── SearchBar.tsx          # 검색 및 필터
│   └── AddCardModal.tsx       # 추가/수정 모달
├── lib/                   # 유틸리티 라이브러리
│   ├── types.ts           # TypeScript 타입
│   ├── sheets.ts          # Sheets API 클라이언트
│   ├── google-auth.ts     # Google 인증
│   └── store.ts           # Zustand 상태 관리
├── public/                # 정적 파일
│   ├── manifest.json      # PWA 매니페스트
│   └── icons/             # 앱 아이콘
├── next.config.js         # Next.js 설정
├── tailwind.config.ts     # Tailwind (다크모드 활성화)
└── package.json           # 프로젝트 의존성
```

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Theme**: next-themes (다크모드)
- **Icons**: Lucide React

### 상태 관리
- **State**: Zustand
- **Persistence**: localStorage

### 드래그 앤 드롭
- **Library**: @dnd-kit/core, @dnd-kit/sortable
- **Features**: 카드 이동, 보드 재정렬

### 데이터베이스
- **Primary**: Google Sheets API
- **Auth**: Google Service Account

### PWA
- **Plugin**: next-pwa
- **Features**: 오프라인 지원, 설치 가능

## 🎯 사용 방법

### 테마 전환
- 사이드바 하단의 테마 토글 버튼 사용
- ☀️ **Light**: 밝은 테마
- 🌙 **Dark**: 어두운 테마
- 💻 **System**: OS 설정 따름

### 보드 관리
1. **보드 추가**: "보드 관리" → "보드 추가"
2. **보드 이름 변경**: 보드 제목 옆 설정 아이콘
3. **보드 순서 변경**: 보드 헤더를 드래그하여 재정렬
4. **보드 삭제**: 보드 관리에서 삭제 버튼 (기본 보드는 삭제 불가)

### 법인 카드 관리
1. **카드 추가**: 우측 상단 "새 법인 추가" 버튼
2. **카드 이동**: 카드를 드래그하여 다른 보드로 이동
3. **카드 수정**: 카드 메뉴 (⋮) → "수정"
4. **카드 삭제**: 카드 메뉴 (⋮) → "삭제"

### 검색 및 필터
1. 상단 검색 바에 법인명 또는 환경키 입력
2. "필터" 버튼으로 상태별 필터링
3. 필터 조합하여 정확한 검색 가능

### 접근 권한 관리
1. 카드 수정 시 "접근 권한 관리" 섹션
2. 이메일 주소 추가
3. 저장 시 자동으로 Google Drive 권한 부여

### 법인 자동 생성
1. "새 법인 추가" → 법인명과 환경키 입력
2. "법인 추가 과정" 페이지에서 진행 상황 확인
3. 완료 시 자동으로 폴더, 시트, 스크립트 생성

## 📱 모바일 PWA 설치

### iOS (Safari)
1. 사이트 접속
2. 공유 버튼 → "홈 화면에 추가"

### Android (Chrome)
1. 사이트 접속
2. 메뉴 → "홈 화면에 추가"

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: Blue-to-Purple 그라데이션
- **Success**: Green 계열
- **Warning**: Yellow 계열
- **Danger**: Red 계열
- **Neutral**: Gray 계열

### 다크모드 구현
- Tailwind CSS `dark:` 클래스 사용
- `next-themes`로 테마 전환 관리
- 모든 컴포넌트 다크모드 최적화

### 애니메이션
- 부드러운 전환 효과 (300ms)
- 호버 스케일 효과
- 드래그 앤 드롭 시각 피드백
- 로딩 스피너 및 스켈레톤

## 🚀 배포

### Vercel 배포

```bash
npm run build
```

Vercel에 배포 후 환경변수 설정:

1. Vercel 프로젝트 설정
2. Environment Variables 추가
3. `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID` 설정

## 🔧 문제 해결

### Google Sheets API 인증 오류
- 서비스 계정 이메일이 스프레드시트에 편집자로 추가되었는지 확인
- Private Key가 올바르게 환경변수에 설정되었는지 확인 (`\n`을 `\\n`으로 이스케이프)

### 데이터 로딩 실패
- Google Sheet ID가 올바른지 확인
- "법인목록" 시트가 존재하는지 확인
- 헤더 행이 정확히 설정되었는지 확인

### 드래그 앤 드롭 작동 안 함
- React Hydration 에러 확인 (브라우저 콘솔)
- 페이지 새로고침 시도
- 브라우저 캐시 삭제

### 다크모드 전환 안 됨
- ThemeProvider가 올바르게 래핑되었는지 확인
- 브라우저 localStorage 확인
- `suppressHydrationWarning` 속성 확인

## 📋 향후 계획

- [ ] 법인 통계 대시보드
- [ ] 일괄 내보내기/가져오기 (Excel/CSV)
- [ ] 법인별 메모 및 태그 관리
- [ ] 활동 로그 및 히스토리
- [ ] 사용자 권한 시스템
- [ ] 푸시 알림 기능
- [ ] 다국어 지원

## 📄 라이선스

MIT

## 👨‍💻 개발자

Built with ❤️ by Claude Code

---

**최근 업데이트**: 2025-10-09
- ✨ 다크모드 지원 추가 (Light/Dark/System)
- 🎨 모던한 UI 디자인 적용
- 🔄 드래그 앤 드롭 개선 및 시각 피드백 강화
- 📱 반응형 디자인 최적화
- ⚡ 애니메이션 및 전환 효과 개선
- 🎯 접근성 향상 (ARIA 레이블, 키보드 네비게이션)
