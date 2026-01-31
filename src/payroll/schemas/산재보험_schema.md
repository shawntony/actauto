# 산재보험 시트 스키마

## 📋 시트 정보
- **시트명**: 산재보험
- **매칭 키**: A열(월, YYYY-MM-DD) + D열(주민번호 앞 6자리)

## 📊 컬럼 구조

| 열 | 인덱스 | 컬럼명 | 타입 | 설명 |
|----|--------|--------|------|------|
| A | 0 | 월 | string | YYYY-MM-DD 형식 (말일) |
| B | 1 | 항목명/구분 | string | 참고용 |
| D | 3 | 주민번호 | string | 매칭 키 (앞 6자리 사용) |
| O | 14 | 산재보험료 | number | 산재보험료 금액 |

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
4. 산재보험 시트에서 일치하는 행 찾기
5. 해당 행의 O열(산재보험료) 값 반환

## 📐 데이터 흐름

```
급여데이터 (C열: 주민번호)
    ↓
extractResidentIdKey() → 앞 6자리
    ↓
"YYYY-MM-DD|YYMMDD" 복합 키 생성
    ↓
산재보험 시트에서 매칭
    ↓
O열(산재보험료) 값 반환
```

## 🔧 스키마 정의 (보험시트_schema.js)

```javascript
산재보험: {
  SHEET_NAME: '산재보험',
  MATCHING_COLUMNS: {
    MONTH: 'A',
    RESIDENT_ID: 'D',
    RESIDENT_ID_KEY: 'D',
    NAME: 'D'                // 참고용
  },
  DATA_COLUMNS: {
    INDUSTRIAL_ACCIDENT: 'O'  // 15번째 컬럼 (인덱스 14)
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
   - 해당 월/주민번호 조합이 시트에 없으면 0

4. **중복 데이터**: 동일 매칭 키가 여러 개 있을 경우
   - 첫 번째로 발견된 값 사용

5. **산재보험료는 사업주 전액 부담**
   - 직원 부담금 없음
   - O열에 사업주가 납부하는 산재보험료만 존재

## 📝 사용 예시

### monthlyPayrollUIHandler.js 내부
```javascript
// 1. 월 형식 변환
const monthLastDay = convertToLastDayOfMonth("2026-01");
// → "2026-01-31"

// 2. 보험 데이터 매칭
const insuranceData = matchInsuranceData(sheets, monthLastDay, residentId);
// → { industrialAccident: 8000, ... }

// 3. 결과 사용
// insuranceData.industrialAccident = O열의 산재보험료 값
```

## 🧪 테스트 방법

1. **데이터 준비**: 산재보험 시트에 테스트 데이터 입력
   ```
   A열: 2026-01-31
   D열: 901225-1234567
   O열: 8000
   ```

2. **UI 테스트**: 월지급계산 UI 실행
   - 월: 2026-01 선택
   - 직원: 주민번호 901225-1234567인 직원 선택
   - "처리" 버튼 클릭

3. **결과 확인**: 월지급계산 시트
   - (산재보험료는 월지급계산에 표시 안 될 수 있음 - 사업주 부담)
   - 월지급DB 또는 로그에서 확인

4. **로그 확인**:
   ```
   [executeMonthlyPayrollForPerson] 처리 시작: 2026-01 → 2026-01-31, 홍길동
   [matchInsuranceData] 산재보험 매칭 키: 2026-01-31|901225
   [matchInsuranceData] 산재보험료: 8000
   ```

## 🔄 컬럼 인덱스 매핑

**중요**: 컬럼 문자를 인덱스로 변환 시 주의
- O열 = 15번째 컬럼 = 인덱스 14

```javascript
// columnLetterToIndex 함수 사용
const industrialAccidentIndex = columnLetterToIndex('O');  // 14
```

## 📊 건강보험과의 차이점

**건강보험 시트**:
- O열: 건강보험료
- AB열: 장기요양보험료

**산재보험 시트**:
- O열: 산재보험료
- AB열: (없음)

⚠️ **주의**: 동일한 O열이지만 시트가 다르므로 의미가 다름!
- 건강보험 시트의 O열 = 건강보험료
- 산재보험 시트의 O열 = 산재보험료

## 💼 산재보험의 특징

1. **사업주 전액 부담**
   - 직원 급여에서 공제되지 않음
   - 회사가 전액 납부

2. **업종별 요율 차이**
   - 업종의 위험도에 따라 보험료율이 다름
   - 시트의 O열에 이미 계산된 금액이 저장됨

3. **월지급계산 시트 반영 여부**
   - 직원 급여명세서에는 표시 안 될 수 있음
   - 회사 비용 관리용으로 주로 사용

---

**작성일**: 2026-01-30
**버전**: v1.0
**관련 파일**:
- `src/payroll/monthlyPayrollUIHandler.js`
- `src/payroll/schemas/보험시트_schema.js`
