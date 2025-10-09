/**
 * 데이터 검증 유틸리티
 *
 * 공통 데이터 검증 패턴 제공
 * - 입력 검증
 * - 형식 검증
 * - 비즈니스 규칙 검증
 *
 * @module ValidationUtils
 */

const ValidationUtils = {
  /**
   * 빈 값 검사
   * @param {*} value - 검사할 값
   * @returns {boolean} 빈 값이면 true
   * @example
   * if (ValidationUtils.isEmpty(userInput)) {
   *   throw new Error('값을 입력해주세요');
   * }
   */
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },

  /**
   * 필수 필드 검증
   * @param {Object} data - 검증할 데이터 객체
   * @param {Array<string>} requiredFields - 필수 필드 목록
   * @returns {{valid: boolean, missing: Array<string>}} 검증 결과
   * @example
   * const result = ValidationUtils.requireFields(
   *   { name: '홍길동', email: '' },
   *   ['name', 'email', 'phone']
   * );
   * if (!result.valid) {
   *   Logger.log('누락된 필드: ' + result.missing.join(', '));
   * }
   */
  requireFields(data, requiredFields) {
    const missing = requiredFields.filter(field => this.isEmpty(data[field]));
    return {
      valid: missing.length === 0,
      missing: missing
    };
  },

  /**
   * 이메일 형식 검증
   * @param {string} email - 검증할 이메일
   * @returns {boolean} 유효한 이메일이면 true
   * @example
   * if (!ValidationUtils.isValidEmail(email)) {
   *   throw new Error('올바른 이메일 주소를 입력하세요');
   * }
   */
  isValidEmail(email) {
    if (this.isEmpty(email)) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * 전화번호 형식 검증 (한국)
   * @param {string} phone - 검증할 전화번호
   * @returns {boolean} 유효한 전화번호이면 true
   * @example
   * if (!ValidationUtils.isValidPhone(phone)) {
   *   throw new Error('올바른 전화번호를 입력하세요');
   * }
   */
  isValidPhone(phone) {
    if (this.isEmpty(phone)) return false;
    // 하이픈 제거
    const cleaned = phone.replace(/[^0-9]/g, '');
    // 10자리 또는 11자리 (02-xxx-xxxx, 010-xxxx-xxxx 등)
    return /^0[0-9]{9,10}$/.test(cleaned);
  },

  /**
   * 사업자등록번호 형식 검증
   * @param {string} businessNumber - 검증할 사업자등록번호
   * @returns {boolean} 유효한 사업자등록번호이면 true
   * @example
   * if (!ValidationUtils.isValidBusinessNumber('123-45-67890')) {
   *   throw new Error('올바른 사업자등록번호를 입력하세요');
   * }
   */
  isValidBusinessNumber(businessNumber) {
    if (this.isEmpty(businessNumber)) return false;
    const cleaned = businessNumber.replace(/[^0-9]/g, '');
    if (cleaned.length !== 10) return false;

    // 검증 알고리즘
    const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * weights[i];
    }

    sum += Math.floor((parseInt(cleaned[8]) * 5) / 10);
    const checkDigit = (10 - (sum % 10)) % 10;

    return checkDigit === parseInt(cleaned[9]);
  },

  /**
   * 주민등록번호 형식 검증 (앞 6자리만 검증)
   * @param {string} residentNumber - 검증할 주민등록번호 (앞 6자리)
   * @returns {boolean} 유효한 형식이면 true
   * @example
   * if (!ValidationUtils.isValidResidentNumberPrefix('901231')) {
   *   throw new Error('올바른 생년월일을 입력하세요');
   * }
   */
  isValidResidentNumberPrefix(residentNumber) {
    if (this.isEmpty(residentNumber)) return false;
    const cleaned = residentNumber.replace(/[^0-9]/g, '');

    if (cleaned.length !== 6) return false;

    const year = parseInt(cleaned.substring(0, 2));
    const month = parseInt(cleaned.substring(2, 4));
    const day = parseInt(cleaned.substring(4, 6));

    // 월 검증 (1-12)
    if (month < 1 || month > 12) return false;

    // 일 검증 (1-31)
    if (day < 1 || day > 31) return false;

    // 월별 일수 검증 (간단히)
    if (month === 2 && day > 29) return false;
    if ([4, 6, 9, 11].includes(month) && day > 30) return false;

    return true;
  },

  /**
   * 숫자 범위 검증
   * @param {number} value - 검증할 값
   * @param {number} min - 최소값 (포함)
   * @param {number} max - 최대값 (포함)
   * @returns {boolean} 범위 내이면 true
   * @example
   * if (!ValidationUtils.isInRange(age, 0, 150)) {
   *   throw new Error('나이는 0-150 사이여야 합니다');
   * }
   */
  isInRange(value, min, max) {
    if (typeof value !== 'number' || isNaN(value)) return false;
    return value >= min && value <= max;
  },

  /**
   * 문자열 길이 검증
   * @param {string} str - 검증할 문자열
   * @param {number} minLength - 최소 길이
   * @param {number} [maxLength] - 최대 길이 (선택)
   * @returns {boolean} 길이가 유효하면 true
   * @example
   * if (!ValidationUtils.isLengthValid(password, 8, 20)) {
   *   throw new Error('비밀번호는 8-20자여야 합니다');
   * }
   */
  isLengthValid(str, minLength, maxLength) {
    if (typeof str !== 'string') return false;
    const length = str.length;
    if (length < minLength) return false;
    if (maxLength !== undefined && length > maxLength) return false;
    return true;
  },

  /**
   * 날짜 형식 검증 (YYYY-MM-DD)
   * @param {string} dateStr - 검증할 날짜 문자열
   * @returns {boolean} 유효한 날짜이면 true
   * @example
   * if (!ValidationUtils.isValidDate('2024-01-15')) {
   *   throw new Error('올바른 날짜를 입력하세요');
   * }
   */
  isValidDate(dateStr) {
    if (this.isEmpty(dateStr)) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  },

  /**
   * 날짜 범위 검증
   * @param {Date|string} date - 검증할 날짜
   * @param {Date|string} startDate - 시작 날짜
   * @param {Date|string} endDate - 종료 날짜
   * @returns {boolean} 범위 내이면 true
   * @example
   * if (!ValidationUtils.isDateInRange(inputDate, '2024-01-01', '2024-12-31')) {
   *   throw new Error('날짜가 2024년 범위를 벗어났습니다');
   * }
   */
  isDateInRange(date, startDate, endDate) {
    const d = date instanceof Date ? date : new Date(date);
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);

    if (isNaN(d.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    return d >= start && d <= end;
  },

  /**
   * 금액 검증 (양수)
   * @param {number|string} amount - 검증할 금액
   * @returns {boolean} 유효한 금액이면 true
   * @example
   * if (!ValidationUtils.isValidAmount(price)) {
   *   throw new Error('올바른 금액을 입력하세요');
   * }
   */
  isValidAmount(amount) {
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    return typeof num === 'number' && !isNaN(num) && num >= 0;
  },

  /**
   * URL 형식 검증
   * @param {string} url - 검증할 URL
   * @returns {boolean} 유효한 URL이면 true
   * @example
   * if (!ValidationUtils.isValidUrl(websiteUrl)) {
   *   throw new Error('올바른 URL을 입력하세요');
   * }
   */
  isValidUrl(url) {
    if (this.isEmpty(url)) return false;
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * 배열 검증 (최소/최대 길이)
   * @param {Array} arr - 검증할 배열
   * @param {number} [minLength=1] - 최소 길이
   * @param {number} [maxLength] - 최대 길이
   * @returns {boolean} 유효한 배열이면 true
   * @example
   * if (!ValidationUtils.isValidArray(items, 1, 100)) {
   *   throw new Error('항목은 1개 이상 100개 이하여야 합니다');
   * }
   */
  isValidArray(arr, minLength = 1, maxLength) {
    if (!Array.isArray(arr)) return false;
    if (arr.length < minLength) return false;
    if (maxLength !== undefined && arr.length > maxLength) return false;
    return true;
  },

  /**
   * 스프레드시트 ID 형식 검증
   * @param {string} spreadsheetId - 검증할 스프레드시트 ID
   * @returns {boolean} 유효한 형식이면 true
   * @example
   * if (!ValidationUtils.isValidSpreadsheetId(id)) {
   *   throw new Error('올바른 스프레드시트 ID를 입력하세요');
   * }
   */
  isValidSpreadsheetId(spreadsheetId) {
    if (this.isEmpty(spreadsheetId)) return false;
    // Google Spreadsheet ID는 44자의 영숫자 및 특수문자
    return /^[a-zA-Z0-9-_]{44}$/.test(spreadsheetId);
  },

  /**
   * 복합 검증 실행
   * @param {Object} data - 검증할 데이터
   * @param {Object} rules - 검증 규칙 객체
   * @returns {{valid: boolean, errors: Object}} 검증 결과
   * @example
   * const result = ValidationUtils.validate(userData, {
   *   email: { required: true, type: 'email' },
   *   age: { required: true, type: 'number', min: 0, max: 150 },
   *   name: { required: true, minLength: 2, maxLength: 50 }
   * });
   */
  validate(data, rules) {
    const errors = {};

    for (const field in rules) {
      const rule = rules[field];
      const value = data[field];

      // 필수 필드 검증
      if (rule.required && this.isEmpty(value)) {
        errors[field] = `${field}은(는) 필수 입력 항목입니다`;
        continue;
      }

      // 빈 값이면 나머지 검증 스킵 (required가 false인 경우)
      if (this.isEmpty(value)) continue;

      // 타입별 검증
      if (rule.type === 'email' && !this.isValidEmail(value)) {
        errors[field] = '올바른 이메일 주소를 입력하세요';
      }

      if (rule.type === 'phone' && !this.isValidPhone(value)) {
        errors[field] = '올바른 전화번호를 입력하세요';
      }

      if (rule.type === 'url' && !this.isValidUrl(value)) {
        errors[field] = '올바른 URL을 입력하세요';
      }

      if (rule.type === 'date' && !this.isValidDate(value)) {
        errors[field] = '올바른 날짜를 입력하세요 (YYYY-MM-DD)';
      }

      if (rule.type === 'number') {
        const num = parseFloat(value);
        if (isNaN(num)) {
          errors[field] = '숫자를 입력하세요';
        } else if (rule.min !== undefined && num < rule.min) {
          errors[field] = `${rule.min} 이상의 값을 입력하세요`;
        } else if (rule.max !== undefined && num > rule.max) {
          errors[field] = `${rule.max} 이하의 값을 입력하세요`;
        }
      }

      // 문자열 길이 검증
      if (rule.minLength && !this.isLengthValid(value, rule.minLength)) {
        errors[field] = `최소 ${rule.minLength}자 이상 입력하세요`;
      }

      if (rule.maxLength && !this.isLengthValid(value, 0, rule.maxLength)) {
        errors[field] = `최대 ${rule.maxLength}자까지 입력 가능합니다`;
      }

      // 사용자 정의 검증 함수
      if (rule.custom && typeof rule.custom === 'function') {
        const customResult = rule.custom(value, data);
        if (customResult !== true) {
          errors[field] = customResult || '유효하지 않은 값입니다';
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors
    };
  },

  /**
   * 검증 오류 메시지 포맷팅
   * @param {Object} errors - 검증 오류 객체
   * @returns {string} 포맷팅된 오류 메시지
   * @example
   * const result = ValidationUtils.validate(data, rules);
   * if (!result.valid) {
   *   const message = ValidationUtils.formatErrors(result.errors);
   *   UIUtils.alert('검증 실패', message);
   * }
   */
  formatErrors(errors) {
    const messages = Object.entries(errors)
      .map(([field, message]) => `• ${field}: ${message}`)
      .join('\n');

    return `다음 항목을 확인해주세요:\n\n${messages}`;
  }
};
