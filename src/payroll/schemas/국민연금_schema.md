# 국민연금 시트 스키마

## 📋 시트 정보
- **시트명**: 국민연금
- **매칭 키**: A열(월, YYYY-MM-DD) + D열(주민번호 앞 6자리)

## 📊 컬럼 구조

| 열 | 인덱스 | 컬럼명 | 타입 | 설명 |
|----|--------|--------|------|------|
| A | 0 | 월 | string | YYYY-MM-DD 형식 (말일) |
| B | 1 | 항목명/구분 | string | 참고용 |
| D | 3 | 주민번호 | string | 매칭 키 (앞 6자리 사용) |
| I | 8 | 국민연금액 | number | 국민연금 보험료 |

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
4. 국민연금 시트에서 일치하는 행 찾기
5. 해당 행의 I열(국민연금액) 값 반환

## 📐 데이터 흐름

```
급여데이터 (C열: 주민번호)
    ↓
extractResidentIdKey() → 앞 6자리
    ↓
"YYYY-MM-DD|YYMMDD" 복합 키 생성
    ↓
국민연금 시트에서 매칭
    ↓
I열(국민연금액) 값 반환
```

## 🔧 스키마 정의 (보험시트_schema.js)

```javascript
국민연금: {
  SHEET_NAME: '국민연금',
  MATCHING_COLUMNS: {
    MONTH: 'A',
    RESIDENT_ID: 'D',
    RESIDENT_ID_KEY: 'D'
  },
  DATA_COLUMNS: {
    PENSION_AMOUNT: 'I'
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

## 📝 사용 예시

### monthlyPayrollUIHandler.js 내부
```javascript
// 1. 월 형식 변환
const monthLastDay = convertToLastDayOfMonth("2026-01");
// → "2026-01-31"

// 2. 보험 데이터 매칭
const insuranceData = matchInsuranceData(sheets, monthLastDay, residentId);
// → { nationalPension: 123000, ... }

// 3. 결과 사용
// insuranceData.nationalPension = I열의 국민연금액 값
```

## 🧪 테스트 방법

1. **데이터 준비**: 국민연금 시트에 테스트 데이터 입력
   ```
   A열: 2026-01-31
   D열: 901225-1234567
   I열: 123000
   ```

2. **UI 테스트**: 월지급계산 UI 실행
   - 월: 2026-01 선택
   - 직원: 주민번호 901225-1234567인 직원 선택
   - "처리" 버튼 클릭

3. **결과 확인**: 월지급계산 시트
   - M열(국민연금): 123000이 표시되는지 확인

4. **로그 확인**:
   ```
   [executeMonthlyPayrollForPerson] 처리 시작: 2026-01 → 2026-01-31, 홍길동
   [matchInsuranceData] 국민연금 매칭 키: 2026-01-31|901225
   [matchInsuranceData] 국민연금: 123000
   ```

---

**작성일**: 2026-01-30
**버전**: v1.0
**관련 파일**:
- `src/payroll/monthlyPayrollUIHandler.js`
- `src/payroll/schemas/보험시트_schema.js`
