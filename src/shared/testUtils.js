/**
 * 테스트 유틸리티
 *
 * Google Apps Script용 간단한 테스트 프레임워크
 * - 단위 테스트 실행
 * - Assertion 함수
 * - 테스트 리포트 생성
 *
 * @module TestUtils
 */

const TestRunner = {
  /** 테스트 결과 저장 */
  results: {
    passed: [],
    failed: [],
    skipped: []
  },

  /**
   * 테스트 스위트 실행
   * @param {string} suiteName - 테스트 스위트 이름
   * @param {Function} suiteFunc - 테스트 함수들을 포함한 함수
   * @example
   * TestRunner.describe('ValidationUtils 테스트', function() {
   *   TestRunner.it('이메일 검증', function() {
   *     TestRunner.assert.isTrue(ValidationUtils.isValidEmail('test@example.com'));
   *   });
   * });
   */
  describe(suiteName, suiteFunc) {
    Logger.log(`\n${'='.repeat(60)}`);
    Logger.log(`테스트 스위트: ${suiteName}`);
    Logger.log('='.repeat(60));

    this.currentSuite = suiteName;
    this.results = { passed: [], failed: [], skipped: [] };

    try {
      suiteFunc();
    } catch (error) {
      Logger.log(`❌ 스위트 실행 오류: ${error.message}`);
    }

    this.printReport();
  },

  /**
   * 개별 테스트 케이스 실행
   * @param {string} testName - 테스트 이름
   * @param {Function} testFunc - 테스트 함수
   * @example
   * TestRunner.it('빈 값 검사', function() {
   *   TestRunner.assert.isTrue(ValidationUtils.isEmpty(''));
   * });
   */
  it(testName, testFunc) {
    try {
      testFunc();
      this.results.passed.push(testName);
      Logger.log(`  ✅ ${testName}`);
    } catch (error) {
      this.results.failed.push({ name: testName, error: error.message });
      Logger.log(`  ❌ ${testName}`);
      Logger.log(`     오류: ${error.message}`);
    }
  },

  /**
   * 테스트 건너뛰기
   * @param {string} testName - 테스트 이름
   * @param {Function} testFunc - 테스트 함수 (실행되지 않음)
   * @example
   * TestRunner.skip('구현 예정 기능', function() {
   *   // 아직 구현되지 않음
   * });
   */
  skip(testName, testFunc) {
    this.results.skipped.push(testName);
    Logger.log(`  ⊘ ${testName} (건너뜀)`);
  },

  /**
   * 테스트 결과 리포트 출력
   */
  printReport() {
    const total = this.results.passed.length + this.results.failed.length + this.results.skipped.length;
    const passRate = total > 0 ? Math.round((this.results.passed.length / total) * 100) : 0;

    Logger.log('\n' + '-'.repeat(60));
    Logger.log('테스트 결과:');
    Logger.log(`  총 테스트: ${total}개`);
    Logger.log(`  ✅ 통과: ${this.results.passed.length}개`);
    Logger.log(`  ❌ 실패: ${this.results.failed.length}개`);
    Logger.log(`  ⊘ 건너뜀: ${this.results.skipped.length}개`);
    Logger.log(`  통과율: ${passRate}%`);
    Logger.log('-'.repeat(60));

    if (this.results.failed.length > 0) {
      Logger.log('\n실패한 테스트:');
      this.results.failed.forEach(fail => {
        Logger.log(`  ❌ ${fail.name}`);
        Logger.log(`     ${fail.error}`);
      });
    }
  },

  /**
   * Assertion 함수들
   */
  assert: {
    /**
     * 값이 true인지 확인
     * @param {boolean} condition - 확인할 조건
     * @param {string} [message] - 오류 메시지
     */
    isTrue(condition, message) {
      if (condition !== true) {
        throw new Error(message || `Expected true but got ${condition}`);
      }
    },

    /**
     * 값이 false인지 확인
     * @param {boolean} condition - 확인할 조건
     * @param {string} [message] - 오류 메시지
     */
    isFalse(condition, message) {
      if (condition !== false) {
        throw new Error(message || `Expected false but got ${condition}`);
      }
    },

    /**
     * 두 값이 같은지 확인
     * @param {*} actual - 실제 값
     * @param {*} expected - 기대 값
     * @param {string} [message] - 오류 메시지
     */
    equal(actual, expected, message) {
      if (actual !== expected) {
        throw new Error(message || `Expected ${expected} but got ${actual}`);
      }
    },

    /**
     * 두 값이 다른지 확인
     * @param {*} actual - 실제 값
     * @param {*} expected - 기대하지 않는 값
     * @param {string} [message] - 오류 메시지
     */
    notEqual(actual, expected, message) {
      if (actual === expected) {
        throw new Error(message || `Expected not ${expected} but got ${actual}`);
      }
    },

    /**
     * 깊은 객체 비교 (JSON 직렬화 기반)
     * @param {*} actual - 실제 값
     * @param {*} expected - 기대 값
     * @param {string} [message] - 오류 메시지
     */
    deepEqual(actual, expected, message) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(message || `Expected ${expectedStr} but got ${actualStr}`);
      }
    },

    /**
     * 값이 null인지 확인
     * @param {*} value - 확인할 값
     * @param {string} [message] - 오류 메시지
     */
    isNull(value, message) {
      if (value !== null) {
        throw new Error(message || `Expected null but got ${value}`);
      }
    },

    /**
     * 값이 null이 아닌지 확인
     * @param {*} value - 확인할 값
     * @param {string} [message] - 오류 메시지
     */
    isNotNull(value, message) {
      if (value === null) {
        throw new Error(message || `Expected not null but got null`);
      }
    },

    /**
     * 값이 undefined인지 확인
     * @param {*} value - 확인할 값
     * @param {string} [message] - 오류 메시지
     */
    isUndefined(value, message) {
      if (value !== undefined) {
        throw new Error(message || `Expected undefined but got ${value}`);
      }
    },

    /**
     * 값이 undefined가 아닌지 확인
     * @param {*} value - 확인할 값
     * @param {string} [message] - 오류 메시지
     */
    isDefined(value, message) {
      if (value === undefined) {
        throw new Error(message || `Expected defined value but got undefined`);
      }
    },

    /**
     * 배열에 값이 포함되어 있는지 확인
     * @param {Array} array - 배열
     * @param {*} value - 찾을 값
     * @param {string} [message] - 오류 메시지
     */
    includes(array, value, message) {
      if (!Array.isArray(array) || array.indexOf(value) === -1) {
        throw new Error(message || `Expected array to include ${value}`);
      }
    },

    /**
     * 배열의 길이 확인
     * @param {Array} array - 배열
     * @param {number} length - 기대 길이
     * @param {string} [message] - 오류 메시지
     */
    lengthOf(array, length, message) {
      if (!Array.isArray(array) || array.length !== length) {
        throw new Error(message || `Expected length ${length} but got ${array ? array.length : 'not an array'}`);
      }
    },

    /**
     * 함수가 에러를 던지는지 확인
     * @param {Function} func - 실행할 함수
     * @param {string} [message] - 오류 메시지
     */
    throws(func, message) {
      let threw = false;
      try {
        func();
      } catch (e) {
        threw = true;
      }
      if (!threw) {
        throw new Error(message || `Expected function to throw an error`);
      }
    },

    /**
     * 함수가 에러를 던지지 않는지 확인
     * @param {Function} func - 실행할 함수
     * @param {string} [message] - 오류 메시지
     */
    doesNotThrow(func, message) {
      try {
        func();
      } catch (e) {
        throw new Error(message || `Expected function not to throw but got: ${e.message}`);
      }
    },

    /**
     * 문자열이 특정 문자열을 포함하는지 확인
     * @param {string} str - 문자열
     * @param {string} substring - 포함되어야 할 부분 문자열
     * @param {string} [message] - 오류 메시지
     */
    contains(str, substring, message) {
      if (typeof str !== 'string' || str.indexOf(substring) === -1) {
        throw new Error(message || `Expected string to contain "${substring}"`);
      }
    },

    /**
     * 값의 타입 확인
     * @param {*} value - 확인할 값
     * @param {string} type - 기대 타입 ('string', 'number', 'boolean', 'object', 'function')
     * @param {string} [message] - 오류 메시지
     */
    typeOf(value, type, message) {
      const actualType = typeof value;
      if (actualType !== type) {
        throw new Error(message || `Expected type ${type} but got ${actualType}`);
      }
    },

    /**
     * 값이 배열인지 확인
     * @param {*} value - 확인할 값
     * @param {string} [message] - 오류 메시지
     */
    isArray(value, message) {
      if (!Array.isArray(value)) {
        throw new Error(message || `Expected array but got ${typeof value}`);
      }
    },

    /**
     * 값이 객체인지 확인 (null 제외)
     * @param {*} value - 확인할 값
     * @param {string} [message] - 오류 메시지
     */
    isObject(value, message) {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(message || `Expected object but got ${typeof value}`);
      }
    },

    /**
     * 숫자 범위 확인
     * @param {number} value - 확인할 값
     * @param {number} min - 최소값
     * @param {number} max - 최대값
     * @param {string} [message] - 오류 메시지
     */
    inRange(value, min, max, message) {
      if (typeof value !== 'number' || value < min || value > max) {
        throw new Error(message || `Expected ${value} to be between ${min} and ${max}`);
      }
    }
  }
};

/**
 * 테스트 실행 헬퍼 - 모든 테스트 한 번에 실행
 * @example
 * function runAllTests() {
 *   TestRunner.describe('전체 테스트', function() {
 *     runValidationUtilsTests();
 *     runBatchProgressTests();
 *     runDelayUtilsTests();
 *   });
 * }
 */
function runAllTests() {
  Logger.log('🚀 전체 테스트 시작\n');

  const testSuites = [
    // 여기에 테스트 함수들 추가
    // 예: testValidationUtils,
    // 예: testBatchProgress,
  ];

  testSuites.forEach(suite => {
    try {
      suite();
    } catch (error) {
      Logger.log(`❌ 테스트 스위트 실행 실패: ${error.message}`);
    }
  });

  Logger.log('\n✅ 전체 테스트 완료');
}
