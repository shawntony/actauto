# 고용보험 시트 스키마

## 📋 시트 정보
- **시트명**: 고용보험
- **매칭 키**: A열(월, YYYY-MM-DD) + **E열**(주민번호 앞 6자리) ⚠️ **다른 보험과 다름!**

## ⚠️ 중요 차이점
- **국민연금, 건강보험, 산재보험**: D열에 주민번호
- **고용보험**: **E열**에 주민번호 (D열은 근로자명)

## 📊 컬럼 구조

| 열 | 인덱스 | 컬럼명 | 타입 | 설명 |
|----|--------|--------|------|------|
| A | 0 | 월 | string | YYYY-MM-DD 형식 (말일) |
| B | 1 | 항목명/구분 | string | 참고용 |
| D | 3 | 근로자명 | string | 참고용 (매칭에 사용 안 함) |
| **E** | **4** | **주민번호** | **string** | **매칭 키 (앞 6자리 사용)** ⚠️ |
| X | 23 | 직원고용보험료 | number | 직원 부담 고용보험료 |
| Z | 25 | 사업주고용보험료 | number | 사업주 부담 고용보험료 |

## 🔍 매칭 로직

**매칭 키 생성**:
```
compositeKey = A열(YYYY-MM-DD) + "|" + 주민번호 앞 6자리
예: "2026-01-31|901225"
```

**매칭 과정**:
1. 급여데이터 C열에서 주민번호 추출
2. 주민번호 앞 6자리 추출 (YYMMDD)
3. 월 + 주민번호로 복합 키 생성
4. 고용보험 시트에서 일치하는 행 찾기 (**E열** 기준!)
5. 해당 행의 X열(직원고용보험료), Z열(사업주고용보험료) 값 반환

## 📐 데이터 흐름

```
급여데이터 (C열: 주민번호)
    ↓
extractResidentIdKey() → 앞 6자리
    ↓
"YYYY-MM-DD|YYMMDD" 복합 키 생성
    ↓
고용보험 시트에서 매칭 (E열 기준!)
    ↓
X열(직원고용보험료), Z열(사업주고용보험료) 값 반환
```

## 🔧 스키마 정의 (보험시트_schema.js)

```javascript
고용보험: {
  SHEET_NAME: '고용보험',
  MATCHING_COLUMNS: {
    MONTH: 'A',
    RESIDENT_ID: 'E',        // ⚠️ E열! (다른 보험과 다름)
    RESIDENT_ID_KEY: 'E',    // ⚠️ E열! (다른 보험과 다름)
    NAME: 'D'                // 참고용 (매칭에 사용 안 함)
  },
  DATA_COLUMNS: {
    EMPLOYEE_INSURANCE: 'X',  // 24번째 컬럼 (인덱스 23)
    EMPLOYER_INSURANCE: 'Z'   // 26번째 컬럼 (인덱스 25)
  }
}
```

## ⚠️ 주의사항

1. **주민번호 컬럼이 E열임!** (가장 중요)
   - 국민연금, 건강보험, 산재보험은 D열
   - **고용보험만 E열** 사용
   - 스키마에서 `RESIDENT_ID: 'E'`로 명확히 구분

2. **월 형식**: 반드시 `YYYY-MM-DD` 형식이어야 함
   - UI에서 `YYYY-MM` 입력 → `convertToLastDayOfMonth()`로 변환 필수
   - 예: "2026-01" → "2026-01-31"

3. **주민번호 형식**: 하이픈 포함/제외 모두 처리
   - `extractResidentIdKey()`가 하이픈 제거 후 앞 6자리 추출
   - 예: "901225-1234567" → "901225"

4. **데이터 없는 경우**: 매칭 실패 시 0 반환
   - 해당 월/주민번호 조합이 시트에 없으면 둘 다 0

5. **중복 데이터**: 동일 매칭 키가 여러 개 있을 경우
   - 첫 번째로 발견된 값 사용

6. **두 개의 값 반환**: 직원과 사업주 부담금을 별도로 관리
   - 직원고용보험료: K열 (11번째 컬럼)
   - 사업주고용보험료: Z열 (26번째 컬럼)

## 📝 사용 예시

### monthlyPayrollUIHandler.js 내부
```javascript
// 1. 월 형식 변환
const monthLastDay = convertToLastDayOfMonth("2026-01");
// → "2026-01-31"

// 2. 보험 데이터 매칭
const insuranceData = matchInsuranceData(sheets, monthLastDay, residentId);
// → { employeeEmployment: 15000, employerEmployment: 25000, ... }

// 3. 결과 사용
// insuranceData.employeeEmployment = K열의 직원고용보험료 값
// insuranceData.employerEmployment = Z열의 사업주고용보험료 값
```

## 🧪 테스트 방법

1. **데이터 준비**: 고용보험 시트에 테스트 데이터 입력
   ```
   A열: 2026-01-31
   D열: 홍길동 (근로자명 - 참고용)
   E열: 901225-1234567 (주민번호 - 매칭에 사용!)
   X열: 15000
   Z열: 25000
   ```

2. **UI 테스트**: 월지급계산 UI 실행
   - 월: 2026-01 선택
   - 직원: 주민번호 901225-1234567인 직원 선택
   - "처리" 버튼 클릭

3. **결과 확인**: 월지급계산 시트
   - O열(고용보험료): 15000이 표시되는지 확인
   - (사업주 부담금은 별도 관리)

4. **로그 확인**:
   ```
   [executeMonthlyPayrollForPerson] 처리 시작: 2026-01 → 2026-01-31, 홍길동
   [matchInsuranceData] 고용보험 매칭 키: 2026-01-31|901225
   [matchInsuranceData] 고용보험료(직원): 15000, 고용보험료(사업주): 25000
   ```

## 🔄 컬럼 인덱스 매핑

**중요**: 컬럼 문자를 인덱스로 변환 시 주의
- E열 = 5번째 컬럼 = 인덱스 4 (주민번호!)
- X열 = 24번째 컬럼 = 인덱스 23 (직원고용보험료)
- Z열 = 26번째 컬럼 = 인덱스 25 (사업주고용보험료)

```javascript
// columnLetterToIndex 함수 사용
const residentIdIndex = columnLetterToIndex('E');        // 4
const employeeInsuranceIndex = columnLetterToIndex('X'); // 23
const employerInsuranceIndex = columnLetterToIndex('Z'); // 25
```

## 🚨 트러블슈팅

**문제**: 고용보험 매칭이 안 됨
- **원인**: 다른 보험과 달리 E열에 주민번호가 있음
- **해결**: 스키마에서 `RESIDENT_ID: 'E'` 설정 확인

**문제**: D열을 읽었는데 숫자가 아닌 이름이 나옴
- **원인**: D열은 근로자명, 주민번호는 E열
- **해결**: E열 사용

---

**작성일**: 2026-01-30
**버전**: v1.0
**관련 파일**:
- `src/payroll/monthlyPayrollUIHandler.js`
- `src/payroll/schemas/보험시트_schema.js`
