# 월지급계산 UI - 근무위치 필터 추가

## 📋 변경 개요

**날짜**: 2026-01-30
**목적**: 본사/본사외 근무위치별 필터링 기능 추가
**상태**: ✅ 구현 완료

---

## 🎯 추가된 기능

### 1. 근무위치 필터 드롭다운 ✅
- **전체**: 모든 근무위치 표시
- **본사**: "본사"가 포함된 근무위치만 표시
- **본사외**: "본사"가 포함되지 않은 근무위치 표시

### 2. 근무위치 정보 표시 ✅
- 각 인원 행에 근무위치 아이콘 표시
  - 🏢 본사
  - 🏪 본사외
- 입사일 앞에 표시

### 3. 통계 정보 업데이트 ✅
- **전체 선택 통계**: (재직: X명, 퇴사: Y명 | 본사: Z명, 본사외: W명)
- **선택 요약 정보**:
  - 재직/퇴사 인원 수
  - **본사/본사외 인원 수** ← 신규 추가
  - 매칭 가능/불가 인원 수

---

## 🔧 수정된 파일

### 1. monthlyPayrollUIHandler.js

**변경 내용**:
```javascript
// 급여데이터 D열(근무위치) 읽기 추가
const workplace = String(row[3]).trim();  // D열: 근무위치

// 근무위치 분류 로직
const workplaceType = (workplace && workplace.includes('본사')) ? 'headquarters' : 'branch';

// 반환 데이터에 근무위치 정보 추가
people.push({
  index: index,
  name: name,
  residentId: residentId,
  workplace: workplace,        // 원본 근무위치 텍스트
  workplaceType: workplaceType, // 분류된 타입 (headquarters/branch)
  startDate: formatDate(startDate),
  status: status,
  matchStatus: matchStatus
});
```

**분류 로직**:
- 근무위치 텍스트에 "본사"가 포함되어 있으면 → `headquarters` (본사)
- 그 외 → `branch` (본사외)

### 2. monthlyPayrollUI.html

#### 2-1. 필터 드롭다운 추가
```html
<select id="workplaceFilter" class="filter-dropdown">
  <option value="all">근무위치</option>
  <option value="headquarters">본사</option>
  <option value="branch">본사외</option>
</select>
```

#### 2-2. 사람 목록 렌더링 로직 업데이트
```javascript
// 필터링 조건에 근무위치 추가
const workplaceFilter = document.getElementById('workplaceFilter').value;
if (workplaceFilter !== 'all' && person.workplaceType !== workplaceFilter) return;

// 근무위치 아이콘 표시
const workplaceDisplay = person.workplaceType === 'headquarters' ? '🏢 본사' : '🏪 본사외';
```

#### 2-3. 통계 표시 업데이트
```javascript
// 전체 목록 통계
document.getElementById('totalStats').textContent =
  `(재직: ${activeCount}명, 퇴사: ${inactiveCount}명 | 본사: ${headquartersCount}명, 본사외: ${branchCount}명)`;

// 선택 요약 통계
document.getElementById('headquartersCount').textContent = headquartersCount;
document.getElementById('branchCount').textContent = branchCount;
```

#### 2-4. 이벤트 리스너 추가
```javascript
// 근무위치 필터 변경 시 재렌더링
document.getElementById('workplaceFilter').addEventListener('change', renderPeopleList);
```

#### 2-5. 전체 선택 로직 업데이트
```javascript
// 전체 선택 시 근무위치 필터도 고려
const workplaceFilter = document.getElementById('workplaceFilter').value;
if (workplaceFilter !== 'all' && person.workplaceType !== workplaceFilter) return;
```

---

## 📊 UI 변경 사항

### Before (이전)
```
🔍 [이름 검색...]  [전체▼] [매칭상태▼]
```

### After (변경 후)
```
🔍 [이름 검색...]  [전체▼] [근무위치▼] [매칭상태▼]
```

### 사람 목록 표시

**Before**:
```
☑ 홍길동  재직  2026-01-15 입사  ✓
```

**After**:
```
☑ 홍길동  재직  🏢 본사  2026-01-15 입사  ✓
☑ 김철수  재직  🏪 본사외  2025-03-10 입사  ✓
```

### 통계 표시

**Before**:
```
전체 선택 (재직: 15명, 퇴사: 3명)

• 선택된 인원: 15명
• 재직: 14명 | 퇴사: 1명
• 매칭 가능: 14명 | 매칭 불가: 1명
```

**After**:
```
전체 선택 (재직: 15명, 퇴사: 3명 | 본사: 10명, 본사외: 5명)

• 선택된 인원: 15명
• 재직: 14명 | 퇴사: 1명
• 본사: 9명 | 본사외: 5명  ← 신규 추가
• 매칭 가능: 14명 | 매칭 불가: 1명
```

---

## 🧪 테스트 시나리오

### 1. 근무위치 필터 기본 동작
- [ ] "근무위치" 드롭다운이 표시되는지 확인
- [ ] "전체" 선택 시 모든 인원 표시 확인
- [ ] "본사" 선택 시 본사 인원만 표시 확인
- [ ] "본사외" 선택 시 본사외 인원만 표시 확인

### 2. 근무위치 아이콘 표시
- [ ] 본사 인원에 🏢 아이콘 표시 확인
- [ ] 본사외 인원에 🏪 아이콘 표시 확인
- [ ] 아이콘이 입사일 앞에 위치하는지 확인

### 3. 통계 정보
- [ ] 전체 선택 통계에 본사/본사외 카운트 표시 확인
- [ ] 선택 요약에 본사/본사외 카운트 표시 확인
- [ ] 필터 적용 시 통계가 정확하게 업데이트되는지 확인

### 4. 복합 필터 테스트
- [ ] 이름 검색 + 근무위치 필터 조합 테스트
- [ ] 재직/퇴사 + 근무위치 필터 조합 테스트
- [ ] 매칭상태 + 근무위치 필터 조합 테스트
- [ ] 모든 필터를 동시에 적용했을 때 정확한 결과 확인

### 5. 전체 선택 테스트
- [ ] 근무위치 필터 적용 상태에서 전체 선택 시
- [ ] 필터링된 본사 인원만 선택되는지 확인
- [ ] 필터링된 본사외 인원만 선택되는지 확인

---

## 📝 데이터 구조

### 급여데이터 시트
```
A열: ?
B열: 근무자명
C열: 주민번호
D열: 근무위치 ← 사용하는 열
E열: ?
F열: 계약시작일
G열: 계약종료일
...
R열: 합계금액
```

### 근무위치 예시
- "본사" → 분류: headquarters (본사)
- "본사 1층" → 분류: headquarters (본사)
- "본사 영업부" → 분류: headquarters (본사)
- "서울지점" → 분류: branch (본사외)
- "부산지점" → 분류: branch (본사외)
- "제주센터" → 분류: branch (본사외)

---

## 🚀 배포 절차

### 1. 변경 사항 확인
```bash
git status
```

### 2. 배포
```bash
clasp push
```

### 3. 테스트
1. Google Sheets 새로고침
2. 메뉴: **급여 관리 > 4. 월지급 계산**
3. UI 모달에서 근무위치 필터 확인
4. 각 필터 옵션 테스트
5. 통계 정보 확인

---

## 🐛 예상 문제 및 해결

### 문제: 근무위치가 "본사"와 "본사외"로 정확히 분류되지 않음

**원인**: 급여데이터 시트의 D열 근무위치 텍스트가 예상과 다름

**해결 방법**:
1. 급여데이터 시트의 D열 데이터 확인
2. 필요시 분류 로직 수정:
```javascript
// monthlyPayrollUIHandler.js
// 현재 로직: "본사"가 포함되어 있으면 본사
const workplaceType = (workplace && workplace.includes('본사')) ? 'headquarters' : 'branch';

// 수정 예시: 더 정확한 분류가 필요한 경우
const workplaceType = (workplace === '본사' || workplace === '본사 1층' || workplace === '본사 영업부')
  ? 'headquarters'
  : 'branch';
```

### 문제: 통계가 정확하지 않음

**원인**: 카운트 변수가 제대로 업데이트되지 않음

**해결 방법**:
1. 브라우저 콘솔에서 peopleData 확인
2. workplace와 workplaceType 값 확인
3. 필요시 로그 추가:
```javascript
console.log('Person:', person.name, 'Workplace:', person.workplace, 'Type:', person.workplaceType);
```

---

## 📊 성능 영향

### 추가된 연산
- 급여데이터 D열 읽기 (1회, 초기 로딩 시)
- 근무위치 분류 로직 (각 인원당 1회)
- 필터링 조건 1개 추가 (각 렌더링마다)

### 예상 성능 영향
- **미미함**: 데이터 양이 수백 명 이하인 경우 체감 불가
- **최적화됨**: 필터링은 클라이언트 사이드에서만 수행

---

## ✅ 체크리스트

### 구현 완료
- [x] monthlyPayrollUIHandler.js에 근무위치 읽기 추가
- [x] 근무위치 분류 로직 구현 (본사/본사외)
- [x] HTML에 근무위치 필터 드롭다운 추가
- [x] 사람 목록에 근무위치 아이콘 표시
- [x] 전체 선택 통계에 본사/본사외 카운트 추가
- [x] 선택 요약 정보에 본사/본사외 카운트 추가
- [x] 필터링 로직에 근무위치 조건 추가
- [x] 이벤트 리스너 추가
- [x] 전체 선택 로직 업데이트

### 배포 대기
- [ ] clasp push 실행
- [ ] 브라우저에서 테스트
- [ ] 근무위치 분류 정확성 확인
- [ ] 복합 필터 동작 확인
- [ ] 통계 정보 정확성 확인

---

**작성일**: 2026-01-30
**버전**: 1.1
**이전 버전**: 1.0 (근무위치 필터 없음)
