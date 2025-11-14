-- Holistic Wellness AI Platform Database Schema
-- Supabase PostgreSQL Schema with Row-Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable TimescaleDB extension for time-series data (if available)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================================================
-- TABLES
-- ============================================================================

-- User Profiles (Extended user information beyond auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Demographics
    age INTEGER CHECK (age > 0 AND age < 150),
    gender TEXT,
    height NUMERIC(5,2), -- cm
    weight NUMERIC(5,2), -- kg

    -- Dietary
    dietary_restrictions TEXT[],
    dietary_preferences TEXT[],
    allergies TEXT[],
    cuisine_preferences TEXT[],
    diet_type TEXT CHECK (diet_type IN ('vegan', 'vegetarian', 'pescatarian', 'omnivore', 'keto', 'paleo')),

    -- Health
    health_conditions TEXT[],
    medications TEXT[],
    fitness_level TEXT CHECK (fitness_level IN ('sedentary', 'light', 'moderate', 'active', 'very-active')),
    health_goals TEXT[],

    -- Mental Health
    personality_scores JSONB, -- Big Five scores

    -- Spiritual
    birth_date DATE,
    birth_time TIME,
    birth_place JSONB, -- {latitude, longitude, timezone}
    spiritual_interests TEXT[],
    dosha_type TEXT CHECK (dosha_type IN ('vata', 'pitta', 'kapha')),

    -- Schedule
    wake_time TIME,
    sleep_time TIME,
    work_hours JSONB, -- {start: "09:00", end: "17:00"}
    schedule_preferences JSONB,

    UNIQUE(user_id)
);

-- Mood Tracking Entries
CREATE TABLE public.mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    energy INTEGER CHECK (energy >= 1 AND energy <= 5),
    stress INTEGER CHECK (stress >= 1 AND stress <= 5),
    sleep_hours NUMERIC(4,2),
    notes TEXT,
    tags TEXT[]
);

-- Convert mood_entries to hypertable for time-series optimization
SELECT create_hypertable('mood_entries', 'created_at', if_not_exists => TRUE);

-- Meal Plans (Generated plans)
CREATE TABLE public.meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    plan_data JSONB NOT NULL, -- Full meal plan structure
    total_calories INTEGER,
    macros JSONB, -- {protein, carbs, fat, fiber}
    status TEXT CHECK (status IN ('pending', 'active', 'completed')) DEFAULT 'pending',
    adherence_score NUMERIC(3,2) -- 0.00 to 1.00
);

-- Meal Logs (Actual meals consumed)
CREATE TABLE public.meal_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    foods JSONB NOT NULL,
    total_calories INTEGER,
    macros JSONB,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT
);

-- Wellness Plans (Holistic daily/weekly plans)
CREATE TABLE public.wellness_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    plan_type TEXT CHECK (plan_type IN ('daily', 'weekly', 'custom')) DEFAULT 'daily',
    plan_data JSONB NOT NULL,
    status TEXT CHECK (status IN ('draft', 'active', 'completed')) DEFAULT 'draft',
    completion_rate NUMERIC(3,2) -- 0.00 to 1.00
);

-- Activities (Scheduled and completed activities)
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    category TEXT CHECK (category IN ('nutrition', 'mental', 'spiritual', 'physical', 'work')),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INTEGER, -- minutes
    completed BOOLEAN DEFAULT FALSE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT
);

-- Meditation Sessions
CREATE TABLE public.meditation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    duration INTEGER NOT NULL, -- minutes
    type TEXT CHECK (type IN ('guided', 'silent', 'mantra')),
    focus TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT
);

-- Agent Sessions (AI agent execution logs)
CREATE TABLE public.agent_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    session_id UUID NOT NULL,
    agent_role TEXT NOT NULL,
    request TEXT NOT NULL,
    response JSONB,
    execution_time INTEGER, -- ms
    tokens_used INTEGER,
    cost NUMERIC(10,6),
    status TEXT CHECK (status IN ('success', 'error', 'timeout')),
    error_message TEXT
);

-- API Cache (For caching external API results)
CREATE TABLE public.api_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key TEXT UNIQUE NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    hit_count INTEGER DEFAULT 0
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User profiles
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Mood entries
CREATE INDEX idx_mood_entries_user_date ON public.mood_entries(user_id, date DESC);
CREATE INDEX idx_mood_entries_created ON public.mood_entries(created_at DESC);

-- Meal plans
CREATE INDEX idx_meal_plans_user_date ON public.meal_plans(user_id, date DESC);
CREATE INDEX idx_meal_plans_status ON public.meal_plans(status, date DESC);

-- Meal logs
CREATE INDEX idx_meal_logs_user_date ON public.meal_logs(user_id, date DESC);

-- Wellness plans
CREATE INDEX idx_wellness_plans_user_date ON public.wellness_plans(user_id, date DESC);

-- Activities
CREATE INDEX idx_activities_user_date ON public.activities(user_id, date DESC);
CREATE INDEX idx_activities_category ON public.activities(category, date DESC);

-- Meditation sessions
CREATE INDEX idx_meditation_user_date ON public.meditation_sessions(user_id, date DESC);

-- Agent sessions
CREATE INDEX idx_agent_sessions_user ON public.agent_sessions(user_id, created_at DESC);
CREATE INDEX idx_agent_sessions_session ON public.agent_sessions(session_id);

-- API cache
CREATE INDEX idx_api_cache_key ON public.api_cache(cache_key);
CREATE INDEX idx_api_cache_expires ON public.api_cache(expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Mood Entries Policies
CREATE POLICY "Users can view own mood entries" ON public.mood_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries" ON public.mood_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries" ON public.mood_entries
    FOR UPDATE USING (auth.uid() = user_id);

-- Meal Plans Policies
CREATE POLICY "Users can view own meal plans" ON public.meal_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans" ON public.meal_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans" ON public.meal_plans
    FOR UPDATE USING (auth.uid() = user_id);

-- Meal Logs Policies
CREATE POLICY "Users can view own meal logs" ON public.meal_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs" ON public.meal_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs" ON public.meal_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Wellness Plans Policies
CREATE POLICY "Users can view own wellness plans" ON public.wellness_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness plans" ON public.wellness_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness plans" ON public.wellness_plans
    FOR UPDATE USING (auth.uid() = user_id);

-- Activities Policies
CREATE POLICY "Users can view own activities" ON public.activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON public.activities
    FOR UPDATE USING (auth.uid() = user_id);

-- Meditation Sessions Policies
CREATE POLICY "Users can view own meditation sessions" ON public.meditation_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meditation sessions" ON public.meditation_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meditation sessions" ON public.meditation_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Agent Sessions Policies (read-only for users)
CREATE POLICY "Users can view own agent sessions" ON public.agent_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert agent sessions" ON public.agent_sessions
    FOR INSERT WITH CHECK (true);

-- API Cache Policies (read-only for users, service role can manage)
CREATE POLICY "Users can read cache" ON public.api_cache
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage cache" ON public.api_cache
    FOR ALL USING (true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.api_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Any seed data can be added here

-- ============================================================================
-- GRANTS (if needed for service role)
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
