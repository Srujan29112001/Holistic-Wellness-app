# ✅ POST-DEPLOYMENT VERIFICATION TESTS

**Run these tests immediately after deployment to verify everything works**

**Production URL**: `https://your-project.vercel.app`

---

## 🎯 CRITICAL PATH TESTING (15 min)

### Test 1: Homepage Load ✅
**Time**: 1 minute

1. Open production URL in browser
2. **Verify**:
   - ✅ Page loads within 3 seconds
   - ✅ Hero section displays: "🌟 Holistic Wellness AI"
   - ✅ 4 feature cards visible (Nutrition, Mental, Spiritual, Schedule)
   - ✅ Stats section shows: "AI-Powered", "4 Domains", "Personalized"
   - ✅ "Get Started Free" button visible
   - ✅ "Sign In" button visible
   - ✅ No console errors (F12 → Console tab)

**Expected Behavior**: Clean homepage with no errors

---

### Test 2: User Registration ✅
**Time**: 2 minutes

1. Click **"Get Started Free"**
2. **Verify**: Redirected to `/signup`
3. Enter test credentials:
   - **Email**: `test-user-001@yourdomain.com`
   - **Password**: `TestPassword123!`
   - **Confirm Password**: `TestPassword123!`
4. Click **"Sign Up"**
5. **Verify**:
   - ✅ Loading spinner appears
   - ✅ No errors in console
   - ✅ Redirected to `/onboarding` (not `/dashboard`)
   - ✅ Onboarding page loads

**Check in Supabase Dashboard**:
1. Go to Supabase → Authentication → Users
2. **Verify**: New user `test-user-001@yourdomain.com` exists

**Expected Behavior**: User created and redirected to onboarding

---

### Test 3: Onboarding Flow ✅
**Time**: 4 minutes

**Step 1: Basic Information**
- Age: `30`
- Gender: `Male`
- Height: `175` cm
- Weight: `75` kg
- Click **"Continue"**
- **Verify**: Progress bar updates (1/7)

**Step 2: Physical Activity**
- Select: **"Moderate - Exercise 3-5 days/week"**
- Click **"Continue"**
- **Verify**: Progress bar updates (2/7)

**Step 3: Health Information**
- Health Conditions: Leave empty (or select if testing)
- Allergies: Leave empty
- Medications: Leave empty
- Click **"Continue"**
- **Verify**: Progress bar updates (3/7)

**Step 4: Dietary Preferences**
- Diet Type: **"Omnivore"**
- Cuisine Preferences: Select **"Italian", "Indian", "Japanese"**
- Click **"Continue"**
- **Verify**: Progress bar updates (4/7)

**Step 5: Daily Routine**
- Wake Time: `07:00`
- Sleep Time: `23:00`
- Work Start: `09:00`
- Work End: `17:00`
- Click **"Continue"**
- **Verify**: Progress bar updates (5/7)

**Step 6: Wellness Goals**
- Select: **"Better Sleep", "Stress Management"**
- Target Weight: Leave empty (optional)
- Click **"Continue"**
- **Verify**: Progress bar updates (6/7)

**Step 7: Spiritual Wellness**
- Birth Date: Leave empty (optional) OR enter: `1994-03-15`
- Spiritual Interests: Select **"Meditation", "Yoga"**
- Click **"Complete Onboarding"**

**Verify**:
- ✅ Loading spinner appears
- ✅ Redirected to `/dashboard`
- ✅ No console errors

**Check in Supabase Dashboard**:
1. Go to Supabase → Table Editor → `user_profiles`
2. **Verify**: New profile row exists for the test user
3. **Verify**: `target_calories` is calculated (should be ~2400-2600 for example above)

**Expected Behavior**: Profile created with calculated calories, redirected to dashboard

---

### Test 4: Dashboard Initial State ✅
**Time**: 1 minute

After onboarding completes:

**Verify Dashboard Welcome State**:
- ✅ URL is `/dashboard`
- ✅ See welcome message: "Welcome to Your Wellness Dashboard"
- ✅ See card with star icon 🌟
- ✅ Button displays: "Generate Today's Plan"
- ✅ No errors in console
- ✅ Sidebar navigation visible:
  - 📊 Dashboard
  - 🍽️ Meal Plans
  - 😊 Mood Tracking

**Expected Behavior**: Dashboard loads in "empty state" mode ready for plan generation

---

### Test 5: Wellness Plan Generation ✅
**Time**: 2-3 minutes

1. Click **"Generate Today's Plan"** button
2. **Verify**:
   - ✅ Button shows loading spinner
   - ✅ Page displays: "Generating Your Wellness Plan..."
   - ✅ Spinner animation visible
   - ✅ Text: "This may take a moment..."

3. **Wait 10-30 seconds** (AI processing time)

4. **After generation completes, verify**:
   - ✅ Loading disappears
   - ✅ Page title: "Today's Wellness Plan"
   - ✅ Date displays correctly (e.g., "Monday, November 14, 2024")
   - ✅ "Regenerate Plan" button visible

**Verify Quick Stats Cards**:
- ✅ Card 1: Calories (e.g., "2400") 🍽️
- ✅ Card 2: Protein (e.g., "150g") 💪
- ✅ Card 3: Wellness Activities (e.g., "3") 😊
- ✅ Card 4: Scheduled activities (e.g., "12") ⭐

**Verify Nutrition Plan Section**:
- ✅ Section title: "🥗 Nutrition Plan"
- ✅ At least 3 meals displayed (Breakfast, Lunch, Dinner)
- ✅ Each meal shows:
  - Meal name (e.g., "Oatmeal with Berries")
  - Description
  - Calories (e.g., "450 kcal")
  - Macros (P: Xg | C: Yg | F: Zg)
- ✅ Total nutrition summary visible
- ✅ Nutrition tips section (blue background box)

**Verify Mental Wellness Section**:
- ✅ Section title: "🧘 Mental Wellness"
- ✅ At least 2-3 recommendations
- ✅ Each recommendation shows:
  - Title (e.g., "Morning Meditation")
  - Description
  - Duration (e.g., "⏱️ 10 minutes")
  - Timing (e.g., "🕐 Morning")

**Verify Spiritual Guidance Section**:
- ✅ Section title: "✨ Spiritual Guidance"
- ✅ Daily guidance insights (purple boxes)
- ✅ At least 1-2 insights visible
- ✅ Spiritual practices section (if applicable)

**Verify Daily Schedule Section**:
- ✅ Section title: "📅 Daily Schedule"
- ✅ Timeline of activities
- ✅ Each activity shows:
  - Start time (e.g., "07:00")
  - Activity name
  - Category label
- ✅ Activities sorted by time

**Check in Supabase Dashboard**:
1. Go to Supabase → Table Editor → `wellness_plans`
2. **Verify**: New plan row for today's date
3. **Verify**: `plan` column contains JSON data

**Check Console**:
- ✅ No errors in browser console
- ✅ No 500 errors in Network tab (F12 → Network)

**Expected Behavior**: Full plan generated with all 4 sections populated

---

### Test 6: Navigation & Persistence ✅
**Time**: 2 minutes

1. Click **"Meal Plans"** in sidebar
2. **Verify**:
   - ✅ Navigates to `/meals`
   - ✅ Shows "Coming Soon" card
   - ✅ No errors

3. Click **"Mood Tracking"** in sidebar
4. **Verify**:
   - ✅ Navigates to `/mood`
   - ✅ Shows "Today's Check-in" form
   - ✅ All sliders visible (Mood, Energy, Stress)
   - ✅ Sleep hours input visible

5. Click **"Dashboard"** in sidebar
6. **Verify**:
   - ✅ Returns to `/dashboard`
   - ✅ **Previous wellness plan still visible** (data persisted!)
   - ✅ No need to regenerate

**Expected Behavior**: Navigation works, data persists across page changes

---

### Test 7: Mood Tracking ✅
**Time**: 2 minutes

1. Navigate to **Mood Tracking** page
2. Fill out form:
   - **Mood**: Slide to `4` (🙂)
   - **Energy**: Slide to `3` (🔋🔋🔋)
   - **Stress**: Slide to `2` (😌)
   - **Sleep Hours**: Enter `7.5`
   - **Notes**: "Testing mood tracking feature"
3. Click **"Save Mood Entry"**
4. **Verify**:
   - ✅ Loading spinner on button
   - ✅ Success message: "Mood logged successfully! 🎉"
   - ✅ Green success banner appears
   - ✅ Notes field clears after save

**Check in Supabase Dashboard**:
1. Go to Supabase → Table Editor → `mood_entries`
2. **Verify**: New entry with today's date
3. **Verify**: Mood=4, Energy=3, Stress=2, Sleep=7.5
4. **Verify**: Notes contains text

**Expected Behavior**: Mood entry saved to TimescaleDB hypertable

---

### Test 8: Sign Out & Sign In ✅
**Time**: 2 minutes

1. Click **"Sign Out"** button (top right)
2. **Verify**:
   - ✅ Redirected to homepage (`/`)
   - ✅ Session cleared (not auto-redirected to dashboard)

3. Click **"Sign In"** button
4. **Verify**: Redirected to `/login`

5. Enter credentials:
   - **Email**: `test-user-001@yourdomain.com`
   - **Password**: `TestPassword123!`
6. Click **"Sign In"**
7. **Verify**:
   - ✅ Loading spinner appears
   - ✅ Redirected to `/dashboard` (NOT `/onboarding`)
   - ✅ Previous wellness plan still visible
   - ✅ User profile data persisted

**Expected Behavior**: Auth works, returning users go straight to dashboard

---

### Test 9: Mobile Responsive ✅
**Time**: 2 minutes

**Option 1: Chrome DevTools**
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select: iPhone 12 Pro (or any mobile device)

**Option 2: Real Mobile Device**
1. Open production URL on your phone

**Verify on Mobile**:
- ✅ Homepage displays correctly (no horizontal scroll)
- ✅ Feature cards stack vertically
- ✅ Navigation menu works
- ✅ Onboarding forms usable on small screen
- ✅ Dashboard cards stack vertically
- ✅ All text readable (font sizes appropriate)
- ✅ Buttons tappable (not too small)
- ✅ Form inputs work with mobile keyboard

**Expected Behavior**: Fully responsive on mobile devices

---

### Test 10: Error Handling ✅
**Time**: 1 minute

**Test Invalid Login**:
1. Go to `/login`
2. Enter wrong credentials:
   - Email: `wrong@email.com`
   - Password: `wrongpass`
3. Click **"Sign In"**
4. **Verify**:
   - ✅ Error message displays
   - ✅ User stays on login page
   - ✅ No console errors

**Test Duplicate Registration**:
1. Go to `/signup`
2. Try to sign up with existing email: `test-user-001@yourdomain.com`
3. **Verify**:
   - ✅ Error message displays
   - ✅ User stays on signup page

**Expected Behavior**: Errors handled gracefully

---

## 🔍 VERCEL DASHBOARD CHECKS

### 1. Deployment Status
- Go to: Vercel Dashboard → Your Project → Deployments
- **Verify**:
  - ✅ Latest deployment shows "Ready"
  - ✅ Build time: ~2-3 minutes
  - ✅ No build errors

### 2. Analytics
- Go to: Vercel Dashboard → Your Project → Analytics
- **Verify**:
  - ✅ Page views showing up (from your tests)
  - ✅ At least 1 unique visitor (you)
  - ✅ Top pages: `/`, `/signup`, `/dashboard`

### 3. Logs (Real-time)
- Go to: Vercel Dashboard → Your Project → Logs
- Enable real-time logs
- Generate a new wellness plan
- **Verify**:
  - ✅ API route logs appear: `POST /api/wellness/plan`
  - ✅ No 500 errors
  - ✅ Response status: 200

### 4. Speed Insights
- Go to: Vercel Dashboard → Your Project → Speed Insights
- **Verify** (after a few page loads):
  - ✅ LCP (Largest Contentful Paint) < 2.5s
  - ✅ FID (First Input Delay) < 100ms
  - ✅ CLS (Cumulative Layout Shift) < 0.1

---

## 🗄️ SUPABASE DASHBOARD CHECKS

### 1. Users Created
- Go to: Supabase → Authentication → Users
- **Verify**:
  - ✅ At least 1 user (your test account)
  - ✅ Email verified status (if email confirmation enabled)

### 2. Database Tables Populated

**user_profiles**:
- Go to: Supabase → Table Editor → `user_profiles`
- **Verify**:
  - ✅ 1 row with your test user's data
  - ✅ `target_calories` calculated (e.g., 2400-2600)
  - ✅ All fields populated from onboarding

**wellness_plans**:
- Go to: Supabase → Table Editor → `wellness_plans`
- **Verify**:
  - ✅ 1 row with today's date
  - ✅ `plan` column contains JSON data
  - ✅ `user_id` matches your test user

**mood_entries**:
- Go to: Supabase → Table Editor → `mood_entries`
- **Verify**:
  - ✅ 1 row with today's date
  - ✅ Mood, energy, stress values match what you entered
  - ✅ Notes field has your test text

### 3. API Logs
- Go to: Supabase → Logs → API
- **Verify**:
  - ✅ Recent requests logged
  - ✅ No 500 errors
  - ✅ Requests from your Vercel domain

---

## 💰 COST MONITORING

### Anthropic API Usage
1. Go to: https://console.anthropic.com
2. Navigate to: Usage
3. **Check**:
   - Requests made: ~4 (coordinator + 4 agents for one plan)
   - Tokens used: ~8,000-15,000
   - Cost: ~$0.05-0.10 per plan

### Supabase Usage
1. Go to: Supabase → Settings → Usage
2. **Check**:
   - Database size: < 10 MB
   - Bandwidth: < 100 MB
   - Auth users: 1

### Vercel Bandwidth
1. Go to: Vercel Dashboard → Settings → Usage
2. **Check**:
   - Bandwidth: < 1 GB
   - Serverless function executions: ~20-30

---

## ✅ SUCCESS CRITERIA

### All Tests Pass ✅
- ✅ Homepage loads
- ✅ User registration works
- ✅ Onboarding completes and saves profile
- ✅ Wellness plan generates with all 4 sections
- ✅ Navigation works across all pages
- ✅ Mood tracking saves to database
- ✅ Sign out / sign in persists data
- ✅ Mobile responsive
- ✅ Error handling graceful
- ✅ No console errors on critical paths

### Dashboard Data ✅
- ✅ Vercel deployment shows "Ready"
- ✅ Vercel logs show successful API calls
- ✅ Supabase tables populated correctly
- ✅ Analytics tracking page views

### Performance ✅
- ✅ Homepage loads < 3 seconds
- ✅ Wellness plan generates < 30 seconds
- ✅ No timeout errors
- ✅ Core Web Vitals in acceptable range

---

## 🚨 WHAT TO DO IF TESTS FAIL

### If Homepage Won't Load:
1. Check Vercel deployment status
2. Check environment variables set
3. View Vercel logs for build errors
4. Try redeploying

### If User Registration Fails:
1. Check Supabase Auth settings (email provider enabled)
2. Check Site URL configured correctly
3. Check browser console for errors
4. Verify `NEXT_PUBLIC_SUPABASE_*` variables

### If Onboarding Doesn't Save:
1. Check Supabase RLS policies
2. Check `user_profiles` table exists
3. Check browser Network tab for 500 errors
4. Verify `SUPABASE_SERVICE_ROLE_KEY` set

### If Plan Generation Fails:
1. Check `ANTHROPIC_API_KEY` set in Vercel
2. Check API key has credits in Anthropic Console
3. Check Vercel logs for error details
4. Check Network tab for 500 response

### If Database Doesn't Populate:
1. Re-run `lib/supabase/schema.sql`
2. Verify RLS policies created
3. Check Supabase logs for errors
4. Test queries in Supabase SQL Editor

---

## 📊 TEST RESULTS TEMPLATE

Copy and fill this out as you test:

```
## POST-DEPLOYMENT TEST RESULTS
Date: __________
Tester: __________
Production URL: __________

### Critical Path Tests
- [ ] Test 1: Homepage Load - PASS / FAIL
- [ ] Test 2: User Registration - PASS / FAIL
- [ ] Test 3: Onboarding Flow - PASS / FAIL
- [ ] Test 4: Dashboard Initial - PASS / FAIL
- [ ] Test 5: Plan Generation - PASS / FAIL
- [ ] Test 6: Navigation - PASS / FAIL
- [ ] Test 7: Mood Tracking - PASS / FAIL
- [ ] Test 8: Auth Flow - PASS / FAIL
- [ ] Test 9: Mobile Responsive - PASS / FAIL
- [ ] Test 10: Error Handling - PASS / FAIL

### Dashboard Checks
- [ ] Vercel deployment status - READY / ERROR
- [ ] Vercel logs - NO ERRORS / ERRORS FOUND
- [ ] Supabase users created - YES / NO
- [ ] Supabase tables populated - YES / NO

### Performance
- Homepage load time: _____ seconds
- Plan generation time: _____ seconds
- Mobile usable: YES / NO

### Issues Found
(List any issues or errors encountered)

### Overall Status
READY FOR BETA USERS / NEEDS FIXES
```

---

## 🎉 DEPLOYMENT SUCCESS!

If all tests pass, **congratulations!** Your Holistic Wellness MVP is live and ready for beta users!

**Next Steps**:
1. Share production URL with 2-3 friends for feedback
2. Monitor Vercel logs for any unexpected errors
3. Check Anthropic API usage daily
4. Set up monitoring (Helicone, Sentry) for production use

**Your wellness platform is changing lives!** 🌟

---

**Total Test Time**: ~15 minutes
**Recommended Frequency**: After every deployment
**Test Coverage**: Full user journey from signup to daily plan
