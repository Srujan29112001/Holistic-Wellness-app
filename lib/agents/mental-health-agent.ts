/**
 * Mental Health Agent
 *
 * Specialized AI agent for mental wellness, mood tracking, and mindfulness.
 * Uses Claude LLM with psychological frameworks and sentiment analysis.
 *
 * Capabilities:
 * - Mood tracking and analysis
 * - Meditation and mindfulness recommendations
 * - Stress management techniques
 * - CBT (Cognitive Behavioral Therapy) exercises
 * - Gratitude journaling prompts
 * - Emotional pattern recognition
 */

import { callClaude, ClaudeMessage } from '../utils/anthropic-client';

// ==================== Types ====================

export interface MoodEntry {
  date: string;           // ISO datetime
  moodRating: number;     // 1-5 scale (1=very low, 5=very high)
  stressLevel: number;    // 1-5 scale
  energyLevel: number;    // 1-5 scale
  sleepQuality?: number;  // 1-5 scale
  notes?: string;         // User journal entry
  tags?: string[];        // e.g., 'anxious', 'happy', 'tired'
}

export interface MoodTrend {
  period: 'week' | 'month';
  averageMood: number;
  averageStress: number;
  averageEnergy: number;
  improvements: string[];
  concerns: string[];
  insights: string;
}

export interface MeditationRecommendation {
  title: string;
  duration: number;       // minutes
  type: 'breathing' | 'body-scan' | 'mindfulness' | 'guided' | 'loving-kindness';
  description: string;
  instructions: string[];
  benefits: string[];
  bestTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'bedtime';
}

export interface MentalWellnessActivity {
  name: string;
  category: 'meditation' | 'exercise' | 'journaling' | 'breathing' | 'cbt' | 'social';
  duration: number;       // minutes
  description: string;
  when: string;           // e.g., "after work", "morning"
  reason: string;         // Why this is recommended now
}

export interface CBTExercise {
  name: string;
  scenario: string;       // User's negative thought
  automaticThought: string;
  cognitiveDistortions: string[];
  balancedThought: string;
  actionPlan: string[];
}

export interface MentalHealthProfile {
  personalityTraits?: BigFiveScores;
  stressors?: string[];   // Known stressors
  copingStrategies?: string[];
  goals?: string[];       // e.g., "reduce anxiety", "improve sleep"
  therapeuticPreferences?: ('meditation' | 'journaling' | 'exercise' | 'social')[];
}

export interface BigFiveScores {
  openness: number;       // 0-100
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface MentalHealthAgentContext {
  profile: MentalHealthProfile;
  recentMoods?: MoodEntry[];
  currentStressLevel?: number;
  sleepQuality?: number;
}

// ==================== Mental Health Agent ====================

export class MentalHealthAgent {
  constructor(private context: MentalHealthAgentContext) {}

  /**
   * Generate personalized mental wellness recommendations
   */
  async generateWellnessRecommendations(): Promise<MentalWellnessActivity[]> {
    console.log('[MentalHealthAgent] Generating wellness recommendations...');

    const { profile, recentMoods, currentStressLevel } = this.context;

    // Analyze current state
    const moodAnalysis = this.analyzeMoodPattern(recentMoods || []);

    // Build context for Claude
    const contextStr = this.buildContextString(moodAnalysis);

    const prompt = `You are a compassionate mental health AI assistant trained in evidence-based practices.

${contextStr}

Based on this context, recommend 3-4 mental wellness activities for today. For each activity:
1. Choose appropriate type: meditation, breathing exercise, journaling, CBT exercise, physical activity, or social connection
2. Specify duration (5-30 minutes)
3. Explain WHY this is recommended right now
4. Provide brief, actionable instructions

Format as JSON array:
[
  {
    "name": "4-7-8 Breathing Exercise",
    "category": "breathing",
    "duration": 5,
    "description": "A calming breathing technique to reduce stress",
    "when": "before bed",
    "reason": "Your stress levels have been elevated. This technique activates the parasympathetic nervous system."
  }
]

Focus on evidence-based practices. Be empathetic but concise.`;

    const response = await callClaude(prompt, {
      model: 'haiku',
      maxTokens: 1500,
    });

    // Parse JSON
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse recommendations from Claude');
    }

    const activities = JSON.parse(jsonMatch[0]);
    console.log('[MentalHealthAgent] Generated recommendations:', activities.length);

    return activities;
  }

  /**
   * Recommend specific meditation based on user's current state
   */
  async recommendMeditation(): Promise<MeditationRecommendation> {
    const { currentStressLevel, recentMoods } = this.context;

    const prompt = `You are a mindfulness meditation teacher.

Current state:
- Stress level: ${currentStressLevel || 'unknown'}/5
${recentMoods && recentMoods.length > 0 ? `- Recent mood: ${this.getMoodDescription(recentMoods[0].moodRating)}` : ''}

Recommend ONE meditation practice. Provide:
- Title
- Type (breathing, body-scan, mindfulness, guided, or loving-kindness)
- Duration (5-20 minutes)
- Description (1 sentence)
- Step-by-step instructions (3-5 steps)
- Benefits (2-3 bullet points)
- Best time of day

Format as JSON:
{
  "title": "Mindful Body Scan",
  "type": "body-scan",
  "duration": 10,
  "description": "A gentle practice to reconnect with physical sensations",
  "instructions": [
    "Lie down comfortably",
    "Close eyes and take 3 deep breaths",
    "Slowly scan attention from toes to head"
  ],
  "benefits": ["Reduces tension", "Improves body awareness"],
  "bestTimeOfDay": "evening"
}`;

    const response = await callClaude(prompt, {
      model: 'haiku',
      maxTokens: 800,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse meditation recommendation');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Analyze mood entries and identify trends
   */
  analyzeMoodPattern(moods: MoodEntry[]): MoodTrend | null {
    if (moods.length === 0) return null;

    const avgMood = this.average(moods.map(m => m.moodRating));
    const avgStress = this.average(moods.map(m => m.stressLevel));
    const avgEnergy = this.average(moods.map(m => m.energyLevel));

    const improvements: string[] = [];
    const concerns: string[] = [];

    // Check trends (compare first half vs second half)
    if (moods.length >= 4) {
      const midpoint = Math.floor(moods.length / 2);
      const firstHalfMood = this.average(moods.slice(0, midpoint).map(m => m.moodRating));
      const secondHalfMood = this.average(moods.slice(midpoint).map(m => m.moodRating));

      if (secondHalfMood > firstHalfMood + 0.5) {
        improvements.push('Mood trending upward');
      } else if (secondHalfMood < firstHalfMood - 0.5) {
        concerns.push('Mood declining over time');
      }

      const firstHalfStress = this.average(moods.slice(0, midpoint).map(m => m.stressLevel));
      const secondHalfStress = this.average(moods.slice(midpoint).map(m => m.stressLevel));

      if (secondHalfStress < firstHalfStress - 0.5) {
        improvements.push('Stress levels decreasing');
      } else if (secondHalfStress > firstHalfStress + 0.5) {
        concerns.push('Stress levels increasing');
      }
    }

    // Absolute thresholds
    if (avgMood < 2.5) {
      concerns.push('Consistently low mood');
    }
    if (avgStress > 3.5) {
      concerns.push('High stress levels');
    }
    if (avgEnergy < 2.5) {
      concerns.push('Low energy levels');
    }

    const insights = this.generateInsights(avgMood, avgStress, avgEnergy, improvements, concerns);

    return {
      period: moods.length > 20 ? 'month' : 'week',
      averageMood: Math.round(avgMood * 10) / 10,
      averageStress: Math.round(avgStress * 10) / 10,
      averageEnergy: Math.round(avgEnergy * 10) / 10,
      improvements,
      concerns,
      insights,
    };
  }

  /**
   * Generate a CBT exercise based on negative thought
   */
  async generateCBTExercise(negativeThought: string): Promise<CBTExercise> {
    const prompt = `You are a cognitive behavioral therapist.

The user is experiencing this negative thought:
"${negativeThought}"

Help them challenge this thought using CBT. Provide:
1. Identify the automatic thought
2. List possible cognitive distortions (e.g., catastrophizing, black-and-white thinking, overgeneralization)
3. Suggest a more balanced, rational thought
4. Provide 2-3 action steps they can take

Format as JSON:
{
  "name": "Challenging Catastrophic Thinking",
  "scenario": "${negativeThought}",
  "automaticThought": "...",
  "cognitiveDistortions": ["catastrophizing", "..."],
  "balancedThought": "...",
  "actionPlan": ["Step 1...", "Step 2..."]
}`;

    const response = await callClaude(prompt, {
      model: 'sonnet',
      maxTokens: 800,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse CBT exercise');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Analyze journal entry sentiment
   */
  async analyzeJournalEntry(entry: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    emotions: string[];
    themes: string[];
    suggestions: string[];
  }> {
    const prompt = `Analyze this journal entry for emotional content:

"${entry}"

Provide:
1. Overall sentiment (positive, neutral, or negative)
2. Emotions detected (2-4 emotions)
3. Themes (2-3 main themes)
4. Supportive suggestions (2-3 brief suggestions)

Format as JSON:
{
  "sentiment": "negative",
  "emotions": ["anxiety", "worry"],
  "themes": ["work stress", "uncertainty"],
  "suggestions": ["Practice self-compassion", "Consider breaking tasks into smaller steps"]
}`;

    const response = await callClaude(prompt, {
      model: 'haiku',
      maxTokens: 500,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse journal analysis');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Generate gratitude journaling prompts
   */
  async generateGratitudePrompts(): Promise<string[]> {
    const prompt = `Generate 3 gratitude journaling prompts for today. Make them thoughtful and varied.

Format as JSON array of strings:
["What small moment brought you joy today?", "...", "..."]`;

    const response = await callClaude(prompt, {
      model: 'haiku',
      maxTokens: 300,
    });

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse gratitude prompts');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Answer mental health questions
   */
  async answerQuestion(question: string): Promise<string> {
    const { profile, recentMoods } = this.context;

    const systemPrompt = `You are a compassionate mental health AI assistant trained in evidence-based psychology.

Context:
${profile ? JSON.stringify(profile, null, 2) : 'No profile available'}
${recentMoods ? `Recent mood average: ${this.average(recentMoods.map(m => m.moodRating)).toFixed(1)}/5` : ''}

Provide supportive, evidence-based responses. Always encourage professional help for serious concerns. Be empathetic and non-judgmental.`;

    const response = await callClaude(question, {
      model: 'sonnet',
      systemPrompt,
      maxTokens: 600,
    });

    return response;
  }

  // ==================== Private Helpers ====================

  private buildContextString(moodAnalysis: MoodTrend | null): string {
    const { profile, currentStressLevel, sleepQuality } = this.context;

    const parts: string[] = [];

    parts.push('USER CONTEXT:');

    if (currentStressLevel) {
      parts.push(`- Current stress: ${currentStressLevel}/5 (${this.getStressDescription(currentStressLevel)})`);
    }

    if (sleepQuality) {
      parts.push(`- Sleep quality: ${sleepQuality}/5`);
    }

    if (moodAnalysis) {
      parts.push(`- Average mood: ${moodAnalysis.averageMood}/5`);
      parts.push(`- Average stress: ${moodAnalysis.averageStress}/5`);

      if (moodAnalysis.concerns.length > 0) {
        parts.push(`- Concerns: ${moodAnalysis.concerns.join(', ')}`);
      }

      if (moodAnalysis.improvements.length > 0) {
        parts.push(`- Improvements: ${moodAnalysis.improvements.join(', ')}`);
      }
    }

    if (profile?.personalityTraits) {
      const traits = profile.personalityTraits;
      if (traits.neuroticism > 60) {
        parts.push('- Personality: Higher neuroticism (more stress-sensitive)');
      }
      if (traits.extraversion < 40) {
        parts.push('- Personality: Lower extraversion (prefers solitary activities)');
      }
    }

    if (profile?.goals && profile.goals.length > 0) {
      parts.push(`- Goals: ${profile.goals.join(', ')}`);
    }

    if (profile?.stressors && profile.stressors.length > 0) {
      parts.push(`- Known stressors: ${profile.stressors.join(', ')}`);
    }

    return parts.join('\n');
  }

  private generateInsights(
    avgMood: number,
    avgStress: number,
    avgEnergy: number,
    improvements: string[],
    concerns: string[]
  ): string {
    const insights: string[] = [];

    if (concerns.length > 0) {
      insights.push(`Areas to focus on: ${concerns.join(', ')}.`);
    }

    if (improvements.length > 0) {
      insights.push(`Positive trends: ${improvements.join(', ')}.`);
    }

    if (avgStress > 3.5 && avgEnergy < 2.5) {
      insights.push('High stress with low energy suggests need for rest and stress management.');
    }

    if (avgMood > 3.5 && avgStress < 2.5) {
      insights.push('Generally positive state. Maintain current wellness practices.');
    }

    if (insights.length === 0) {
      insights.push('Overall wellness is stable. Continue monitoring and practicing self-care.');
    }

    return insights.join(' ');
  }

  private getMoodDescription(rating: number): string {
    if (rating >= 4.5) return 'very positive';
    if (rating >= 3.5) return 'good';
    if (rating >= 2.5) return 'okay';
    if (rating >= 1.5) return 'low';
    return 'very low';
  }

  private getStressDescription(level: number): string {
    if (level >= 4) return 'high';
    if (level >= 3) return 'moderate';
    if (level >= 2) return 'mild';
    return 'low';
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}

// ==================== Pre-defined Meditation Library ====================

export const MEDITATION_LIBRARY: MeditationRecommendation[] = [
  {
    title: 'Box Breathing (4-4-4-4)',
    duration: 5,
    type: 'breathing',
    description: 'A simple breathing technique used by Navy SEALs to reduce stress',
    instructions: [
      'Sit comfortably with feet flat on floor',
      'Inhale through nose for 4 counts',
      'Hold breath for 4 counts',
      'Exhale through mouth for 4 counts',
      'Hold empty lungs for 4 counts',
      'Repeat for 5 minutes',
    ],
    benefits: [
      'Activates parasympathetic nervous system',
      'Reduces stress and anxiety quickly',
      'Improves focus and mental clarity',
    ],
    bestTimeOfDay: 'morning',
  },
  {
    title: '4-7-8 Relaxation Breath',
    duration: 5,
    type: 'breathing',
    description: 'Dr. Andrew Weil\'s natural tranquilizer for the nervous system',
    instructions: [
      'Sit with back straight',
      'Place tongue behind upper front teeth',
      'Exhale completely through mouth with whoosh sound',
      'Close mouth, inhale through nose for 4 counts',
      'Hold breath for 7 counts',
      'Exhale through mouth for 8 counts',
      'Repeat cycle 4 times',
    ],
    benefits: [
      'Induces calm and promotes sleep',
      'Reduces anxiety instantly',
      'Can be done anywhere',
    ],
    bestTimeOfDay: 'bedtime',
  },
  {
    title: 'Body Scan Meditation',
    duration: 15,
    type: 'body-scan',
    description: 'Progressive relaxation by focusing attention on each body part',
    instructions: [
      'Lie down in a quiet space',
      'Close eyes and take 3 deep breaths',
      'Start at your toes - notice sensations without judgment',
      'Slowly move attention up through feet, legs, torso',
      'Continue to arms, neck, face, top of head',
      'Spend 1-2 minutes on each body region',
      'Notice areas of tension and consciously relax them',
    ],
    benefits: [
      'Releases physical tension',
      'Improves body awareness',
      'Helps with insomnia',
    ],
    bestTimeOfDay: 'evening',
  },
  {
    title: 'Mindful Morning Meditation',
    duration: 10,
    type: 'mindfulness',
    description: 'Set positive intentions for the day ahead',
    instructions: [
      'Sit comfortably soon after waking',
      'Focus on natural breath for 2 minutes',
      'Bring to mind 3 things you\'re grateful for',
      'Set 1-2 intentions for the day (e.g., "I will be patient")',
      'Visualize your day going well',
      'Take 3 deep breaths and open eyes',
    ],
    benefits: [
      'Starts day with positive mindset',
      'Increases gratitude',
      'Reduces morning anxiety',
    ],
    bestTimeOfDay: 'morning',
  },
  {
    title: 'Loving-Kindness Meditation (Metta)',
    duration: 10,
    type: 'loving-kindness',
    description: 'Cultivate compassion for self and others',
    instructions: [
      'Sit comfortably and close eyes',
      'Begin with yourself: "May I be happy, may I be healthy, may I be safe"',
      'Repeat 3-5 times, feeling the intention',
      'Extend to a loved one: "May you be happy..."',
      'Extend to a neutral person',
      'Extend to a difficult person (optional)',
      'Extend to all beings: "May all beings be happy..."',
    ],
    benefits: [
      'Increases compassion and empathy',
      'Reduces self-criticism',
      'Improves relationships',
    ],
    bestTimeOfDay: 'afternoon',
  },
];

// ==================== CBT Common Distortions ====================

export const COGNITIVE_DISTORTIONS = [
  'All-or-Nothing Thinking',
  'Overgeneralization',
  'Mental Filter (focusing only on negatives)',
  'Disqualifying the Positive',
  'Jumping to Conclusions (mind reading, fortune telling)',
  'Magnification or Minimization',
  'Emotional Reasoning',
  'Should Statements',
  'Labeling',
  'Personalization',
] as const;
