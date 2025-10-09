# 배포 체크리스트

완벽한 배포를 위한 단계별 체크리스트

## ✅ 배포 전 체크리스트

### 1. Google Cloud 설정
- [ ] Google Cloud 프로젝트 생성
- [ ] Google Sheets API 활성화
- [ ] 서비스 계정 생성 완료
- [ ] JSON 키 파일 다운로드
- [ ] 서비스 계정 이메일 확인

### 2. Google Sheets 설정
- [ ] 스프레드시트 생성
- [ ] "법인목록" 시트 생성
- [ ] 헤더 행 입력 (14개 컬럼)
- [ ] 서비스 계정에 편집 권한 부여
- [ ] 스프레드시트 ID 복사

### 3. 로컬 환경 설정
- [ ] `.env.local` 파일 생성
- [ ] `GOOGLE_CLIENT_EMAIL` 설정
- [ ] `GOOGLE_PRIVATE_KEY` 설정 (줄바꿈 포함)
- [ ] `GOOGLE_SHEET_ID` 설정
- [ ] `npm install` 실행 성공
- [ ] `npm run dev` 로컬 서버 정상 작동

### 4. PWA 리소스
- [ ] `public/icon-192.png` 생성
- [ ] `public/icon-512.png` 생성
- [ ] `public/manifest.json` 확인
- [ ] 브라우저에서 PWA 감지 확인

### 5. 코드 검증
- [ ] TypeScript 오류 없음 (`npm run build`)
- [ ] ESLint 경고 최소화
- [ ] 모든 API 엔드포인트 테스트
- [ ] CRUD 기능 정상 작동

### 6. Git 저장소
- [ ] `.gitignore` 파일 확인 (`.env.local` 제외됨)
- [ ] GitHub 저장소 생성
- [ ] 초기 커밋 완료
- [ ] README.md 업데이트

## ✅ Vercel 배포 체크리스트

### 1. Vercel 프로젝트 설정
- [ ] Vercel 계정 생성/로그인
- [ ] GitHub 저장소 연결
- [ ] Framework: Next.js 선택
- [ ] Root Directory 설정 (필요시)

### 2. 환경변수 설정
- [ ] `GOOGLE_CLIENT_EMAIL` 입력
- [ ] `GOOGLE_PRIVATE_KEY` 입력 (따옴표 없이)
- [ ] `GOOGLE_SHEET_ID` 입력
- [ ] 환경변수 저장

### 3. 빌드 설정
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `npm install`
- [ ] Node.js Version: 18.x 이상

### 4. 배포 실행
- [ ] "Deploy" 버튼 클릭
- [ ] 빌드 로그 확인
- [ ] 배포 성공 확인
- [ ] 프로덕션 URL 접속

## ✅ 배포 후 검증

### 1. 기능 테스트
- [ ] 페이지 로딩 정상
- [ ] Google Sheets 데이터 로드 성공
- [ ] 검색 기능 작동
- [ ] 법인 추가 기능 작동
- [ ] 법인 수정 기능 작동
- [ ] 법인 삭제 기능 작동
- [ ] 링크 클릭 시 새 탭 열림

### 2. 모바일 테스트
- [ ] 모바일 브라우저 접속
- [ ] 반응형 레이아웃 정상
- [ ] 터치 이벤트 정상
- [ ] PWA 설치 프롬프트 나타남
- [ ] PWA 설치 후 작동 확인

### 3. 성능 검증
- [ ] Lighthouse 점수 확인
  - Performance: 90+ 목표
  - Accessibility: 90+ 목표
  - Best Practices: 90+ 목표
  - SEO: 90+ 목표
- [ ] 페이지 로드 속도 < 3초
- [ ] API 응답 속도 < 1초

### 4. 브라우저 호환성
- [ ] Chrome (최신 버전)
- [ ] Safari (iOS)
- [ ] Edge
- [ ] Firefox
- [ ] 모바일 Chrome (Android)
- [ ] 모바일 Safari (iOS)

## ✅ 보안 체크

### 1. 환경변수
- [ ] `.env.local` 파일 Git에 커밋되지 않음
- [ ] Vercel 환경변수 설정됨
- [ ] JSON 키 파일 안전하게 보관

### 2. API 보안
- [ ] 서비스 계정 최소 권한 적용
- [ ] CORS 설정 확인 (필요시)
- [ ] Rate limiting 고려 (필요시)

### 3. 데이터 보안
- [ ] 스프레드시트 공유 권한 확인
- [ ] 민감 정보 암호화 (필요시)

## ✅ 사용자 가이드

### 1. 문서
- [ ] README.md 업데이트
- [ ] SETUP_GUIDE.md 작성
- [ ] API 문서 작성 (필요시)
- [ ] 사용자 매뉴얼 작성 (필요시)

### 2. 지원
- [ ] 문제 해결 가이드 작성
- [ ] FAQ 작성
- [ ] 연락처 정보 제공

## ✅ 유지보수 계획

### 1. 모니터링
- [ ] Vercel Analytics 활성화 (선택)
- [ ] 에러 로깅 설정 (선택)
- [ ] 사용량 모니터링 (선택)

### 2. 백업
- [ ] Google Sheets 자동 백업 설정
- [ ] 코드 저장소 백업

### 3. 업데이트 계획
- [ ] 정기 의존성 업데이트
- [ ] 보안 패치 적용
- [ ] 기능 개선 로드맵

## 🎯 배포 완료 확인

모든 체크리스트 항목이 완료되면:

✅ **배포 성공!**

프로덕션 URL: `https://your-project.vercel.app`

---

**배포 날짜**: _______________
**배포자**: _______________
**버전**: v1.0.0
