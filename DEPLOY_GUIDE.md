# Deployment Guide - 월지급DB 및 대량이체 시스템

## 📋 Pre-Deployment Checklist

### ✅ Files Ready (7 files)
- [x] `src/payroll/savePayrollDB.js` (12.5 KB)
- [x] `src/payroll/bulkTransferHandler.js` (10.9 KB)
- [x] `src/payroll/test_savePayrollDB.js` (15 KB)
- [x] `src/payroll/html/savePayrollDBUI.html` (15 KB)
- [x] `src/payroll/html/bulkTransferUI.html` (18 KB)
- [x] `src/menu/01. 메뉴.js` (updated)
- [x] `src/payroll/monthlyPayrollUIHandler.js` (updated)

### ✅ Syntax Validated
- [x] All JavaScript files pass syntax check
- [x] All HTML files are well-formed
- [x] Menu functions properly referenced

### ✅ Configuration Verified
- [x] .clasp.json exists
- [x] rootDir: "src" configured
- [x] .claspignore properly set

---

## 🚀 Deployment Steps

### Step 1: Backup Current Version

```bash
# Create a version backup in Google Apps Script
clasp versions

# Create a new version before deploying
clasp version "Pre-월지급DB-대량이체-system"
```

### Step 2: Check Status

```bash
# See which files will be pushed
clasp status

# Expected output:
# Not ignored files:
#   src/menu/01. 메뉴.js (modified)
#   src/payroll/monthlyPayrollUIHandler.js (modified)
#   src/payroll/savePayrollDB.js (new)
#   src/payroll/bulkTransferHandler.js (new)
#   src/payroll/test_savePayrollDB.js (new)
#   src/payroll/html/savePayrollDBUI.html (new)
#   src/payroll/html/bulkTransferUI.html (new)
```

### Step 3: Dry Run (Preview)

```bash
# Preview what will be pushed (doesn't actually push)
clasp push --dry-run

# Review the output carefully
```

### Step 4: Push to Google Apps Script

```bash
# Push all changes
clasp push

# Expected output:
# └─ src/payroll/savePayrollDB.js
# └─ src/payroll/bulkTransferHandler.js
# └─ src/payroll/test_savePayrollDB.js
# └─ src/payroll/html/savePayrollDBUI.html
# └─ src/payroll/html/bulkTransferUI.html
# └─ src/menu/01. 메뉴.js
# └─ src/payroll/monthlyPayrollUIHandler.js
# Pushed 7 files.
```

### Step 5: Verify in Apps Script Editor

```bash
# Open the project in browser
clasp open

# Verify in the editor:
# 1. Check that new files appear in file list
# 2. Check that menu functions are present
# 3. Run onOpen() to test menu
```

---

## 🧪 Post-Deployment Testing

### Immediate Tests (in Apps Script Editor)

1. **Test Menu Creation**
   ```javascript
   // Run this function
   onOpen()
   ```

   **Expected**: No errors, menu created

2. **Test Function Availability**
   ```javascript
   // Check these functions exist
   typeof showSavePayrollDBUI === 'function'
   typeof showBulkTransferUI === 'function'
   ```

   **Expected**: Both return true

3. **Test Sample Data Creation**
   ```javascript
   // Run this function
   createSampleDazoneData()
   ```

   **Expected**: Sample data created, alert shown

### Integration Tests (in Google Sheets)

1. **Refresh the spreadsheet** (F5 or reload page)

2. **Check Menu**
   - Menu bar → 급여 관리
   - Verify items:
     - 4. 월지급 계산
     - 5. 월지급DB 저장 ✨ (NEW)
     - 6. 대량이체 등록 ✨ (NEW)

3. **Test Menu 5** (월지급DB 저장)
   - Click: 급여 관리 → 5. 월지급DB 저장
   - Modal should open
   - UI should display correctly

4. **Test Menu 6** (대량이체 등록)
   - Click: 급여 관리 → 6. 대량이체 등록
   - Modal should open
   - UI should display correctly

5. **Run Full Test**
   - Follow: `claudedocs/Menu5_Quick_Test_Reference.md`
   - Expected: All tests pass

---

## 🔄 Multi-Environment Deployment

If you need to deploy to multiple environments:

### Environment List

Based on your configs, you have:
- admonz
- ahn
- bnbk
- canandwill
- chc
- coursek
- golfk
- khj
- kigm (multiple)
- lawnchina
- lawnfood (multiple)
- theplayearth

### Deployment Script

```bash
#!/bin/bash
# deploy-to-all.sh

environments=(
  "bnbk"
  "canandwill"
  "coursek"
  "golfk"
  "khj"
  # Add others as needed
)

for env in "${environments[@]}"; do
  echo "Deploying to $env..."
  cp "configs/clasp-$env.json" .clasp.json
  clasp push
  echo "✅ Deployed to $env"
  echo "---"
done

echo "🎉 All deployments complete!"
```

**Usage**:
```bash
chmod +x deploy-to-all.sh
./deploy-to-all.sh
```

---

## 🐛 Troubleshooting

### Issue 1: "File not found" during push

**Cause**: Files not in src/ directory
**Solution**: Check file paths, ensure rootDir is "src" in .clasp.json

### Issue 2: "Syntax error" during push

**Cause**: JavaScript syntax error
**Solution**:
```bash
# Check syntax locally
node --check src/payroll/savePayrollDB.js
node --check src/payroll/bulkTransferHandler.js
```

### Issue 3: Menu items don't appear

**Cause**: onOpen() not triggered
**Solution**:
1. Close and reopen the spreadsheet
2. Manually run `onOpen()` in Apps Script editor
3. Check browser console for errors

### Issue 4: "Function not found" when clicking menu

**Cause**: Function name mismatch
**Solution**: Verify function names in menu match handler files:
- `showSavePayrollDBUI` in savePayrollDB.js
- `showBulkTransferUI` in bulkTransferHandler.js

### Issue 5: HTML modal doesn't open

**Cause**: HTML file not pushed or path incorrect
**Solution**:
1. Verify HTML files in Apps Script editor
2. Check file paths in handlers:
   - `'src/payroll/html/savePayrollDBUI'`
   - `'src/payroll/html/bulkTransferUI'`

### Issue 6: clasp push fails

**Cause**: Not logged in or wrong project
**Solution**:
```bash
# Login to clasp
clasp login

# Check current project
clasp open

# Pull latest to sync
clasp pull
```

---

## 📊 Deployment Verification Checklist

### Pre-Push
- [ ] All files saved locally
- [ ] Syntax checks passed
- [ ] .clasp.json configured
- [ ] Backup version created

### Push
- [ ] `clasp status` reviewed
- [ ] `clasp push --dry-run` checked
- [ ] `clasp push` successful
- [ ] No errors in output

### Post-Push
- [ ] Files visible in Apps Script editor
- [ ] onOpen() runs without errors
- [ ] Menu items appear in Sheets
- [ ] Menu 5 opens modal
- [ ] Menu 6 opens modal
- [ ] Test script runs successfully

### Integration
- [ ] Sample data creation works
- [ ] Data saves to 월지급DB
- [ ] Duplicate detection works
- [ ] Bulk transfer creation works
- [ ] All UI interactions smooth

---

## 🎯 Success Criteria

**Deployment is successful when**:

1. ✅ `clasp push` completes with "Pushed X files"
2. ✅ All 7 files visible in Apps Script editor
3. ✅ Menu shows 2 new items (5, 6)
4. ✅ Both modals open correctly
5. ✅ Test functions run without errors
6. ✅ Full test cycle passes

**Expected Output**:
```
Pushed 7 files.
└─ src/payroll/savePayrollDB.js
└─ src/payroll/bulkTransferHandler.js
└─ src/payroll/test_savePayrollDB.js
└─ src/payroll/html/savePayrollDBUI.html
└─ src/payroll/html/bulkTransferUI.html
└─ src/menu/01. 메뉴.js
└─ src/payroll/monthlyPayrollUIHandler.js
```

---

## 📝 Post-Deployment Tasks

### 1. Update Version
```bash
clasp version "v2.1-월지급DB-대량이체-system"
```

### 2. Document Deployment
- Update project README
- Note deployment date
- Record any environment-specific changes

### 3. User Communication
- Notify users of new menu items
- Share quick test guide
- Provide training if needed

### 4. Monitor
- Watch for errors in executions
- Check user feedback
- Monitor performance

---

## 🔐 Rollback Plan

If issues occur after deployment:

### Quick Rollback
```bash
# Pull previous version
clasp versions

# Use version number from pre-deployment backup
clasp rollback <version_number>
```

### Manual Rollback
1. Go to Apps Script editor
2. File → Version history
3. Select pre-deployment version
4. Restore

---

## 📞 Support

If you encounter issues:

1. Check logs: Apps Script → Executions
2. Review error messages in console
3. Test with sample data first
4. Verify against test guide
5. Check schema files for data structure

---

**Deployment Date**: 2026-01-31
**Version**: v2.1
**Status**: Ready for deployment
**Risk Level**: Low (new features, backward compatible)
