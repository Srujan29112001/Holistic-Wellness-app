-- Holistic Wellness Platform - Database Schema
--
-- This migration creates all necessary tables for the wellness platform:
-- - User profiles (comprehensive wellness profile)
-- - Wellness plans (daily generated plans)
-- - Mood entries (time-series data with TimescaleDB)
-- - Meal logs (track actual consumption)
-- - Activity logs (track completed activities)
--
-- Uses TimescaleDB extension for efficient time-series storage

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ==================== User Profiles Table ====================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Basic Information
    age INTEGER,
    sex TEXT CHECK (sex IN ('male', 'female')),
    height INTEGER,  -- cm
    weight NUMERIC(5, 1),  -- kg

    -- Nutrition Profile
    calorie_target INTEGER,
    protein_target INTEGER,
    carbs_target INTEGER,
    fat_target INTEGER,
    dietary_restrictions TEXT[],
    dietary_preferences TEXT[],
    allergies TEXT[],
    meals_per_day INTEGER DEFAULT 3,
    diet_type TEXT DEFAULT 'standard',

    -- Fitness
    activity_level TEXT DEFAULT 'moderate',
    fitness_goals TEXT[],

    -- Mental Health
    personality_traits JSONB,  -- Big Five scores
    stressors TEXT[],
    coping_strategies TEXT[],
    mental_health_goals TEXT[],
    therapeutic_preferences TEXT[],
    current_stress_level INTEGER CHECK (current_stress_level BETWEEN 1 AND 5),
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),

    -- Spiritual
    birth_date DATE,
    birth_time TIME,
    birth_place TEXT,
    sun_sign TEXT,
    moon_sign TEXT,
    dosha TEXT,
    spiritual_interests TEXT[],
    spiritual_practices TEXT[],
    belief_system TEXT,

    -- Location (for astrology calculations)
    location JSONB,  -- {lat: number, lon: number}

    -- Meta
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Index for fast user lookups
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- ==================== Wellness Plans Table ====================

CREATE TABLE IF NOT EXISTS wellness_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Plan Components (stored as JSONB for flexibility)
    meal_plan JSONB,
    mental_wellness JSONB,
    spiritual_guidance JSONB,
    schedule JSONB,
    summary TEXT,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one plan per user per date
    UNIQUE(user_id, date)
);

-- Row Level Security
ALTER TABLE wellness_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans"
    ON wellness_plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
    ON wellness_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
    ON wellness_plans FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
    ON wellness_plans FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_wellness_plans_user_date ON wellness_plans(user_id, date DESC);
CREATE INDEX idx_wellness_plans_date ON wellness_plans(date DESC);

-- ==================== Mood Entries Table (Time-Series) ====================

CREATE TABLE IF NOT EXISTS mood_entries (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,

    -- Mood Metrics (1-5 scale)
    mood_rating INTEGER NOT NULL CHECK (mood_rating BETWEEN 1 AND 5),
    stress_level INTEGER NOT NULL CHECK (stress_level BETWEEN 1 AND 5),
    energy_level INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),

    -- Journal & Analysis
    notes TEXT,
    tags TEXT[],
    sentiment_analysis JSONB,  -- AI analysis of notes

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (id, date)
);

-- Convert to TimescaleDB hypertable (partitioned by time)
SELECT create_hypertable('mood_entries', 'date', if_not_exists => TRUE);

-- Retention policy: keep mood data for 2 years, then aggregate
SELECT add_retention_policy('mood_entries', INTERVAL '2 years', if_not_exists => TRUE);

-- Row Level Security
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own moods"
    ON mood_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own moods"
    ON mood_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moods"
    ON mood_entries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own moods"
    ON mood_entries FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes for efficient time-series queries
CREATE INDEX idx_mood_entries_user_time ON mood_entries(user_id, date DESC);

-- Continuous aggregate for weekly mood averages
CREATE MATERIALIZED VIEW IF NOT EXISTS mood_weekly_avg
WITH (timescaledb.continuous) AS
SELECT
    user_id,
    time_bucket('7 days', date) AS week,
    AVG(mood_rating) AS avg_mood,
    AVG(stress_level) AS avg_stress,
    AVG(energy_level) AS avg_energy,
    AVG(sleep_quality) AS avg_sleep,
    COUNT(*) AS entry_count
FROM mood_entries
GROUP BY user_id, week;

-- Refresh policy for the aggregate (update every hour)
SELECT add_continuous_aggregate_policy('mood_weekly_avg',
    start_offset => INTERVAL '1 month',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- ==================== Meal Logs Table (Time-Series) ====================

CREATE TABLE IF NOT EXISTS meal_logs (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,

    -- Meal Info
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    meal_name TEXT,
    ingredients JSONB,

    -- Nutrition (actual consumed)
    calories INTEGER,
    protein NUMERIC(6, 1),
    carbs NUMERIC(6, 1),
    fat NUMERIC(6, 1),
    fiber NUMERIC(6, 1),

    -- Adherence
    was_planned BOOLEAN DEFAULT FALSE,
    deviation_from_plan TEXT,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (id, date)
);

-- Convert to hypertable
SELECT create_hypertable('meal_logs', 'date', if_not_exists => TRUE);

-- Retention policy: 1 year
SELECT add_retention_policy('meal_logs', INTERVAL '1 year', if_not_exists => TRUE);

-- Row Level Security
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal logs"
    ON meal_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
    ON meal_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
    ON meal_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
    ON meal_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_meal_logs_user_time ON meal_logs(user_id, date DESC);

-- Daily nutrition totals aggregate
CREATE MATERIALIZED VIEW IF NOT EXISTS nutrition_daily_totals
WITH (timescaledb.continuous) AS
SELECT
    user_id,
    time_bucket('1 day', date) AS day,
    SUM(calories) AS total_calories,
    SUM(protein) AS total_protein,
    SUM(carbs) AS total_carbs,
    SUM(fat) AS total_fat,
    SUM(fiber) AS total_fiber,
    COUNT(*) AS meal_count
FROM meal_logs
GROUP BY user_id, day;

SELECT add_continuous_aggregate_policy('nutrition_daily_totals',
    start_offset => INTERVAL '1 month',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- ==================== Activity Logs Table (Time-Series) ====================

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,

    -- Activity Info
    activity_type TEXT CHECK (activity_type IN ('meditation', 'exercise', 'yoga', 'journaling', 'breathwork', 'other')),
    activity_name TEXT NOT NULL,
    duration INTEGER,  -- minutes

    -- Completion
    completed BOOLEAN DEFAULT TRUE,
    notes TEXT,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (id, date)
);

-- Convert to hypertable
SELECT create_hypertable('activity_logs', 'date', if_not_exists => TRUE);

-- Retention policy: 1 year
SELECT add_retention_policy('activity_logs', INTERVAL '1 year', if_not_exists => TRUE);

-- Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
    ON activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
    ON activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
    ON activity_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
    ON activity_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_activity_logs_user_time ON activity_logs(user_id, date DESC);
CREATE INDEX idx_activity_logs_type ON activity_logs(activity_type);

-- ==================== Functions ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wellness_plans_updated_at
    BEFORE UPDATE ON wellness_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== Useful Views ====================

-- View: User wellness summary (latest stats)
CREATE OR REPLACE VIEW user_wellness_summary AS
SELECT
    up.user_id,
    up.age,
    up.sex,
    up.calorie_target,
    up.onboarding_completed,
    (SELECT COUNT(*) FROM wellness_plans WHERE user_id = up.user_id) AS total_plans,
    (SELECT COUNT(*) FROM mood_entries WHERE user_id = up.user_id) AS total_mood_entries,
    (SELECT AVG(mood_rating) FROM mood_entries
     WHERE user_id = up.user_id
     AND date > NOW() - INTERVAL '7 days') AS avg_mood_7d,
    (SELECT AVG(stress_level) FROM mood_entries
     WHERE user_id = up.user_id
     AND date > NOW() - INTERVAL '7 days') AS avg_stress_7d,
    up.created_at,
    up.updated_at
FROM user_profiles up;

-- Grant access to views
GRANT SELECT ON user_wellness_summary TO authenticated;

-- ==================== Comments ====================

COMMENT ON TABLE user_profiles IS 'Comprehensive user wellness profile';
COMMENT ON TABLE wellness_plans IS 'AI-generated daily wellness plans';
COMMENT ON TABLE mood_entries IS 'Time-series mood tracking with TimescaleDB';
COMMENT ON TABLE meal_logs IS 'Actual meal consumption logs';
COMMENT ON TABLE activity_logs IS 'Completed wellness activities';

-- ==================== Success ====================

DO $$
BEGIN
    RAISE NOTICE 'Wellness database schema created successfully!';
    RAISE NOTICE 'TimescaleDB hypertables configured for efficient time-series storage.';
    RAISE NOTICE 'Row-Level Security enabled on all tables.';
END $$;
