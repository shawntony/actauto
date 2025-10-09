/**
 * ValidationUtils 테스트
 *
 * ValidationUtils 모듈의 테스트 케이스
 *
 * 실행 방법:
 * Apps Script 편집기에서 testValidationUtils() 함수 실행
 */

/**
 * ValidationUtils 테스트 실행
 */
function testValidationUtils() {
  TestRunner.describe('ValidationUtils 테스트', function() {
    // isEmpty 테스트
    TestRunner.it('isEmpty: null 값 테스트', function() {
      TestRunner.assert.isTrue(ValidationUtils.isEmpty(null));
    });

    TestRunner.it('isEmpty: undefined 값 테스트', function() {
      TestRunner.assert.isTrue(ValidationUtils.isEmpty(undefined));
    });

    TestRunner.it('isEmpty: 빈 문자열 테스트', function() {
      TestRunner.assert.isTrue(ValidationUtils.isEmpty(''));
      TestRunner.assert.isTrue(ValidationUtils.isEmpty('   ')); // 공백만
    });

    TestRunner.it('isEmpty: 빈 배열 테스트', function() {
      TestRunner.assert.isTrue(ValidationUtils.isEmpty([]));
    });

    TestRunner.it('isEmpty: 빈 객체 테스트', function() {
      TestRunner.assert.isTrue(ValidationUtils.isEmpty({}));
    });

    TestRunner.it('isEmpty: 값이 있는 경우 테스트', function() {
      TestRunner.assert.isFalse(ValidationUtils.isEmpty('test'));
      TestRunner.assert.isFalse(ValidationUtils.isEmpty([1, 2, 3]));
      TestRunner.assert.isFalse(ValidationUtils.isEmpty({ key: 'value' }));
    });

    // isValidEmail 테스트
    TestRunner.it('isValidEmail: 유효한 이메일', function() {
      TestRunner.assert.isTrue(ValidationUtils.isValidEmail('test@example.com'));
      TestRunner.assert.isTrue(ValidationUtils.isValidEmail('user.name+tag@example.co.kr'));
    });

    TestRunner.it('isValidEmail: 유효하지 않은 이메일', function() {
      TestRunner.assert.isFalse(ValidationUtils.isValidEmail('invalid'));
      TestRunner.assert.isFalse(ValidationUtils.isValidEmail('@example.com'));
      TestRunner.assert.isFalse(ValidationUtils.isValidEmail('test@'));
      TestRunner.assert.isFalse(ValidationUtils.isValidEmail(''));
    });

    // isValidPhone 테스트
    TestRunner.it('isValidPhone: 유효한 전화번호', function() {
      TestRunner.assert.isTrue(ValidationUtils.isValidPhone('010-1234-5678'));
      TestRunner.assert.isTrue(ValidationUtils.isValidPhone('02-123-4567'));
      TestRunner.assert.isTrue(ValidationUtils.isValidPhone('01012345678')); // 하이픈 없이
    });

    TestRunner.it('isValidPhone: 유효하지 않은 전화번호', function() {
      TestRunner.assert.isFalse(ValidationUtils.isValidPhone('123-456'));
      TestRunner.assert.isFalse(ValidationUtils.isValidPhone('abc-defg-hijk'));
      TestRunner.assert.isFalse(ValidationUtils.isValidPhone(''));
    });

    // isValidBusinessNumber 테스트
    TestRunner.it('isValidBusinessNumber: 유효한 사업자등록번호', function() {
      TestRunner.assert.isTrue(ValidationUtils.isValidBusinessNumber('123-45-67890'));
      TestRunner.assert.isTrue(ValidationUtils.isValidBusinessNumber('1234567890')); // 하이픈 없이
    });

    TestRunner.it('isValidBusinessNumber: 유효하지 않은 사업자등록번호', function() {
      TestRunner.assert.isFalse(ValidationUtils.isValidBusinessNumber('123-45-6789')); // 9자리
      TestRunner.assert.isFalse(ValidationUtils.isValidBusinessNumber('123-45-67891')); // 잘못된 체크섬
      TestRunner.assert.isFalse(ValidationUtils.isValidBusinessNumber(''));
    });

    // isValidDate 테스트
    TestRunner.it('isValidDate: 유효한 날짜', function() {
      TestRunner.assert.isTrue(ValidationUtils.isValidDate('2024-01-15'));
      TestRunner.assert.isTrue(ValidationUtils.isValidDate('2024-12-31'));
    });

    TestRunner.it('isValidDate: 유효하지 않은 날짜', function() {
      TestRunner.assert.isFalse(ValidationUtils.isValidDate('2024/01/15')); // 잘못된 형식
      TestRunner.assert.isFalse(ValidationUtils.isValidDate('2024-13-01')); // 잘못된 월
      TestRunner.assert.isFalse(ValidationUtils.isValidDate('2024-02-30')); // 존재하지 않는 날짜
      TestRunner.assert.isFalse(ValidationUtils.isValidDate(''));
    });

    // isInRange 테스트
    TestRunner.it('isInRange: 범위 내 값', function() {
      TestRunner.assert.isTrue(ValidationUtils.isInRange(5, 0, 10));
      TestRunner.assert.isTrue(ValidationUtils.isInRange(0, 0, 10)); // 경계값
      TestRunner.assert.isTrue(ValidationUtils.isInRange(10, 0, 10)); // 경계값
    });

    TestRunner.it('isInRange: 범위 외 값', function() {
      TestRunner.assert.isFalse(ValidationUtils.isInRange(-1, 0, 10));
      TestRunner.assert.isFalse(ValidationUtils.isInRange(11, 0, 10));
      TestRunner.assert.isFalse(ValidationUtils.isInRange('abc', 0, 10)); // 숫자가 아님
    });

    // isLengthValid 테스트
    TestRunner.it('isLengthValid: 유효한 길이', function() {
      TestRunner.assert.isTrue(ValidationUtils.isLengthValid('password', 8, 20));
      TestRunner.assert.isTrue(ValidationUtils.isLengthValid('12345678', 8, 20)); // 최소 길이
      TestRunner.assert.isTrue(ValidationUtils.isLengthValid('12345', 5)); // 최대 길이 없음
    });

    TestRunner.it('isLengthValid: 유효하지 않은 길이', function() {
      TestRunner.assert.isFalse(ValidationUtils.isLengthValid('short', 8, 20)); // 너무 짧음
      TestRunner.assert.isFalse(ValidationUtils.isLengthValid('a'.repeat(25), 8, 20)); // 너무 김
    });

    // isValidAmount 테스트
    TestRunner.it('isValidAmount: 유효한 금액', function() {
      TestRunner.assert.isTrue(ValidationUtils.isValidAmount(1000));
      TestRunner.assert.isTrue(ValidationUtils.isValidAmount('1,000'));
      TestRunner.assert.isTrue(ValidationUtils.isValidAmount(0)); // 0도 유효
    });

    TestRunner.it('isValidAmount: 유효하지 않은 금액', function() {
      TestRunner.assert.isFalse(ValidationUtils.isValidAmount(-100)); // 음수
      TestRunner.assert.isFalse(ValidationUtils.isValidAmount('abc'));
    });

    // isValidUrl 테스트
    TestRunner.it('isValidUrl: 유효한 URL', function() {
      TestRunner.assert.isTrue(ValidationUtils.isValidUrl('https://www.example.com'));
      TestRunner.assert.isTrue(ValidationUtils.isValidUrl('http://example.com/path'));
    });

    TestRunner.it('isValidUrl: 유효하지 않은 URL', function() {
      TestRunner.assert.isFalse(ValidationUtils.isValidUrl('not-a-url'));
      TestRunner.assert.isFalse(ValidationUtils.isValidUrl(''));
    });

    // requireFields 테스트
    TestRunner.it('requireFields: 모든 필수 필드 존재', function() {
      const data = { name: '홍길동', email: 'test@example.com', phone: '010-1234-5678' };
      const result = ValidationUtils.requireFields(data, ['name', 'email', 'phone']);
      TestRunner.assert.isTrue(result.valid);
      TestRunner.assert.lengthOf(result.missing, 0);
    });

    TestRunner.it('requireFields: 일부 필수 필드 누락', function() {
      const data = { name: '홍길동', email: '' };
      const result = ValidationUtils.requireFields(data, ['name', 'email', 'phone']);
      TestRunner.assert.isFalse(result.valid);
      TestRunner.assert.lengthOf(result.missing, 2); // email, phone
      TestRunner.assert.includes(result.missing, 'email');
      TestRunner.assert.includes(result.missing, 'phone');
    });

    // validate 복합 검증 테스트
    TestRunner.it('validate: 모든 규칙 통과', function() {
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

    TestRunner.it('validate: 일부 규칙 실패', function() {
      const data = {
        email: 'invalid-email',
        age: 200,
        name: 'A'
      };
      const rules = {
        email: { required: true, type: 'email' },
        age: { required: true, type: 'number', min: 0, max: 150 },
        name: { required: true, minLength: 2, maxLength: 50 }
      };
      const result = ValidationUtils.validate(data, rules);
      TestRunner.assert.isFalse(result.valid);
      TestRunner.assert.isDefined(result.errors.email);
      TestRunner.assert.isDefined(result.errors.age);
      TestRunner.assert.isDefined(result.errors.name);
    });

    // isValidSpreadsheetId 테스트
    TestRunner.it('isValidSpreadsheetId: 유효한 스프레드시트 ID', function() {
      const validId = '1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8'; // 44자
      TestRunner.assert.isTrue(ValidationUtils.isValidSpreadsheetId(validId));
    });

    TestRunner.it('isValidSpreadsheetId: 유효하지 않은 스프레드시트 ID', function() {
      TestRunner.assert.isFalse(ValidationUtils.isValidSpreadsheetId('too-short'));
      TestRunner.assert.isFalse(ValidationUtils.isValidSpreadsheetId(''));
    });
  });
}

/**
 * 통합 검증 시나리오 테스트
 */
function testValidationUtilsIntegration() {
  TestRunner.describe('ValidationUtils 통합 테스트', function() {
    TestRunner.it('사용자 등록 폼 검증 시나리오', function() {
      // 실제 사용 시나리오
      const userData = {
        name: '홍길동',
        email: 'hong@example.com',
        phone: '010-1234-5678',
        birthdate: '1990-01-15',
        website: 'https://example.com'
      };

      const rules = {
        name: { required: true, minLength: 2, maxLength: 50 },
        email: { required: true, type: 'email' },
        phone: { required: true, type: 'phone' },
        birthdate: { required: true, type: 'date' },
        website: { required: false, type: 'url' }
      };

      const result = ValidationUtils.validate(userData, rules);

      TestRunner.assert.isTrue(result.valid, '모든 검증 통과해야 함');
      TestRunner.assert.deepEqual(result.errors, {}, '오류가 없어야 함');
    });

    TestRunner.it('복합 오류 시나리오', function() {
      const invalidData = {
        name: 'A', // 너무 짧음
        email: 'not-an-email',
        phone: '123',
        birthdate: '2024-13-01', // 잘못된 날짜
        website: 'not-a-url'
      };

      const rules = {
        name: { required: true, minLength: 2 },
        email: { required: true, type: 'email' },
        phone: { required: true, type: 'phone' },
        birthdate: { required: true, type: 'date' },
        website: { required: true, type: 'url' }
      };

      const result = ValidationUtils.validate(invalidData, rules);

      TestRunner.assert.isFalse(result.valid, '검증 실패해야 함');
      TestRunner.assert.equal(Object.keys(result.errors).length, 5, '5개 필드 모두 오류');

      // 오류 메시지 포맷팅 테스트
      const errorMessage = ValidationUtils.formatErrors(result.errors);
      TestRunner.assert.contains(errorMessage, '다음 항목을 확인해주세요');
    });
  });
}
