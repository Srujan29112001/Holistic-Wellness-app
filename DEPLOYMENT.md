# 🚀 DEPLOYMENT GUIDE - Vercel Production Deployment

**Status:** Ready for Production Deployment
**Target Platform:** Vercel
**Deployment Type:** One-Click GitHub Integration

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Environment Variables Required

Create these in Vercel Dashboard after connecting your repository:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Anthropic AI (REQUIRED)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# External APIs (OPTIONAL - Platform works without these)
USDA_API_KEY=your_usda_api_key_here
VEDIC_ASTRO_API_KEY=your_vedic_astro_key_here
EDAMAM_APP_ID=your_edamam_app_id
EDAMAM_APP_KEY=your_edamam_app_key
SPOONACULAR_API_KEY=your_spoonacular_key

# Redis (OPTIONAL - For caching in production)
REDIS_URL=redis://your-redis-url

# Monitoring (OPTIONAL - Recommended for production)
HELICONE_API_KEY=your_helicone_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 2. Supabase Database Setup

**CRITICAL**: Ensure your Supabase database is fully configured:

✅ **Run SQL Schema** (if not done already):
1. Go to Supabase Dashboard → SQL Editor
2. Execute `lib/supabase/schema.sql` (all tables, indexes, RLS policies)
3. Verify TimescaleDB extension is enabled
4. Verify all 9 tables exist:
   - user_profiles
   - wellness_plans
   - meals
   - meal_logs
   - mental_health_sessions
   - mood_entries (with TimescaleDB)
   - spiritual_practices
   - daily_schedules
   - activity_logs

✅ **Verify Row-Level Security**:
```sql
-- Run this to check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All should show rowsecurity = true
```

✅ **Test Authentication**:
- Ensure Supabase Auth is enabled
- Email provider configured
- Site URL updated for production domain

### 3. Git Repository Status

Current branch: `claude/wellness-genai-app-setup-01SArgS6cd7mGnBZWKVbRpsu`

**Actions needed**:
1. Merge feature branch to `main` (or deploy from feature branch)
2. Ensure all commits are pushed
3. Repository is connected to Vercel

---

## 🎯 VERCEL DEPLOYMENT STEPS

### Step 1: Connect GitHub Repository

1. **Login to Vercel**: https://vercel.com
2. **Click "Add New Project"**
3. **Import Git Repository**:
   - Select your GitHub account
   - Choose repository: `Srujan29112001/Holistic-Wellness-app`
   - Click "Import"

### Step 2: Configure Project Settings

#### Framework Preset:
- **Framework**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)

#### Environment Variables:

Click **"Add Environment Variable"** and add ALL variables from section above.

**CRITICAL VARIABLES** (Must have these):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
```

**Note**: `NEXT_PUBLIC_*` variables are exposed to the browser (safe for public keys only).

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Vercel will:
   - Install dependencies (`npm install`)
   - Run build (`npm run build`)
   - Deploy to production URL

### Step 4: Get Your Production URL

After successful deployment:
- **Production URL**: `https://your-project-name.vercel.app`
- **Custom Domain** (optional): Can be configured in Settings

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Test 1: Homepage & Authentication

1. **Visit Production URL**: `https://your-project.vercel.app`
2. **Verify**:
   - ✅ Landing page loads with hero section
   - ✅ "Get Started Free" button works
   - ✅ "Sign In" button works

### Test 2: User Registration Flow

1. **Click "Get Started Free"**
2. **Sign up with test account**:
   - Email: `test@yourproductiondomain.com`
   - Password: `testpass123`
3. **Verify**:
   - ✅ Account created in Supabase Auth
   - ✅ Redirected to `/onboarding`
   - ✅ No console errors

### Test 3: Onboarding Wizard

1. **Complete all 7 steps**:
   - Step 1: Age (25), Gender (Male), Height (175), Weight (70)
   - Step 2: Activity Level (Moderate)
   - Step 3: Health Conditions (None), Allergies (None)
   - Step 4: Diet (Omnivore), Cuisines (Italian, Indian)
   - Step 5: Wake (07:00), Sleep (23:00), Work (09:00-17:00)
   - Step 6: Goals (Weight loss), Target Weight (65)
   - Step 7: Birth Date (Optional), Spiritual Interests (Meditation, Yoga)

2. **Verify**:
   - ✅ All steps save data
   - ✅ Progress bar updates
   - ✅ Back/Continue buttons work
   - ✅ Redirected to `/dashboard` after completion
   - ✅ Profile saved to `user_profiles` table

### Test 4: Wellness Plan Generation

1. **On Dashboard**, click **"Generate Today's Plan"**
2. **Wait 10-30 seconds** (AI generation)
3. **Verify**:
   - ✅ Loading indicator shows
   - ✅ Plan generates successfully
   - ✅ All 4 sections display:
     - 🥗 Nutrition Plan (meals with calories)
     - 🧘 Mental Wellness (meditation recommendations)
     - ✨ Spiritual Guidance (insights)
     - 📅 Daily Schedule (timeline)
   - ✅ Quick stats cards populate
   - ✅ No API errors in console
   - ✅ Plan saved to `wellness_plans` table

### Test 5: Mood Tracking

1. **Navigate to Mood Tracking** (sidebar)
2. **Fill out form**:
   - Mood: 4
   - Energy: 3
   - Stress: 2
   - Sleep Hours: 7.5
   - Notes: "Feeling good today"
3. **Submit**
4. **Verify**:
   - ✅ Success message shows
   - ✅ Entry saved to `mood_entries` table
   - ✅ No errors

### Test 6: Navigation & Auth

1. **Test all sidebar links**: Dashboard, Meals, Mood, Settings
2. **Sign Out**
3. **Verify**:
   - ✅ Redirected to homepage
   - ✅ Session cleared
4. **Sign back in**
5. **Verify**:
   - ✅ Redirected to dashboard
   - ✅ Previous data persists
   - ✅ Wellness plan still visible

---

## 🔍 VERCEL DASHBOARD MONITORING

After deployment, monitor these in Vercel:

### Analytics Tab:
- Page views
- Unique visitors
- Top pages
- Device breakdown

### Logs Tab (Real-time):
- API route calls
- Server errors
- Build logs
- Function invocations

### Performance Tab:
- Core Web Vitals
- Page load times
- API response times

---

## 🐛 COMMON DEPLOYMENT ISSUES & FIXES

### Issue 1: Build Fails - "Module not found"

**Cause**: Missing dependency in `package.json`

**Fix**:
```bash
# Verify all dependencies are installed locally
npm install

# If build works locally, redeploy to Vercel
```

### Issue 2: "Supabase client error" on production

**Cause**: Environment variables not set correctly

**Fix**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Check for typos or extra spaces
4. Redeploy after fixing

### Issue 3: "Authentication failed" errors

**Cause**: Supabase site URL mismatch

**Fix**:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add Vercel production URL to "Site URL": `https://your-project.vercel.app`
3. Add to "Redirect URLs": `https://your-project.vercel.app/**`

### Issue 4: API routes return 500 errors

**Cause**: Missing `ANTHROPIC_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

**Fix**:
1. Verify both keys are set in Vercel environment variables
2. Check Anthropic API key has sufficient credits
3. Verify Supabase service role key is correct
4. Redeploy

### Issue 5: RLS policy errors - "new row violates row-level security"

**Cause**: RLS policies not properly configured

**Fix**:
```sql
-- Run in Supabase SQL Editor to verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Should see policies like:
-- user_profiles_select_policy, user_profiles_insert_policy, etc.
```

---

## 🔐 SECURITY CHECKLIST

Before going live with real users:

- ✅ **Environment Variables**: Never commit `.env.local` to Git
- ✅ **API Keys**: Use Vercel environment variables, not hardcoded
- ✅ **Supabase RLS**: Verify all tables have RLS enabled
- ✅ **CORS**: Configured in Supabase for your production domain
- ✅ **Rate Limiting**: Consider implementing (see below)
- ✅ **Error Handling**: Sensitive errors not exposed to users
- ✅ **HTTPS**: Vercel provides SSL automatically
- ✅ **Auth Tokens**: Stored in httpOnly cookies (Supabase default)

### Optional: Add Rate Limiting

Install Vercel Edge Config for rate limiting:
```bash
npm install @vercel/edge-config
```

Add middleware:
```typescript
// middleware.ts
import { ratelimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

---

## 📊 MONITORING SETUP (Optional but Recommended)

### Option 1: Helicone (AI Request Monitoring)

1. **Sign up**: https://helicone.ai
2. **Get API Key**
3. **Add to Vercel Environment Variables**:
   ```
   HELICONE_API_KEY=sk-helicone-your-key
   ```
4. **Update Anthropic client** in `lib/clients/anthropic.ts`:
   ```typescript
   const anthropic = new Anthropic({
     apiKey: process.env.ANTHROPIC_API_KEY,
     baseURL: 'https://anthropic.helicone.ai/v1',
     defaultHeaders: {
       'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}`
     }
   });
   ```

### Option 2: Sentry (Error Tracking)

1. **Sign up**: https://sentry.io
2. **Install**:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```
3. **Add DSN to Vercel**:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

### Option 3: Vercel Analytics (Built-in)

Already enabled automatically! View in Vercel Dashboard → Analytics.

---

## 🌐 CUSTOM DOMAIN SETUP (Optional)

### Add Your Own Domain:

1. **Go to Vercel Dashboard** → Your Project → Settings → Domains
2. **Add Domain**: e.g., `wellness.yourdomain.com`
3. **Configure DNS** (at your domain registrar):
   - **Type**: CNAME
   - **Name**: `wellness` (or `@` for root)
   - **Value**: `cname.vercel-dns.com`
4. **Wait for DNS propagation** (5-60 minutes)
5. **Vercel will auto-provision SSL certificate**

### Update Supabase URLs:

After custom domain is live:
1. **Supabase Dashboard** → Authentication → URL Configuration
2. **Update Site URL**: `https://wellness.yourdomain.com`
3. **Update Redirect URLs**: `https://wellness.yourdomain.com/**`

---

## 🚦 GO-LIVE READINESS

### MVP is Production-Ready ✅

Your application is ready for:
- ✅ **Beta User Testing** (10-100 users)
- ✅ **Demo Presentations**
- ✅ **Investor Pitches**
- ✅ **Portfolio Showcase**

### Not Yet Ready For:
- ❌ **Large-scale production** (1000+ users) - Need caching, rate limiting
- ❌ **Enterprise customers** - Need SOC2, HIPAA compliance
- ❌ **International deployment** - Need edge regions, i18n

### To Scale to 1000+ Users:

1. **Add Redis caching** (Upstash or Vercel KV)
2. **Implement rate limiting** (Vercel Edge Config)
3. **Add comprehensive tests** (Jest, Playwright)
4. **Set up CI/CD** (GitHub Actions)
5. **Enable monitoring** (Sentry, Helicone)
6. **Optimize database** (Supabase connection pooling)
7. **Add CDN** (Vercel automatic)

---

## 📝 DEPLOYMENT COMMAND SUMMARY

### One-Time Setup:
```bash
# 1. Push all code to GitHub
git push -u origin claude/wellness-genai-app-setup-01SArgS6cd7mGnBZWKVbRpsu

# 2. Go to vercel.com and import repository

# 3. Configure environment variables in Vercel Dashboard

# 4. Deploy (automatic)
```

### Future Deployments:
```bash
# Just push to your branch - Vercel auto-deploys
git add .
git commit -m "feat: New feature"
git push
```

### Rollback (if needed):
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

---

## 🎉 SUCCESS METRICS

After deployment, you should see:

- ✅ Production URL live and accessible
- ✅ All pages load without errors
- ✅ User signup flow works end-to-end
- ✅ Wellness plan generation completes in <30 seconds
- ✅ Database operations succeed
- ✅ No console errors on critical paths
- ✅ Mobile responsive (test on phone)
- ✅ Vercel Analytics showing traffic

---

## 📞 SUPPORT & RESOURCES

### Vercel Documentation:
- **Deployment**: https://vercel.com/docs/deployments/overview
- **Environment Variables**: https://vercel.com/docs/environment-variables
- **Troubleshooting**: https://vercel.com/docs/troubleshooting

### Supabase Documentation:
- **Production Checklist**: https://supabase.com/docs/guides/platform/going-into-prod
- **Auth Configuration**: https://supabase.com/docs/guides/auth

### Need Help?
- Vercel Discord: https://vercel.com/discord
- Supabase Discord: https://discord.supabase.com

---

## ✅ FINAL CHECKLIST

Before clicking "Deploy":

- [ ] All environment variables configured in Vercel
- [ ] Supabase database schema fully deployed
- [ ] All RLS policies enabled
- [ ] Site URL updated in Supabase Auth settings
- [ ] Latest code pushed to GitHub
- [ ] `package.json` has all dependencies
- [ ] No `.env.local` committed to Git
- [ ] Build works locally (`npm run build`)

**Ready to deploy!** 🚀

---

**Deployment Time**: ~5 minutes
**First Build Time**: ~2-3 minutes
**Time to First User**: ~10 minutes (including testing)

**Your MVP is ready to change lives!** 🌟
