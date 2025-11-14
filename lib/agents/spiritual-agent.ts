/**
 * Spiritual Agent
 *
 * Specialized AI agent for spiritual wellness, astrology, and holistic practices.
 * Uses Claude LLM with VedicAstro API and Ayurvedic knowledge base.
 *
 * Capabilities:
 * - Daily horoscope and astrological insights
 * - Vedic panchang (auspicious times)
 * - Birth chart analysis
 * - Ayurvedic dosha recommendations
 * - Spiritual practices (yoga, meditation themes, mantras)
 * - Mind-body-spirit integration
 */

import { callClaude } from '../utils/anthropic-client';
import {
  getDailyHoroscope,
  getBirthChart,
  getPanchang,
  getAuspiciousTimes,
  getSunSign,
  getPlanetPositions,
  type ZodiacSign,
  type BirthDetails,
} from '../apis/vedic-astro-client';

// ==================== Types ====================

export interface SpiritualProfile {
  birthDetails?: BirthDetails;
  sunSign?: ZodiacSign;
  moonSign?: ZodiacSign;
  dosha?: AyurvedicDosha;
  spiritualInterests: SpiritualInterest[];
  practices: SpiritualPractice[];
  beliefSystem?: 'vedic' | 'western-astrology' | 'spiritual-general' | 'none';
}

export type AyurvedicDosha = 'vata' | 'pitta' | 'kapha' | 'vata-pitta' | 'pitta-kapha' | 'vata-kapha';

export type SpiritualInterest =
  | 'astrology'
  | 'ayurveda'
  | 'yoga'
  | 'meditation'
  | 'mindfulness'
  | 'energy-work'
  | 'nature-connection';

export type SpiritualPractice =
  | 'daily-meditation'
  | 'yoga'
  | 'prayer'
  | 'journaling'
  | 'breathwork'
  | 'gratitude'
  | 'intention-setting';

export interface DailySpiritualGuidance {
  date: string;
  horoscope?: {
    sign: ZodiacSign;
    prediction: string;
    luckyColor?: string;
    luckyNumber?: number;
    advice: string;
  };
  auspiciousTimes?: {
    meditation: string;
    brahmaMuhurta?: string;
    yoga: string;
    importantDecisions: string;
  };
  doshaAdvice?: {
    dosha: AyurvedicDosha;
    foodRecommendations: string[];
    lifestyleRecommendations: string[];
    avoidances: string[];
  };
  spiritualPractice?: {
    practice: string;
    duration: number;
    instructions: string;
    intention: string;
  };
  affirmation: string;
  lunarPhase?: string;
  planetaryInsights?: string;
}

export interface BirthChartInsights {
  sunSign: ZodiacSign;
  moonSign?: ZodiacSign;
  ascendant?: ZodiacSign;
  dominantPlanets: string[];
  strengths: string[];
  challenges: string[];
  lifePurpose?: string;
  compatibilityWith?: { [sign: string]: number };
}

export interface AyurvedicRecommendation {
  dosha: AyurvedicDosha;
  description: string;
  balancingFoods: string[];
  avoidFoods: string[];
  lifestyle: string[];
  bestExercise: string[];
  dailyRoutine: string[];
}

export interface SpiritualAgentContext {
  profile: SpiritualProfile;
  date?: string;
  location?: {
    lat: number;
    lon: number;
  };
}

// ==================== Spiritual Agent ====================

export class SpiritualAgent {
  constructor(private context: SpiritualAgentContext) {}

  /**
   * Generate complete daily spiritual guidance
   */
  async generateDailyGuidance(): Promise<DailySpiritualGuidance> {
    console.log('[SpiritualAgent] Generating daily spiritual guidance...');

    const { profile, date, location } = this.context;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const guidance: DailySpiritualGuidance = {
      date: targetDate,
      affirmation: await this.generateAffirmation(),
    };

    // Astrology (if interested and sign available)
    if (profile.spiritualInterests.includes('astrology') && profile.sunSign) {
      try {
        const horoscope = await getDailyHoroscope(profile.sunSign, targetDate);
        guidance.horoscope = {
          sign: profile.sunSign,
          prediction: horoscope.prediction,
          luckyColor: horoscope.lucky_color,
          luckyNumber: horoscope.lucky_number,
          advice: horoscope.advice || 'Stay positive and trust the universe.',
        };

        // Get planetary insights
        if (location) {
          const positions = await getPlanetPositions(targetDate, location.lat, location.lon);
          guidance.planetaryInsights = this.interpretPlanetaryPositions(positions);
        }
      } catch (error) {
        console.error('[SpiritualAgent] Error fetching horoscope:', error);
      }
    }

    // Auspicious times (if location available)
    if (location && profile.spiritualInterests.includes('astrology')) {
      try {
        const times = await getAuspiciousTimes(targetDate, location.lat, location.lon);
        guidance.auspiciousTimes = times;

        // Lunar phase
        const panchang = await getPanchang(targetDate, location.lat, location.lon);
        guidance.lunarPhase = panchang.tithi || 'Unknown';
      } catch (error) {
        console.error('[SpiritualAgent] Error fetching auspicious times:', error);
      }
    }

    // Ayurvedic advice (if dosha known)
    if (profile.dosha && profile.spiritualInterests.includes('ayurveda')) {
      const doshaRec = this.getAyurvedicRecommendations(profile.dosha);
      guidance.doshaAdvice = {
        dosha: profile.dosha,
        foodRecommendations: doshaRec.balancingFoods.slice(0, 3),
        lifestyleRecommendations: doshaRec.lifestyle.slice(0, 3),
        avoidances: doshaRec.avoidFoods.slice(0, 2),
      };
    }

    // Spiritual practice recommendation
    if (profile.practices.length > 0 || profile.spiritualInterests.includes('meditation')) {
      guidance.spiritualPractice = await this.recommendSpiritualPractice();
    }

    console.log('[SpiritualAgent] Daily guidance generated');
    return guidance;
  }

  /**
   * Analyze birth chart and provide insights
   */
  async analyzeBirthChart(birthDetails: BirthDetails): Promise<BirthChartInsights> {
    console.log('[SpiritualAgent] Analyzing birth chart...');

    try {
      const chart = await getBirthChart(birthDetails);

      // Use Claude to interpret the chart
      const prompt = `You are a professional Vedic astrologer. Analyze this birth chart:

${JSON.stringify(chart, null, 2)}

Provide insights in JSON format:
{
  "sunSign": "${birthDetails.zodiacSign || 'Aries'}",
  "moonSign": "...",
  "ascendant": "...",
  "dominantPlanets": ["...", "..."],
  "strengths": ["...", "...", "..."],
  "challenges": ["...", "..."],
  "lifePurpose": "..."
}

Focus on practical, empowering insights.`;

      const response = await callClaude(prompt, {
        model: 'sonnet',
        maxTokens: 1000,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse birth chart insights');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[SpiritualAgent] Error analyzing birth chart:', error);
      throw error;
    }
  }

  /**
   * Determine Ayurvedic dosha through questionnaire results
   */
  determineDoshaFromQuiz(answers: {
    bodyFrame: 'thin' | 'medium' | 'large';
    skin: 'dry' | 'oily' | 'normal';
    temperament: 'anxious' | 'intense' | 'calm';
    appetite: 'irregular' | 'strong' | 'steady';
    sleep: 'light' | 'moderate' | 'deep';
  }): AyurvedicDosha {
    let vata = 0, pitta = 0, kapha = 0;

    // Body frame
    if (answers.bodyFrame === 'thin') vata += 2;
    if (answers.bodyFrame === 'medium') pitta += 2;
    if (answers.bodyFrame === 'large') kapha += 2;

    // Skin
    if (answers.skin === 'dry') vata += 2;
    if (answers.skin === 'oily') pitta += 2;
    if (answers.skin === 'normal') kapha += 2;

    // Temperament
    if (answers.temperament === 'anxious') vata += 2;
    if (answers.temperament === 'intense') pitta += 2;
    if (answers.temperament === 'calm') kapha += 2;

    // Appetite
    if (answers.appetite === 'irregular') vata += 1;
    if (answers.appetite === 'strong') pitta += 1;
    if (answers.appetite === 'steady') kapha += 1;

    // Sleep
    if (answers.sleep === 'light') vata += 1;
    if (answers.sleep === 'moderate') pitta += 1;
    if (answers.sleep === 'deep') kapha += 1;

    // Determine dominant dosha(s)
    const scores = { vata, pitta, kapha };
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    // If two doshas are close (within 2 points), it's a dual dosha
    if (sorted[0][1] - sorted[1][1] <= 2) {
      return `${sorted[0][0]}-${sorted[1][0]}` as AyurvedicDosha;
    }

    return sorted[0][0] as AyurvedicDosha;
  }

  /**
   * Get Ayurvedic recommendations for a dosha
   */
  getAyurvedicRecommendations(dosha: AyurvedicDosha): AyurvedicRecommendation {
    const recommendations: { [key in AyurvedicDosha]: AyurvedicRecommendation } = {
      vata: {
        dosha: 'vata',
        description: 'Vata represents air and space. When balanced: creative, energetic. Imbalanced: anxious, scattered.',
        balancingFoods: [
          'Warm, cooked foods',
          'Root vegetables (sweet potatoes, carrots)',
          'Healthy fats (ghee, olive oil, avocado)',
          'Whole grains (oats, rice)',
          'Warm spices (ginger, cinnamon, cumin)',
          'Sweet fruits (bananas, berries)',
        ],
        avoidFoods: [
          'Cold, raw foods',
          'Dry, crispy foods',
          'Excessive caffeine',
          'Beans and legumes (in excess)',
        ],
        lifestyle: [
          'Maintain regular daily routine',
          'Get adequate rest (7-8 hours)',
          'Practice grounding activities (yoga, walking)',
          'Stay warm',
          'Avoid overstimulation',
        ],
        bestExercise: ['Gentle yoga', 'Tai chi', 'Walking', 'Swimming'],
        dailyRoutine: [
          'Wake at sunrise',
          'Self-massage with warm oil',
          'Eat meals at regular times',
          'Wind down before 10 PM',
        ],
      },
      pitta: {
        dosha: 'pitta',
        description: 'Pitta represents fire and water. When balanced: focused, courageous. Imbalanced: irritable, intense.',
        balancingFoods: [
          'Cooling foods',
          'Sweet fruits (melons, grapes)',
          'Leafy greens and vegetables',
          'Coconut',
          'Cooling spices (coriander, fennel, cardamom)',
          'Whole grains (barley, wheat)',
        ],
        avoidFoods: [
          'Spicy foods',
          'Fried, oily foods',
          'Sour foods',
          'Excessive salt',
          'Alcohol and caffeine (in excess)',
        ],
        lifestyle: [
          'Avoid excessive heat',
          'Take time to cool down (literally and figuratively)',
          'Practice moderation',
          'Spend time in nature',
          'Avoid competitive situations when stressed',
        ],
        bestExercise: ['Swimming', 'Moderate yoga', 'Hiking', 'Moon salutations'],
        dailyRoutine: [
          'Wake early but not too early',
          'Avoid working through lunch',
          'Take evening walks',
          'Practice forgiveness and letting go',
        ],
      },
      kapha: {
        dosha: 'kapha',
        description: 'Kapha represents earth and water. When balanced: stable, nurturing. Imbalanced: lethargic, attached.',
        balancingFoods: [
          'Light, warm foods',
          'Pungent spices (ginger, black pepper, turmeric)',
          'Leafy greens and bitter vegetables',
          'Legumes and beans',
          'Honey (in moderation)',
          'Apples, pears',
        ],
        avoidFoods: [
          'Heavy, oily foods',
          'Dairy products (in excess)',
          'Sweet, salty foods',
          'Cold foods and drinks',
          'Wheat and red meat (in excess)',
        ],
        lifestyle: [
          'Stay active and avoid oversleeping',
          'Seek variety and new experiences',
          'Keep warm and dry',
          'Avoid daytime naps',
          'Practice letting go of possessions',
        ],
        bestExercise: ['Vigorous exercise', 'Running', 'Dance', 'HIIT', 'Power yoga'],
        dailyRoutine: [
          'Wake before sunrise',
          'Dry brushing before shower',
          'Skip breakfast or eat light',
          'Stay active throughout day',
        ],
      },
      'vata-pitta': {
        dosha: 'vata-pitta',
        description: 'Combination of air and fire. Creative yet driven, but prone to anxiety and burnout.',
        balancingFoods: ['Warm, grounding foods', 'Moderate spices', 'Sweet fruits', 'Healthy fats', 'Whole grains'],
        avoidFoods: ['Excessive raw foods', 'Very spicy foods', 'Caffeine in excess'],
        lifestyle: ['Balance activity with rest', 'Maintain routine', 'Stay cool but avoid cold'],
        bestExercise: ['Moderate yoga', 'Swimming', 'Walking'],
        dailyRoutine: ['Regular sleep schedule', 'Warm meals at regular times', 'Evening relaxation'],
      },
      'pitta-kapha': {
        dosha: 'pitta-kapha',
        description: 'Combination of fire and earth. Strong and focused, but can be stubborn or intense.',
        balancingFoods: ['Light, cooling foods', 'Vegetables', 'Legumes', 'Moderate spices'],
        avoidFoods: ['Heavy, oily foods', 'Excessive sweets', 'Spicy foods'],
        lifestyle: ['Stay active', 'Avoid overheating', 'Practice flexibility'],
        bestExercise: ['Moderate to vigorous exercise', 'Yoga', 'Swimming', 'Cycling'],
        dailyRoutine: ['Wake early', 'Avoid heavy dinners', 'Regular exercise'],
      },
      'vata-kapha': {
        dosha: 'vata-kapha',
        description: 'Combination of air and earth. Can be creative yet grounded, but prone to stagnation.',
        balancingFoods: ['Warm, light foods', 'Spices for digestion', 'Vegetables', 'Legumes'],
        avoidFoods: ['Heavy, cold foods', 'Excessive sweets', 'Dairy'],
        lifestyle: ['Stay warm and active', 'Maintain routine', 'Avoid oversleeping'],
        bestExercise: ['Moderate yoga', 'Walking', 'Light cardio'],
        dailyRoutine: ['Wake at consistent time', 'Light breakfast', 'Evening movement'],
      },
    };

    return recommendations[dosha];
  }

  /**
   * Recommend a spiritual practice for today
   */
  private async recommendSpiritualPractice(): Promise<{
    practice: string;
    duration: number;
    instructions: string;
    intention: string;
  }> {
    const { profile } = this.context;

    const prompt = `You are a spiritual wellness guide.

User's interests: ${profile.spiritualInterests.join(', ')}
Current practices: ${profile.practices.join(', ')}

Recommend ONE spiritual practice for today. Provide:
- Practice name
- Duration (5-20 minutes)
- Simple instructions
- Intention/theme for the practice

Format as JSON:
{
  "practice": "Morning Sun Salutations",
  "duration": 10,
  "instructions": "Perform 3 rounds of sun salutations, syncing breath with movement.",
  "intention": "Honor the life-giving energy of the sun and awaken your inner light."
}`;

    const response = await callClaude(prompt, {
      model: 'haiku',
      maxTokens: 500,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback
      return {
        practice: 'Mindful Breathing',
        duration: 5,
        instructions: 'Sit quietly and focus on your breath for 5 minutes.',
        intention: 'Cultivate presence and inner peace.',
      };
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Generate daily affirmation
   */
  private async generateAffirmation(): Promise<string> {
    const prompt = `Generate a short, powerful affirmation for today. Make it positive, present-tense, and empowering.

Examples:
- "I am worthy of love and abundance."
- "I trust the timing of my life."
- "I release what no longer serves me."

Return just the affirmation text, no quotes.`;

    const response = await callClaude(prompt, {
      model: 'haiku',
      maxTokens: 100,
    });

    return response.trim().replace(/^["']|["']$/g, '');
  }

  /**
   * Interpret planetary positions
   */
  private interpretPlanetaryPositions(positions: any): string {
    // Simple interpretation based on prominent planets
    const insights: string[] = [];

    // Check for retrograde planets (if API provides this)
    if (positions.retrogrades && positions.retrogrades.length > 0) {
      insights.push(`${positions.retrogrades[0]} is retrograde - a time for reflection and review.`);
    }

    // Check lunar phase
    if (positions.moon_phase) {
      if (positions.moon_phase.includes('New')) {
        insights.push('New Moon energy favors new beginnings and intention-setting.');
      } else if (positions.moon_phase.includes('Full')) {
        insights.push('Full Moon energy highlights completion and release.');
      }
    }

    if (insights.length === 0) {
      insights.push('The stars support your growth and self-discovery today.');
    }

    return insights.join(' ');
  }

  /**
   * Answer spiritual questions
   */
  async answerQuestion(question: string): Promise<string> {
    const { profile } = this.context;

    const systemPrompt = `You are a compassionate spiritual wellness guide with knowledge of astrology, Ayurveda, and holistic practices.

User profile:
${JSON.stringify(profile, null, 2)}

Provide thoughtful, non-dogmatic guidance. Respect all belief systems. Be practical and empowering.`;

    const response = await callClaude(question, {
      model: 'sonnet',
      systemPrompt,
      maxTokens: 600,
    });

    return response;
  }
}

// ==================== Zodiac Compatibility ====================

export const ZODIAC_COMPATIBILITY: { [key in ZodiacSign]: { [key in ZodiacSign]?: number } } = {
  aries: {
    aries: 70, taurus: 50, gemini: 85, cancer: 45, leo: 90,
    virgo: 40, libra: 75, scorpio: 60, sagittarius: 95, capricorn: 55,
    aquarius: 80, pisces: 50,
  },
  taurus: {
    aries: 50, taurus: 75, gemini: 45, cancer: 85, leo: 55,
    virgo: 90, libra: 70, scorpio: 80, sagittarius: 40, capricorn: 95,
    aquarius: 50, pisces: 85,
  },
  gemini: {
    aries: 85, taurus: 45, gemini: 70, cancer: 50, leo: 85,
    virgo: 60, libra: 95, scorpio: 40, sagittarius: 80, capricorn: 45,
    aquarius: 90, pisces: 55,
  },
  cancer: {
    aries: 45, taurus: 85, gemini: 50, cancer: 75, leo: 60,
    virgo: 80, libra: 55, scorpio: 95, sagittarius: 45, capricorn: 70,
    aquarius: 40, pisces: 90,
  },
  leo: {
    aries: 90, taurus: 55, gemini: 85, cancer: 60, leo: 75,
    virgo: 50, libra: 85, scorpio: 55, sagittarius: 90, capricorn: 45,
    aquarius: 70, pisces: 50,
  },
  virgo: {
    aries: 40, taurus: 90, gemini: 60, cancer: 80, leo: 50,
    virgo: 70, libra: 60, scorpio: 75, sagittarius: 45, capricorn: 85,
    aquarius: 55, pisces: 70,
  },
  libra: {
    aries: 75, taurus: 70, gemini: 95, cancer: 55, leo: 85,
    virgo: 60, libra: 75, scorpio: 60, sagittarius: 80, capricorn: 50,
    aquarius: 90, pisces: 65,
  },
  scorpio: {
    aries: 60, taurus: 80, gemini: 40, cancer: 95, leo: 55,
    virgo: 75, libra: 60, scorpio: 80, sagittarius: 50, capricorn: 85,
    aquarius: 45, pisces: 95,
  },
  sagittarius: {
    aries: 95, taurus: 40, gemini: 80, cancer: 45, leo: 90,
    virgo: 45, libra: 80, scorpio: 50, sagittarius: 75, capricorn: 55,
    aquarius: 85, pisces: 60,
  },
  capricorn: {
    aries: 55, taurus: 95, gemini: 45, cancer: 70, leo: 45,
    virgo: 85, libra: 50, scorpio: 85, sagittarius: 55, capricorn: 75,
    aquarius: 60, pisces: 75,
  },
  aquarius: {
    aries: 80, taurus: 50, gemini: 90, cancer: 40, leo: 70,
    virgo: 55, libra: 90, scorpio: 45, sagittarius: 85, capricorn: 60,
    aquarius: 80, pisces: 55,
  },
  pisces: {
    aries: 50, taurus: 85, gemini: 55, cancer: 90, leo: 50,
    virgo: 70, libra: 65, scorpio: 95, sagittarius: 60, capricorn: 75,
    aquarius: 55, pisces: 80,
  },
};
