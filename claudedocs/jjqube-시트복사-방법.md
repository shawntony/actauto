# 제이제이큐브 시트 복사 방법

## 상황
법인재무관리_제이제이큐브 스프레드시트가 이미 생성되었지만, 유니스의 모든 시트와 1행(헤더)이 복사되지 않은 상태

## 해결 방법

### 방법 1: 유니스 Apps Script에서 실행 (권장)

**장점**: 권한 문제 없음, 빠른 실행

**실행 단계**:
1. [법인재무관리_유니스](https://docs.google.com/spreadsheets/d/1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8) 열기
2. 확장 프로그램 > Apps Script
3. 함수 목록에서 `create제이제이큐브완전자동` 찾기
4. 함수 실행
5. 로그에서 결과 확인

**예상 결과**:
- 모든 시트 생성
- 각 시트의 1행(헤더) 복사 (값, 서식, 색상, 정렬 등 모두 포함)
- 기본 Sheet1 삭제
- 실행 시간: 약 2-5분

---

### 방법 2: 제이제이큐브 Apps Script에 직접 붙여넣기

**장점**: 독립적 실행 가능

**실행 단계**:
1. [법인재무관리_제이제이큐브](https://docs.google.com/spreadsheets/d/1ul4Pzf-LiCQ3HSDt4PBt8AkoySmTuSutHO07U9dfSto/edit) 열기
2. 확장 프로그램 > Apps Script
3. **새 스크립트 파일 생성**
4. `C:\Users\gram\myautomation\actauto\scripts\copy-sheets-to-jjqube.js` 파일 내용 전체 복사
5. Apps Script 편집기에 붙여넣기
6. 저장 (Ctrl+S)
7. `copyAllSheetsFromUnis` 함수 실행

**스크립트 파일 위치**:
```
C:\Users\gram\myautomation\actauto\scripts\copy-sheets-to-jjqube.js
```

---

## 복사되는 내용

### 각 시트마다:
✅ 시트 생성 (같은 이름으로)
✅ 1행 값 (headers)
✅ 1행 숫자 포맷
✅ 1행 폰트 굵기
✅ 1행 폰트 색상
✅ 1행 배경 색상
✅ 1행 가로 정렬

### 추가 작업:
✅ 빈 시트 건너뜀
✅ 기본 Sheet1 삭제
✅ 상세한 로그 출력

---

## 실행 후 확인 사항

1. **시트 개수 확인**
   - 유니스와 동일한 개수의 시트가 생성되었는지 확인

2. **1행 헤더 확인**
   - 각 시트의 1행에 컬럼 헤더가 올바르게 복사되었는지 확인
   - 서식(색상, 굵기 등)이 유지되었는지 확인

3. **메뉴 확인** (새로고침 후)
   - 재무자료 관리
   - 도구 관리
   - 급여 관리
   - 각 메뉴의 하위 항목들

4. **코드 배포 상태 확인**
   ```bash
   cd C:\Users\gram\myautomation\actauto
   node scripts/deploy.js jjqube
   ```

---

## 환경 정보

- **환경 키**: `jjqube`
- **법인 이름**: 제이제이큐브
- **스프레드시트 ID**: `1ul4Pzf-LiCQ3HSDt4PBt8AkoySmTuSutHO07U9dfSto`
- **스크립트 ID**: `1ubo9LjotcMCQoDoyN4qiz3I9ApvDdLMOs_i29ApebJeJdtMciyGtJ1jz`
- **폴더 ID**: `1zFZMGdiIiQIGDh6tQWFvqc_B4zcOvCKF`

---

## 문제 해결

**문제**: 권한 오류 발생
- **해결**: 방법 1 사용 (유니스 Apps Script에서 실행)

**문제**: 일부 시트만 복사됨
- **해결**: 로그 확인하여 실패한 시트 파악, 수동으로 해당 시트만 재실행

**문제**: 메뉴가 보이지 않음
- **해결**:
  1. 스프레드시트 새로고침 (F5)
  2. 코드가 배포되었는지 확인: `node scripts/deploy.js jjqube`
  3. 필요시 재배포: `copy configs/clasp-jjqube.json .clasp.json && npx clasp push --force`
