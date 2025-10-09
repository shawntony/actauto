# 테스트 가이드

Google Apps Script용 간단한 테스트 프레임워크 사용 가이드

## 개요

`testUtils.js`는 Google Apps Script 환경에서 사용할 수 있는 경량 테스트 프레임워크입니다. 전통적인 테스트 러너(Jest, Mocha 등)를 사용할 수 없는 Apps Script 환경에서 단위 테스트를 작성하고 실행할 수 있게 해줍니다.

## 테스트 작성 방법

### 1. 기본 테스트 구조

```javascript
function testMyFunction() {
  TestRunner.describe('테스트 스위트 이름', function() {
    TestRunner.it('개별 테스트 케이스', function() {
      TestRunner.assert.isTrue(someCondition);
    });
  });
}
```

### 2. Assertion 함수

| 함수 | 설명 | 예시 |
|------|------|------|
| `isTrue(condition)` | 값이 true인지 확인 | `assert.isTrue(x === 5)` |
| `isFalse(condition)` | 값이 false인지 확인 | `assert.isFalse(isEmpty(arr))` |
| `equal(actual, expected)` | 두 값이 같은지 확인 (===) | `assert.equal(result, 'success')` |
| `notEqual(actual, expected)` | 두 값이 다른지 확인 | `assert.notEqual(a, b)` |
| `deepEqual(actual, expected)` | 깊은 객체 비교 | `assert.deepEqual(obj1, obj2)` |
| `isNull(value)` | 값이 null인지 확인 | `assert.isNull(getValue())` |
| `isNotNull(value)` | 값이 null이 아닌지 확인 | `assert.isNotNull(result)` |
| `isUndefined(value)` | 값이 undefined인지 확인 | `assert.isUndefined(x)` |
| `isDefined(value)` | 값이 defined인지 확인 | `assert.isDefined(config)` |
| `includes(array, value)` | 배열에 값 포함 여부 | `assert.includes([1,2,3], 2)` |
| `lengthOf(array, length)` | 배열 길이 확인 | `assert.lengthOf(items, 5)` |
| `throws(func)` | 함수가 에러를 던지는지 확인 | `assert.throws(() => divide(1, 0))` |
| `doesNotThrow(func)` | 함수가 에러를 던지지 않는지 확인 | `assert.doesNotThrow(() => add(1, 2))` |
| `contains(str, substring)` | 문자열 포함 여부 | `assert.contains('hello world', 'world')` |
| `typeOf(value, type)` | 값의 타입 확인 | `assert.typeOf(x, 'number')` |
| `isArray(value)` | 값이 배열인지 확인 | `assert.isArray([1,2,3])` |
| `isObject(value)` | 값이 객체인지 확인 | `assert.isObject({key: 'value'})` |
| `inRange(value, min, max)` | 숫자 범위 확인 | `assert.inRange(age, 0, 150)` |

### 3. 테스트 건너뛰기

```javascript
TestRunner.skip('아직 구현 안됨', function() {
  // 이 테스트는 실행되지 않음
});
```

## 실제 예시

### ValidationUtils 테스트 예시

```javascript
function testValidationUtils() {
  TestRunner.describe('ValidationUtils 테스트', function() {
    // 이메일 검증 테스트
    TestRunner.it('유효한 이메일 검증', function() {
      TestRunner.assert.isTrue(
        ValidationUtils.isValidEmail('test@example.com')
      );
    });

    TestRunner.it('유효하지 않은 이메일 검증', function() {
      TestRunner.assert.isFalse(
        ValidationUtils.isValidEmail('invalid-email')
      );
    });

    // 복합 검증 테스트
    TestRunner.it('복합 필드 검증', function() {
      const data = {
        email: 'test@example.com',
        age: 25,
        name: '홍길동'
      };

      const rules = {
        email: { required: true, type: 'email' },
        age: { required: true, type: 'number', min: 0, max: 150 },
        name: { required: true, minLength: 2, maxLength: 50 }
      };

      const result = ValidationUtils.validate(data, rules);

      TestRunner.assert.isTrue(result.valid);
      TestRunner.assert.deepEqual(result.errors, {});
    });
  });
}
```

### BatchProgress 테스트 예시

```javascript
function testBatchProgress() {
  TestRunner.describe('BatchProgress 테스트', function() {
    const PROGRESS_KEY = 'TEST_BATCH';

    TestRunner.it('진행 상황 초기화', function() {
      BatchProgress.init(PROGRESS_KEY, 10);
      const progress = BatchProgress.get(PROGRESS_KEY);

      TestRunner.assert.equal(progress.totalSheets, 10);
      TestRunner.assert.equal(progress.sheetIndex, 0);
    });

    TestRunner.it('성공 카운트 증가', function() {
      BatchProgress.init(PROGRESS_KEY, 10);
      BatchProgress.increment(PROGRESS_KEY, 'success');

      const progress = BatchProgress.get(PROGRESS_KEY);
      TestRunner.assert.equal(progress.results.success, 1);
      TestRunner.assert.equal(progress.sheetIndex, 1);
    });

    TestRunner.it('완료 여부 확인', function() {
      BatchProgress.init(PROGRESS_KEY, 2);
      TestRunner.assert.isFalse(BatchProgress.isComplete(PROGRESS_KEY));

      BatchProgress.increment(PROGRESS_KEY, 'success');
      TestRunner.assert.isFalse(BatchProgress.isComplete(PROGRESS_KEY));

      BatchProgress.increment(PROGRESS_KEY, 'success');
      TestRunner.assert.isTrue(BatchProgress.isComplete(PROGRESS_KEY));
    });

    // 정리
    TestRunner.it('진행 상황 삭제', function() {
      BatchProgress.delete(PROGRESS_KEY);
      TestRunner.assert.doesNotThrow(function() {
        BatchProgress.delete(PROGRESS_KEY); // 이미 없어도 오류 없음
      });
    });
  });
}
```

### DelayUtils 테스트 예시

```javascript
function testDelayUtils() {
  TestRunner.describe('DelayUtils 테스트', function() {
    TestRunner.it('지연 함수 존재 확인', function() {
      TestRunner.assert.isDefined(DelayUtils.short);
      TestRunner.assert.isDefined(DelayUtils.standard);
      TestRunner.assert.isDefined(DelayUtils.long);
      TestRunner.assert.isDefined(DelayUtils.afterSheetCreation);
    });

    TestRunner.it('지연 함수 타입 확인', function() {
      TestRunner.assert.typeOf(DelayUtils.short, 'function');
      TestRunner.assert.typeOf(DelayUtils.standard, 'function');
      TestRunner.assert.typeOf(DelayUtils.long, 'function');
    });

    TestRunner.it('지연 함수 실행', function() {
      TestRunner.assert.doesNotThrow(function() {
        DelayUtils.short();
      });
    });
  });
}
```

## 테스트 실행 방법

### Apps Script 편집기에서 실행

1. Apps Script 편집기 열기
2. 테스트 파일 (예: `validationUtils.test.js`) 열기
3. 실행할 함수 선택 (예: `testValidationUtils`)
4. 실행 버튼 클릭
5. 로그 확인 (보기 → 로그 또는 Ctrl+Enter)

### 모든 테스트 한 번에 실행

```javascript
function runAllTests() {
  testValidationUtils();
  testBatchProgress();
  testDelayUtils();
  testUIUtils();
  testDriveUtils();
}
```

## 테스트 결과 리포트

테스트 실행 후 로그에 다음과 같은 리포트가 출력됩니다:

```
==============================================================
테스트 스위트: ValidationUtils 테스트
==============================================================
  ✅ isEmpty: null 값 테스트
  ✅ isEmpty: undefined 값 테스트
  ✅ isEmpty: 빈 문자열 테스트
  ✅ isValidEmail: 유효한 이메일
  ❌ isValidEmail: 잘못된 테스트
     오류: Expected true but got false

--------------------------------------------------------------
테스트 결과:
  총 테스트: 5개
  ✅ 통과: 4개
  ❌ 실패: 1개
  ⊘ 건너뜀: 0개
  통과율: 80%
--------------------------------------------------------------

실패한 테스트:
  ❌ isValidEmail: 잘못된 테스트
     Expected true but got false
```

## 모범 사례

### 1. 테스트 이름은 명확하게

```javascript
// ✅ 좋은 예
TestRunner.it('빈 문자열을 입력하면 true를 반환한다', function() {
  TestRunner.assert.isTrue(isEmpty(''));
});

// ❌ 나쁜 예
TestRunner.it('테스트1', function() {
  TestRunner.assert.isTrue(isEmpty(''));
});
```

### 2. 하나의 테스트 = 하나의 동작

```javascript
// ✅ 좋은 예
TestRunner.it('이메일 검증: 유효한 이메일', function() {
  TestRunner.assert.isTrue(isValidEmail('test@example.com'));
});

TestRunner.it('이메일 검증: 유효하지 않은 이메일', function() {
  TestRunner.assert.isFalse(isValidEmail('invalid'));
});

// ❌ 나쁜 예
TestRunner.it('이메일 검증', function() {
  TestRunner.assert.isTrue(isValidEmail('test@example.com'));
  TestRunner.assert.isFalse(isValidEmail('invalid'));
  TestRunner.assert.isFalse(isValidEmail(''));
});
```

### 3. 정리(Cleanup) 코드 작성

```javascript
TestRunner.describe('BatchProgress 테스트', function() {
  const PROGRESS_KEY = 'TEST_BATCH';

  // 테스트들...

  // 마지막에 정리
  TestRunner.it('정리: 진행 상황 삭제', function() {
    BatchProgress.delete(PROGRESS_KEY);
  });
});
```

### 4. 경계값 테스트

```javascript
TestRunner.it('isInRange: 경계값 테스트', function() {
  TestRunner.assert.isTrue(isInRange(0, 0, 10));   // 최소값
  TestRunner.assert.isTrue(isInRange(10, 0, 10));  // 최대값
  TestRunner.assert.isFalse(isInRange(-1, 0, 10)); // 범위 밖
  TestRunner.assert.isFalse(isInRange(11, 0, 10)); // 범위 밖
});
```

## 통합 테스트 작성

실제 사용 시나리오를 테스트:

```javascript
function testUserRegistrationWorkflow() {
  TestRunner.describe('사용자 등록 워크플로우', function() {
    TestRunner.it('전체 등록 프로세스', function() {
      // 1. 입력 데이터
      const userData = {
        name: '홍길동',
        email: 'hong@example.com',
        phone: '010-1234-5678'
      };

      // 2. 검증
      const rules = {
        name: { required: true, minLength: 2 },
        email: { required: true, type: 'email' },
        phone: { required: true, type: 'phone' }
      };

      const validationResult = ValidationUtils.validate(userData, rules);
      TestRunner.assert.isTrue(validationResult.valid);

      // 3. 처리 (실제 등록 로직)
      // const registrationResult = registerUser(userData);
      // TestRunner.assert.isTrue(registrationResult.success);
    });
  });
}
```

## 제한사항

1. **비동기 테스트 미지원**: Google Apps Script는 비동기 작업이 제한적이므로 비동기 테스트는 지원하지 않습니다.
2. **모킹 미지원**: 복잡한 모킹 라이브러리가 없으므로 간단한 스텁만 가능합니다.
3. **실행 시간 제한**: Apps Script는 6분 실행 제한이 있으므로 테스트 개수를 적절히 조절해야 합니다.

## 참고 자료

- `testUtils.js`: 테스트 프레임워크 구현
- `validationUtils.test.js`: ValidationUtils 테스트 예시
- 추가 테스트 예시는 `*.test.js` 파일들 참조
