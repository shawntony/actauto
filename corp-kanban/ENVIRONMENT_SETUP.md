# 환경변수 설정 가이드

## ⚠️ 현재 상태

`.env.local` 파일이 생성되었지만 **데모 값**으로 채워져 있습니다.
실제 Google Sheets와 연동하려면 아래 단계를 따라주세요.

## 🔧 Google Sheets API 설정 (필수)

### 1단계: Google Cloud Console 설정

#### 1-1. 프로젝트 생성
1. https://console.cloud.google.com/ 접속
2. 새 프로젝트 생성 (예: "corp-kanban-system")

#### 1-2. Google Sheets API 활성화
1. 좌측 메뉴 → "API 및 서비스" → "라이브러리"
2. "Google Sheets API" 검색
3. "사용 설정" 클릭

#### 1-3. 서비스 계정 생성
1. 좌측 메뉴 → "API 및 서비스" → "사용자 인증 정보"
2. "사용자 인증 정보 만들기" → "서비스 계정"
3. 서비스 계정 이름 입력 (예: "corp-kanban-service")
4. 역할: "편집자" 선택
5. "완료" 클릭

#### 1-4. JSON 키 다운로드
1. 생성된 서비스 계정 클릭
2. "키" 탭 선택
3. "키 추가" → "새 키 만들기" → "JSON"
4. JSON 파일 다운로드 및 안전하게 보관

### 2단계: Google Sheets 생성 및 권한 설정

#### 2-1. 스프레드시트 생성
1. https://sheets.google.com/ 접속
2. 새 스프레드시트 생성
3. 이름: "법인관리_데이터베이스"

#### 2-2. 시트 구조 설정
1. 첫 번째 시트 이름을 **"법인목록"**으로 변경
2. A1 셀부터 다음 헤더 입력:

```
id | name | envKey | folderId | folderUrl | spreadsheetId | spreadsheetUrl | scriptId | scriptUrl | description | createdAt | updatedAt | status | tags
```

#### 2-3. 권한 부여
1. 스프레드시트 우측 상단 "공유" 클릭
2. 서비스 계정 이메일 추가
   - JSON 파일에서 `client_email` 값 확인
   - 예: `corp-kanban-service@project-id.iam.gserviceaccount.com`
3. 권한: **"편집자"**로 설정
4. "완료" 클릭

#### 2-4. 스프레드시트 ID 복사
URL에서 ID 확인:
```
https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
                                       ↑ 이 부분을 복사
```

### 3단계: .env.local 파일 수정

다운로드한 JSON 파일을 열고 다음 값들을 확인하세요:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service@your-project.iam.gserviceaccount.com",
  ...
}
```

`.env.local` 파일을 열고 다음과 같이 수정:

```env
# client_email 값을 복사
GOOGLE_CLIENT_EMAIL=your-service@your-project.iam.gserviceaccount.com

# private_key 값을 그대로 복사 (줄바꿈 \n 포함, 큰따옴표로 감싸기)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# 스프레드시트 ID 입력
GOOGLE_SHEET_ID=1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8
```

**⚠️ 주의사항:**
- `GOOGLE_PRIVATE_KEY`는 반드시 큰따옴표(`"`)로 감싸야 합니다
- 줄바꿈(`\n`)을 그대로 유지해야 합니다
- 복사할 때 앞뒤 공백이 없는지 확인하세요

### 4단계: 서버 재시작

환경변수를 수정한 후 개발 서버를 재시작하세요:

```bash
# 터미널에서 Ctrl+C로 서버 중지
# 그 다음 다시 실행
npm run dev
```

## ✅ 테스트

1. 브라우저에서 http://localhost:3000 접속
2. "Failed to fetch corporations" 오류가 사라지면 성공!
3. "새 법인 추가" 버튼으로 테스트 데이터 입력

## 🐛 문제 해결

### "client_email field" 오류
→ `.env.local` 파일의 `GOOGLE_CLIENT_EMAIL` 값 확인

### "private_key" 오류
→ `GOOGLE_PRIVATE_KEY`가 큰따옴표로 감싸져 있는지, `\n`이 포함되어 있는지 확인

### "Permission denied" 오류
→ 스프레드시트에 서비스 계정이 편집자로 추가되었는지 확인

### "Spreadsheet not found" 오류
→ `GOOGLE_SHEET_ID`가 정확한지, 시트 이름이 "법인목록"인지 확인

## 📝 예시 .env.local 파일

```env
GOOGLE_CLIENT_EMAIL=corp-kanban-service@corp-kanban-123456.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7...[긴 키 값]...ABC\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 다음 단계

환경변수 설정이 완료되면:
1. 개발 서버 재시작
2. 테스트 데이터 입력
3. 기능 테스트 (추가/수정/삭제)
4. 프로덕션 배포 준비

---

**도움말**: 설정 중 문제가 발생하면 `SETUP_GUIDE.md` 문서를 참고하세요.
