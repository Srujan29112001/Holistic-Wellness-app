# Holistic Wellness AI - System Architecture

This document provides a comprehensive technical overview of the Holistic Wellness AI platform's architecture, design decisions, and implementation patterns.

## Table of Contents

1. [System Overview](#system-overview)
2. [Multi-Agent Architecture](#multi-agent-architecture)
3. [Protocol Implementations](#protocol-implementations)
4. [Data Flow & Processing](#data-flow--processing)
5. [Security Architecture](#security-architecture)
6. [Scalability & Performance](#scalability--performance)
7. [Deployment Architecture](#deployment-architecture)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                      │
│        (Next.js 15 + React 19 + Tailwind + Zustand)            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                            │
│        (Next.js API Routes + Serverless Functions)              │
└────────────┬─────────────────────┬──────────────────────────────┘
             │                     │
             ▼                     ▼
┌────────────────────┐  ┌─────────────────────────────────────┐
│   Auth & Session   │  │     Multi-Agent Orchestration       │
│   (Supabase Auth)  │  │  ┌──────────────────────────────┐  │
└────────────────────┘  │  │   Coordinator Agent          │  │
                        │  │   (Claude 3.5 Sonnet)        │  │
                        │  └─────────┬────────────────────┘  │
                        │            │                        │
                        │  ┌─────────▼─────────────────────┐ │
                        │  │   Specialist Agents           │ │
                        │  │  • Nutrition Agent            │ │
                        │  │  • Mental Health Agent        │ │
                        │  │  • Spiritual Agent            │ │
                        │  │  • Scheduler Agent            │ │
                        │  └─────────┬─────────────────────┘ │
                        │            │                        │
                        │  ┌─────────▼─────────────────────┐ │
                        │  │   MCP Tool Layer              │ │
                        │  │  • External APIs              │ │
                        │  │  • OR-Tools Optimization      │ │
                        │  │  • Database Queries           │ │
                        │  └───────────────────────────────┘ │
                        └─────────────────────────────────────┘
                                      │
                        ┌─────────────▼─────────────────────────┐
                        │         Data Layer                     │
                        │  • Supabase PostgreSQL (RLS)          │
                        │  • TimescaleDB (Time-series)          │
                        │  • Redis Cache                         │
                        └────────────────────────────────────────┘
```

### Technology Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **State Management** | Zustand, React Hook Form, Zod |
| **Backend** | Next.js API Routes, Serverless Functions |
| **AI/ML** | Anthropic Claude 3.5, OR-Tools, RL algorithms |
| **Database** | Supabase (PostgreSQL), TimescaleDB |
| **Caching** | Redis, Helicone |
| **Auth** | Supabase Auth (JWT-based) |
| **Deployment** | Vercel (Frontend/Edge), Supabase Cloud |
| **Monitoring** | Helicone, PromptLayer, Sentry |

---

## Multi-Agent Architecture

### Agent Design Pattern

Each agent follows a consistent interface pattern:

```typescript
interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  description: string;

  getAgentCard(): A2AAgentCard;      // A2A discovery
  getTools(): MCPTool[];              // MCP tool definitions
  process(request, context): Promise<AgentResponse>;
  handleA2AMessage(message, context): Promise<AgentResponse>;
  executeTool(toolCall, context): Promise<MCPToolResult>;
}
```

### Coordinator Agent

**Role**: Orchestrator and synthesizer

**Responsibilities**:
- Receives user requests
- Decomposes complex queries into sub-tasks
- Delegates to specialist agents via A2A
- Aggregates and synthesizes results
- Ensures coherent cross-domain recommendations

**LLM Configuration**:
- Model: Claude 3.5 Sonnet
- Temperature: 0.3 (balanced creativity and consistency)
- Max Tokens: 4096
- Prompt Caching: Enabled for user profile

**Decision Logic**:
```python
def coordinate(user_request, context):
    # 1. Analyze request
    required_agents = determine_agents_needed(user_request)

    # 2. Delegate to specialist agents (parallel or sequential)
    agent_responses = {}
    for agent_role in required_agents:
        response = await call_agent(agent_role, user_request, context)
        agent_responses[agent_role] = response

    # 3. Synthesize results
    holistic_plan = synthesize(agent_responses, context)

    # 4. Apply constraints and optimizations
    final_plan = optimize_plan(holistic_plan, user_constraints)

    return final_plan
```

### Nutrition Agent

**Role**: Nutrition and meal planning expert

**Tools (MCP)**:
- `usdaFoodSearch` - Search USDA FoodData Central
- `edamamRecipeSearch` - Find recipes matching criteria
- `calculateNutrition` - Compute nutritional values
- `spoonacularMealPlan` - Generate meal plans

**Processing Pipeline**:
1. **Phase 1: Hard Constraints Filtering**
   - Eliminate foods violating allergies, restrictions
   - Apply dietary type filters (vegan, keto, etc.)

2. **Phase 2: Fuzzy Logic Scoring**
   - Score meals on preference alignment (0-1)
   - Consider cuisine preferences, taste history

3. **Phase 3: Multi-Objective Optimization**
   - Use OR-Tools to optimize:
     - Nutritional targets (calories, macros, micros)
     - Cost constraints
     - Variety (avoid repetition)
     - Preparation time
   - Formulation:
     ```
     Maximize: weighted_sum(nutrition_score, preference_score, variety_score)
     Subject to:
       total_calories = target ± tolerance
       protein >= minimum
       cost <= budget
       variety_constraint(meal_repetitions)
     ```

4. **Phase 4: Reinforcement Learning**
   - Update user preference model based on ratings
   - Adjust future recommendations using CFRL

**Example Output**:
```json
{
  "meals": [
    {
      "type": "breakfast",
      "name": "Greek Yogurt Parfait",
      "time": "08:00",
      "foods": [
        {"name": "Greek yogurt", "amount": 200, "unit": "g", "calories": 150},
        {"name": "Blueberries", "amount": 50, "unit": "g", "calories": 30}
      ],
      "calories": 350,
      "macros": {"protein": 20, "carbs": 35, "fat": 8}
    }
  ],
  "totalCalories": 1800,
  "macros": {"protein": 120, "carbs": 180, "fat": 60}
}
```

### Mental Health Agent

**Role**: Mental wellness and mindfulness guide

**Tools (MCP)**:
- `ipipAssessment` - IPIP Big Five personality scoring
- `analyzeMood` - NLP sentiment analysis on journal entries
- `getMeditation` - Retrieve meditation content
- `getCBTExercise` - Get CBT techniques

**Capabilities**:
- Mood trend analysis using TimescaleDB time-series queries
- Personalized meditation recommendations
- Stress management techniques
- Sleep hygiene guidance

**Mood Analysis Algorithm**:
```python
def analyze_mood_trends(user_id, days=30):
    # Query TimescaleDB for mood history
    moods = query_mood_entries(user_id, days)

    # Compute statistics
    avg_mood = mean(moods.mood)
    trend = linear_regression(moods.date, moods.mood).slope

    # Detect patterns
    if trend < -0.1:
        alert = "Declining mood trend detected"
        suggestions = suggest_interventions("mood_decline")

    # Correlate with other factors
    correlations = {
        "sleep": pearson_correlation(moods.sleep_hours, moods.mood),
        "exercise": pearson_correlation(activities.duration, moods.mood)
    }

    return MoodAnalysis(avg_mood, trend, correlations, suggestions)
```

### Spiritual Agent

**Role**: Spiritual guidance and holistic wellness

**Tools (MCP)**:
- `getHoroscope` - Daily horoscope from VedicAstro API
- `getBirthChart` - Generate natal chart
- `getAyurvedicGuidance` - Dosha-based recommendations
- `getPanchang` - Vedic calendar (auspicious times)

**Ayurvedic Integration**:
- Dosha assessment based on user questionnaire
- Food recommendations balancing doshas
- Daily routine (Dinacharya) suggestions
- Seasonal guidelines (Ritucharya)

**Example Recommendations**:
```json
{
  "horoscope": "Today Mars is in your sign, favoring physical activity...",
  "ayurvedicTips": [
    "As a Vata type, favor warm, grounding foods today",
    "Best time for meditation: 5:30-6:30 AM (Brahma Muhurta)"
  ],
  "practices": [
    {
      "type": "meditation",
      "name": "Gratitude Meditation",
      "duration": 15,
      "time": "06:00"
    }
  ]
}
```

### Scheduler Agent

**Role**: Daily schedule optimization

**Algorithm**: Constraint Satisfaction Problem (CSP) using OR-Tools CP-SAT

**Variables**:
- Start time for each activity (breakfast, meditation, workout, etc.)

**Constraints**:
- Hard:
  - No overlaps
  - Fixed events (work meetings)
  - Meal spacing (≥3 hours apart)
  - Sleep 7-9 hours in continuous block
  - Activities within wake/sleep window
- Soft (objectives):
  - Activities at preferred times
  - Energy-matched (high-energy tasks when user has high energy)
  - Meal times consistent with user habits

**OR-Tools Formulation**:
```python
from ortools.sat.python import cp_model

model = cp_model.CpModel()

# Variables
activity_start = {}
for activity in activities:
    activity_start[activity] = model.NewIntVar(
        0, 24*60, f'start_{activity.name}'  # Minutes from midnight
    )

# No overlap constraints
for a1, a2 in combinations(activities, 2):
    model.Add(
        activity_start[a1] + a1.duration <= activity_start[a2]
    ).OnlyEnforceIf(a1_before_a2)
    # ... (or a2 before a1)

# Objective: minimize deviation from preferred times
deviations = []
for activity in activities:
    if activity.preferred_time:
        deviation = model.NewIntVar(0, 24*60, f'dev_{activity.name}')
        model.AddAbsEquality(
            deviation,
            activity_start[activity] - activity.preferred_time
        )
        deviations.append(deviation)

model.Minimize(sum(deviations))

solver = cp_model.CpSolver()
status = solver.Solve(model)

if status == cp_model.OPTIMAL:
    schedule = extract_solution(solver, activity_start)
```

---

## Protocol Implementations

### Model Context Protocol (MCP)

**Purpose**: Standardized AI-tool communication

**Architecture**:
```
┌──────────────┐
│  AI Agent    │
└──────┬───────┘
       │ MCP Request
       ▼
┌──────────────┐
│ MCP Registry │ ←──── Registers tools from servers
└──────┬───────┘
       │ Route to Server
       ▼
┌──────────────┐
│  MCP Server  │ (e.g., Nutrition Server)
└──────┬───────┘
       │ HTTP/stdio
       ▼
┌──────────────┐
│ External API │ (e.g., USDA, Edamam)
└──────────────┘
```

**Tool Call Flow**:
1. Agent needs data (e.g., "calories in apple")
2. Agent constructs `MCPToolCall`:
   ```json
   {
     "id": "mcp_123",
     "tool": "usdaFoodSearch",
     "parameters": {"query": "apple", "pageSize": 1}
   }
   ```
3. Registry routes to appropriate MCP Server
4. Server executes (with circuit breaker & caching)
5. Returns `MCPToolResult`:
   ```json
   {
     "id": "mcp_123",
     "tool": "usdaFoodSearch",
     "status": "success",
     "data": {"foods": [{"name": "Apple", "calories": 95}]},
     "metadata": {"executionTime": 120, "cached": false}
   }
   ```

**Circuit Breaker Pattern**:
- States: CLOSED → OPEN → HALF-OPEN → CLOSED
- Threshold: 5 failures → OPEN
- Timeout: 60 seconds before HALF-OPEN
- Prevents cascade failures when external APIs are down

**Caching Strategy**:
- Cache key: `mcp:{tool_name}:{hash(parameters)}`
- TTL: varies by tool (nutrition data: 24h, horoscope: 1h)
- Cache hit rate target: >70%
- Invalidation: pattern-based (e.g., `mcp:usda:*`)

### Agent-to-Agent (A2A) Protocol

**Purpose**: Inter-agent communication and coordination

**Message Types**:
- `request`: Asking another agent to perform a task
- `response`: Replying to a request
- `inform`: Sharing information
- `query`: Asking for information
- `delegate`: Handing off a task
- `acknowledge`: Confirming receipt
- `error`: Reporting an error

**Communication Pattern Example**:
```
Coordinator → Nutrition Agent (request):
{
  "type": "request",
  "sender": {"agentId": "coord_1", "role": "coordinator"},
  "receiver": {"role": "nutrition"},
  "content": {
    "task": "Generate meal plan for user",
    "parameters": {"calories": 1800, "diet": "vegetarian"}
  }
}

Nutrition Agent → Coordinator (response):
{
  "type": "response",
  "sender": {"agentId": "nutr_1", "role": "nutrition"},
  "receiver": {"agentId": "coord_1"},
  "content": {
    "status": "success",
    "result": {...meal_plan...},
    "confidence": 0.92
  }
}
```

**Agent Discovery**:
- Each agent publishes an Agent Card (like OpenAPI spec)
- Cards include capabilities, input/output schemas
- Coordinator discovers agents by querying registry:
  ```typescript
  const nutritionAgents = await a2aHandler.discoverAgents({
    role: "nutrition",
    status: "active"
  });
  ```

**Conversation Management**:
- Each user session creates an `A2AConversation`
- Tracks all messages between agents
- Maintains shared context for coherence
- Enables audit trail and debugging

---

## Data Flow & Processing

### User Request Processing Flow

```
1. User submits request (e.g., "Plan my day")
   │
   ▼
2. API Route (/api/wellness/plan) receives request
   │
   ▼
3. Authenticate user (Supabase Auth JWT)
   │
   ▼
4. Load user profile & context from database
   │
   ▼
5. Initialize A2A Conversation
   │
   ▼
6. Coordinator Agent processes request
   │
   ├─→ Determines required agents (nutrition, mental, spiritual)
   │
   ├─→ Sends A2A messages to each agent (parallel)
   │   │
   │   ├─→ Nutrition Agent
   │   │   ├─→ Query USDA API (via MCP)
   │   │   ├─→ Run OR-Tools optimization
   │   │   └─→ Return meal plan
   │   │
   │   ├─→ Mental Agent
   │   │   ├─→ Query mood history (TimescaleDB)
   │   │   ├─→ Analyze trends
   │   │   └─→ Return mental wellness tips
   │   │
   │   └─→ Spiritual Agent
   │       ├─→ Call VedicAstro API (via MCP)
   │       └─→ Return spiritual guidance
   │
   ├─→ Receives all agent responses
   │
   ├─→ Scheduler Agent optimizes timeline
   │   └─→ OR-Tools CSP solver
   │
   └─→ Coordinator synthesizes holistic plan
       │
       ▼
7. Store generated plan in database
   │
   ▼
8. Log agent session for analytics
   │
   ▼
9. Return JSON response to frontend
   │
   ▼
10. Frontend renders plan in UI
```

### Data Persistence Strategy

**Write Operations**:
- User profiles: Write immediately to Supabase
- Generated plans: Store with status "pending" → "active" → "completed"
- Logs (mood, meals): Append-only to TimescaleDB
- Agent sessions: Asynchronous write for analytics

**Read Operations**:
- User profile: Cache in Zustand store for session
- Recent data: Query with indexed lookups
- Historical data: TimescaleDB continuous aggregates
- External API results: Redis cache (L1) → Database cache table (L2)

**Caching Layers**:
```
L1: Redis (in-memory, 1h-24h TTL)
    ├─ User profiles (per session)
    ├─ API results (USDA, VedicAstro)
    └─ Generated plans (current day)

L2: Database cache table (persistent, 7-30d TTL)
    └─ Expensive API results

L3: Helicone (LLM response cache, 30d TTL)
    └─ Claude API responses
```

---

## Security Architecture

### Authentication & Authorization

**Supabase Auth Flow**:
```
1. User signs up/in
   │
   ▼
2. Supabase Auth validates credentials
   │
   ▼
3. Issues JWT with user_id in payload
   │
   ▼
4. Frontend stores JWT (httpOnly cookie or localStorage)
   │
   ▼
5. Each API request includes JWT in Authorization header
   │
   ▼
6. Backend verifies JWT signature
   │
   ▼
7. Extracts user_id, attaches to request context
```

**Row-Level Security (RLS)**:
Every table has policies like:
```sql
CREATE POLICY "Users can view own data"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);
```

Even if SQL injection occurs, users can only see their own rows.

### Data Encryption

**At Rest**:
- Supabase encrypts all data at rest (AES-256)
- Sensitive fields (journal entries) additionally encrypted with pgcrypto

**In Transit**:
- All connections use TLS 1.3
- API keys stored in environment variables (Vercel/Supabase secrets)
- Never exposed to client-side code

**Secrets Management**:
```
Development: .env.local (git-ignored)
Production:  Vercel environment variables
             ├─ Encrypted at rest
             ├─ Only accessible to serverless functions
             └─ Rotated regularly
```

### API Rate Limiting

**User-Level Limits**:
- 100 requests per minute per user (sliding window)
- 1000 AI agent calls per day per user

**Global Limits**:
- Coordinates with external API rate limits
- Circuit breakers prevent exhaustion

**Implementation**:
```typescript
// Middleware in API routes
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  keyGenerator: (req) => req.user.id,
  handler: (req, res) => {
    res.status(429).json({ error: "Too many requests" });
  }
});
```

### Compliance & Privacy

**GDPR**:
- Right to access: `GET /api/user/data` exports all data as JSON
- Right to deletion: `DELETE /api/user/account` anonymizes or deletes
- Consent: Explicit opt-in for data collection
- Privacy policy: Clear explanation of data usage

**HIPAA Alignment** (not a covered entity, but best practices):
- Minimum necessary: Only collect data needed for features
- Audit logs: All agent sessions logged
- Access controls: RLS + JWTs
- Disclaimers: "Not medical advice" on all recommendations

---

## Scalability & Performance

### Horizontal Scaling

**Frontend (Vercel)**:
- Auto-scales globally via CDN
- Edge functions for low-latency API responses
- Static pages cached aggressively

**Backend (Serverless)**:
- Each API route is a serverless function
- Auto-scales to demand (0 → 1000s of instances)
- Stateless (all state in database or cache)

**Database (Supabase)**:
- Vertical scaling: Upgrade Postgres instance (2GB → 8GB RAM)
- Read replicas: For read-heavy workloads
- Connection pooling: PgBouncer included

### Performance Optimizations

**LLM Optimization**:
- Prompt caching: User profile cached in Claude context (90% cost reduction)
- Model cascading: Simple queries → Haiku ($0.25/M tokens), complex → Sonnet ($3/M tokens)
- Streaming responses: Start rendering before full completion

**Database**:
- Indexes on all foreign keys and commonly queried fields
- TimescaleDB compression for old mood data (10x compression)
- Continuous aggregates for trend queries (pre-computed)

**API Calls**:
- Batch requests where possible (e.g., multiple food lookups in one USDA call)
- Deduplicate concurrent requests (if 3 users query "apple" simultaneously, only 1 API call)

**Estimated Performance**:
- Cold start latency: <500ms (Next.js serverless)
- Warm request latency: <200ms (with cache hit)
- Full plan generation: 2-5 seconds (parallel agent execution)
- Database query time: <50ms (indexed queries)
- LLM response time: 1-3 seconds (streaming)

### Cost Projections

**For 1000 Monthly Active Users**:
- Vercel: $20/mo (Pro plan)
- Supabase: $25/mo (Pro plan)
- Anthropic Claude: ~$200/mo (with optimization)
- External APIs: ~$100/mo (USDA free, Edamam $50, VedicAstro $50)
- Redis: $50/mo (managed)
- Monitoring: $50/mo (Helicone, Sentry)

**Total: ~$445/mo** or **$0.45 per MAU**

At 10k MAU: ~$1200/mo or $0.12 per MAU (economies of scale)

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Global CDN)                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Static Assets + Next.js Pages (Edge Functions) │   │
│  └────────────────────┬────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│             Vercel Serverless Functions                  │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────┐     │
│  │ API     │  │ Agents   │  │ Background Jobs    │     │
│  │ Routes  │  │ Endpoints│  │ (Cron, Webhooks)   │     │
│  └────┬────┘  └────┬─────┘  └────────┬───────────┘     │
└───────┼────────────┼─────────────────┼──────────────────┘
        │            │                 │
        ▼            ▼                 ▼
┌────────────────────────────────────────────────────────────┐
│                    Supabase (Cloud)                        │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ PostgreSQL   │  │ Auth        │  │ Storage     │      │
│  │ (TimescaleDB)│  │ (JWT)       │  │ (Files)     │      │
│  └──────────────┘  └─────────────┘  └─────────────┘      │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│                    External Services                       │
│  • Anthropic Claude API                                    │
│  • USDA FoodData Central                                   │
│  • Edamam / Spoonacular                                    │
│  • VedicAstro API                                          │
│  • Redis (Upstash)                                         │
│  • Helicone (LLM Observability)                           │
│  • Sentry (Error Tracking)                                 │
└────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
1. Git push to branch
   │
   ▼
2. GitHub Actions triggered
   │
   ├─→ Lint (ESLint)
   ├─→ Type check (tsc --noEmit)
   ├─→ Unit tests (Jest)
   └─→ Build (next build)
   │
   ▼
3. If main branch: Deploy to Vercel
   │
   ├─→ Deploy preview (automatic)
   ├─→ Run E2E tests (Playwright)
   └─→ Deploy production (if tests pass)
   │
   ▼
4. Database migrations (Supabase CLI)
   │
   ▼
5. Invalidate caches (Redis, Helicone)
   │
   ▼
6. Notify team (Slack/Discord webhook)
```

### Monitoring & Observability

**Metrics Collected**:
- **Application**:
  - Request latency (p50, p95, p99)
  - Error rates by endpoint
  - User actions (page views, interactions)

- **Agents**:
  - Agent execution time
  - Agent success/failure rates
  - Token usage per agent
  - Cost per request

- **Infrastructure**:
  - Serverless function cold starts
  - Database connection pool usage
  - Cache hit rates

**Alerting**:
- Error rate >1% → Sentry alert
- API latency >5s → PagerDuty
- Database CPU >80% → Email/SMS
- LLM cost spike → Slack notification

**Dashboards**:
- Helicone: LLM performance, token usage, costs
- Sentry: Error trends, user impact
- Vercel Analytics: Page speed, Core Web Vitals
- Custom (Grafana): Agent performance, cache hit rates

---

## Conclusion

This architecture is designed for:
- **Scalability**: Handles 1-100k users with auto-scaling
- **Reliability**: Circuit breakers, caching, graceful degradation
- **Security**: RLS, encryption, JWT auth, GDPR compliance
- **Maintainability**: Modular agents, clean protocols, typed code
- **Cost-Efficiency**: Optimized LLM usage, caching, serverless

The multi-agent design with MCP and A2A protocols provides a flexible, extensible foundation for adding new wellness domains or capabilities without major refactoring.

