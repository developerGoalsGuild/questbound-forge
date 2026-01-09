# Quick Test Guide - Landing Page New Functionalities

## Option 1: Automated Selenium Tests (Recommended)

### Prerequisites
```bash
# Install dependencies if not already installed
cd apps/frontend
npm install
```

### Run Tests
```bash
# Make sure dev server is running on port 8080
npm run dev

# In another terminal, run the tests
npm run test:selenium:landing:verbose
```

### Run with Visible Browser (for debugging)
Edit `apps/frontend/src/__tests__/selenium/landing-page-integration.test.js`:
- Change `--headless` to `--headless=new` or remove the headless option

---

## Option 2: Manual Browser Testing

### Step 1: Open Landing Page
1. Make sure dev server is running: `npm run dev` (in `apps/frontend`)
2. Open browser: http://localhost:8080
3. Open DevTools (F12) → Console tab

### Step 2: Quick Console Test
Paste this in browser console to check all sections:

```javascript
// Quick test script
console.log('🧪 Testing Landing Page Sections...\n');

const tests = [
  { id: 'problem', name: 'Problem Recognition' },
  { id: 'empathy', name: 'Empathy Section' },
  { id: 'solution', name: 'Solution Intro' },
  { id: 'how-it-works', name: 'How It Works' },
  { id: 'waitlist', name: 'Waitlist Form' },
  { id: 'development-notice', name: 'Development Notice' }
];

tests.forEach(test => {
  const el = document.getElementById(test.id);
  console.log(`${el ? '✅' : '❌'} ${test.name}: ${el ? 'Found' : 'Missing'}`);
});

// Test carousel
const carousel = document.querySelector('[aria-labelledby="carousel-title"]');
console.log(`${carousel ? '✅' : '❌'} Feature Carousel: ${carousel ? 'Found' : 'Missing'}`);

// Test forms
const waitlistForm = document.querySelector('form[aria-label*="Waitlist"], #waitlist form');
const newsletterForm = document.querySelector('footer form, form[aria-label*="Newsletter"]');
console.log(`${waitlistForm ? '✅' : '❌'} Waitlist Form: ${waitlistForm ? 'Found' : 'Missing'}`);
console.log(`${newsletterForm ? '✅' : '❌'} Newsletter Form: ${newsletterForm ? 'Found' : 'Missing'}`);

console.log('\n✅ Quick test complete!');
```

### Step 3: Manual Test Checklist

#### ✅ Problem Recognition
- [ ] Scroll to section - all 6 scenarios visible?
- [ ] Icons load correctly?
- [ ] Text is readable?

#### ✅ Empathy Section  
- [ ] Statistics animate (92%, 78%, 3x)?
- [ ] Animation is smooth?

#### ✅ How It Works
- [ ] All 6 steps visible?
- [ ] Step numbers correct (1-6)?
- [ ] Icons visible?

#### ✅ Feature Carousel
- [ ] Auto-plays (changes every 5 seconds)?
- [ ] Next/Previous buttons work?
- [ ] Click indicators - slides change?
- [ ] Progress bar animates?
- [ ] Keyboard arrows work (← →)?

#### ✅ Waitlist Form
- [ ] Email input visible?
- [ ] Submit button disabled when empty?
- [ ] Enter invalid email → shows error?
- [ ] Enter valid email → button enables?
- [ ] Submit form → check Network tab for API call?

#### ✅ Newsletter (Footer)
- [ ] Scroll to footer
- [ ] Newsletter form visible?
- [ ] Submit works?

---

## Option 3: Browser Extension Testing

If you have browser testing extensions installed:

1. **Playwright Test Runner** (if installed)
2. **Cypress** (if installed)
3. **Browser DevTools** → Performance/Lighthouse audits

---

## Quick Verification Commands

### Check if server is running
```bash
lsof -ti:8080 && echo "✅ Server running" || echo "❌ Server not running"
```

### Start server if not running
```bash
cd apps/frontend
npm run dev
```

### Check for console errors
1. Open http://localhost:8080
2. Press F12 → Console tab
3. Look for red errors
4. Should see no errors ✅

### Check Network requests
1. Open http://localhost:8080
2. Press F12 → Network tab
3. Submit waitlist form
4. Should see POST to `/v1/waitlist/subscribe` ✅

---

## Expected Results

### ✅ All Sections Render
- Problem Recognition: 6 scenarios
- Empathy: 3 statistics
- Solution Intro: Title + 2 paragraphs
- How It Works: 6 steps
- Feature Carousel: 4 slides
- Development Notice: Visible
- Waitlist Form: Functional
- Newsletter: Functional

### ✅ Interactions Work
- Carousel navigation (buttons, keyboard, indicators)
- Form validation
- Form submission
- Scroll animations

### ✅ No Errors
- Browser console: No red errors
- Network tab: Successful API calls (or handled errors)
- Performance: Smooth scrolling, no lag

---

## Troubleshooting

### Server not starting?
```bash
# Check if port 8080 is in use
lsof -ti:8080

# Kill process if needed
kill -9 $(lsof -ti:8080)

# Start server
cd apps/frontend && npm run dev
```

### Tests failing?
- Make sure server is running on port 8080
- Check browser console for errors
- Verify all sections are rendered
- Check Network tab for API calls

### Can't see sections?
- Scroll down the page
- Check browser zoom (should be 100%)
- Try different browser
- Clear browser cache

---

## Full Test Documentation

See detailed test plan: `docs/testing/INTEGRATED_TEST_PLAN.md`
