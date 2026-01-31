# Menu 5 (월지급DB 저장) - Quick Test Reference Card

## 🚀 5-Minute Quick Test

### Step 1: Setup (30 seconds)
```javascript
// Apps Script 편집기에서 실행
createSampleDazoneData()
```
✅ 3명의 샘플 데이터 생성됨

---

### Step 2: Test Save (2 minutes)

**메뉴**: 급여 관리 → 5. 월지급DB 저장

**입력**:
- 급여기준월: `2026-01-31`
- 불러오기 클릭

**확인**:
- ✅ 3명 표시 (홍길동, 김철수, 이영희)
- ✅ 모두 "✓ 신규" 배지

**실행**:
- 2명 선택 (홍길동, 김철수)
- 저장 클릭

**결과**:
```
✅ 저장: 2명
⚠️ 중복: 0명
❌ 오류: 0명
```

---

### Step 3: Verify (1 minute)
```javascript
// Apps Script 편집기에서 실행
verifyResults()
```

**예상 출력**:
```
✅ 테스트 성공!
저장된 데이터: 2개
```

---

### Step 4: Test Duplicate Check (1.5 minutes)

**메뉴**: 급여 관리 → 5. 월지급DB 저장 (다시)

**입력**:
- 급여기준월: `2026-01-31` (동일)
- 불러오기 클릭

**확인**:
- ✅ 홍길동, 김철수: "⚠ 중복" (비활성화)
- ✅ 이영희: "✓ 신규" (선택 가능)

**실행**:
- 이영희 선택
- 저장 클릭

**결과**:
```
✅ 저장: 1명
⚠️ 중복: 0명
```

---

### Step 5: Cleanup (30 seconds)
```javascript
// Apps Script 편집기에서 실행
cleanupTestData()
```
✅ 테스트 데이터 삭제됨

---

## ✅ Success Criteria

- [ ] 샘플 데이터 생성 성공
- [ ] UI 정상 작동
- [ ] 2명 저장 성공
- [ ] 중복 감지 성공
- [ ] 1명 추가 저장 성공
- [ ] 검증 통과
- [ ] 정리 완료

---

## 🔧 Test Functions

| Function | Purpose |
|----------|---------|
| `createSampleDazoneData()` | 샘플 데이터 생성 |
| `checkBeforeSave()` | 저장 전 상태 확인 |
| `verifyResults()` | 결과 검증 |
| `testDuplicateCheck()` | 중복 테스트 준비 |
| `cleanupTestData()` | 테스트 데이터 삭제 |
| `runFullTest()` | 전체 자동 테스트 |

---

## 🎯 Expected Data

### Sample Employees

| Name | Total Salary | Net Pay | Bank |
|------|--------------|---------|------|
| 홍길동 | ₩4,150,000 | ₩3,612,854 | 국민은행 |
| 김철수 | ₩5,000,000 | ₩4,349,571 | 신한은행 |
| 이영희 | ₩3,000,000 | ₩2,622,852 | (없음) |

### 월지급DB Columns (30)

| Column | Name | Sample Value |
|--------|------|--------------|
| A | 급여기준월 | 2026-01-31 |
| B | 이름 | 홍길동 |
| W | 세후지급액 | 3612854 |
| AB | 입금처리여부 | 대기 |
| AC | 은행 | 국민은행 |
| AD | 계좌번호 | 123-45-678910 |

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "시트를 찾을 수 없습니다" | Run `createSampleDazoneData()` |
| 체크박스 비활성화 | Expected for duplicates ✅ |
| 은행 정보 없음 | OK, saves with blank AC/AD |
| 저장 버튼 비활성화 | Select at least 1 employee |
| 중복 감지 안됨 | Check date format (YYYY-MM-DD) |

---

## 📊 Visual Checks

### UI Before Save
```
📊 선택: 0명 | 중복: 0명 | 신규: 3명
```

### UI After Selection (2명)
```
📊 선택: 2명 | 중복: 0명 | 신규: 3명
[저장 (2명)] 버튼 활성화
```

### UI with Duplicates
```
📊 선택: 0명 | 중복: 2명 | 신규: 1명
⚠ 중복 항목 노란색 배경
```

---

## 💡 Pro Tips

1. **First Time**: Always run `createSampleDazoneData()` first
2. **Verification**: Use `verifyResults()` to check data integrity
3. **Cleanup**: Use `cleanupTestData()` to remove test data
4. **Logs**: Check Apps Script logs for detailed information
5. **Real Data**: After testing, replace sample with real Dazone download

---

**Total Test Time**: ~5 minutes
**Success Rate**: Should be 100% ✅
