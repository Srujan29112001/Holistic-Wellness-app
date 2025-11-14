/**
 * Wellness Planning API Route
 *
 * Main endpoint for generating holistic wellness plans.
 * Coordinates all specialist agents to create comprehensive daily guidance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/auth';
import { coordinatorAgent } from '@/lib/agents/coordinator';
import { nutritionAgent } from '@/lib/agents/nutrition';
import { mentalHealthAgent } from '@/lib/agents/mental-health';
import { spiritualAgent } from '@/lib/agents/spiritual';
import { schedulerAgent } from '@/lib/agents/scheduler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface WellnessPlanRequest {
  date?: string;
  includeDomains?: Array<'nutrition' | 'mental' | 'spiritual' | 'schedule'>;
  preferences?: {
    focusArea?: string;
    availableTime?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: WellnessPlanRequest = await request.json();
    const {
      date = new Date().toISOString().split('T')[0],
      includeDomains = ['nutrition', 'mental', 'spiritual', 'schedule'],
      preferences = {}
    } = body;

    // Fetch user profile and recent data
    const [profileData, moodData, mealData] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(7),
      supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(7)
    ]);

    // Build agent context
    const context = {
      userId: user.id,
      userProfile: profileData.data,
      recentData: {
        moodEntries: moodData.data || [],
        mealLogs: mealData.data || []
      },
      preferences,
      timestamp: new Date().toISOString()
    };

    // Use coordinator to orchestrate all agents
    const planningRequest = `Generate a comprehensive wellness plan for ${date}. Include: ${includeDomains.join(', ')}.`;

    const response = await coordinatorAgent.process(planningRequest, context);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to generate wellness plan' },
        { status: 500 }
      );
    }

    // Store the generated plan
    const { data: planData, error: planError } = await supabase
      .from('wellness_plans')
      .insert({
        user_id: user.id,
        date,
        plan_type: 'daily',
        plan_data: response.data,
        status: 'active'
      })
      .select()
      .single();

    if (planError) {
      console.error('Error storing wellness plan:', planError);
    }

    // Log agent session
    await supabase.from('agent_sessions').insert({
      user_id: user.id,
      session_id: crypto.randomUUID(),
      agent_role: 'coordinator',
      request: planningRequest,
      response: response,
      execution_time: 0, // Would track actual time in production
      status: 'success'
    });

    return NextResponse.json({
      success: true,
      data: {
        plan: response.data,
        planId: planData?.id,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Wellness plan generation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Fetch wellness plan for the date
    const { data, error } = await supabase
      .from('wellness_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'No wellness plan found for this date' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        plan: data.plan_data,
        planId: data.id,
        date: data.date,
        status: data.status,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching wellness plan:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
