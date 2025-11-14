/**
 * Spiritual Agent
 *
 * Specializes in spiritual wellness, astrological insights, Ayurvedic recommendations,
 * and holistic spiritual practices.
 */

import { Agent, AgentContext, AgentResponse, AgentRole } from '@/types/agents/base';
import { A2AAgentCard, A2AMessage } from '@/types/protocols/a2a';
import { MCPTool, MCPToolResult } from '@/types/protocols/mcp';
import { createAnthropicClient } from '@/lib/utils/anthropic-client';
import { VedicAstroClient } from '@/lib/apis/vedic-astro-client';

interface SpiritualPractice {
  type: 'meditation' | 'yoga' | 'mantra' | 'prayer' | 'ritual';
  name: string;
  description: string;
  duration: number;
  benefits: string[];
  instructions?: string[];
  bestTime?: string;
}

interface AstrologicalInsight {
  sunSign: string;
  moonSign?: string;
  dailyHoroscope: string;
  luckyColor?: string;
  luckyNumber?: number;
  auspiciousTimes?: string[];
  recommendations: string[];
}

interface AyurvedicGuidance {
  dosha: 'vata' | 'pitta' | 'kapha';
  balancingFoods: string[];
  avoidFoods: string[];
  lifestyleRecommendations: string[];
  dailyRoutine: Array<{ time: string; activity: string }>;
}

export class SpiritualAgent implements Agent {
  id = 'spiritual-agent';
  role: AgentRole = 'spiritual';
  name = 'Spiritual Wellness Guide';
  description = 'Expert in spiritual practices, astrological insights, and Ayurvedic wisdom';

  private claudeClient = createAnthropicClient();
  private astroClient = new VedicAstroClient();

  getAgentCard(): A2AAgentCard {
    return {
      agentId: this.id,
      name: this.name,
      description: this.description,
      capabilities: [
        'astrology_insights',
        'ayurvedic_recommendations',
        'spiritual_practices',
        'meditation_guidance',
        'dosha_assessment',
        'panchang_info'
      ],
      endpoints: [
        {
          path: '/api/agents/spiritual',
          method: 'POST',
          description: 'Get spiritual guidance and astrological insights'
        }
      ],
      version: '1.0.0'
    };
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'get_daily_horoscope',
        description: 'Get daily horoscope based on sun sign',
        inputSchema: {
          type: 'object',
          properties: {
            sunSign: {
              type: 'string',
              description: 'Zodiac sun sign'
            },
            date: {
              type: 'string',
              description: 'Date for horoscope (YYYY-MM-DD)'
            }
          },
          required: ['sunSign']
        }
      },
      {
        name: 'get_panchang',
        description: 'Get Vedic panchang (calendar) information',
        inputSchema: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' }
          },
          required: ['date']
        }
      },
      {
        name: 'assess_dosha',
        description: 'Assess Ayurvedic dosha based on user characteristics',
        inputSchema: {
          type: 'object',
          properties: {
            characteristics: {
              type: 'object',
              description: 'Physical and mental characteristics'
            }
          },
          required: ['characteristics']
        }
      },
      {
        name: 'recommend_spiritual_practice',
        description: 'Recommend spiritual practices based on goals and time available',
        inputSchema: {
          type: 'object',
          properties: {
            goal: { type: 'string' },
            availableTime: { type: 'number' },
            experience: { type: 'string' }
          },
          required: ['goal']
        }
      }
    ];
  }

  async process(request: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Get astrological insights
      const astroInsights = await this.getAstrologicalInsights(context);

      // Get Ayurvedic recommendations
      const ayurvedicGuidance = await this.getAyurvedicGuidance(context);

      // Get spiritual practices
      const spiritualPractices = await this.getSpiritualPractices(context);

      // Generate daily spiritual guidance
      const dailyGuidance = await this.generateDailyGuidance(astroInsights, context);

      return {
        agentId: this.id,
        success: true,
        data: {
          astrologicalInsights: astroInsights,
          ayurvedicGuidance,
          spiritualPractices,
          dailyGuidance
        },
        message: 'Spiritual guidance generated successfully',
        confidence: 0.8,
        reasoning: 'Guidance based on astrological charts, Ayurvedic principles, and spiritual traditions'
      };
    } catch (error) {
      console.error('Spiritual agent error:', error);
      return {
        agentId: this.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to generate spiritual guidance'
      };
    }
  }

  async handleA2AMessage(message: A2AMessage, context: AgentContext): Promise<AgentResponse> {
    const { task, parameters } = message.content;

    switch (task) {
      case 'get_horoscope':
        return this.getHoroscope(parameters, context);

      case 'get_ayurvedic_tips':
        return this.getAyurvedicTips(parameters, context);

      case 'suggest_practice':
        return this.suggestPractice(parameters, context);

      default:
        return {
          agentId: this.id,
          success: false,
          error: `Unknown task: ${task}`,
          message: 'Task not supported by Spiritual Agent'
        };
    }
  }

  async executeTool(toolCall: { name: string; parameters: any }, context: AgentContext): Promise<MCPToolResult> {
    switch (toolCall.name) {
      case 'get_daily_horoscope':
        return this.getDailyHoroscope(toolCall.parameters);

      case 'get_panchang':
        return this.getPanchang(toolCall.parameters);

      case 'assess_dosha':
        return this.assessDosha(toolCall.parameters);

      case 'recommend_spiritual_practice':
        return this.recommendSpiritualPractice(toolCall.parameters);

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolCall.name}`
        };
    }
  }

  // Private helper methods

  private async getAstrologicalInsights(context: AgentContext): Promise<AstrologicalInsight | null> {
    const userProfile = context.userProfile;

    // Check if user has provided birth details
    if (!userProfile?.birthDate) {
      return null;
    }

    try {
      // Calculate sun sign from birth date
      const sunSign = this.calculateSunSign(userProfile.birthDate);

      // Get daily horoscope from VedicAstro API
      const horoscope = await this.astroClient.getDailyHoroscope(sunSign);

      return {
        sunSign,
        dailyHoroscope: horoscope.prediction,
        luckyColor: horoscope.luckyColor,
        luckyNumber: horoscope.luckyNumber,
        auspiciousTimes: horoscope.auspiciousTimes,
        recommendations: this.parseHoroscopeRecommendations(horoscope.prediction)
      };
    } catch (error) {
      console.error('Failed to get astrological insights:', error);
      // Return generic insights if API fails
      return this.getGenericAstrologicalInsights(context);
    }
  }

  private calculateSunSign(birthDate: string): string {
    const date = new Date(birthDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const signs = [
      { sign: 'Capricorn', start: [12, 22], end: [1, 19] },
      { sign: 'Aquarius', start: [1, 20], end: [2, 18] },
      { sign: 'Pisces', start: [2, 19], end: [3, 20] },
      { sign: 'Aries', start: [3, 21], end: [4, 19] },
      { sign: 'Taurus', start: [4, 20], end: [5, 20] },
      { sign: 'Gemini', start: [5, 21], end: [6, 20] },
      { sign: 'Cancer', start: [6, 21], end: [7, 22] },
      { sign: 'Leo', start: [7, 23], end: [8, 22] },
      { sign: 'Virgo', start: [8, 23], end: [9, 22] },
      { sign: 'Libra', start: [9, 23], end: [10, 22] },
      { sign: 'Scorpio', start: [10, 23], end: [11, 21] },
      { sign: 'Sagittarius', start: [11, 22], end: [12, 21] }
    ];

    for (const { sign, start, end } of signs) {
      if (
        (month === start[0] && day >= start[1]) ||
        (month === end[0] && day <= end[1])
      ) {
        return sign;
      }
    }

    return 'Aries'; // Default
  }

  private parseHoroscopeRecommendations(horoscope: string): string[] {
    // Extract actionable recommendations from horoscope text
    const recommendations: string[] = [];

    if (horoscope.toLowerCase().includes('meditation') || horoscope.toLowerCase().includes('reflect')) {
      recommendations.push('Take time for meditation and reflection today');
    }
    if (horoscope.toLowerCase().includes('communication') || horoscope.toLowerCase().includes('express')) {
      recommendations.push('Focus on clear communication with others');
    }
    if (horoscope.toLowerCase().includes('caution') || horoscope.toLowerCase().includes('careful')) {
      recommendations.push('Approach important decisions with care');
    }

    return recommendations.length > 0 ? recommendations : ['Stay mindful and present throughout the day'];
  }

  private getGenericAstrologicalInsights(context: AgentContext): AstrologicalInsight {
    return {
      sunSign: 'Unknown',
      dailyHoroscope: 'Focus on inner balance and mindful living today. Trust your intuition.',
      recommendations: [
        'Practice mindfulness throughout the day',
        'Listen to your inner wisdom',
        'Maintain balance in all aspects of life'
      ]
    };
  }

  private async getAyurvedicGuidance(context: AgentContext): Promise<AyurvedicGuidance | null> {
    const userProfile = context.userProfile;

    if (!userProfile?.doshaType) {
      return null;
    }

    const dosha = userProfile.doshaType;

    // Provide dosha-specific guidance
    const guidance: Record<string, Omit<AyurvedicGuidance, 'dosha'>> = {
      vata: {
        balancingFoods: [
          'Warm, cooked foods',
          'Root vegetables',
          'Healthy fats (ghee, nuts)',
          'Sweet fruits',
          'Warming spices (ginger, cinnamon)'
        ],
        avoidFoods: [
          'Cold, raw foods',
          'Dried fruits',
          'Bitter, astringent foods',
          'Excessive caffeine'
        ],
        lifestyleRecommendations: [
          'Maintain regular daily routine',
          'Stay warm and avoid cold',
          'Practice gentle, grounding exercises',
          'Get adequate rest and sleep',
          'Oil massage (abhyanga) with warm sesame oil'
        ],
        dailyRoutine: [
          { time: '6:00 AM', activity: 'Wake up and practice gentle stretching' },
          { time: '7:00 AM', activity: 'Warm breakfast with grounding foods' },
          { time: '12:00 PM', activity: 'Largest meal of the day, warm and nourishing' },
          { time: '6:00 PM', activity: 'Light, warm dinner' },
          { time: '9:00 PM', activity: 'Evening relaxation and wind-down' },
          { time: '10:00 PM', activity: 'Bedtime (consistent schedule important)' }
        ]
      },
      pitta: {
        balancingFoods: [
          'Cooling foods',
          'Sweet fruits',
          'Leafy greens',
          'Whole grains',
          'Cooling spices (coriander, fennel)'
        ],
        avoidFoods: [
          'Spicy, hot foods',
          'Sour foods',
          'Excessive salt',
          'Fried foods',
          'Alcohol'
        ],
        lifestyleRecommendations: [
          'Avoid excessive heat and sun',
          'Practice cooling exercises (swimming, walking)',
          'Take breaks to prevent burnout',
          'Cultivate patience and compassion',
          'Spend time in nature'
        ],
        dailyRoutine: [
          { time: '5:30 AM', activity: 'Wake early during cooler hours' },
          { time: '7:00 AM', activity: 'Cooling, moderate breakfast' },
          { time: '12:00 PM', activity: 'Main meal with cooling foods' },
          { time: '6:00 PM', activity: 'Light dinner, avoid late eating' },
          { time: '9:00 PM', activity: 'Calming evening activities' },
          { time: '10:00 PM', activity: 'Bedtime' }
        ]
      },
      kapha: {
        balancingFoods: [
          'Light, dry foods',
          'Bitter and astringent tastes',
          'Spicy foods',
          'Leafy greens',
          'Stimulating spices (black pepper, ginger)'
        ],
        avoidFoods: [
          'Heavy, oily foods',
          'Dairy products',
          'Sweet, salty foods',
          'Cold foods and drinks'
        ],
        lifestyleRecommendations: [
          'Vigorous exercise daily',
          'Avoid daytime napping',
          'Stay active and engaged',
          'Seek variety and stimulation',
          'Dry massage (garshana) before shower'
        ],
        dailyRoutine: [
          { time: '6:00 AM', activity: 'Wake early and exercise vigorously' },
          { time: '8:00 AM', activity: 'Light breakfast or skip if not hungry' },
          { time: '12:00 PM', activity: 'Largest meal with warming spices' },
          { time: '6:00 PM', activity: 'Light dinner, minimal for weight loss' },
          { time: '9:00 PM', activity: 'Avoid eating or relaxing too much' },
          { time: '10:00 PM', activity: 'Bedtime (avoid oversleeping)' }
        ]
      }
    };

    return {
      dosha,
      ...guidance[dosha]
    };
  }

  private async getSpiritualPractices(context: AgentContext): Promise<SpiritualPractice[]> {
    const practices: SpiritualPractice[] = [];

    // Morning meditation
    practices.push({
      type: 'meditation',
      name: 'Morning Spiritual Meditation',
      description: 'Start your day with connection to your higher self',
      duration: 20,
      benefits: [
        'Sets positive intention for the day',
        'Enhances spiritual awareness',
        'Promotes inner peace'
      ],
      instructions: [
        'Sit comfortably in a quiet space',
        'Light a candle or incense if desired',
        'Close your eyes and take deep breaths',
        'Visualize divine light filling your body',
        'Set an intention for spiritual growth',
        'Sit in silent awareness for 15 minutes',
        'Slowly return to normal awareness'
      ],
      bestTime: '6:00 AM - 7:00 AM (Brahma Muhurta)'
    });

    // Yoga practice
    practices.push({
      type: 'yoga',
      name: 'Mindful Yoga Practice',
      description: 'Unite body, mind, and spirit through movement',
      duration: 30,
      benefits: [
        'Improves flexibility and strength',
        'Balances energy centers (chakras)',
        'Calms the mind',
        'Enhances mind-body connection'
      ],
      instructions: [
        'Begin with Sun Salutations (Surya Namaskar)',
        'Practice standing poses for grounding',
        'Include forward bends for introspection',
        'Add twists for detoxification',
        'End with Savasana (relaxation)'
      ],
      bestTime: 'Morning or evening'
    });

    // Mantra practice
    practices.push({
      type: 'mantra',
      name: 'Sacred Mantra Chanting',
      description: 'Use sound vibrations for spiritual elevation',
      duration: 10,
      benefits: [
        'Raises spiritual vibration',
        'Focuses the mind',
        'Creates positive energy',
        'Connects to divine consciousness'
      ],
      instructions: [
        'Choose a mantra (e.g., "Om" or "Om Namah Shivaya")',
        'Sit comfortably with straight spine',
        'Take deep breaths to center yourself',
        'Chant the mantra 108 times (use mala beads)',
        'Feel the vibration in your body',
        'End with silent meditation'
      ],
      bestTime: 'Morning or before meditation'
    });

    // Evening gratitude
    practices.push({
      type: 'prayer',
      name: 'Evening Gratitude Prayer',
      description: 'Express thankfulness for the day\'s blessings',
      duration: 5,
      benefits: [
        'Cultivates gratitude',
        'Promotes positive mindset',
        'Enhances spiritual connection',
        'Improves sleep quality'
      ],
      instructions: [
        'Sit or kneel in a comfortable position',
        'Reflect on the day\'s experiences',
        'Express gratitude for blessings received',
        'Ask for guidance and protection',
        'Send love and light to all beings'
      ],
      bestTime: 'Before bedtime'
    });

    return practices;
  }

  private async generateDailyGuidance(
    astroInsights: AstrologicalInsight | null,
    context: AgentContext
  ): Promise<string[]> {
    const guidance: string[] = [];

    // Add astrological guidance if available
    if (astroInsights) {
      guidance.push(`🌟 ${astroInsights.dailyHoroscope}`);
      if (astroInsights.recommendations.length > 0) {
        guidance.push(...astroInsights.recommendations);
      }
    }

    // Add general spiritual guidance
    const dayOfWeek = new Date().getDay();
    const weeklyGuidance = [
      'Sunday: Honor the divine light within you',
      'Monday: Practice emotional balance and intuition',
      'Tuesday: Channel your energy into purposeful action',
      'Wednesday: Enhance communication and wisdom',
      'Thursday: Expand your knowledge and generosity',
      'Friday: Cultivate love, beauty, and harmony',
      'Saturday: Practice discipline and spiritual structure'
    ];

    guidance.push(weeklyGuidance[dayOfWeek]);

    // Add seasonal guidance
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) {
      guidance.push('Spring: Time for renewal and planting seeds of intention');
    } else if (month >= 5 && month <= 7) {
      guidance.push('Summer: Embrace abundance and outward expression');
    } else if (month >= 8 && month <= 10) {
      guidance.push('Autumn: Release what no longer serves you');
    } else {
      guidance.push('Winter: Turn inward for reflection and rest');
    }

    return guidance;
  }

  // A2A message handlers

  private async getHoroscope(parameters: any, context: AgentContext): Promise<AgentResponse> {
    const insights = await this.getAstrologicalInsights(context);

    return {
      agentId: this.id,
      success: true,
      data: insights,
      message: 'Horoscope retrieved successfully'
    };
  }

  private async getAyurvedicTips(parameters: any, context: AgentContext): Promise<AgentResponse> {
    const guidance = await this.getAyurvedicGuidance(context);

    return {
      agentId: this.id,
      success: true,
      data: guidance,
      message: 'Ayurvedic guidance provided'
    };
  }

  private async suggestPractice(parameters: any, context: AgentContext): Promise<AgentResponse> {
    const practices = await this.getSpiritualPractices(context);

    return {
      agentId: this.id,
      success: true,
      data: { practices },
      message: 'Spiritual practices suggested'
    };
  }

  // Tool implementations

  private async getDailyHoroscope(params: { sunSign: string; date?: string }): Promise<MCPToolResult> {
    try {
      const horoscope = await this.astroClient.getDailyHoroscope(params.sunSign, params.date);

      return {
        success: true,
        data: horoscope
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get horoscope'
      };
    }
  }

  private async getPanchang(params: { date: string; latitude?: number; longitude?: number }): Promise<MCPToolResult> {
    try {
      const panchang = await this.astroClient.getPanchang(
        params.date,
        params.latitude || 28.6139, // Default: New Delhi
        params.longitude || 77.2090
      );

      return {
        success: true,
        data: panchang
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get panchang'
      };
    }
  }

  private async assessDosha(params: { characteristics: any }): Promise<MCPToolResult> {
    // Simple dosha assessment based on characteristics
    // In a full implementation, this would use a comprehensive questionnaire

    const { bodyType, skin, digestion, energy, temperament } = params.characteristics;

    let vataScore = 0;
    let pittaScore = 0;
    let kaphaScore = 0;

    // Simplified scoring
    if (bodyType === 'thin') vataScore += 2;
    if (bodyType === 'medium') pittaScore += 2;
    if (bodyType === 'heavy') kaphaScore += 2;

    if (temperament === 'anxious') vataScore += 2;
    if (temperament === 'intense') pittaScore += 2;
    if (temperament === 'calm') kaphaScore += 2;

    const dominant = vataScore > pittaScore && vataScore > kaphaScore ? 'vata' :
                    pittaScore > kaphaScore ? 'pitta' : 'kapha';

    return {
      success: true,
      data: {
        dominantDosha: dominant,
        scores: { vata: vataScore, pitta: pittaScore, kapha: kaphaScore }
      }
    };
  }

  private async recommendSpiritualPractice(params: {
    goal: string;
    availableTime?: number;
    experience?: string;
  }): Promise<MCPToolResult> {
    const { goal, availableTime = 20, experience = 'beginner' } = params;

    const allPractices = await this.getSpiritualPractices({} as AgentContext);

    // Filter practices based on available time
    const suitablePractices = allPractices.filter(p => p.duration <= availableTime);

    return {
      success: true,
      data: {
        recommendations: suitablePractices.slice(0, 3)
      }
    };
  }
}

// Export singleton instance
export const spiritualAgent = new SpiritualAgent();
