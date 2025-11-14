/**
 * Wellness Plan API Route
 *
 * POST /api/wellness/plan
 *
 * Generates a comprehensive daily wellness plan including:
 * - Meal plan (Nutrition Agent)
 * - Mental wellness activities (Mental Health Agent)
 * - Spiritual guidance (Spiritual Agent)
 * - Daily schedule (Scheduler Agent)
 *
 * Uses the Coordinator Agent to orchestrate all specialist agents.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CoordinatorAgent } from '@/lib/agents/coordinator';
import { NutritionAgent, type DietaryProfile } from '@/lib/agents/nutrition-agent';
import { MentalHealthAgent, type MentalHealthProfile, type MoodEntry } from '@/lib/agents/mental-health-agent';
import { SpiritualAgent, type SpiritualProfile } from '@/lib/agents/spiritual-agent';

// ==================== Request Types ====================

interface GeneratePlanRequest {
  date?: string;  // ISO date, defaults to today
  focus?: 'nutrition' | 'mental' | 'spiritual' | 'all';
  includeSchedule?: boolean;
}

// ==================== Response Types ====================

interface WellnessPlanResponse {
  success: boolean;
  plan?: {
    date: string;
    mealPlan?: any;
    mentalWellness?: any;
    spiritualGuidance?: any;
    schedule?: any;
    summary: string;
  };
  error?: string;
}

// ==================== POST Handler ====================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: GeneratePlanRequest = await request.json();
    const { date, focus = 'all', includeSchedule = false } = body;

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[API] Generating wellness plan for user ${user.id}`);

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found. Please complete onboarding.' },
        { status: 404 }
      );
    }

    // Fetch recent mood entries (last 7 days for trends)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: moods } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo.toISOString())
      .order('date', { ascending: false })
      .limit(7);

    // Build agent contexts from profile
    const dietaryProfile: DietaryProfile = {
      calorieTarget: profile.calorie_target || 2000,
      proteinTarget: profile.protein_target || 100,
      carbsTarget: profile.carbs_target,
      fatTarget: profile.fat_target,
      restrictions: profile.dietary_restrictions || [],
      preferences: profile.dietary_preferences || [],
      allergies: profile.allergies || [],
      mealsPerDay: profile.meals_per_day || 3,
      dietType: profile.diet_type || 'standard',
    };

    const mentalHealthProfile: MentalHealthProfile = {
      personalityTraits: profile.personality_traits,
      stressors: profile.stressors || [],
      copingStrategies: profile.coping_strategies || [],
      goals: profile.mental_health_goals || [],
      therapeuticPreferences: profile.therapeutic_preferences || [],
    };

    const spiritualProfile: SpiritualProfile = {
      birthDetails: profile.birth_details,
      sunSign: profile.sun_sign,
      moonSign: profile.moon_sign,
      dosha: profile.dosha,
      spiritualInterests: profile.spiritual_interests || [],
      practices: profile.spiritual_practices || [],
      beliefSystem: profile.belief_system,
    };

    // Initialize agents
    const nutritionAgent = new NutritionAgent({
      profile: dietaryProfile,
      currentDate: date || new Date().toISOString().split('T')[0],
    });

    const mentalAgent = new MentalHealthAgent({
      profile: mentalHealthProfile,
      recentMoods: moods as MoodEntry[] || [],
      currentStressLevel: profile.current_stress_level,
      sleepQuality: profile.sleep_quality,
    });

    const spiritualAgent = new SpiritualAgent({
      profile: spiritualProfile,
      date: date || new Date().toISOString().split('T')[0],
      location: profile.location ? {
        lat: profile.location.lat,
        lon: profile.location.lon,
      } : undefined,
    });

    // Generate plans based on focus
    let mealPlan, mentalWellness, spiritualGuidance;

    if (focus === 'all' || focus === 'nutrition') {
      console.log('[API] Generating meal plan...');
      mealPlan = await nutritionAgent.generateDailyMealPlan();
    }

    if (focus === 'all' || focus === 'mental') {
      console.log('[API] Generating mental wellness recommendations...');
      mentalWellness = {
        activities: await mentalAgent.generateWellnessRecommendations(),
        meditation: await mentalAgent.recommendMeditation(),
      };
    }

    if (focus === 'all' || focus === 'spiritual') {
      console.log('[API] Generating spiritual guidance...');
      spiritualGuidance = await spiritualAgent.generateDailyGuidance();
    }

    // Use Coordinator to generate summary
    const coordinator = new CoordinatorAgent();
    const summary = await coordinator.synthesizeResults({
      nutrition: mealPlan,
      mental: mentalWellness,
      spiritual: spiritualGuidance,
    });

    // Save plan to database
    const { error: insertError } = await supabase
      .from('wellness_plans')
      .insert({
        user_id: user.id,
        date: date || new Date().toISOString().split('T')[0],
        meal_plan: mealPlan,
        mental_wellness: mentalWellness,
        spiritual_guidance: spiritualGuidance,
        summary,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[API] Error saving plan:', insertError);
    }

    console.log('[API] Wellness plan generated successfully');

    // Return response
    return NextResponse.json({
      success: true,
      plan: {
        date: date || new Date().toISOString().split('T')[0],
        mealPlan,
        mentalWellness,
        spiritualGuidance,
        summary,
      },
    } as WellnessPlanResponse);

  } catch (error: any) {
    console.error('[API] Error generating wellness plan:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate wellness plan',
      } as WellnessPlanResponse,
      { status: 500 }
    );
  }
}

// ==================== GET Handler ====================

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get date from query params
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    console.log(`[API] Fetching wellness plan for ${date}`);

    // Fetch existing plan
    const { data: plan, error } = await supabase
      .from('wellness_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .single();

    if (error || !plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found for this date' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: {
        date: plan.date,
        mealPlan: plan.meal_plan,
        mentalWellness: plan.mental_wellness,
        spiritualGuidance: plan.spiritual_guidance,
        summary: plan.summary,
      },
    } as WellnessPlanResponse);

  } catch (error: any) {
    console.error('[API] Error fetching wellness plan:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch wellness plan',
      } as WellnessPlanResponse,
      { status: 500 }
    );
  }
}
