# 법인 관리 칸반보드 - 설치 가이드

## 🚀 빠른 시작

### 1단계: Google Cloud 설정

#### Google Cloud Console 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 (예: "corp-kanban-system")
3. 프로젝트 선택

#### Google Sheets API 활성화
1. 좌측 메뉴 → "API 및 서비스" → "라이브러리"
2. "Google Sheets API" 검색
3. "사용 설정" 클릭

#### 서비스 계정 생성
1. 좌측 메뉴 → "API 및 서비스" → "사용자 인증 정보"
2. "사용자 인증 정보 만들기" → "서비스 계정" 선택
3. 서비스 계정 이름 입력 (예: "corp-kanban-service")
4. "만들기 및 계속하기" 클릭
5. 역할 선택: "편집자" 또는 "기본 > 편집자"
6. "계속" → "완료"

#### JSON 키 파일 다운로드
1. 생성된 서비스 계정 클릭
2. "키" 탭 선택
3. "키 추가" → "새 키 만들기" → "JSON" 선택
4. 다운로드된 JSON 파일 안전하게 보관

### 2단계: Google Sheets 생성

#### 스프레드시트 생성
1. [Google Sheets](https://sheets.google.com/) 접속
2. 새 스프레드시트 생성
3. 이름: "법인관리_데이터베이스"

#### 시트 설정
1. 첫 번째 시트 이름을 "법인목록"으로 변경
2. A1 셀부터 다음 헤더 입력:

```
id | name | envKey | folderId | folderUrl | spreadsheetId | spreadsheetUrl | scriptId | scriptUrl | description | createdAt | updatedAt | status | tags
```

#### 권한 부여
1. 스프레드시트 우측 상단 "공유" 클릭
2. 서비스 계정 이메일 추가 (JSON 파일의 `client_email` 값)
   - 예: `corp-kanban-service@project-id.iam.gserviceaccount.com`
3. 권한: "편집자"로 설정
4. "완료"

#### 스프레드시트 ID 복사
- URL에서 ID 확인: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

### 3단계: 프로젝트 설정

#### 환경변수 파일 생성

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# actauto/corp-kanban/.env.local
GOOGLE_CLIENT_EMAIL=corp-kanban-service@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...your-key-here...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1ABC...your-spreadsheet-id...xyz
```

**중요**:
- `GOOGLE_PRIVATE_KEY`는 JSON 파일의 `private_key` 값 전체를 복사
- 줄바꿈(`\n`)을 그대로 유지해야 함
- 값 전체를 큰따옴표로 감싸기

#### 예시 환경변수 (JSON 파일에서 추출)

다운로드한 JSON 파일:
```json
{
  "type": "service_account",
  "project_id": "corp-kanban-system",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...\n-----END PRIVATE KEY-----\n",
  "client_email": "corp-kanban-service@corp-kanban-system.iam.gserviceaccount.com",
  "client_id": "123456789",
  ...
}
```

변환 후 `.env.local`:
```env
GOOGLE_CLIENT_EMAIL=corp-kanban-service@corp-kanban-system.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8
```

### 4단계: 개발 서버 실행

```bash
cd actauto/corp-kanban
npm install
npm run dev
```

브라우저에서 http://localhost:3000 열기

## 📱 PWA 아이콘 설정

### 아이콘 준비
1. 192x192 PNG 이미지 준비
2. 512x512 PNG 이미지 준비
3. 파일명: `icon-192.png`, `icon-512.png`
4. `public/` 폴더에 저장

### 온라인 도구 활용
- [Favicon Generator](https://favicon.io/)
- [PWA Asset Generator](https://www.pwabuilder.com/)

## 🌐 Vercel 배포

### 1. GitHub 저장소 생성
```bash
cd actauto/corp-kanban
git init
git add .
git commit -m "Initial commit: Corporation Kanban Board"
git branch -M main
git remote add origin https://github.com/yourusername/corp-kanban.git
git push -u origin main
```

### 2. Vercel 배포
1. [Vercel](https://vercel.com) 접속 및 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결
4. 프로젝트 설정:
   - Framework Preset: Next.js
   - Root Directory: `actauto/corp-kanban` (필요시)
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. 환경변수 설정
Vercel 프로젝트 설정 → Environment Variables:

```
GOOGLE_CLIENT_EMAIL = corp-kanban-service@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n
GOOGLE_SHEET_ID = 1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8
```

**주의**: Vercel에서는 값에 따옴표 없이 입력

### 4. 배포
"Deploy" 버튼 클릭 → 자동 빌드 및 배포

## 📋 초기 데이터 입력

### 방법 1: 웹 UI 사용
1. 배포된 사이트 접속
2. 우측 상단 "새 법인 추가" 클릭
3. 폼에 정보 입력
4. 저장

### 방법 2: Google Sheets 직접 입력
1. Google Sheets "법인목록" 시트 열기
2. 2번 행부터 데이터 입력:

| id | name | envKey | folderId | ... |
|----|------|--------|----------|-----|
| corp-1 | 유니스 | uniace | 1ABC...xyz | ... |
| corp-2 | 제이제이큐브 | jjqube | 1DEF...xyz | ... |

3. 웹 페이지 새로고침

## 🔧 문제 해결

### API 인증 오류
**증상**: "Failed to load corporations" 에러

**해결방법**:
1. 서비스 계정 이메일이 스프레드시트 공유되었는지 확인
2. `.env.local` 파일의 `GOOGLE_PRIVATE_KEY` 줄바꿈 확인
3. 스프레드시트 ID가 정확한지 확인

### 빌드 오류
**증상**: `npm run build` 실패

**해결방법**:
```bash
rm -rf .next node_modules
npm install
npm run build
```

### PWA 설치 안됨
**증상**: 모바일에서 "홈 화면에 추가" 안 나타남

**해결방법**:
1. HTTPS 환경에서만 작동 (localhost 또는 Vercel)
2. `manifest.json` 확인
3. 아이콘 파일 존재 확인

## 📞 지원

문제가 계속되면 다음을 확인하세요:
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Google Sheets API 문서](https://developers.google.com/sheets/api)
- [Vercel 배포 가이드](https://vercel.com/docs)

## 🎉 완료!

이제 법인 관리 칸반보드를 사용할 준비가 완료되었습니다!
