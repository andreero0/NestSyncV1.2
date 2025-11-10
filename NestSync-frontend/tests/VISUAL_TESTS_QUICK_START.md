# Visual Regression Tests - Quick Start Guide

## 🚀 Quick Start (5 minutes)

### 1. Setup Environment
```bash
cd NestSync-frontend
./tests/setup-visual-tests.sh
```

### 2. Ensure Servers Are Running

**Frontend:**
```bash
npm run start
```

**Backend:**
```bash
cd ../NestSync-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Run Tests
```bash
npm run test:visual
```

### 4. View Results
```bash
npm run test:visual:report
```

## 📊 Test Coverage

- ✅ **8 tests** - Trial banner states (free, subscribed, paid, expired)
- ✅ **6 tests** - Premium upgrade flow
- ✅ **4 tests** - Reorder flow
- ✅ **4 tests** - Size prediction interface
- ✅ **6 tests** - Payment screens
- ✅ **3 tests** - Cross-screen consistency

**Total: 31+ test cases generating 60+ screenshots**

## 🎯 Common Commands

```bash
# Run all visual tests
npm run test:visual

# Run mobile tests only
npm run test:visual:mobile

# Run desktop tests only
npm run test:visual:desktop

# Update screenshot baselines (after approved design changes)
npm run test:visual:update

# View HTML report
npm run test:visual:report

# Run specific test suite
npx playwright test --config=playwright.visual-regression.config.ts -g "Trial Banner"
```

## 📁 Where Are Screenshots?

All screenshots are saved to:
```
test-results/visual-regression/
```

Example files:
- `trial-banner-free-trial-mobile.png`
- `premium-upgrade-subscription-management-desktop.png`
- `reorder-flow-suggestions-tablet.png`

## 🔧 Troubleshooting

### Tests Failing?

1. **Check servers are running:**
   ```bash
   curl http://localhost:8082  # Frontend
   curl http://localhost:8001/health  # Backend
   ```

2. **Clear test results:**
   ```bash
   rm -rf test-results/visual-regression
   ```

3. **Reinstall Playwright browsers:**
   ```bash
   npx playwright install chromium webkit
   ```

### Screenshots Look Different?

This is normal! Update baselines after approved design changes:
```bash
npm run test:visual:update
```

## 📚 Full Documentation

For complete documentation, see:
- [VISUAL_REGRESSION_TESTS.md](./VISUAL_REGRESSION_TESTS.md) - Complete guide
- [VISUAL_REGRESSION_IMPLEMENTATION.md](../docs/testing/VISUAL_REGRESSION_IMPLEMENTATION.md) - Implementation details

## 🎨 What Gets Tested?

### Trial Banner States
- Free trial users see upgrade banner
- Subscribed trial users see success banner
- Active paid users see no banner
- Expired trial users see appropriate state

### Design Consistency
- Button styling matches across screens
- Card styling is consistent
- Spacing uses 4px base unit
- Touch targets meet 48px minimum

### Responsive Design
- Mobile (375×812)
- Tablet (768×1024)
- Desktop (1280×720)

## ⚡ Pro Tips

1. **Run tests before committing** to catch visual regressions early
2. **Review diffs carefully** when tests fail
3. **Update baselines only after design approval**
4. **Use specific test suites** for faster iteration during development

## 🤝 Need Help?

1. Check [Troubleshooting](#troubleshooting) section above
2. Review [VISUAL_REGRESSION_TESTS.md](./VISUAL_REGRESSION_TESTS.md)
3. Ask the development team

---

**Requirements:** 8.1, 8.2  
**Last Updated:** 2025-01-09
