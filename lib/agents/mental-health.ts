/**
 * Mental Health Agent
 *
 * Specializes in mood tracking, meditation recommendations, stress management,
 * and mental wellness guidance.
 */

import { Agent, AgentContext, AgentResponse, AgentRole } from '@/types/agents/base';
import { A2AAgentCard, A2AMessage } from '@/types/protocols/a2a';
import { MCPTool, MCPToolResult } from '@/types/protocols/mcp';
import { createAnthropicClient } from '@/lib/utils/anthropic-client';

interface MoodEntry {
  date: string;
  mood: number; // 1-5
  energy: number; // 1-5
  stress: number; // 1-5
  sleepHours: number;
  notes?: string;
  tags?: string[];
}

interface MentalWellnessRecommendation {
  type: 'meditation' | 'breathing' | 'journaling' | 'activity' | 'rest';
  title: string;
  description: string;
  duration: number; // minutes
  benefits: string[];
  instructions?: string[];
  when?: string;
}

export class MentalHealthAgent implements Agent {
  id = 'mental-health-agent';
  role: AgentRole = 'mental-health';
  name = 'Mental Wellness Specialist';
  description = 'Expert in mood tracking, meditation guidance, stress management, and mental wellness practices';

  private claudeClient = createAnthropicClient();

  getAgentCard(): A2AAgentCard {
    return {
      agentId: this.id,
      name: this.name,
      description: this.description,
      capabilities: [
        'mood_analysis',
        'meditation_recommendations',
        'stress_management',
        'cbt_techniques',
        'mindfulness_guidance',
        'sleep_optimization'
      ],
      endpoints: [
        {
          path: '/api/agents/mental-health',
          method: 'POST',
          description: 'Get mental wellness recommendations and mood analysis'
        }
      ],
      version: '1.0.0'
    };
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'analyze_mood_trends',
        description: 'Analyze mood patterns over time from mood tracking data',
        inputSchema: {
          type: 'object',
          properties: {
            moodEntries: {
              type: 'array',
              description: 'Array of mood entries with dates and scores'
            },
            period: {
              type: 'string',
              description: 'Time period to analyze (week, month, etc.)'
            }
          },
          required: ['moodEntries']
        }
      },
      {
        name: 'recommend_meditation',
        description: 'Recommend meditation practices based on current state and goals',
        inputSchema: {
          type: 'object',
          properties: {
            currentMood: { type: 'number' },
            stressLevel: { type: 'number' },
            availableTime: { type: 'number' },
            experience: { type: 'string' }
          },
          required: ['currentMood', 'stressLevel']
        }
      },
      {
        name: 'suggest_cbt_technique',
        description: 'Suggest Cognitive Behavioral Therapy techniques for specific issues',
        inputSchema: {
          type: 'object',
          properties: {
            issue: { type: 'string', description: 'The mental health challenge' },
            context: { type: 'string' }
          },
          required: ['issue']
        }
      }
    ];
  }

  async process(request: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Analyze user's current mental state from context
      const currentState = this.analyzeCurrentState(context);

      // Generate personalized mental wellness recommendations
      const recommendations = await this.generateRecommendations(currentState, context);

      // Get mood trends if available
      const moodAnalysis = await this.analyzeMoodHistory(context);

      return {
        agentId: this.id,
        success: true,
        data: {
          recommendations,
          moodAnalysis,
          dailyPractices: this.getDailyPractices(currentState),
          insights: await this.generateInsights(currentState, context)
        },
        message: 'Mental wellness guidance generated successfully',
        confidence: 0.85,
        reasoning: 'Recommendations based on mood trends, stress levels, and evidence-based practices'
      };
    } catch (error) {
      console.error('Mental health agent error:', error);
      return {
        agentId: this.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to generate mental wellness guidance'
      };
    }
  }

  async handleA2AMessage(message: A2AMessage, context: AgentContext): Promise<AgentResponse> {
    const { task, parameters } = message.content;

    switch (task) {
      case 'analyze_mood':
        return this.analyzeMood(parameters, context);

      case 'recommend_practices':
        return this.process('', context);

      case 'suggest_stress_relief':
        return this.suggestStressRelief(parameters, context);

      default:
        return {
          agentId: this.id,
          success: false,
          error: `Unknown task: ${task}`,
          message: 'Task not supported by Mental Health Agent'
        };
    }
  }

  async executeTool(toolCall: { name: string; parameters: any }, context: AgentContext): Promise<MCPToolResult> {
    switch (toolCall.name) {
      case 'analyze_mood_trends':
        return this.analyzeMoodTrends(toolCall.parameters);

      case 'recommend_meditation':
        return this.recommendMeditation(toolCall.parameters);

      case 'suggest_cbt_technique':
        return this.suggestCBTTechnique(toolCall.parameters);

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolCall.name}`
        };
    }
  }

  // Private helper methods

  private analyzeCurrentState(context: AgentContext) {
    // Extract current mental state from context
    const latestMood = context.recentData?.moodEntries?.[0];

    return {
      mood: latestMood?.mood || 3,
      energy: latestMood?.energy || 3,
      stress: latestMood?.stress || 3,
      sleepQuality: latestMood?.sleepHours >= 7 ? 'good' : 'poor',
      recentConcerns: latestMood?.notes || ''
    };
  }

  private async generateRecommendations(
    state: any,
    context: AgentContext
  ): Promise<MentalWellnessRecommendation[]> {
    const recommendations: MentalWellnessRecommendation[] = [];

    // Stress management
    if (state.stress >= 4) {
      recommendations.push({
        type: 'breathing',
        title: '4-7-8 Breathing Exercise',
        description: 'A calming breathing technique to reduce stress and anxiety',
        duration: 5,
        benefits: [
          'Activates parasympathetic nervous system',
          'Reduces anxiety and stress',
          'Improves focus and clarity'
        ],
        instructions: [
          'Exhale completely through your mouth',
          'Close your mouth and inhale through nose for 4 counts',
          'Hold your breath for 7 counts',
          'Exhale completely through mouth for 8 counts',
          'Repeat 4 times'
        ],
        when: 'When feeling stressed or anxious'
      });
    }

    // Energy boost
    if (state.energy <= 2) {
      recommendations.push({
        type: 'activity',
        title: 'Energizing Movement Break',
        description: 'Quick physical activity to boost energy and mood',
        duration: 10,
        benefits: [
          'Increases energy levels',
          'Releases endorphins',
          'Improves circulation'
        ],
        instructions: [
          'Take a brisk 10-minute walk outside',
          'Or do 5 minutes of stretching and light exercises',
          'Focus on deep breathing while moving'
        ],
        when: 'Mid-morning or afternoon slump'
      });
    }

    // Meditation for overall wellness
    recommendations.push({
      type: 'meditation',
      title: 'Mindful Morning Meditation',
      description: 'Start your day with clarity and intention',
      duration: 15,
      benefits: [
        'Improves focus and concentration',
        'Reduces stress throughout the day',
        'Enhances emotional regulation'
      ],
      instructions: [
        'Find a quiet, comfortable place to sit',
        'Close your eyes and focus on your breath',
        'Notice thoughts without judgment, let them pass',
        'Set an intention for your day',
        'Gradually return awareness to your surroundings'
      ],
      when: 'First thing in the morning'
    });

    // Journaling for mood improvement
    if (state.mood <= 2) {
      recommendations.push({
        type: 'journaling',
        title: 'Gratitude Journaling',
        description: 'Write down three things you\'re grateful for',
        duration: 10,
        benefits: [
          'Shifts focus to positive aspects',
          'Improves overall mood',
          'Builds resilience over time'
        ],
        instructions: [
          'Write down 3 things you\'re grateful for today',
          'Be specific about why you\'re grateful',
          'Include both big and small things',
          'Reflect on how these things make you feel'
        ],
        when: 'Evening before bed'
      });
    }

    // Sleep optimization
    if (state.sleepQuality === 'poor') {
      recommendations.push({
        type: 'rest',
        title: 'Sleep Hygiene Routine',
        description: 'Evening routine to improve sleep quality',
        duration: 30,
        benefits: [
          'Improves sleep quality',
          'Helps you fall asleep faster',
          'Enhances next-day energy'
        ],
        instructions: [
          'Dim lights 1 hour before bed',
          'Avoid screens 30 minutes before sleep',
          'Practice 5 minutes of deep breathing',
          'Keep bedroom cool and dark',
          'Stick to consistent sleep schedule'
        ],
        when: '1 hour before bedtime'
      });
    }

    return recommendations;
  }

  private async analyzeMoodHistory(context: AgentContext): Promise<any> {
    const moodEntries = context.recentData?.moodEntries || [];

    if (moodEntries.length === 0) {
      return {
        available: false,
        message: 'Start tracking your mood to see patterns and insights'
      };
    }

    // Calculate averages
    const avgMood = moodEntries.reduce((sum: number, e: any) => sum + e.mood, 0) / moodEntries.length;
    const avgStress = moodEntries.reduce((sum: number, e: any) => sum + e.stress, 0) / moodEntries.length;
    const avgEnergy = moodEntries.reduce((sum: number, e: any) => sum + e.energy, 0) / moodEntries.length;

    // Detect trends
    const recentEntries = moodEntries.slice(0, 3);
    const olderEntries = moodEntries.slice(3, 6);

    const recentAvgMood = recentEntries.reduce((sum: number, e: any) => sum + e.mood, 0) / (recentEntries.length || 1);
    const olderAvgMood = olderEntries.reduce((sum: number, e: any) => sum + e.mood, 0) / (olderEntries.length || 1);

    const trend = recentAvgMood > olderAvgMood ? 'improving' : recentAvgMood < olderAvgMood ? 'declining' : 'stable';

    return {
      available: true,
      period: `Last ${moodEntries.length} days`,
      averages: {
        mood: Math.round(avgMood * 10) / 10,
        stress: Math.round(avgStress * 10) / 10,
        energy: Math.round(avgEnergy * 10) / 10
      },
      trend,
      insights: await this.generateMoodInsights(moodEntries)
    };
  }

  private async generateMoodInsights(moodEntries: MoodEntry[]): Promise<string[]> {
    const insights: string[] = [];

    // Sleep correlation
    const goodSleepDays = moodEntries.filter(e => e.sleepHours >= 7);
    const poorSleepDays = moodEntries.filter(e => e.sleepHours < 7);

    if (goodSleepDays.length > 0 && poorSleepDays.length > 0) {
      const goodSleepMood = goodSleepDays.reduce((sum, e) => sum + e.mood, 0) / goodSleepDays.length;
      const poorSleepMood = poorSleepDays.reduce((sum, e) => sum + e.mood, 0) / poorSleepDays.length;

      if (goodSleepMood > poorSleepMood + 0.5) {
        insights.push('Your mood is significantly better on days with 7+ hours of sleep');
      }
    }

    // Stress patterns
    const highStressDays = moodEntries.filter(e => e.stress >= 4).length;
    if (highStressDays > moodEntries.length / 2) {
      insights.push('You\'ve experienced high stress frequently. Consider stress management techniques');
    }

    // Energy patterns
    const lowEnergyDays = moodEntries.filter(e => e.energy <= 2).length;
    if (lowEnergyDays > moodEntries.length / 3) {
      insights.push('Low energy is common for you. Regular exercise and better sleep may help');
    }

    return insights;
  }

  private getDailyPractices(state: any): Array<{ practice: string; time: string; duration: string }> {
    return [
      {
        practice: 'Morning Meditation',
        time: '7:00 AM',
        duration: '10-15 minutes'
      },
      {
        practice: 'Gratitude Journaling',
        time: '9:00 PM',
        duration: '5-10 minutes'
      },
      {
        practice: 'Mindful Break',
        time: '12:00 PM',
        duration: '5 minutes'
      },
      {
        practice: 'Evening Reflection',
        time: '8:00 PM',
        duration: '10 minutes'
      }
    ];
  }

  private async generateInsights(state: any, context: AgentContext): Promise<string[]> {
    const insights: string[] = [];

    // Use Claude for personalized insights
    const prompt = `Based on this mental state, provide 2-3 brief, actionable insights:
    - Current Mood: ${state.mood}/5
    - Stress Level: ${state.stress}/5
    - Energy: ${state.energy}/5
    - Sleep: ${state.sleepQuality}

    Focus on practical, evidence-based suggestions for improving mental wellness.`;

    try {
      const response = await this.claudeClient.chat({
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-3-haiku-20240307',
        maxTokens: 300
      });

      const lines = response.content.split('\n').filter(line => line.trim().length > 0);
      insights.push(...lines.slice(0, 3));
    } catch (error) {
      // Fallback insights
      if (state.stress >= 4) {
        insights.push('High stress detected. Prioritize relaxation techniques today.');
      }
      if (state.sleepQuality === 'poor') {
        insights.push('Better sleep can significantly improve mood and energy.');
      }
    }

    return insights;
  }

  private async analyzeMood(parameters: any, context: AgentContext): Promise<AgentResponse> {
    const moodAnalysis = await this.analyzeMoodHistory(context);

    return {
      agentId: this.id,
      success: true,
      data: moodAnalysis,
      message: 'Mood analysis completed'
    };
  }

  private async suggestStressRelief(parameters: any, context: AgentContext): Promise<AgentResponse> {
    const { stressLevel } = parameters;

    const techniques = [
      {
        name: 'Progressive Muscle Relaxation',
        duration: 15,
        description: 'Systematically tense and relax muscle groups'
      },
      {
        name: 'Box Breathing',
        duration: 5,
        description: 'Inhale, hold, exhale, hold - each for 4 counts'
      },
      {
        name: 'Mindful Walking',
        duration: 20,
        description: 'Walk slowly, focusing on each step and breath'
      }
    ];

    return {
      agentId: this.id,
      success: true,
      data: { techniques },
      message: 'Stress relief techniques suggested'
    };
  }

  // Tool implementations

  private async analyzeMoodTrends(params: { moodEntries: MoodEntry[]; period?: string }): Promise<MCPToolResult> {
    try {
      const { moodEntries } = params;

      if (moodEntries.length === 0) {
        return {
          success: true,
          data: {
            message: 'No mood data available',
            trends: []
          }
        };
      }

      const trends = {
        averageMood: moodEntries.reduce((sum, e) => sum + e.mood, 0) / moodEntries.length,
        averageStress: moodEntries.reduce((sum, e) => sum + e.stress, 0) / moodEntries.length,
        averageEnergy: moodEntries.reduce((sum, e) => sum + e.energy, 0) / moodEntries.length,
        sleepAverage: moodEntries.reduce((sum, e) => sum + e.sleepHours, 0) / moodEntries.length
      };

      return {
        success: true,
        data: trends
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  private async recommendMeditation(params: {
    currentMood: number;
    stressLevel: number;
    availableTime?: number;
    experience?: string;
  }): Promise<MCPToolResult> {
    const { currentMood, stressLevel, availableTime = 15, experience = 'beginner' } = params;

    const recommendations = [];

    if (stressLevel >= 4) {
      recommendations.push({
        type: 'Stress Relief',
        name: 'Calming Breath Meditation',
        duration: Math.min(availableTime, 10),
        difficulty: 'beginner'
      });
    }

    if (currentMood <= 2) {
      recommendations.push({
        type: 'Mood Boost',
        name: 'Loving-Kindness Meditation',
        duration: Math.min(availableTime, 15),
        difficulty: 'beginner'
      });
    }

    recommendations.push({
      type: 'General Wellness',
      name: 'Mindfulness Meditation',
      duration: availableTime,
      difficulty: experience
    });

    return {
      success: true,
      data: { recommendations }
    };
  }

  private async suggestCBTTechnique(params: { issue: string; context?: string }): Promise<MCPToolResult> {
    const { issue } = params;

    const techniques: Record<string, any> = {
      anxiety: {
        name: 'Cognitive Restructuring',
        steps: [
          'Identify the anxious thought',
          'Question the evidence for and against it',
          'Consider alternative perspectives',
          'Develop a balanced thought'
        ]
      },
      worry: {
        name: 'Worry Time',
        steps: [
          'Schedule 15 minutes for "worry time"',
          'Write down all worries',
          'Problem-solve actionable worries',
          'Accept non-actionable ones'
        ]
      },
      negativity: {
        name: 'Thought Record',
        steps: [
          'Record the negative thought',
          'Rate the emotion (0-10)',
          'Challenge the thought with evidence',
          'Create a balanced alternative',
          'Re-rate the emotion'
        ]
      }
    };

    const matchedTechnique = Object.keys(techniques).find(key =>
      issue.toLowerCase().includes(key)
    );

    const technique = matchedTechnique ? techniques[matchedTechnique] : techniques.anxiety;

    return {
      success: true,
      data: { technique }
    };
  }
}

// Export singleton instance
export const mentalHealthAgent = new MentalHealthAgent();
