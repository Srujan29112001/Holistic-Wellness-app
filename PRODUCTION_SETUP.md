# 🔧 PRODUCTION ENVIRONMENT SETUP

**Complete setup guide for production deployment**

---

## 1. SUPABASE DATABASE VERIFICATION

### Check All Tables Exist

Run this in Supabase SQL Editor:

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Output (9 tables):**
```
activity_logs
daily_schedules
meal_logs
meals
mental_health_sessions
mood_entries
spiritual_practices
user_profiles
wellness_plans
```

### Verify TimescaleDB Extension

```sql
-- Check if TimescaleDB is enabled
SELECT * FROM pg_extension WHERE extname = 'timescaledb';
```

**Expected:** Should return one row with `timescaledb`

### Check Hypertable for Mood Entries

```sql
-- Verify mood_entries is a hypertable
SELECT * FROM timescaledb_information.hypertables
WHERE hypertable_name = 'mood_entries';
```

**Expected:** Should return one row showing `mood_entries` as hypertable

### Verify Row-Level Security (RLS)

```sql
-- Check RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected:** All tables should have `rls_enabled = true`

### Check RLS Policies Exist

```sql
-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected Policies (minimum 4 per table = 36 total):**
- `{table}_select_policy`
- `{table}_insert_policy`
- `{table}_update_policy`
- `{table}_delete_policy`

### Verify Indexes

```sql
-- List all indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**Expected Key Indexes:**
- `user_profiles_user_id_idx` on `user_profiles(user_id)`
- `wellness_plans_user_id_date_idx` on `wellness_plans(user_id, date)`
- `mood_entries_user_id_date_idx` on `mood_entries(user_id, date)`
- Primary keys on all tables

### Test Database Connection

```sql
-- Simple test query
SELECT
  COUNT(*) as total_users,
  NOW() as current_time,
  version() as postgres_version;
```

**Expected:** Should return current time and PostgreSQL version (14.x or higher)

---

## 2. SUPABASE AUTH CONFIGURATION

### Enable Email Provider

1. **Go to**: Supabase Dashboard → Authentication → Providers
2. **Email Provider**:
   - ✅ Enable Email provider
   - ✅ Confirm email: Optional for testing, Required for production
   - ✅ Secure email change: Enabled
   - ✅ Secure password change: Enabled

### Configure Site URL

1. **Go to**: Supabase Dashboard → Authentication → URL Configuration
2. **Site URL**:
   - **Development**: `http://localhost:3000`
   - **Production**: `https://your-project.vercel.app`
3. **Redirect URLs**: Add:
   ```
   http://localhost:3000/**
   https://your-project.vercel.app/**
   ```

### Configure Email Templates (Optional)

1. **Go to**: Supabase Dashboard → Authentication → Email Templates
2. **Customize** (optional):
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

### Configure JWT Settings

1. **Go to**: Supabase Dashboard → Settings → API
2. **JWT Settings**:
   - **JWT expiry**: 3600 seconds (1 hour) - default is fine
   - **Refresh token rotation**: Enabled (recommended)
   - **Reuse interval**: 10 seconds

### Test Authentication

```sql
-- Check auth schema exists
SELECT * FROM auth.users LIMIT 1;

-- Should return user data or empty result (no errors)
```

---

## 3. ANTHROPIC API SETUP

### Verify API Key

Test your Anthropic API key:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Hi"}]
  }'
```

**Expected:** JSON response with Claude's reply

### Check Credits/Usage

1. **Go to**: https://console.anthropic.com
2. **Navigate to**: Settings → Usage
3. **Verify**: You have available credits
4. **Recommended**: Set up usage alerts

### Models Available

Your application uses these models:
- **claude-3-5-sonnet-20241022**: Main coordinator agent (more capable)
- **claude-3-5-haiku-20241022**: Specialist agents (faster, cheaper)

**Verify both are available** in your API plan.

---

## 4. OPTIONAL API INTEGRATIONS

### USDA FoodData Central

1. **Sign up**: https://fdc.nal.usda.gov/api-key-signup.html
2. **Get API Key**: Free, instant
3. **Test**:
   ```bash
   curl "https://api.nal.usda.gov/fdc/v1/foods/search?query=apple&api_key=YOUR_KEY"
   ```
4. **Add to Vercel**: `USDA_API_KEY=your_key`

### VedicAstro API (Astrology)

1. **Sign up**: https://api.vedicastroapi.com
2. **Get API Key**: Paid plans available
3. **Test**: Check their API docs
4. **Add to Vercel**: `VEDIC_ASTRO_API_KEY=your_key`

### Edamam (Meal Database)

1. **Sign up**: https://developer.edamam.com
2. **Get**: App ID and App Key
3. **Add to Vercel**:
   ```
   EDAMAM_APP_ID=your_app_id
   EDAMAM_APP_KEY=your_app_key
   ```

### Spoonacular (Recipe API)

1. **Sign up**: https://spoonacular.com/food-api
2. **Get API Key**: Free tier available
3. **Add to Vercel**: `SPOONACULAR_API_KEY=your_key`

---

## 5. MONITORING SETUP

### Helicone (AI Request Monitoring)

**Why**: Track Claude API usage, costs, latency, and errors

1. **Sign up**: https://helicone.ai
2. **Get API Key**: Dashboard → API Keys
3. **Add to Vercel**: `HELICONE_API_KEY=sk-helicone-xxx`
4. **Update Anthropic Client** in `lib/clients/anthropic.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Add Helicone proxy
  baseURL: 'https://anthropic.helicone.ai/v1',
  defaultHeaders: {
    'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}`,
    'Helicone-Cache-Enabled': 'true' // Optional: Enable caching
  }
});
```

5. **View Dashboard**: https://helicone.ai/dashboard
   - Request logs
   - Cost tracking
   - Latency metrics
   - Error rates

### Sentry (Error Tracking)

**Why**: Catch and debug runtime errors in production

1. **Sign up**: https://sentry.io
2. **Create Project**: Choose Next.js
3. **Install**:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```
4. **Get DSN**: Project Settings → Client Keys (DSN)
5. **Add to Vercel**: `NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx`
6. **Files auto-generated**:
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`
7. **Commit and deploy**

### Vercel Analytics (Built-in)

**Already enabled automatically!**

1. **View**: Vercel Dashboard → Your Project → Analytics
2. **Metrics**:
   - Page views
   - Unique visitors
   - Top pages
   - Devices
   - Locations

### Vercel Speed Insights (Built-in)

**Already enabled automatically!**

1. **View**: Vercel Dashboard → Your Project → Speed Insights
2. **Metrics**:
   - Core Web Vitals (LCP, FID, CLS)
   - Real User Monitoring (RUM)
   - Performance scores

---

## 6. ENVIRONMENT VARIABLES REFERENCE

### Required for MVP

```bash
# Supabase (CRITICAL)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic AI (CRITICAL)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx...
```

### Optional but Recommended

```bash
# Monitoring
HELICONE_API_KEY=sk-helicone-xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Nutrition APIs
USDA_API_KEY=xxxxx
EDAMAM_APP_ID=xxxxx
EDAMAM_APP_KEY=xxxxx
SPOONACULAR_API_KEY=xxxxx

# Spiritual APIs
VEDIC_ASTRO_API_KEY=xxxxx
PROKERALA_API_KEY=xxxxx
```

### Optional for Scale

```bash
# Caching
REDIS_URL=redis://default:xxxxx@xxxxx.upstash.io:6379

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### How to Add in Vercel

1. **Go to**: Vercel Dashboard → Your Project → Settings → Environment Variables
2. **For each variable**:
   - **Name**: Variable name (e.g., `ANTHROPIC_API_KEY`)
   - **Value**: Your actual key
   - **Environment**: Select "Production" (and "Preview" if needed)
3. **Click**: "Save"
4. **After adding all**: Redeploy your project

---

## 7. SECURITY CHECKLIST

### Environment Variables

- ✅ **Never commit** `.env.local` to Git (should be in `.gitignore`)
- ✅ **Use Vercel UI** to add production variables
- ✅ **Rotate keys** regularly (every 90 days recommended)
- ✅ **Separate keys** for development and production

### Supabase Security

- ✅ **RLS enabled** on all tables
- ✅ **Service role key** only in server-side code
- ✅ **Anon key** safe to expose (RLS protects data)
- ✅ **CORS configured** for your domain
- ✅ **Auth rate limiting** enabled (Supabase default)

### Next.js Security

- ✅ **API routes** verify authentication
- ✅ **Environment variables** prefixed correctly:
  - `NEXT_PUBLIC_*` - Safe to expose to browser
  - No prefix - Server-side only
- ✅ **HTTPS** enforced (Vercel automatic)
- ✅ **CSP headers** configured (optional, advanced)

### Anthropic API

- ✅ **API key** stored server-side only
- ✅ **Rate limiting** implemented (or use Helicone)
- ✅ **Usage monitoring** enabled
- ✅ **Budget alerts** set up in Anthropic Console

---

## 8. PERFORMANCE OPTIMIZATION

### Database Optimization

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM wellness_plans
WHERE user_id = 'user-uuid-here'
  AND date = '2024-01-15';

-- Should use index: wellness_plans_user_id_date_idx
```

### Recommended Indexes (Already in schema.sql)

All critical indexes are already created! Verify with:

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%_idx'
ORDER BY tablename;
```

### Supabase Connection Pooling

**For high traffic** (100+ concurrent users):

1. **Go to**: Supabase Dashboard → Settings → Database
2. **Enable**: Connection Pooler
3. **Mode**: Transaction mode (for serverless)
4. **Update connection string** in your app if needed

### Vercel Edge Caching

Already configured! Next.js automatically:
- ✅ Caches static assets (CSS, JS, images)
- ✅ Optimizes images (Next.js Image component)
- ✅ Server-side renders pages
- ✅ Deploys to global CDN

---

## 9. BACKUP & DISASTER RECOVERY

### Supabase Automatic Backups

**Free Tier**: Daily backups (7 days retention)
**Pro Tier**: Point-in-time recovery (7-30 days)

**Check backup status**:
1. **Go to**: Supabase Dashboard → Settings → Backups
2. **Verify**: Backups are running daily

### Vercel Deployment Rollback

**Instant rollback** to any previous deployment:

1. **Go to**: Vercel Dashboard → Your Project → Deployments
2. **Find**: Previous working deployment
3. **Click**: "..." → "Promote to Production"
4. **Result**: Instant rollback (< 1 second)

### Database Export (Manual Backup)

```bash
# Export database dump
# Run in Supabase SQL Editor
COPY (SELECT * FROM user_profiles) TO '/tmp/user_profiles.csv' CSV HEADER;
```

Or use Supabase CLI:
```bash
supabase db dump -f backup.sql
```

---

## 10. PRODUCTION READINESS SCORECARD

### Infrastructure ✅

- ✅ Vercel account created and project imported
- ✅ Custom domain configured (optional)
- ✅ SSL certificate auto-provisioned
- ✅ Environment variables configured
- ✅ Build succeeds without errors

### Database ✅

- ✅ All tables created with indexes
- ✅ RLS enabled and tested
- ✅ TimescaleDB extension active
- ✅ Backups enabled
- ✅ Connection pooling configured (if needed)

### APIs ✅

- ✅ Anthropic API key valid and has credits
- ✅ Supabase API keys configured
- ✅ Optional APIs added (USDA, etc.)
- ✅ Rate limiting considered

### Monitoring ✅

- ✅ Vercel Analytics enabled (automatic)
- ✅ Vercel Speed Insights enabled (automatic)
- ✅ Helicone configured (optional)
- ✅ Sentry configured (optional)

### Security ✅

- ✅ No secrets in Git repository
- ✅ RLS policies tested
- ✅ Auth flow works end-to-end
- ✅ HTTPS enforced
- ✅ CORS configured

### Testing ✅

- ✅ Sign up flow tested
- ✅ Onboarding wizard tested
- ✅ Wellness plan generation tested
- ✅ Mood tracking tested
- ✅ Mobile responsive verified

---

## 11. GO-LIVE CHECKLIST

### Pre-Launch (30 min before)

- [ ] All environment variables double-checked
- [ ] Database schema fully deployed
- [ ] RLS policies verified
- [ ] Supabase Site URL updated
- [ ] Build succeeds on Vercel
- [ ] No TypeScript/linting errors

### Launch (Deploy!)

- [ ] Click "Deploy" in Vercel
- [ ] Wait for build (2-3 minutes)
- [ ] Note production URL
- [ ] First smoke test (load homepage)

### Post-Launch (30 min after)

- [ ] Complete full user journey test
- [ ] Check Vercel logs for errors
- [ ] Verify Supabase data populating
- [ ] Test on mobile device
- [ ] Share URL with beta testers
- [ ] Monitor for first hour

### Week 1

- [ ] Collect user feedback
- [ ] Monitor error rates (Sentry)
- [ ] Check API costs (Anthropic, Helicone)
- [ ] Optimize slow queries
- [ ] Update documentation

---

## 12. SUPPORT & ESCALATION

### If Build Fails

1. Check Vercel build logs
2. Run `npm run build` locally
3. Fix TypeScript errors
4. Verify all dependencies in `package.json`
5. Redeploy

### If Database Errors

1. Check Supabase Dashboard → Logs
2. Verify RLS policies
3. Check user authentication
4. Test queries in SQL Editor
5. Contact Supabase support if needed

### If API Errors

1. Check Vercel Logs (Runtime logs)
2. Verify environment variables set
3. Test API keys manually
4. Check rate limits
5. Monitor Helicone dashboard

### Emergency Rollback

1. Go to Vercel → Deployments
2. Find last working deployment
3. Click "Promote to Production"
4. Instant rollback (< 1 second)

---

## 13. COST ESTIMATES

### Supabase (Database + Auth)

- **Free Tier**: $0/month
  - 500MB database
  - 50,000 monthly active users
  - Daily backups (7 days)
  - **Good for**: MVP, testing, < 100 users

- **Pro Tier**: $25/month
  - 8GB database
  - 100,000 MAU
  - Point-in-time recovery
  - **Good for**: Production, < 1000 users

### Anthropic API (Claude)

**Pricing** (as of Nov 2024):
- **Claude 3.5 Sonnet**: $3 per million input tokens, $15 per million output
- **Claude 3.5 Haiku**: $0.25 per million input tokens, $1.25 per million output

**Estimated per user per day**:
- Input: ~5,000 tokens (profile + plan request)
- Output: ~3,000 tokens (meal plan + recommendations)
- **Cost per plan**: ~$0.05-0.10

**For 100 daily active users**: ~$5-10/day = $150-300/month

### Vercel (Hosting)

- **Hobby (Free)**: $0/month
  - 100GB bandwidth
  - Unlimited deployments
  - **Good for**: MVP, personal projects

- **Pro**: $20/month per seat
  - 1TB bandwidth
  - Advanced analytics
  - **Good for**: Production with traffic

### Total Estimated Monthly Costs

**MVP (100 users)**:
- Supabase Free: $0
- Anthropic: $150-300 (depending on usage)
- Vercel Free: $0
- **Total**: $150-300/month

**Production (1000 users)**:
- Supabase Pro: $25
- Anthropic: $1,500-3,000
- Vercel Pro: $20
- Helicone: $0 (free tier)
- **Total**: $1,545-3,045/month

### Cost Optimization Tips

1. **Cache wellness plans** (Redis) - reduce API calls
2. **Batch API requests** - use Haiku model for simpler tasks
3. **Rate limit users** - prevent abuse
4. **Use USDA API** - free nutrition data
5. **Implement tiered plans** - free basic, paid premium

---

## READY FOR PRODUCTION! 🚀

Your Holistic Wellness MVP is fully configured and ready to deploy!

**Deployment Status**: ✅ All systems ready
**Estimated Setup Time**: 30-45 minutes
**Estimated Deployment Time**: 5 minutes
**Time to First User**: 45-60 minutes total

**Next Step**: Follow `DEPLOYMENT_CHECKLIST.md` to deploy!

---

**Questions?** Check `DEPLOYMENT.md` for detailed troubleshooting.

**Good luck with your launch!** 🌟
