# 🖥️ Synology NAS 개발 서버 설정 가이드

로컬호스트와 Synology NAS 간 개발 환경을 손쉽게 전환하는 방법

---

## 📋 목차

1. [환경 개요](#환경-개요)
2. [사전 준비](#사전-준비)
3. [NAS 설정](#nas-설정)
4. [사용 방법](#사용-방법)
5. [트러블슈팅](#트러블슈팅)

---

## 🎯 환경 개요

### 지원 환경

| 환경 | 설명 | 접근 URL | 사용 시나리오 |
|------|------|----------|---------------|
| **localhost** | 로컬 PC에서 실행 | `http://localhost:3000` | 개인 PC에서 개발 |
| **NAS** | Synology NAS에서 실행 | `http://[NAS-IP]:3000` | 네트워크 내 다른 기기에서 접근 |

### 환경 파일 구조

```
corp-kanban/
├── .env.local      # localhost 환경 설정
├── .env.nas        # NAS 환경 설정
├── .env            # 현재 활성 환경 (자동 생성)
└── .env.example    # 템플릿
```

---

## 🛠️ 사전 준비

### 1. Synology NAS 요구사항

- **DSM 버전**: 7.0 이상
- **패키지**: Node.js 18+ 설치 필요
- **메모리**: 최소 2GB RAM
- **포트**: 3000번 포트 개방

### 2. Node.js 설치 (NAS)

1. **패키지 센터** 열기
2. **Node.js** 검색 및 설치
3. 버전 확인:
```bash
node --version  # v18.0.0 이상
npm --version   # v9.0.0 이상
```

### 3. NAS IP 주소 확인

**DSM 제어판** → **네트워크** → **네트워크 인터페이스**

예시: `192.168.0.100`

---

## 🔧 NAS 설정

### Step 1: 프로젝트 복사

#### 방법 A: Git Clone (권장)

```bash
# NAS SSH 접속
ssh admin@192.168.0.100

# 프로젝트 디렉토리로 이동
cd /volume1/web

# Git Clone
git clone https://github.com/shawntony/actauto.git
cd actauto/corp-kanban
```

#### 방법 B: 파일 스테이션

1. **File Station** 열기
2. `web` 폴더 생성 (없으면)
3. Windows에서 프로젝트 폴더를 NAS로 복사

### Step 2: 의존성 설치

```bash
# NAS SSH 또는 Task Scheduler에서
cd /volume1/web/actauto/corp-kanban
npm install
```

### Step 3: 환경 파일 설정

#### `.env.nas` 파일 수정

```bash
nano .env.nas
```

**중요**: NAS IP 주소를 실제 값으로 변경

```env
# NAS IP 주소로 변경 ⬇️
NEXT_PUBLIC_API_URL=http://192.168.0.100:3000

# NAS 설정
NAS_HOST=192.168.0.100  # 실제 NAS IP
NAS_PORT=3000
```

### Step 4: 방화벽 설정

**DSM 제어판** → **보안** → **방화벽**

1. 규칙 생성
2. 포트: `3000`
3. 프로토콜: `TCP`
4. 소스: `LAN` (또는 특정 IP)

### Step 5: Task Scheduler 설정 (자동 시작)

1. **제어판** → **작업 스케줄러**
2. **생성** → **예약된 작업** → **사용자 정의 스크립트**
3. 설정:

```bash
일반:
- 작업: Next.js Dev Server
- 사용자: root
- 활성화됨: ✅

스케줄:
- 부팅 시 실행

작업 설정:
cd /volume1/web/actauto/corp-kanban
npm run dev:nas
```

---

## 🚀 사용 방법

### 방법 1: NPM 스크립트 사용 (권장)

#### localhost에서 실행

```bash
# Windows PowerShell 또는 CMD
cd C:\Users\gram\myautomation\actauto\corp-kanban

# localhost 환경으로 실행
npm run dev:local
```

#### NAS에서 실행

```bash
# NAS SSH
cd /volume1/web/actauto/corp-kanban

# NAS 환경으로 실행 (모든 네트워크 인터페이스 바인딩)
npm run dev:nas
```

### 방법 2: 환경 수동 전환

```bash
# localhost로 전환
npm run switch:local
npm run dev

# NAS로 전환
npm run switch:nas
npm run dev
```

### 방법 3: 프로덕션 빌드 실행

```bash
# 빌드
npm run build

# localhost 시작
npm start

# NAS 시작 (네트워크 접근 허용)
npm run start:nas
```

---

## 🌐 접근 방법

### localhost 환경

- **브라우저**: `http://localhost:3000`
- **접근 가능**: 현재 PC에서만

### NAS 환경

#### 같은 네트워크 내 접근

- **브라우저**: `http://192.168.0.100:3000`
- **접근 가능**: 같은 WiFi/LAN의 모든 기기
  - PC: `http://192.168.0.100:3000`
  - 스마트폰: `http://192.168.0.100:3000`
  - 태블릿: `http://192.168.0.100:3000`

#### 외부 접근 (선택)

**QuickConnect 또는 DDNS 설정 필요**

1. **DSM 제어판** → **외부 액세스**
2. DDNS 설정: `yourname.synology.me`
3. 포트 포워딩: `3000` → NAS IP
4. 접근: `http://yourname.synology.me:3000`

---

## 📝 NPM 스크립트 전체 목록

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 기본 개발 서버 (현재 .env 사용) |
| `npm run dev:local` | localhost 환경으로 개발 서버 시작 |
| `npm run dev:nas` | NAS 환경으로 개발 서버 시작 (0.0.0.0 바인딩) |
| `npm run switch:local` | localhost 환경으로 전환 (.env 교체) |
| `npm run switch:nas` | NAS 환경으로 전환 (.env 교체) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 시작 (localhost) |
| `npm run start:nas` | 프로덕션 서버 시작 (NAS, 0.0.0.0) |

---

## 🔍 트러블슈팅

### 문제 1: NAS에서 서버 시작 안됨

**증상**: `EADDRINUSE: address already in use`

**해결**:
```bash
# 포트 사용 확인
netstat -tulpn | grep 3000

# 프로세스 종료
kill -9 [PID]

# 또는 다른 포트 사용
PORT=3001 npm run dev:nas
```

### 문제 2: 네트워크에서 접근 불가

**원인**: 방화벽 또는 바인딩 문제

**해결**:
1. `-H 0.0.0.0` 옵션 확인 (dev:nas 스크립트)
2. 방화벽 규칙 확인
3. NAS 재시작

```bash
# 수동으로 0.0.0.0 바인딩 테스트
next dev -H 0.0.0.0 -p 3000
```

### 문제 3: 환경 변수 적용 안됨

**원인**: `.env` 파일 캐싱

**해결**:
```bash
# .next 폴더 삭제
rm -rf .next

# 재시작
npm run dev:nas
```

### 문제 4: NAS 성능 저하

**원인**: 메모리 부족 또는 CPU 제한

**해결**:
1. 메모리 사용량 확인
```bash
free -h
```

2. 프로덕션 빌드 사용 (개발 서버보다 빠름)
```bash
npm run build
npm run start:nas
```

3. NAS 자원 관리자에서 다른 패키지 중지

### 문제 5: Git 인증 문제 (NAS)

**원인**: SSH 키 미설정

**해결**:
```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "your_email@example.com"

# 공개 키 복사
cat ~/.ssh/id_ed25519.pub

# GitHub에 SSH 키 등록
# Settings → SSH and GPG keys → New SSH key
```

---

## 🎯 추천 워크플로우

### 시나리오 A: 개인 개발

```bash
# Windows PC에서
npm run dev:local

# 브라우저: http://localhost:3000
```

### 시나리오 B: 팀 협업

```bash
# NAS에서 서버 실행
npm run dev:nas

# 팀원들은 브라우저에서 접근
# http://192.168.0.100:3000
```

### 시나리오 C: 모바일 테스트

```bash
# NAS에서 서버 실행
npm run dev:nas

# 스마트폰/태블릿 브라우저
# http://192.168.0.100:3000

# PWA 설치 테스트 가능
```

### 시나리오 D: 프로덕션 배포 전 테스트

```bash
# NAS에서 프로덕션 빌드
npm run build
npm run start:nas

# 실제 프로덕션 환경과 유사하게 테스트
```

---

## 📊 성능 비교

| 환경 | 빌드 속도 | 핫 리로드 | 안정성 | 접근성 |
|------|-----------|-----------|--------|--------|
| **localhost** | ⚡⚡⚡ 빠름 | ⚡⚡⚡ 즉시 | ⭐⭐⭐ 높음 | 🏠 로컬만 |
| **NAS Dev** | ⚡⚡ 보통 | ⚡⚡ 약간 느림 | ⭐⭐ 보통 | 🌐 네트워크 전체 |
| **NAS Prod** | ⚡⚡⚡ 빠름 | ❌ 없음 | ⭐⭐⭐ 높음 | 🌐 네트워크 전체 |

---

## 🔒 보안 권장사항

1. **방화벽 설정**: LAN만 허용, 외부 접근 최소화
2. **HTTPS 사용**: Reverse Proxy (Nginx) 설정
3. **인증 추가**: 개발 서버에 Basic Auth 적용
4. **환경 변수 보호**: `.env` 파일 권한 설정

```bash
# .env 파일 권한 설정 (NAS)
chmod 600 .env.nas
chmod 600 .env.local
```

---

## 📚 추가 자료

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Synology DSM 사용자 가이드](https://www.synology.com/support/documentation)
- [Node.js NAS 설치 가이드](https://github.com/synology/node)

---

## 💡 팁

1. **자동 시작**: NAS Task Scheduler로 부팅 시 자동 실행
2. **로그 확인**: `npm run dev:nas > /tmp/nextjs.log 2>&1 &`
3. **포트 변경**: `PORT=3001 npm run dev:nas`
4. **환경 확인**: `echo $NEXT_PUBLIC_API_URL`

---

## ✅ 체크리스트

### NAS 초기 설정
- [ ] Node.js 18+ 설치
- [ ] 프로젝트 복사 (Git clone)
- [ ] `npm install` 완료
- [ ] `.env.nas` 파일 수정 (NAS IP)
- [ ] 방화벽 포트 3000 개방
- [ ] Task Scheduler 자동 시작 설정

### 일상 사용
- [ ] 로컬 개발: `npm run dev:local`
- [ ] NAS 개발: `npm run dev:nas`
- [ ] 환경 전환: `npm run switch:local` 또는 `npm run switch:nas`

---

**마지막 업데이트**: 2025-10-09
**작성자**: gram (y0163824619@gmail.com)
