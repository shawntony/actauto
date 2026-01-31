# 건강보험 시트 스키마

## 📋 시트 정보
- **시트명**: 건강보험
- **매칭 키**: A열(월, YYYY-MM-DD) + D열(주민번호 앞 6자리)

## 📊 컬럼 구조

| 열 | 인덱스 | 컬럼명 | 타입 | 설명 |
|----|--------|--------|------|------|
| A | 0 | 월 | string | YYYY-MM-DD 형식 (말일) |
| B | 1 | 항목명/구분 | string | 참고용 |
| D | 3 | 주민번호 | string | 매칭 키 (앞 6자리 사용) |
| O | 14 | 건강보험료 | number | 건강보험료 금액 |
| AB | 27 | 장기요양보험료 | number | 장기요양보험료 금액 |

## 📐 추가 정보
- M, O, Z, AB 컬럼들의 합산 값이 AG, AH, AI 열에 저장됨
- 건강보험료(O)와 장기요양보험료(AB)는 별도로 추출하여 사용

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
4. 건강보험 시트에서 일치하는 행 찾기
5. 해당 행의 O열(건강보험료), AB열(장기요양보험료) 값 반환

## 📐 데이터 흐름

```
급여데이터 (C열: 주민번호)
    ↓
extractResidentIdKey() → 앞 6자리
    ↓
"YYYY-MM-DD|YYMMDD" 복합 키 생성
    ↓
건강보험 시트에서 매칭
    ↓
O열(건강보험료), AB열(장기요양보험료) 값 반환
```

## 🔧 스키마 정의 (보험시트_schema.js)

```javascript
건강보험: {
  SHEET_NAME: '건강보험',
  MATCHING_COLUMNS: {
    MONTH: 'A',
    RESIDENT_ID: 'D',
    RESIDENT_ID_KEY: 'D'
  },
  DATA_COLUMNS: {
    HEALTH_INSURANCE: 'O',    // 15번째 컬럼 (인덱스 14)
    LONG_TERM_CARE: 'AB'      // 28번째 컬럼 (인덱스 27)
  }
}
```

## ⚠️ 주의사항

1. **월 형식**: 반드시 `YYYY-MM-DD` 형식이어야 함
   - UI에서 `YYYY-MM` 입력 → `convertToLastDayOfMonth()`로 변환 필수
   - 예: "2026-01" → "2026-01-31"

2. **주민번호 형식**: 하이픈 포함/제외 모두 처리
   - `extractResidentIdKey()`가 하이픈 제거 후 앞 6자리 추출
   - 예: "901225-1234567" → "901225"

3. **데이터 없는 경우**: 매칭 실패 시 0 반환
   - 해당 월/주민번호 조합이 시트에 없으면 둘 다 0

4. **중복 데이터**: 동일 매칭 키가 여러 개 있을 경우
   - 첫 번째로 발견된 값 사용

5. **두 개의 값 반환**: 건강보험료와 장기요양보험료를 별도로 관리
   - 건강보험료: O열 (15번째 컬럼)
   - 장기요양보험료: AB열 (28번째 컬럼)

## 📝 사용 예시

### monthlyPayrollUIHandler.js 내부
```javascript
// 1. 월 형식 변환
const monthLastDay = convertToLastDayOfMonth("2026-01");
// → "2026-01-31"

// 2. 보험 데이터 매칭
const insuranceData = matchInsuranceData(sheets, monthLastDay, residentId);
// → { healthInsurance: 45000, longTermCare: 5000, ... }

// 3. 결과 사용
// insuranceData.healthInsurance = O열의 건강보험료 값
// insuranceData.longTermCare = AB열의 장기요양보험료 값
```

## 🧪 테스트 방법

1. **데이터 준비**: 건강보험 시트에 테스트 데이터 입력
   ```
   A열: 2026-01-31
   D열: 901225-1234567
   O열: 45000
   AB열: 5000
   ```

2. **UI 테스트**: 월지급계산 UI 실행
   - 월: 2026-01 선택
   - 직원: 주민번호 901225-1234567인 직원 선택
   - "처리" 버튼 클릭

3. **결과 확인**: 월지급계산 시트
   - N열(건강보험료): 45000이 표시되는지 확인
   - P열(장기요양보험료): 5000이 표시되는지 확인

4. **로그 확인**:
   ```
   [executeMonthlyPayrollForPerson] 처리 시작: 2026-01 → 2026-01-31, 홍길동
   [matchInsuranceData] 건강보험 매칭 키: 2026-01-31|901225
   [matchInsuranceData] 건강보험료: 45000, 장기요양: 5000
   ```

## 🔄 컬럼 인덱스 매핑

**중요**: 컬럼 문자를 인덱스로 변환 시 주의
- O열 = 15번째 컬럼 = 인덱스 14
- AB열 = 28번째 컬럼 = 인덱스 27

```javascript
// columnLetterToIndex 함수 사용
const healthInsuranceIndex = columnLetterToIndex('O');  // 14
const longTermCareIndex = columnLetterToIndex('AB');    // 27
```

---

**작성일**: 2026-01-30
**버전**: v1.0
**관련 파일**:
- `src/payroll/monthlyPayrollUIHandler.js`
- `src/payroll/schemas/보험시트_schema.js`
