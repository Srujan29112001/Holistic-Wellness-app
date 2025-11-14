/**
 * Nutrition Agent
 *
 * Specialized AI agent for nutrition planning and dietary guidance.
 * Uses Claude LLM with USDA FoodData Central for accurate nutrition info.
 *
 * Capabilities:
 * - Generate personalized meal plans
 * - Calculate nutritional values (macros, micros)
 * - Respect dietary restrictions and preferences
 * - Optimize for calorie/macro targets
 * - Provide ingredient substitutions
 */

import { callClaude, callClaudeConversation, ClaudeMessage } from '../utils/anthropic-client';
import {
  searchUSDAFoods,
  getUSDAFoodDetails,
  getMacros,
  calculateRecipeNutrition,
  type USDAFood,
  type Macros
} from '../apis/usda-client';

// ==================== Types ====================

export interface DietaryProfile {
  calorieTarget: number;
  proteinTarget: number;  // grams
  carbsTarget?: number;   // grams
  fatTarget?: number;     // grams
  restrictions: DietaryRestriction[];
  preferences: DietaryPreference[];
  allergies: string[];
  mealsPerDay: number;    // typically 3-5
  dietType?: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean';
}

export type DietaryRestriction =
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free'
  | 'shellfish-free'
  | 'soy-free'
  | 'halal'
  | 'kosher'
  | 'low-sodium'
  | 'low-sugar'
  | 'diabetic-friendly';

export type DietaryPreference =
  | 'high-protein'
  | 'low-carb'
  | 'high-fiber'
  | 'organic'
  | 'whole-foods'
  | 'quick-prep';

export interface Meal {
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients: MealIngredient[];
  instructions?: string;
  prepTime?: number;  // minutes
  nutrition: Macros;
  tags?: string[];
}

export interface MealIngredient {
  foodId?: number;        // USDA FDC ID
  name: string;
  amount: number;
  unit: string;           // 'g', 'cup', 'tbsp', etc.
  nutrition?: Macros;
}

export interface MealPlan {
  date: string;           // ISO date
  meals: Meal[];
  totalNutrition: Macros;
  targetNutrition: Macros;
  adherenceScore: number; // 0-100
  notes?: string;
}

export interface NutritionAgentContext {
  profile: DietaryProfile;
  previousMeals?: Meal[];  // for variety
  currentDate?: string;
}

// ==================== Nutrition Agent ====================

export class NutritionAgent {
  private conversationHistory: ClaudeMessage[] = [];

  constructor(private context: NutritionAgentContext) {}

  /**
   * Generate a complete meal plan for a day
   */
  async generateDailyMealPlan(): Promise<MealPlan> {
    const { profile, previousMeals } = this.context;

    console.log('[NutritionAgent] Generating daily meal plan...');
    console.log('Profile:', profile);

    // Step 1: Use Claude to ideate meal concepts that fit profile
    const mealConcepts = await this.generateMealConcepts();

    // Step 2: Fetch nutrition data for each concept
    const meals = await this.enrichMealsWithNutrition(mealConcepts);

    // Step 3: Calculate totals and check adherence
    const totalNutrition = this.calculateTotalNutrition(meals);
    const adherenceScore = this.calculateAdherence(totalNutrition, profile);

    const mealPlan: MealPlan = {
      date: this.context.currentDate || new Date().toISOString().split('T')[0],
      meals,
      totalNutrition,
      targetNutrition: {
        calories: profile.calorieTarget,
        protein: profile.proteinTarget,
        carbs: profile.carbsTarget || 0,
        fat: profile.fatTarget || 0,
        fiber: 0,
      },
      adherenceScore,
      notes: this.generatePlanNotes(meals, totalNutrition, profile),
    };

    console.log('[NutritionAgent] Meal plan generated:', {
      mealCount: meals.length,
      totalCalories: totalNutrition.calories,
      adherenceScore,
    });

    return mealPlan;
  }

  /**
   * Step 1: Generate meal concepts using Claude
   * Returns high-level meal ideas without detailed nutrition
   */
  private async generateMealConcepts(): Promise<Partial<Meal>[]> {
    const { profile, previousMeals } = this.context;

    // Build constraints string
    const constraints = this.buildConstraintsString(profile);

    // Build previous meals string for variety
    const recentMeals = previousMeals
      ? `Recent meals to avoid repeating: ${previousMeals.map(m => m.name).join(', ')}`
      : '';

    const prompt = `You are a professional nutritionist AI. Generate a day's meal plan with ${profile.mealsPerDay} meals.

PROFILE:
- Calorie target: ${profile.calorieTarget} kcal/day
- Protein target: ${profile.proteinTarget}g/day
${profile.carbsTarget ? `- Carbs target: ${profile.carbsTarget}g/day` : ''}
${profile.fatTarget ? `- Fat target: ${profile.fatTarget}g/day` : ''}
- Diet type: ${profile.dietType || 'standard'}

CONSTRAINTS:
${constraints}

${recentMeals}

Generate ${profile.mealsPerDay} meal concepts. For each meal, provide:
1. Meal name (creative but realistic)
2. Meal type (breakfast, lunch, dinner, snack)
3. Simple ingredient list (3-6 items with approximate amounts)
4. Brief prep instructions (optional)
5. Estimated prep time in minutes

Format your response as a JSON array of meals. Example:
[
  {
    "name": "Greek Yogurt Parfait with Berries",
    "mealType": "breakfast",
    "ingredients": [
      {"name": "Greek yogurt", "amount": 200, "unit": "g"},
      {"name": "Blueberries", "amount": 50, "unit": "g"},
      {"name": "Almonds", "amount": 15, "unit": "g"},
      {"name": "Honey", "amount": 10, "unit": "g"}
    ],
    "instructions": "Layer yogurt with berries and top with almonds and honey",
    "prepTime": 5
  }
]

Ensure variety, balance, and adherence to all restrictions. Be creative but practical.`;

    const response = await callClaude(prompt, {
      model: 'haiku', // Cheaper model for ideation
      maxTokens: 2000,
    });

    // Parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse meal concepts from Claude response');
    }

    const concepts = JSON.parse(jsonMatch[0]);
    console.log('[NutritionAgent] Generated meal concepts:', concepts.length);

    return concepts;
  }

  /**
   * Step 2: Enrich meal concepts with real nutrition data from USDA
   */
  private async enrichMealsWithNutrition(concepts: Partial<Meal>[]): Promise<Meal[]> {
    const enrichedMeals: Meal[] = [];

    for (const concept of concepts) {
      console.log(`[NutritionAgent] Enriching: ${concept.name}`);

      const ingredients: MealIngredient[] = [];

      // Fetch nutrition for each ingredient
      for (const ing of concept.ingredients || []) {
        try {
          // Search USDA for this ingredient
          const searchResults = await searchUSDAFoods({
            query: ing.name,
            pageSize: 1,
            dataType: ['Foundation', 'SR Legacy'], // Prefer accurate data
          });

          if (searchResults.foods.length > 0) {
            const food = searchResults.foods[0];
            const macros = getMacros(food);

            // Scale nutrition to ingredient amount
            const scaleFactor = ing.amount / 100; // USDA is per 100g
            const scaledNutrition: Macros = {
              calories: Math.round(macros.calories * scaleFactor),
              protein: Math.round(macros.protein * scaleFactor * 10) / 10,
              carbs: Math.round(macros.carbs * scaleFactor * 10) / 10,
              fat: Math.round(macros.fat * scaleFactor * 10) / 10,
              fiber: Math.round(macros.fiber * scaleFactor * 10) / 10,
            };

            ingredients.push({
              foodId: food.fdcId,
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              nutrition: scaledNutrition,
            });

            console.log(`  ✓ ${ing.name}: ${scaledNutrition.calories} kcal`);
          } else {
            // Fallback: use estimated values
            console.log(`  ⚠ ${ing.name}: No USDA data, using estimate`);
            ingredients.push({
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              nutrition: this.estimateNutrition(ing.name, ing.amount),
            });
          }
        } catch (error) {
          console.error(`  ✗ Error fetching ${ing.name}:`, error);
          // Continue with estimate
          ingredients.push({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            nutrition: this.estimateNutrition(ing.name, ing.amount),
          });
        }
      }

      // Calculate meal totals
      const mealNutrition = this.calculateTotalNutrition(
        ingredients.map(ing => ({
          name: '',
          mealType: concept.mealType as any,
          ingredients: [],
          nutrition: ing.nutrition!
        }))
      );

      enrichedMeals.push({
        name: concept.name!,
        mealType: concept.mealType as any,
        ingredients,
        instructions: concept.instructions,
        prepTime: concept.prepTime,
        nutrition: mealNutrition,
        tags: this.generateTags(concept, mealNutrition),
      });
    }

    return enrichedMeals;
  }

  /**
   * Calculate total nutrition across meals
   */
  private calculateTotalNutrition(meals: Meal[]): Macros {
    const total: Macros = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };

    for (const meal of meals) {
      if (meal.nutrition) {
        total.calories += meal.nutrition.calories || 0;
        total.protein += meal.nutrition.protein || 0;
        total.carbs += meal.nutrition.carbs || 0;
        total.fat += meal.nutrition.fat || 0;
        total.fiber += meal.nutrition.fiber || 0;
      }
    }

    // Round to 1 decimal
    return {
      calories: Math.round(total.calories),
      protein: Math.round(total.protein * 10) / 10,
      carbs: Math.round(total.carbs * 10) / 10,
      fat: Math.round(total.fat * 10) / 10,
      fiber: Math.round(total.fiber * 10) / 10,
    };
  }

  /**
   * Calculate how well the plan meets targets (0-100 score)
   */
  private calculateAdherence(actual: Macros, profile: DietaryProfile): number {
    let score = 100;

    // Calorie adherence (±15% tolerance)
    const calorieRatio = actual.calories / profile.calorieTarget;
    if (calorieRatio < 0.85 || calorieRatio > 1.15) {
      score -= 30;
    } else if (calorieRatio < 0.90 || calorieRatio > 1.10) {
      score -= 15;
    }

    // Protein adherence (±10% tolerance)
    const proteinRatio = actual.protein / profile.proteinTarget;
    if (proteinRatio < 0.90) {
      score -= 25;
    } else if (proteinRatio < 0.95) {
      score -= 10;
    }

    // Carbs adherence (if specified)
    if (profile.carbsTarget) {
      const carbRatio = actual.carbs / profile.carbsTarget;
      if (carbRatio < 0.80 || carbRatio > 1.20) {
        score -= 15;
      }
    }

    // Fat adherence (if specified)
    if (profile.fatTarget) {
      const fatRatio = actual.fat / profile.fatTarget;
      if (fatRatio < 0.80 || fatRatio > 1.20) {
        score -= 10;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Generate helpful notes about the meal plan
   */
  private generatePlanNotes(meals: Meal[], nutrition: Macros, profile: DietaryProfile): string {
    const notes: string[] = [];

    // Calorie difference
    const calorieDiff = nutrition.calories - profile.calorieTarget;
    if (Math.abs(calorieDiff) > 100) {
      notes.push(`Total is ${Math.abs(calorieDiff)} kcal ${calorieDiff > 0 ? 'over' : 'under'} target.`);
    }

    // Protein status
    const proteinDiff = nutrition.protein - profile.proteinTarget;
    if (proteinDiff >= 0) {
      notes.push(`Protein target met! (${nutrition.protein}g)`);
    } else {
      notes.push(`Consider adding ${Math.abs(Math.round(proteinDiff))}g more protein.`);
    }

    // Fiber
    if (nutrition.fiber < 25) {
      notes.push(`Fiber is low (${nutrition.fiber}g). Consider adding vegetables or whole grains.`);
    }

    // Variety
    notes.push(`${meals.length} meals with good variety.`);

    return notes.join(' ');
  }

  /**
   * Build constraints string for Claude prompt
   */
  private buildConstraintsString(profile: DietaryProfile): string {
    const constraints: string[] = [];

    // Diet type
    if (profile.dietType && profile.dietType !== 'standard') {
      constraints.push(`Diet: ${profile.dietType}`);
    }

    // Restrictions
    if (profile.restrictions.length > 0) {
      constraints.push(`Restrictions: ${profile.restrictions.join(', ')}`);
    }

    // Allergies
    if (profile.allergies.length > 0) {
      constraints.push(`Allergies (MUST EXCLUDE): ${profile.allergies.join(', ')}`);
    }

    // Preferences
    if (profile.preferences.length > 0) {
      constraints.push(`Preferences: ${profile.preferences.join(', ')}`);
    }

    return constraints.join('\n');
  }

  /**
   * Generate tags for a meal
   */
  private generateTags(concept: Partial<Meal>, nutrition: Macros): string[] {
    const tags: string[] = [];

    // Meal type
    if (concept.mealType) tags.push(concept.mealType);

    // Nutrition tags
    if (nutrition.protein > 25) tags.push('high-protein');
    if (nutrition.carbs < 30) tags.push('low-carb');
    if (nutrition.fiber > 8) tags.push('high-fiber');
    if (nutrition.calories < 350) tags.push('light');

    // Prep time
    if (concept.prepTime && concept.prepTime < 15) tags.push('quick');

    return tags;
  }

  /**
   * Estimate nutrition when USDA data unavailable
   * (Rough estimates based on common knowledge)
   */
  private estimateNutrition(foodName: string, amountGrams: number): Macros {
    const name = foodName.toLowerCase();

    // Very rough estimates per 100g
    let base: Macros = { calories: 150, protein: 5, carbs: 20, fat: 5, fiber: 2 };

    // Protein-rich
    if (name.includes('chicken') || name.includes('turkey')) {
      base = { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 };
    } else if (name.includes('beef') || name.includes('steak')) {
      base = { calories: 250, protein: 26, carbs: 0, fat: 17, fiber: 0 };
    } else if (name.includes('fish') || name.includes('salmon')) {
      base = { calories: 206, protein: 22, carbs: 0, fat: 13, fiber: 0 };
    } else if (name.includes('egg')) {
      base = { calories: 155, protein: 13, carbs: 1, fat: 11, fiber: 0 };
    } else if (name.includes('tofu')) {
      base = { calories: 76, protein: 8, carbs: 2, fat: 5, fiber: 1 };
    }
    // Carbs
    else if (name.includes('rice')) {
      base = { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 };
    } else if (name.includes('bread') || name.includes('toast')) {
      base = { calories: 265, protein: 9, carbs: 49, fat: 3, fiber: 2.7 };
    } else if (name.includes('pasta')) {
      base = { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8 };
    } else if (name.includes('oat')) {
      base = { calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10.6 };
    }
    // Fruits/Veg
    else if (name.includes('apple') || name.includes('berry')) {
      base = { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 };
    } else if (name.includes('banana')) {
      base = { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 };
    } else if (name.includes('broccoli') || name.includes('spinach')) {
      base = { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 };
    }
    // Dairy
    else if (name.includes('milk')) {
      base = { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0 };
    } else if (name.includes('yogurt')) {
      base = { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0 };
    } else if (name.includes('cheese')) {
      base = { calories: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0 };
    }
    // Fats
    else if (name.includes('oil') || name.includes('butter')) {
      base = { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 };
    } else if (name.includes('nut') || name.includes('almond')) {
      base = { calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 };
    }

    // Scale to actual amount
    const factor = amountGrams / 100;
    return {
      calories: Math.round(base.calories * factor),
      protein: Math.round(base.protein * factor * 10) / 10,
      carbs: Math.round(base.carbs * factor * 10) / 10,
      fat: Math.round(base.fat * factor * 10) / 10,
      fiber: Math.round(base.fiber * factor * 10) / 10,
    };
  }

  /**
   * Answer nutrition-related questions
   */
  async answerQuestion(question: string): Promise<string> {
    const { profile } = this.context;

    const systemPrompt = `You are a professional nutritionist AI agent.
Profile: ${JSON.stringify(profile, null, 2)}

Answer the user's nutrition question professionally and accurately. Use USDA data when available. Keep responses concise but informative.`;

    const response = await callClaude(question, {
      model: 'sonnet',
      systemPrompt,
      maxTokens: 500,
    });

    return response;
  }
}

// ==================== Helper Functions ====================

/**
 * Calculate daily calorie needs (TDEE) using Mifflin-St Jeor equation
 */
export function calculateTDEE(
  weight: number,    // kg
  height: number,    // cm
  age: number,       // years
  sex: 'male' | 'female',
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active'
): number {
  // BMR calculation
  let bmr: number;
  if (sex === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Activity multipliers
  const activityMultipliers = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very-active': 1.9,
  };

  return Math.round(bmr * activityMultipliers[activityLevel]);
}

/**
 * Calculate protein target (1.6g per kg body weight)
 */
export function calculateProteinTarget(weightKg: number): number {
  return Math.round(weightKg * 1.6);
}

/**
 * Create default dietary profile
 */
export function createDefaultProfile(
  weight: number,
  height: number,
  age: number,
  sex: 'male' | 'female',
  goal: 'maintain' | 'lose' | 'gain' = 'maintain'
): DietaryProfile {
  const tdee = calculateTDEE(weight, height, age, sex, 'moderate');

  // Adjust for goal
  let calorieTarget = tdee;
  if (goal === 'lose') calorieTarget -= 500;  // 0.5kg/week loss
  if (goal === 'gain') calorieTarget += 300;  // slow bulk

  const proteinTarget = calculateProteinTarget(weight);

  // Default macros: 30% protein, 30% fat, 40% carbs
  const proteinCals = proteinTarget * 4;
  const fatCals = calorieTarget * 0.30;
  const carbsCals = calorieTarget - proteinCals - fatCals;

  return {
    calorieTarget,
    proteinTarget,
    carbsTarget: Math.round(carbsCals / 4),
    fatTarget: Math.round(fatCals / 9),
    restrictions: [],
    preferences: [],
    allergies: [],
    mealsPerDay: 3,
    dietType: 'standard',
  };
}
