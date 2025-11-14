/**
 * User Profile API Route
 *
 * GET /api/profile - Get user profile
 * POST /api/profile - Create/update user profile
 * PATCH /api/profile - Partially update profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateTDEE, calculateProteinTarget } from '@/lib/agents/nutrition-agent';
import { getSunSign } from '@/lib/apis/vedic-astro-client';

// ==================== GET Handler ====================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {  // Not "no rows returned"
      throw error;
    }

    if (!profile) {
      return NextResponse.json({
        success: true,
        profile: null,
        onboardingComplete: false,
      });
    }

    return NextResponse.json({
      success: true,
      profile,
      onboardingComplete: profile.onboarding_completed,
    });

  } catch (error: any) {
    console.error('[API] Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// ==================== POST Handler - Create/Update ====================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[API] Updating profile for user:', user.id);

    // Calculate nutrition targets if basic info provided
    let calorieTarget, proteinTarget, carbsTarget, fatTarget;

    if (body.weight && body.height && body.age && body.sex) {
      const activityLevel = body.activity_level || 'moderate';
      calorieTarget = calculateTDEE(
        body.weight,
        body.height,
        body.age,
        body.sex,
        activityLevel
      );

      // Adjust for goal
      if (body.goal === 'lose') calorieTarget -= 500;
      if (body.goal === 'gain') calorieTarget += 300;

      proteinTarget = calculateProteinTarget(body.weight);

      // Default macros: 30% protein, 30% fat, 40% carbs
      const proteinCals = proteinTarget * 4;
      const fatCals = calorieTarget * 0.30;
      const carbsCals = calorieTarget - proteinCals - fatCals;

      carbsTarget = Math.round(carbsCals / 4);
      fatTarget = Math.round(fatCals / 9);
    }

    // Calculate sun sign if birth date provided
    let sunSign;
    if (body.birth_date) {
      const birthDate = new Date(body.birth_date);
      sunSign = getSunSign(birthDate.getMonth() + 1, birthDate.getDate());
    }

    // Prepare profile data
    const profileData = {
      user_id: user.id,

      // Basic info
      age: body.age,
      sex: body.sex,
      height: body.height,
      weight: body.weight,

      // Nutrition
      calorie_target: calorieTarget || body.calorie_target,
      protein_target: proteinTarget || body.protein_target,
      carbs_target: carbsTarget || body.carbs_target,
      fat_target: fatTarget || body.fat_target,
      dietary_restrictions: body.dietary_restrictions || [],
      dietary_preferences: body.dietary_preferences || [],
      allergies: body.allergies || [],
      meals_per_day: body.meals_per_day || 3,
      diet_type: body.diet_type || 'standard',

      // Fitness
      activity_level: body.activity_level || 'moderate',
      fitness_goals: body.fitness_goals || [],

      // Mental Health
      personality_traits: body.personality_traits,
      stressors: body.stressors || [],
      coping_strategies: body.coping_strategies || [],
      mental_health_goals: body.mental_health_goals || [],
      therapeutic_preferences: body.therapeutic_preferences || [],
      current_stress_level: body.current_stress_level,
      sleep_quality: body.sleep_quality,

      // Spiritual
      birth_date: body.birth_date,
      birth_time: body.birth_time,
      birth_place: body.birth_place,
      sun_sign: sunSign || body.sun_sign,
      moon_sign: body.moon_sign,
      dosha: body.dosha,
      spiritual_interests: body.spiritual_interests || [],
      spiritual_practices: body.spiritual_practices || [],
      belief_system: body.belief_system,

      // Location
      location: body.location,

      // Meta
      onboarding_completed: body.onboarding_completed || false,
      updated_at: new Date().toISOString(),
    };

    // Upsert profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .upsert(profileData, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('[API] Profile updated successfully');

    return NextResponse.json({
      success: true,
      profile,
    });

  } catch (error: any) {
    console.error('[API] Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// ==================== PATCH Handler - Partial Update ====================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only update provided fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Map body fields to database fields
    const fieldMapping: { [key: string]: string } = {
      calorieTarget: 'calorie_target',
      proteinTarget: 'protein_target',
      carbsTarget: 'carbs_target',
      fatTarget: 'fat_target',
      dietaryRestrictions: 'dietary_restrictions',
      dietaryPreferences: 'dietary_preferences',
      mealsPerDay: 'meals_per_day',
      dietType: 'diet_type',
      activityLevel: 'activity_level',
      fitnessGoals: 'fitness_goals',
      personalityTraits: 'personality_traits',
      copingStrategies: 'coping_strategies',
      mentalHealthGoals: 'mental_health_goals',
      therapeuticPreferences: 'therapeutic_preferences',
      currentStressLevel: 'current_stress_level',
      sleepQuality: 'sleep_quality',
      birthDate: 'birth_date',
      birthTime: 'birth_time',
      birthPlace: 'birth_place',
      sunSign: 'sun_sign',
      moonSign: 'moon_sign',
      spiritualInterests: 'spiritual_interests',
      spiritualPractices: 'spiritual_practices',
      beliefSystem: 'belief_system',
      onboardingCompleted: 'onboarding_completed',
    };

    Object.keys(body).forEach(key => {
      const dbField = fieldMapping[key] || key;
      updateData[dbField] = body[key];
    });

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('[API] Profile partially updated');

    return NextResponse.json({
      success: true,
      profile,
    });

  } catch (error: any) {
    console.error('[API] Error patching profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
