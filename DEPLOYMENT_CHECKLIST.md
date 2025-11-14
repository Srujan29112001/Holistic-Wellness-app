# ✅ DEPLOYMENT CHECKLIST

**Quick Reference Guide for Vercel Deployment**

---

## PRE-DEPLOYMENT (Do First)

### 1. Supabase Setup ✅

- [ ] Database schema deployed (`lib/supabase/schema.sql`)
- [ ] All 9 tables created and visible in Supabase Dashboard
- [ ] TimescaleDB extension enabled on `mood_entries`
- [ ] RLS (Row-Level Security) enabled on all tables
- [ ] Auth providers configured (Email enabled)
- [ ] Test signup works in Supabase Auth dashboard

**Verify Tables Exist:**
```
✓ user_profiles
✓ wellness_plans
✓ meals
✓ meal_logs
✓ mental_health_sessions
✓ mood_entries
✓ spiritual_practices
✓ daily_schedules
✓ activity_logs
```

### 2. API Keys Ready 🔑

**REQUIRED (Must have these):**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (from Supabase project settings)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase API settings)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (from Supabase API settings)
- [ ] `ANTHROPIC_API_KEY` (from Anthropic Console)

**OPTIONAL (Platform works without these):**
- [ ] `USDA_API_KEY` (nutrition fallback)
- [ ] `VEDIC_ASTRO_API_KEY` (astrology features)
- [ ] `EDAMAM_APP_ID` & `EDAMAM_APP_KEY` (meal database)
- [ ] `SPOONACULAR_API_KEY` (recipe suggestions)

**MONITORING (Recommended for production):**
- [ ] `HELICONE_API_KEY` (AI request monitoring)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (error tracking)

### 3. Code Ready 💻

- [ ] All code committed to Git
- [ ] Latest commit pushed to GitHub
- [ ] Branch: `claude/wellness-genai-app-setup-01SArgS6cd7mGnBZWKVbRpsu`
- [ ] No `.env.local` in repository (should be in .gitignore)
- [ ] `npm run build` works locally without errors

---

## VERCEL DEPLOYMENT STEPS

### Step 1: Import Project (5 min)

1. [ ] Go to https://vercel.com/new
2. [ ] Click "Import Git Repository"
3. [ ] Select: `Srujan29112001/Holistic-Wellness-app`
4. [ ] Click "Import"

### Step 2: Configure Settings (3 min)

**Framework:** Next.js (auto-detected)
**Root Directory:** `./` (default)
**Build Command:** `npm run build` (auto-detected)
**Output Directory:** `.next` (auto-detected)

### Step 3: Add Environment Variables (5 min)

Click "Environment Variables" tab and add:

**CRITICAL - Add These First:**
```
NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJxxx...
SUPABASE_SERVICE_ROLE_KEY = eyJxxx...
ANTHROPIC_API_KEY = sk-ant-api03-xxx...
```

**Optional - Add If You Have Them:**
```
USDA_API_KEY = your_key
VEDIC_ASTRO_API_KEY = your_key
EDAMAM_APP_ID = your_id
EDAMAM_APP_KEY = your_key
SPOONACULAR_API_KEY = your_key
HELICONE_API_KEY = your_key
NEXT_PUBLIC_SENTRY_DSN = https://xxx@sentry.io/xxx
```

- [ ] All required variables added
- [ ] No typos or extra spaces
- [ ] Keys are valid and active

### Step 4: Deploy! (2-3 min build time)

1. [ ] Click "Deploy"
2. [ ] Wait for build to complete
3. [ ] Note your production URL: `https://your-project.vercel.app`

---

## POST-DEPLOYMENT TESTING (Critical!)

### Test 1: Homepage ✅
- [ ] Visit production URL
- [ ] Homepage loads with hero section
- [ ] No console errors (F12 → Console)

### Test 2: Sign Up Flow ✅
- [ ] Click "Get Started Free"
- [ ] Sign up: `test@yourdomain.com` / `testpass123`
- [ ] Verify redirected to `/onboarding`
- [ ] Check Supabase Auth dashboard - user created

### Test 3: Onboarding ✅
- [ ] Complete Step 1: Basic Info (age, gender, height, weight)
- [ ] Complete Step 2: Activity Level
- [ ] Complete Step 3: Health Info
- [ ] Complete Step 4: Diet Preferences
- [ ] Complete Step 5: Daily Routine (times)
- [ ] Complete Step 6: Health Goals
- [ ] Complete Step 7: Spiritual (optional)
- [ ] Click "Complete Onboarding"
- [ ] Verify redirected to `/dashboard`
- [ ] Check Supabase `user_profiles` table - profile created

### Test 4: Generate Wellness Plan ✅
- [ ] Click "Generate Today's Plan"
- [ ] Wait 10-30 seconds (loading spinner)
- [ ] Plan generates successfully
- [ ] See 4 sections:
  - [ ] Nutrition Plan (meals with calories)
  - [ ] Mental Wellness (recommendations)
  - [ ] Spiritual Guidance (insights)
  - [ ] Daily Schedule (timeline)
- [ ] Quick stats cards show correct numbers
- [ ] Check Supabase `wellness_plans` table - plan saved

### Test 5: Mood Tracking ✅
- [ ] Navigate to "Mood Tracking" (sidebar)
- [ ] Fill out form (mood, energy, stress, sleep)
- [ ] Add notes (optional)
- [ ] Click "Save Mood Entry"
- [ ] Success message appears
- [ ] Check Supabase `mood_entries` table - entry saved

### Test 6: Navigation ✅
- [ ] Click all sidebar links (Dashboard, Meals, Mood)
- [ ] All pages load without errors
- [ ] Sign out button works
- [ ] After sign out, redirected to homepage
- [ ] Sign back in
- [ ] Dashboard shows previous data (persisted)

### Test 7: Mobile Responsive ✅
- [ ] Open production URL on mobile device (or Chrome DevTools mobile view)
- [ ] Homepage displays correctly
- [ ] Onboarding wizard works on mobile
- [ ] Dashboard is readable on small screens
- [ ] Navigation menu works on mobile

---

## SUPABASE PRODUCTION CONFIG

### Update Auth Settings:

1. [ ] Go to Supabase Dashboard → Authentication → URL Configuration
2. [ ] Update **Site URL**: `https://your-project.vercel.app`
3. [ ] Update **Redirect URLs**: Add `https://your-project.vercel.app/**`
4. [ ] Save changes

### Verify CORS:

1. [ ] Go to Supabase Dashboard → API → CORS
2. [ ] Ensure your Vercel domain is allowed
3. [ ] Should auto-allow all origins by default (check if issues)

---

## VERCEL MONITORING SETUP

### Enable Analytics:
- [ ] Go to Vercel Dashboard → Your Project → Analytics
- [ ] Analytics are enabled by default (View page views, visitors)

### Check Logs:
- [ ] Go to Vercel Dashboard → Your Project → Logs
- [ ] Enable real-time logs
- [ ] Test API call and verify logs show up

### Performance:
- [ ] Go to Vercel Dashboard → Your Project → Speed Insights
- [ ] Check Core Web Vitals after first users visit
- [ ] Aim for: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## TROUBLESHOOTING COMMON ISSUES

### Issue: Build Fails ❌

**Check:**
- [ ] All dependencies in `package.json`
- [ ] `npm run build` works locally
- [ ] No TypeScript errors
- [ ] Environment variables set in Vercel

**Fix:** Redeploy after fixing errors

### Issue: "Supabase client error" ❌

**Check:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is correct
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- [ ] No typos or extra spaces in variables
- [ ] Variables are in "Production" environment in Vercel

**Fix:** Update variables in Vercel → Redeploy

### Issue: Authentication fails ❌

**Check:**
- [ ] Supabase Auth → Site URL matches production URL
- [ ] Redirect URLs include `https://your-domain.vercel.app/**`
- [ ] Email provider enabled in Supabase Auth

**Fix:** Update Supabase Auth settings

### Issue: API returns 500 errors ❌

**Check:**
- [ ] `ANTHROPIC_API_KEY` is set in Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- [ ] Anthropic API key has credits
- [ ] Check Vercel Logs for detailed error

**Fix:** Verify API keys → Redeploy

### Issue: RLS policy errors ❌

**Check:**
- [ ] All tables have RLS enabled in Supabase
- [ ] Policies created (check Supabase → Authentication → Policies)
- [ ] User ID matches in queries

**Fix:** Re-run `lib/supabase/schema.sql` RLS section

---

## OPTIONAL ENHANCEMENTS

### Custom Domain:
- [ ] Go to Vercel → Settings → Domains
- [ ] Add your domain: `wellness.yourdomain.com`
- [ ] Configure DNS CNAME: `cname.vercel-dns.com`
- [ ] Update Supabase Site URL to custom domain

### Error Tracking (Sentry):
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
- [ ] Add `NEXT_PUBLIC_SENTRY_DSN` to Vercel
- [ ] Redeploy

### AI Monitoring (Helicone):
- [ ] Sign up at https://helicone.ai
- [ ] Get API key
- [ ] Add `HELICONE_API_KEY` to Vercel
- [ ] Update Anthropic client to use Helicone proxy
- [ ] Redeploy

---

## SUCCESS CRITERIA ✅

### Deployment Successful When:
- ✅ Production URL loads without errors
- ✅ User can sign up and complete onboarding
- ✅ Wellness plan generates in < 30 seconds
- ✅ All 4 plan sections display correctly
- ✅ Mood tracking saves to database
- ✅ Navigation works across all pages
- ✅ Mobile responsive
- ✅ No console errors on critical paths
- ✅ Vercel Analytics showing traffic
- ✅ Supabase tables populating with data

### Ready for Beta Users When:
- ✅ All success criteria above met
- ✅ Test account can complete full user journey
- ✅ Error monitoring enabled (Sentry)
- ✅ AI monitoring enabled (Helicone)
- ✅ Custom domain configured (optional)
- ✅ Site URL updated in Supabase

---

## DEPLOYMENT TIMELINE

| Task | Time Estimate |
|------|---------------|
| Pre-deployment setup | 10 min |
| Vercel import & config | 5 min |
| Build & deploy | 2-3 min |
| Post-deployment testing | 10 min |
| Supabase config updates | 5 min |
| **TOTAL** | **~30 min** |

---

## NEXT STEPS AFTER DEPLOYMENT

### Immediate (Day 1):
- [ ] Test with 2-3 beta users
- [ ] Monitor Vercel logs for errors
- [ ] Check Supabase dashboard for data
- [ ] Verify all API calls succeed

### Week 1:
- [ ] Add Sentry error tracking
- [ ] Add Helicone AI monitoring
- [ ] Set up custom domain (if desired)
- [ ] Create user feedback form
- [ ] Monitor performance metrics

### Week 2-4:
- [ ] Implement rate limiting
- [ ] Add Redis caching (Upstash)
- [ ] Create automated tests (Jest, Playwright)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Optimize database queries

---

## SUPPORT RESOURCES

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Anthropic Docs**: https://docs.anthropic.com

- **Vercel Discord**: https://vercel.com/discord
- **Supabase Discord**: https://discord.supabase.com

---

**Ready to Deploy!** 🚀

**Current Status**: All prerequisites complete
**Deployment Method**: One-click Vercel import
**Expected Downtime**: 0 seconds (new deployment)
**Rollback Available**: Yes (Vercel instant rollback)

**Your Holistic Wellness MVP is ready to go live!** 🌟
