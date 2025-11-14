/**
 * Mood Tracking API Route
 *
 * POST /api/mood - Log a mood entry
 * GET /api/mood - Get mood history
 * GET /api/mood/trends - Get mood trends and analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MentalHealthAgent, type MoodEntry } from '@/lib/agents/mental-health-agent';

// ==================== POST Handler - Log Mood ====================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate mood entry
    const moodEntry: Partial<MoodEntry> = {
      date: body.date || new Date().toISOString(),
      moodRating: body.moodRating,
      stressLevel: body.stressLevel,
      energyLevel: body.energyLevel,
      sleepQuality: body.sleepQuality,
      notes: body.notes,
      tags: body.tags || [],
    };

    // Analyze journal entry if provided
    let analysis = null;
    if (moodEntry.notes && moodEntry.notes.length > 10) {
      const mentalAgent = new MentalHealthAgent({
        profile: {},
      });

      try {
        analysis = await mentalAgent.analyzeJournalEntry(moodEntry.notes);
      } catch (error) {
        console.error('[API] Error analyzing journal:', error);
      }
    }

    // Insert into database
    const { data: inserted, error: insertError } = await supabase
      .from('mood_entries')
      .insert({
        user_id: user.id,
        date: moodEntry.date,
        mood_rating: moodEntry.moodRating,
        stress_level: moodEntry.stressLevel,
        energy_level: moodEntry.energyLevel,
        sleep_quality: moodEntry.sleepQuality,
        notes: moodEntry.notes,
        tags: moodEntry.tags,
        sentiment_analysis: analysis,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log(`[API] Mood entry logged for user ${user.id}`);

    return NextResponse.json({
      success: true,
      entry: inserted,
      analysis,
    });

  } catch (error: any) {
    console.error('[API] Error logging mood:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log mood' },
      { status: 500 }
    );
  }
}

// ==================== GET Handler - Get Mood History ====================

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

    // Get query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const trends = searchParams.get('trends') === 'true';

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch mood entries
    const { data: moods, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    // If trends requested, analyze patterns
    let moodTrends = null;
    if (trends && moods && moods.length > 0) {
      const moodEntries: MoodEntry[] = moods.map(m => ({
        date: m.date,
        moodRating: m.mood_rating,
        stressLevel: m.stress_level,
        energyLevel: m.energy_level,
        sleepQuality: m.sleep_quality,
        notes: m.notes,
        tags: m.tags,
      }));

      const mentalAgent = new MentalHealthAgent({
        profile: {},
        recentMoods: moodEntries,
      });

      moodTrends = mentalAgent.analyzeMoodPattern(moodEntries);
    }

    console.log(`[API] Retrieved ${moods?.length || 0} mood entries`);

    return NextResponse.json({
      success: true,
      moods,
      trends: moodTrends,
      count: moods?.length || 0,
    });

  } catch (error: any) {
    console.error('[API] Error fetching moods:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch moods' },
      { status: 500 }
    );
  }
}
