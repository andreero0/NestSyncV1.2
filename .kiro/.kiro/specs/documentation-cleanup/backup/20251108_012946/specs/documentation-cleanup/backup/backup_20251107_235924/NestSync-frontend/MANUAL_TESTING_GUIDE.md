# Manual Testing Quick Guide - Trial Banner Visibility Fix

**Quick Reference**: Complete visual verification in 5 minutes

---

## Pre-Flight Checklist ✓

- [x] Backend running: http://localhost:8001
- [x] Frontend running: http://localhost:8082
- [x] Test credentials: parents@nestsync.com / Shazam11#
- [ ] Browser DevTools ready (F12 or Cmd+Option+I)
- [ ] Screenshot tool ready

---

## Test Sequence (5 Steps)

### Step 1: Navigate to App (30 seconds)
```
1. Open browser to: http://localhost:8082
2. You should see login screen
3. Screenshot: "test-1-login-screen.png"
```

**Expected**: Clean login screen, no errors

---

### Step 2: Log In (30 seconds)
```
1. Enter email: parents@nestsync.com
2. Enter password: Shazam11#
3. Click "Sign In"
4. Wait for dashboard to load
5. Screenshot: "test-2-dashboard-no-banner.png"
```

**Expected**: Dashboard loads WITHOUT trial banner

**✓ PASS Criteria**:
- NO banner with "X days left in trial" text
- Clean dashboard with standard components only
- No countdown timer visible

**❌ FAIL Criteria**:
- Trial banner appears at top of dashboard
- "X days left in trial" message visible
- Banner shows upgrade button

---

### Step 3: Check Subscription Badge (1 minute)
```
1. Click Settings icon (bottom navigation)
2. Tap "Subscription Management"
3. Observe subscription plan card
4. Screenshot: "test-3-subscription-badge.png"
```

**Expected**: Blue "TRIAL" badge on Standard plan

**✓ PASS Criteria**:
- Badge color: BLUE (not teal)
- Badge text: "TRIAL" (not "CURRENT")
- Plan shows trial expiration date
- Text indicates billing after trial

**❌ FAIL Criteria**:
- Badge color: TEAL (indicates active paying)
- Badge text: "CURRENT"
- No trial information shown

---

### Step 4: Test Analytics Access (1 minute)
```
1. Navigate back to Dashboard
2. Click "Analytics" button/section
3. Observe analytics screen loads
4. Screenshot: "test-4-analytics-access.png"
```

**Expected**: Analytics screen loads, no upgrade gate

**✓ PASS Criteria**:
- Analytics button present on dashboard
- Click navigates to analytics screen
- NO paywall or upgrade gate
- Analytics data displays

**❌ FAIL Criteria**:
- Upgrade gate blocks access
- "Subscribe to view analytics" message
- Analytics screen not accessible

---

### Step 5: Review Console Logs (1 minute)
```
1. Open DevTools Console tab
2. Review all log messages
3. Look for errors (red text)
4. Screenshot: "test-5-console-logs.png"
```

**Expected**: Clean console, no errors

**✓ PASS Criteria**:
- NO red error messages
- NO "Failed to fetch subscription"
- NO "Banner rendering error"
- NO GraphQL query failures

**❌ FAIL Criteria**:
- Red error messages present
- Subscription fetch failures
- Banner rendering errors
- Authentication errors

---

## Quick Pass/Fail Decision

### ALL TESTS PASS ✓
If ALL 4 tests meet PASS criteria:
1. Mark as VERIFIED ✓
2. Document in test report
3. Proceed to iOS/Android testing
4. Commit changes with evidence

### ANY TEST FAILS ❌
If ANY test meets FAIL criteria:
1. Document failure details
2. Capture error screenshots
3. Review component logic
4. Check Metro bundler reloaded
5. Test with hard refresh (Cmd+Shift+R)

---

## Troubleshooting Quick Fixes

### Banner Still Appears
```bash
# Clear Metro cache
npx expo start --clear

# Hard refresh browser
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Clear browser storage
localStorage.clear()
location.reload()
```

### Console Shows Errors
```bash
# Check GraphQL response
Network Tab → GraphQL request → Response

# Verify subscription data
Look for: stripeSubscriptionId field
Should be: "sub_xxxxx" (not null)
```

### Servers Not Running
```bash
# Backend
cd NestSync-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd NestSync-frontend
npx expo start --port 8082
```

---

## Screenshot Evidence Checklist

Save these screenshots:
- [ ] test-1-login-screen.png
- [ ] test-2-dashboard-no-banner.png (MOST IMPORTANT)
- [ ] test-3-subscription-badge.png
- [ ] test-4-analytics-access.png
- [ ] test-5-console-logs.png

---

## Report Completion

After manual testing:
1. Open: `TRIAL_BANNER_TEST_EXECUTION_REPORT.md`
2. Update "Manual Verification Needed" checkboxes
3. Add screenshot evidence
4. Mark test results (PASS/FAIL)
5. Save and commit

---

## Expected Timeline

- **Step 1**: 30 seconds
- **Step 2**: 30 seconds (CRITICAL TEST)
- **Step 3**: 1 minute
- **Step 4**: 1 minute
- **Step 5**: 1 minute
- **Documentation**: 1 minute
- **TOTAL**: ~5 minutes

---

## Success Confirmation

**Primary Success Indicator**:
✓ Dashboard loads WITHOUT trial banner for TRIALING subscriber

**Secondary Success Indicators**:
✓ Blue "TRIAL" badge in subscription management
✓ Analytics access granted
✓ Console logs clean

**Overall Success**:
If primary + all secondary indicators pass → FIX VERIFIED ✓

---

## Quick Commands Reference

```bash
# Open browser to frontend
open http://localhost:8082

# Check backend health
curl http://localhost:8001/graphql -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}' | head -20

# Run verification script
node verify-trial-banner-fix.js

# Clear Metro cache
npx expo start --clear
```

---

**Ready to Test**: ✓ YES
**Estimated Time**: 5 minutes
**Required Screenshots**: 5
**Critical Test**: Step 2 (Dashboard banner visibility)
