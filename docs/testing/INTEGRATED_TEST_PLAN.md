# Integrated Test Plan for New Landing Page Functionalities

## Test Environment

- **URL**: http://localhost:8080
- **Browser**: Chrome/Firefox/Safari (latest)
- **Dev Tools**: Open browser console (F12) to monitor errors and network requests

## Test Checklist

### 1. Problem Recognition Section ✅

**Location**: Scroll down from Hero section

**Tests**:
- [ ] Section renders with title "Does This Sound Like You?"
- [ ] All 6 problem scenarios are visible:
  - [ ] "You Set Goals But Lose Steam"
  - [ ] "You're Going It Alone"
  - [ ] "You Feel Overwhelmed"
  - [ ] "You Lack Accountability"
  - [ ] "You're Stuck in Perfectionism"
  - [ ] "You Feel Like a Failure"
- [ ] Each scenario has an icon
- [ ] Closing message appears: "If you nodded 'yes' to any of these..."
- [ ] Scroll animations work (fade-in on scroll)
- [ ] Responsive on mobile (check mobile viewport)

**How to Test**:
1. Navigate to http://localhost:8080
2. Scroll down to Problem Recognition section
3. Verify all elements are visible
4. Check browser console for errors

---

### 2. Empathy Section ✅

**Location**: After Problem Recognition

**Tests**:
- [ ] Section renders with title "We Get It"
- [ ] Two empathy paragraphs are visible
- [ ] Three statistics animate from 0 to target values:
  - [ ] "92%" (of people give up)
  - [ ] "78%" (feel more motivated)
  - [ ] "3x" (more likely to succeed)
- [ ] Statistics animate smoothly when scrolled into view
- [ ] Labels are readable and properly positioned

**How to Test**:
1. Scroll to Empathy section
2. Watch statistics animate when section comes into view
3. Verify final values: 92%, 78%, 3x
4. Check animation timing (should be smooth, not instant)

---

### 3. Solution Intro Section ✅

**Location**: After Empathy section

**Tests**:
- [ ] Section renders with title "Here's What Changed Everything"
- [ ] Subtitle visible: "What if you never had to achieve your goals alone again?"
- [ ] Two solution paragraphs are visible
- [ ] Text is readable and well-formatted
- [ ] Responsive layout works

**How to Test**:
1. Scroll to Solution Intro section
2. Verify all text is visible and readable
3. Check responsive behavior (resize browser window)

---

### 4. How It Works Section ✅

**Location**: After Solution Intro

**Tests**:
- [ ] Section renders with title "How GoalsGuild Works"
- [ ] Subtitle visible: "Six simple steps to transform your goal achievement"
- [ ] All 6 steps are visible with:
  - [ ] Step numbers (1-6)
  - [ ] Step icons
  - [ ] Step titles
  - [ ] Step descriptions
- [ ] Steps are in correct order:
  1. Share Your Goals
  2. Find Your People
  3. Achieve Together
  4. Get Matched Intelligently
  5. Stay Motivated & Engaged
  6. Celebrate Your Success
- [ ] Grid layout works (2 columns on desktop, 1 on mobile)
- [ ] Scroll animations work

**How to Test**:
1. Scroll to How It Works section
2. Verify all 6 steps are visible
3. Check step order and numbering
4. Test responsive layout (resize window)
5. Verify icons load correctly

---

### 5. Feature Carousel ✅

**Location**: After How It Works section

**Tests**:
- [ ] Carousel renders with title "Why GoalsGuild Works"
- [ ] All 4 slides are present:
  - [ ] Slide 1: "Never Set Goals Alone Again"
  - [ ] Slide 2: "Find Your Support System"
  - [ ] Slide 3: "Stay Motivated & Engaged"
  - [ ] Slide 4: "Get Real Support When You Need It"
- [ ] Navigation buttons work:
  - [ ] Previous button (left arrow)
  - [ ] Next button (right arrow)
- [ ] Progress bar animates
- [ ] Auto-play works (slides advance automatically)
- [ ] Auto-play pause/resume button works
- [ ] Indicators (dots) work - clicking changes slide
- [ ] Keyboard navigation works:
  - [ ] Arrow Left → Previous slide
  - [ ] Arrow Right → Next slide
  - [ ] Spacebar → Toggle auto-play
- [ ] Touch/swipe works on mobile
- [ ] Slide tags are visible on each slide

**How to Test**:
1. Scroll to Feature Carousel section
2. Wait for auto-play to advance slides (should change every 5 seconds)
3. Click Next button → Should advance to next slide
4. Click Previous button → Should go back
5. Click indicator dots → Should jump to that slide
6. Click pause button → Auto-play should stop
7. Click play button → Auto-play should resume
8. Use keyboard arrows → Should navigate slides
9. Check progress bar → Should fill up as slide plays
10. Test on mobile → Swipe left/right should work

---

### 6. Development Notice ✅

**Location**: After Features section

**Tests**:
- [ ] Notice renders with title "Platform in Development"
- [ ] Message is visible: "The features described on this page are currently in development..."
- [ ] Icon is visible
- [ ] Styling is correct (muted background, proper spacing)

**How to Test**:
1. Scroll to Development Notice section
2. Verify notice is visible
3. Check styling and readability

---

### 7. Waitlist Form ✅

**Location**: After Development Notice, in dedicated section

**Tests**:
- [ ] Form renders with heading "Ready to Finally Achieve Your Goals?"
- [ ] Email input field is visible
- [ ] Submit button is visible ("Join the Community")
- [ ] Button is disabled when email is empty
- [ ] Button enables when valid email is entered
- [ ] Form validation works:
  - [ ] Empty email → Shows "Email is required"
  - [ ] Invalid email → Shows "Please enter a valid email address"
  - [ ] Valid email → No error
- [ ] Form submission works:
  - [ ] Enter valid email: `test@example.com`
  - [ ] Click submit
  - [ ] Loading state shows ("Joining...")
  - [ ] Success message appears OR error is handled gracefully
- [ ] Error handling works:
  - [ ] Network error → Shows error message
  - [ ] API error → Shows error message
  - [ ] Error clears when user starts typing
- [ ] Accessibility:
  - [ ] ARIA labels are present
  - [ ] Error messages are announced to screen readers
  - [ ] Keyboard navigation works (Tab to navigate)

**How to Test**:
1. Scroll to Waitlist Form section
2. Try submitting empty form → Should show validation error
3. Enter invalid email (e.g., "invalid") → Should show validation error
4. Enter valid email → Button should enable
5. Submit form → Check console for API call
6. Verify loading state appears
7. Check success/error message appears
8. Test error recovery (if error occurs, typing should clear it)

**API Test**:
- Open browser console → Network tab
- Submit form
- Check for POST request to `/v1/waitlist/subscribe`
- Verify request includes:
  - Headers: `Content-Type: application/json`, `x-api-key: ...`
  - Body: `{"email": "test@example.com"}`
- Check response (should be 200 with success message OR handled error)

---

### 8. Newsletter Signup (Footer) ✅

**Location**: Footer section at bottom of page

**Tests**:
- [ ] Newsletter form is visible in footer
- [ ] Email input field is present
- [ ] Submit button is visible
- [ ] Form validation works (same as waitlist)
- [ ] Form submission works:
  - [ ] Enter email
  - [ ] Submit
  - [ ] Check API call to `/v1/newsletter/subscribe`
  - [ ] Verify success/error handling
- [ ] Success message appears on successful submission

**How to Test**:
1. Scroll to bottom of page (Footer)
2. Find newsletter signup form
3. Enter email address
4. Submit form
5. Check browser console → Network tab
6. Verify POST request to `/v1/newsletter/subscribe`
7. Check response and success message

---

## Cross-Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Responsive Testing

Test at different viewport sizes:
- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1920px width)
- [ ] Large desktop (2560px width)

**How to Test**:
1. Open browser DevTools (F12)
2. Click device toolbar icon (or Ctrl+Shift+M)
3. Select different device sizes
4. Verify all sections render correctly
5. Check navigation and interactions work

---

## Performance Testing

- [ ] Page loads in < 3 seconds
- [ ] Images load properly (no broken images)
- [ ] No console errors
- [ ] Smooth scrolling
- [ ] Animations are smooth (60fps)
- [ ] No layout shifts (CLS)

**How to Test**:
1. Open DevTools → Performance tab
2. Record page load
3. Check for:
   - Large layout shifts
   - Long tasks
   - Memory leaks
4. Use Lighthouse (DevTools → Lighthouse tab):
   - Run Performance audit
   - Check Core Web Vitals

---

## Accessibility Testing

- [ ] Screen reader compatibility:
  - [ ] Use VoiceOver (Mac) or NVDA (Windows)
  - [ ] Navigate through page with keyboard
  - [ ] Verify all content is announced
- [ ] Keyboard navigation:
  - [ ] Tab through all interactive elements
  - [ ] Enter/Space activates buttons
  - [ ] Arrow keys navigate carousel
- [ ] Color contrast:
  - [ ] Text is readable
  - [ ] Buttons have sufficient contrast
- [ ] ARIA labels:
  - [ ] Forms have proper labels
  - [ ] Error messages have role="alert"
  - [ ] Live regions announce dynamic content

**How to Test**:
1. Enable screen reader (VoiceOver: Cmd+F5)
2. Navigate page with Tab key
3. Check DevTools → Accessibility tab
4. Use axe DevTools extension (if installed)

---

## Network Testing

Test with different network conditions:
- [ ] Fast 3G
- [ ] Slow 3G
- [ ] Offline mode (test error handling)

**How to Test**:
1. DevTools → Network tab
2. Throttling dropdown → Select "Slow 3G"
3. Reload page and test functionality
4. Test offline: DevTools → Application → Service Workers → Offline checkbox

---

## Error Scenarios

- [ ] API returns error → Error message displayed
- [ ] Network offline → Network error recovery shown
- [ ] Invalid API response → Handled gracefully
- [ ] Rate limit exceeded → Appropriate error message

---

## Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________
OS: ___________

Section              | Status | Notes
---------------------|--------|------------------
Problem Recognition  |   ✅   |
Empathy              |   ✅   |
Solution Intro       |   ✅   |
How It Works         |   ✅   |
Feature Carousel     |   ✅   |
Development Notice   |   ✅   |
Waitlist Form        |   ✅   |
Newsletter Footer    |   ✅   |
Responsive           |   ✅   |
Accessibility        |   ✅   |
Performance          |   ✅   |

Issues Found:
1. 
2. 
3. 
```

---

## Quick Test Script

Run this in browser console to quickly test all sections:

```javascript
// Test all sections are present
const sections = [
  'problem',
  'empathy', 
  'solution',
  'how-it-works',
  'carousel',
  'waitlist'
];

sections.forEach(id => {
  const el = document.getElementById(id);
  console.log(`${id}:`, el ? '✅ Found' : '❌ Missing');
});

// Test carousel
const carousel = document.querySelector('[role="region"][aria-labelledby="carousel-title"]');
console.log('Carousel:', carousel ? '✅ Found' : '❌ Missing');

// Test waitlist form
const waitlistForm = document.querySelector('form[aria-label*="Waitlist"]');
console.log('Waitlist Form:', waitlistForm ? '✅ Found' : '❌ Missing');

// Test newsletter form
const newsletterForm = document.querySelector('form[aria-label*="Newsletter"]');
console.log('Newsletter Form:', newsletterForm ? '✅ Found' : '❌ Missing');
```

---

## Next Steps After Testing

1. Document any issues found
2. Fix critical bugs
3. Retest fixed issues
4. Update test results
5. Deploy to staging/production
