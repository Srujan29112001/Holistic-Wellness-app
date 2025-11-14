/**
 * Multi-Constraint Meal Optimization Pipeline
 *
 * Implements a sophisticated 4-phase optimization approach for meal planning:
 * 1. Hard Constraints Filtering - Apply absolute rules (allergies, medical)
 * 2. Fuzzy Logic Scoring - Score meals with flexible targets
 * 3. Multi-Objective Optimization - Balance nutrition, cost, variety, preferences
 * 4. Reinforcement Learning - Personalize based on user feedback
 *
 * Based on research in personalized nutrition and constraint satisfaction.
 */

import type { Meal, DietaryProfile, Macros } from '../agents/nutrition-agent';

// ==================== Types ====================

export interface MealCandidate extends Meal {
  score: MealScore;
  rank: number;
}

export interface MealScore {
  total: number;  // 0-100
  breakdown: {
    nutrition: number;      // How well it meets nutrition targets
    preference: number;     // User preference match
    cost: number;           // Cost efficiency
    variety: number;        // Diversity score
    healthiness: number;    // Overall health score
  };
}

export interface OptimizationWeights {
  nutrition: number;    // 0-1
  preference: number;   // 0-1
  cost: number;         // 0-1
  variety: number;      // 0-1
}

export interface OptimizationResult {
  selectedMeals: Meal[];
  totalNutrition: Macros;
  adherenceScore: number;
  costEstimate?: number;
  varietyScore: number;
  explanations: string[];
}

export interface UserFeedback {
  mealId: string;
  rating: number;  // 1-5
  followed: boolean;
  notes?: string;
}

// ==================== Phase 1: Hard Constraints Filtering ====================

export class HardConstraintsFilter {
  constructor(private profile: DietaryProfile) {}

  /**
   * Apply hard constraints to filter out unsuitable meals
   */
  filter(candidates: Meal[]): Meal[] {
    return candidates.filter(meal => {
      // Check allergies (absolute exclusion)
      if (this.containsAllergen(meal)) {
        console.log(`[Filter] Excluded ${meal.name}: Contains allergen`);
        return false;
      }

      // Check dietary restrictions (vegan, halal, kosher, etc.)
      if (!this.meetsRestrictions(meal)) {
        console.log(`[Filter] Excluded ${meal.name}: Violates dietary restrictions`);
        return false;
      }

      // Check medical requirements (e.g., diabetic-friendly, low-sodium)
      if (!this.meetsMedicalRequirements(meal)) {
        console.log(`[Filter] Excluded ${meal.name}: Violates medical requirements`);
        return false;
      }

      return true;
    });
  }

  private containsAllergen(meal: Meal): boolean {
    const { allergies } = this.profile;

    for (const ingredient of meal.ingredients) {
      const ingredientName = ingredient.name.toLowerCase();

      for (const allergen of allergies) {
        const allergenLower = allergen.toLowerCase();

        // Check if ingredient contains allergen
        if (ingredientName.includes(allergenLower)) {
          return true;
        }

        // Check common allergen keywords
        if (allergenLower === 'nuts' && this.containsNuts(ingredientName)) {
          return true;
        }
        if (allergenLower === 'dairy' && this.containsDairy(ingredientName)) {
          return true;
        }
        if (allergenLower === 'gluten' && this.containsGluten(ingredientName)) {
          return true;
        }
        if (allergenLower === 'shellfish' && this.containsShellfish(ingredientName)) {
          return true;
        }
      }
    }

    return false;
  }

  private meetsRestrictions(meal: Meal): boolean {
    const { restrictions, dietType } = this.profile;

    // Check diet type
    if (dietType === 'vegan') {
      if (!this.isVegan(meal)) return false;
    } else if (dietType === 'vegetarian') {
      if (!this.isVegetarian(meal)) return false;
    } else if (dietType === 'keto') {
      if (meal.nutrition.carbs > 10) return false;  // Very low carb
    } else if (dietType === 'paleo') {
      if (!this.isPaleo(meal)) return false;
    }

    // Check specific restrictions
    for (const restriction of restrictions) {
      switch (restriction) {
        case 'gluten-free':
          if (!this.isGlutenFree(meal)) return false;
          break;
        case 'dairy-free':
          if (!this.isDairyFree(meal)) return false;
          break;
        case 'nut-free':
          if (!this.isNutFree(meal)) return false;
          break;
        case 'low-sodium':
          // Check if sodium data available (would need enhanced nutrition data)
          // For now, skip processed foods
          if (this.hasProcessedIngredients(meal)) return false;
          break;
        case 'low-sugar':
          // Limit total carbs as proxy for sugar
          if (meal.nutrition.carbs > 30) return false;
          break;
      }
    }

    return true;
  }

  private meetsMedicalRequirements(meal: Meal): boolean {
    const { restrictions } = this.profile;

    // Diabetic-friendly: low GI, controlled carbs
    if (restrictions.includes('diabetic-friendly')) {
      if (meal.nutrition.carbs > 45) return false;
      // Avoid simple carbs (would need GI data in real implementation)
      if (this.hasHighGIIngredients(meal)) return false;
    }

    return true;
  }

  // Helper methods for checking ingredients
  private containsNuts(ingredient: string): boolean {
    const nuts = ['almond', 'peanut', 'walnut', 'cashew', 'pecan', 'pistachio', 'hazelnut'];
    return nuts.some(nut => ingredient.includes(nut));
  }

  private containsDairy(ingredient: string): boolean {
    const dairy = ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'whey', 'casein'];
    return dairy.some(d => ingredient.includes(d));
  }

  private containsGluten(ingredient: string): boolean {
    const gluten = ['wheat', 'barley', 'rye', 'bread', 'pasta', 'flour'];
    return gluten.some(g => ingredient.includes(g));
  }

  private containsShellfish(ingredient: string): boolean {
    const shellfish = ['shrimp', 'crab', 'lobster', 'oyster', 'clam', 'mussel'];
    return shellfish.some(s => ingredient.includes(s));
  }

  private isVegan(meal: Meal): boolean {
    const nonVegan = ['meat', 'chicken', 'beef', 'pork', 'fish', 'egg', 'milk', 'cheese', 'yogurt', 'butter', 'honey'];
    return !meal.ingredients.some(ing =>
      nonVegan.some(nv => ing.name.toLowerCase().includes(nv))
    );
  }

  private isVegetarian(meal: Meal): boolean {
    const nonVeg = ['meat', 'chicken', 'beef', 'pork', 'fish', 'seafood'];
    return !meal.ingredients.some(ing =>
      nonVeg.some(nv => ing.name.toLowerCase().includes(nv))
    );
  }

  private isPaleo(meal: Meal): boolean {
    const nonPaleo = ['grain', 'rice', 'wheat', 'bread', 'pasta', 'bean', 'legume', 'dairy', 'sugar'];
    return !meal.ingredients.some(ing =>
      nonPaleo.some(np => ing.name.toLowerCase().includes(np))
    );
  }

  private isGlutenFree(meal: Meal): boolean {
    return !this.containsGluten(meal.ingredients.map(i => i.name.toLowerCase()).join(' '));
  }

  private isDairyFree(meal: Meal): boolean {
    return !meal.ingredients.some(ing => this.containsDairy(ing.name.toLowerCase()));
  }

  private isNutFree(meal: Meal): boolean {
    return !meal.ingredients.some(ing => this.containsNuts(ing.name.toLowerCase()));
  }

  private hasProcessedIngredients(meal: Meal): boolean {
    const processed = ['sausage', 'bacon', 'deli', 'canned', 'frozen meal', 'instant'];
    return meal.ingredients.some(ing =>
      processed.some(p => ing.name.toLowerCase().includes(p))
    );
  }

  private hasHighGIIngredients(meal: Meal): boolean {
    const highGI = ['white bread', 'white rice', 'potato', 'sugar', 'honey', 'syrup'];
    return meal.ingredients.some(ing =>
      highGI.some(h => ing.name.toLowerCase().includes(h))
    );
  }
}

// ==================== Phase 2: Fuzzy Logic Scoring ====================

export class FuzzyLogicScorer {
  constructor(
    private profile: DietaryProfile,
    private previousMeals: Meal[] = []
  ) {}

  /**
   * Score meals using fuzzy logic with flexible targets
   */
  score(meals: Meal[]): MealCandidate[] {
    return meals.map((meal, index) => {
      const nutritionScore = this.scoreNutrition(meal);
      const preferenceScore = this.scorePreference(meal);
      const costScore = this.scoreCost(meal);
      const varietyScore = this.scoreVariety(meal);
      const healthinessScore = this.scoreHealthiness(meal);

      // Weighted average (can be customized)
      const total = (
        nutritionScore * 0.35 +
        preferenceScore * 0.25 +
        costScore * 0.15 +
        varietyScore * 0.15 +
        healthinessScore * 0.10
      );

      return {
        ...meal,
        score: {
          total,
          breakdown: {
            nutrition: nutritionScore,
            preference: preferenceScore,
            cost: costScore,
            variety: varietyScore,
            healthiness: healthinessScore,
          },
        },
        rank: 0,  // Will be set later
      };
    });
  }

  /**
   * Score nutrition using fuzzy ranges (±15% tolerance)
   */
  private scoreNutrition(meal: Meal): number {
    let score = 100;

    const { calorieTarget, proteinTarget, carbsTarget, fatTarget } = this.profile;

    // Calories (fuzzy range ±15%)
    const caloriesPerMeal = calorieTarget / this.profile.mealsPerDay;
    const calorieDiff = Math.abs(meal.nutrition.calories - caloriesPerMeal);
    const calorieTolerance = caloriesPerMeal * 0.15;

    if (calorieDiff > calorieTolerance) {
      score -= (calorieDiff / caloriesPerMeal) * 30;
    }

    // Protein (fuzzy range ±10%)
    const proteinPerMeal = proteinTarget / this.profile.mealsPerDay;
    const proteinDiff = Math.abs(meal.nutrition.protein - proteinPerMeal);
    const proteinTolerance = proteinPerMeal * 0.10;

    if (proteinDiff > proteinTolerance) {
      score -= (proteinDiff / proteinPerMeal) * 25;
    }

    // Carbs (if target set, fuzzy ±20%)
    if (carbsTarget) {
      const carbsPerMeal = carbsTarget / this.profile.mealsPerDay;
      const carbsDiff = Math.abs(meal.nutrition.carbs - carbsPerMeal);
      const carbsTolerance = carbsPerMeal * 0.20;

      if (carbsDiff > carbsTolerance) {
        score -= (carbsDiff / carbsPerMeal) * 20;
      }
    }

    // Fat (if target set, fuzzy ±20%)
    if (fatTarget) {
      const fatPerMeal = fatTarget / this.profile.mealsPerDay;
      const fatDiff = Math.abs(meal.nutrition.fat - fatPerMeal);
      const fatTolerance = fatPerMeal * 0.20;

      if (fatDiff > fatTolerance) {
        score -= (fatDiff / fatPerMeal) * 15;
      }
    }

    // Bonus for high fiber
    if (meal.nutrition.fiber >= 8) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score based on user preferences
   */
  private scorePreference(meal: Meal): number {
    let score = 50;  // Neutral start

    const { preferences } = this.profile;

    // Check preference matches
    if (preferences.includes('high-protein') && meal.nutrition.protein >= 25) {
      score += 20;
    }

    if (preferences.includes('low-carb') && meal.nutrition.carbs <= 30) {
      score += 20;
    }

    if (preferences.includes('high-fiber') && meal.nutrition.fiber >= 8) {
      score += 15;
    }

    if (preferences.includes('quick-prep') && meal.prepTime && meal.prepTime <= 15) {
      score += 15;
    }

    if (preferences.includes('whole-foods')) {
      // Check if ingredients are mostly whole foods
      const wholeFoods = meal.ingredients.filter(ing =>
        !['processed', 'canned', 'instant', 'frozen meal'].some(p =>
          ing.name.toLowerCase().includes(p)
        )
      );

      const wholeFoodRatio = wholeFoods.length / meal.ingredients.length;
      score += wholeFoodRatio * 20;
    }

    return Math.min(100, score);
  }

  /**
   * Score cost efficiency (lower cost = higher score)
   */
  private scoreCost(meal: Meal): number {
    // Estimate cost based on ingredients
    // In real implementation, would use price database
    let estimatedCost = 0;

    for (const ingredient of meal.ingredients) {
      // Rough estimates ($/100g or per unit)
      const name = ingredient.name.toLowerCase();

      if (name.includes('beef') || name.includes('steak')) {
        estimatedCost += 3;
      } else if (name.includes('chicken') || name.includes('turkey')) {
        estimatedCost += 1.5;
      } else if (name.includes('fish') || name.includes('salmon')) {
        estimatedCost += 4;
      } else if (name.includes('tofu') || name.includes('bean')) {
        estimatedCost += 0.5;
      } else if (name.includes('vegetable') || name.includes('fruit')) {
        estimatedCost += 0.75;
      } else {
        estimatedCost += 1;
      }
    }

    // Score: cheaper meals get higher scores
    // Assume $15 is expensive, $3 is cheap
    const maxCost = 15;
    const minCost = 3;

    if (estimatedCost <= minCost) return 100;
    if (estimatedCost >= maxCost) return 0;

    return 100 - ((estimatedCost - minCost) / (maxCost - minCost)) * 100;
  }

  /**
   * Score variety (avoid recent meals)
   */
  private scoreVariety(meal: Meal): number {
    let score = 100;

    // Check if this meal or similar was in recent meals
    for (const prevMeal of this.previousMeals.slice(0, 7)) {  // Last week
      // Exact match
      if (prevMeal.name === meal.name) {
        score -= 40;
        continue;
      }

      // Similar ingredients (>50% overlap)
      const prevIngredients = prevMeal.ingredients.map(i => i.name.toLowerCase());
      const currentIngredients = meal.ingredients.map(i => i.name.toLowerCase());

      const commonIngredients = currentIngredients.filter(ing =>
        prevIngredients.some(prev => prev.includes(ing) || ing.includes(prev))
      );

      const overlapRatio = commonIngredients.length / Math.max(prevIngredients.length, currentIngredients.length);

      if (overlapRatio > 0.5) {
        score -= 20 * overlapRatio;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Score overall healthiness
   */
  private scoreHealthiness(meal: Meal): number {
    let score = 50;

    // High protein-to-calorie ratio (good for satiety)
    const proteinRatio = (meal.nutrition.protein * 4) / meal.nutrition.calories;
    if (proteinRatio > 0.25) score += 15;

    // Low processed ingredients
    const wholeFoodCount = meal.ingredients.filter(ing => {
      const name = ing.name.toLowerCase();
      return !['processed', 'instant', 'canned'].some(p => name.includes(p));
    }).length;

    score += (wholeFoodCount / meal.ingredients.length) * 20;

    // High fiber (good for digestion)
    if (meal.nutrition.fiber >= 10) score += 15;

    // Balanced macros
    const carbRatio = (meal.nutrition.carbs * 4) / meal.nutrition.calories;
    const fatRatio = (meal.nutrition.fat * 9) / meal.nutrition.calories;

    if (carbRatio >= 0.40 && carbRatio <= 0.60) score += 10;  // Balanced carbs
    if (fatRatio >= 0.20 && fatRatio <= 0.35) score += 10;   // Balanced fats

    return Math.min(100, score);
  }
}

// ==================== Phase 3: Multi-Objective Optimization ====================

export class MultiObjectiveOptimizer {
  constructor(private weights: OptimizationWeights) {}

  /**
   * Select optimal combination of meals for a day
   */
  optimize(
    candidates: MealCandidate[],
    mealsNeeded: number,
    calorieTarget: number
  ): OptimizationResult {
    // Rank candidates by weighted score
    const ranked = this.rankCandidates(candidates);

    // Use greedy algorithm with look-ahead for selection
    const selected: MealCandidate[] = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    // Select meals while respecting targets
    for (let i = 0; i < mealsNeeded && ranked.length > 0; i++) {
      // Find best meal that keeps us within calorie target
      const remainingMeals = mealsNeeded - i;
      const remainingCalories = calorieTarget - totalCalories;
      const avgCaloriesPerMeal = remainingCalories / remainingMeals;

      let bestMeal: MealCandidate | null = null;
      let bestScore = -1;

      for (const candidate of ranked) {
        // Skip if already selected
        if (selected.includes(candidate)) continue;

        // Check if adding this meal would exceed target too much
        const calorieDeviation = Math.abs(
          (totalCalories + candidate.nutrition.calories) - calorieTarget
        );

        if (i < mealsNeeded - 1 && calorieDeviation > calorieTarget * 0.20) {
          continue;  // Would deviate too much
        }

        // Calculate combined score
        const score = this.calculateCombinedScore(candidate, avgCaloriesPerMeal);

        if (score > bestScore) {
          bestScore = score;
          bestMeal = candidate;
        }
      }

      if (bestMeal) {
        selected.push(bestMeal);
        totalCalories += bestMeal.nutrition.calories;
        totalProtein += bestMeal.nutrition.protein;
        totalCarbs += bestMeal.nutrition.carbs;
        totalFat += bestMeal.nutrition.fat;
        totalFiber += bestMeal.nutrition.fiber;
      }
    }

    // Calculate final metrics
    const calorieAdherence = 100 - Math.abs(totalCalories - calorieTarget) / calorieTarget * 100;
    const varietyScore = this.calculateVarietyScore(selected);

    // Calculate overall adherence score
    const adherenceScore = Math.round(
      calorieAdherence * 0.5 +
      varietyScore * 0.3 +
      this.averageScore(selected) * 0.2
    );

    // Generate explanations
    const explanations = this.generateExplanations(selected, {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
    });

    return {
      selectedMeals: selected,
      totalNutrition: {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        fiber: Math.round(totalFiber * 10) / 10,
      },
      adherenceScore,
      varietyScore,
      explanations,
    };
  }

  private rankCandidates(candidates: MealCandidate[]): MealCandidate[] {
    // Apply weights to scores
    const scored = candidates.map(candidate => {
      const weightedScore =
        candidate.score.breakdown.nutrition * this.weights.nutrition +
        candidate.score.breakdown.preference * this.weights.preference +
        candidate.score.breakdown.cost * this.weights.cost +
        candidate.score.breakdown.variety * this.weights.variety;

      return {
        ...candidate,
        score: {
          ...candidate.score,
          total: weightedScore,
        },
      };
    });

    // Sort by weighted score
    return scored.sort((a, b) => b.score.total - a.score.total);
  }

  private calculateCombinedScore(
    candidate: MealCandidate,
    targetCalories: number
  ): number {
    let score = candidate.score.total;

    // Bonus for being close to target calories
    const calorieDiff = Math.abs(candidate.nutrition.calories - targetCalories);
    const calorieScore = 100 - (calorieDiff / targetCalories) * 100;
    score += calorieScore * 0.2;

    return score;
  }

  private calculateVarietyScore(meals: MealCandidate[]): number {
    // Check diversity of ingredients
    const allIngredients = new Set<string>();
    const uniqueTypes = new Set<string>();

    for (const meal of meals) {
      for (const ing of meal.ingredients) {
        allIngredients.add(ing.name.toLowerCase());
      }
      uniqueTypes.add(meal.mealType);
    }

    // More unique ingredients = higher variety
    const avgIngredientsPerMeal = meals.reduce((sum, m) => sum + m.ingredients.length, 0) / meals.length;
    const varietyRatio = allIngredients.size / (avgIngredientsPerMeal * meals.length);

    return Math.min(100, varietyRatio * 100);
  }

  private averageScore(meals: MealCandidate[]): number {
    if (meals.length === 0) return 0;
    return meals.reduce((sum, m) => sum + m.score.total, 0) / meals.length;
  }

  private generateExplanations(
    meals: MealCandidate[],
    totals: Macros
  ): string[] {
    const explanations: string[] = [];

    explanations.push(`Selected ${meals.length} meals totaling ${totals.calories} kcal.`);

    const avgScore = this.averageScore(meals);
    if (avgScore >= 80) {
      explanations.push('All meals are well-optimized for your goals.');
    } else if (avgScore >= 60) {
      explanations.push('Meals are a good balance of nutrition and preferences.');
    } else {
      explanations.push('Some compromises made to fit all criteria.');
    }

    if (totals.protein >= 100) {
      explanations.push('Excellent protein intake for muscle maintenance.');
    }

    if (totals.fiber >= 25) {
      explanations.push('High fiber content supports digestive health.');
    }

    return explanations;
  }
}

// ==================== Phase 4: Reinforcement Learning Personalization ====================

export class ReinforcementLearner {
  private feedbackHistory: UserFeedback[] = [];

  /**
   * Add user feedback
   */
  addFeedback(feedback: UserFeedback): void {
    this.feedbackHistory.push(feedback);
  }

  /**
   * Adjust meal scores based on historical feedback
   */
  adjustScores(candidates: MealCandidate[]): MealCandidate[] {
    if (this.feedbackHistory.length === 0) {
      return candidates;
    }

    return candidates.map(candidate => {
      let adjustment = 0;

      // Check if this meal has feedback
      const feedbackForMeal = this.feedbackHistory.filter(
        f => f.mealId === candidate.id || this.isSimilarMeal(f.mealId, candidate)
      );

      if (feedbackForMeal.length > 0) {
        // Average rating (1-5 scale)
        const avgRating = feedbackForMeal.reduce((sum, f) => sum + f.rating, 0) / feedbackForMeal.length;

        // Convert to adjustment (-20 to +20)
        adjustment = (avgRating - 3) * 10;

        // Followed rate
        const followedCount = feedbackForMeal.filter(f => f.followed).length;
        const followRate = followedCount / feedbackForMeal.length;

        // Add bonus for high follow rate
        if (followRate > 0.7) {
          adjustment += 10;
        } else if (followRate < 0.3) {
          adjustment -= 10;
        }
      }

      // Apply adjustment
      const newTotal = Math.max(0, Math.min(100, candidate.score.total + adjustment));

      return {
        ...candidate,
        score: {
          ...candidate.score,
          total: newTotal,
        },
      };
    });
  }

  private isSimilarMeal(mealId: string, candidate: MealCandidate): boolean {
    // In real implementation, would check ingredient similarity
    // For now, simple name matching
    return mealId.toLowerCase().includes(candidate.name.toLowerCase().split(' ')[0]);
  }

  /**
   * Get personalization insights
   */
  getInsights(): string[] {
    const insights: string[] = [];

    if (this.feedbackHistory.length < 5) {
      insights.push('Continue providing feedback to improve recommendations.');
      return insights;
    }

    // Analyze patterns
    const avgRating = this.feedbackHistory.reduce((sum, f) => sum + f.rating, 0) / this.feedbackHistory.length;

    if (avgRating >= 4) {
      insights.push('Your meal plans are highly personalized to your preferences!');
    } else if (avgRating <= 2.5) {
      insights.push('We\'re learning your preferences. Keep rating meals to improve.');
    }

    const followRate = this.feedbackHistory.filter(f => f.followed).length / this.feedbackHistory.length;

    if (followRate >= 0.8) {
      insights.push('Great adherence! You\'re following most recommendations.');
    } else if (followRate < 0.5) {
      insights.push('Consider adjusting your preferences for more followed recommendations.');
    }

    return insights;
  }
}

// ==================== Main Optimizer Class ====================

export class MealOptimizationPipeline {
  private filter: HardConstraintsFilter;
  private scorer: FuzzyLogicScorer;
  private optimizer: MultiObjectiveOptimizer;
  private learner: ReinforcementLearner;

  constructor(
    private profile: DietaryProfile,
    private previousMeals: Meal[] = [],
    weights?: OptimizationWeights
  ) {
    this.filter = new HardConstraintsFilter(profile);
    this.scorer = new FuzzyLogicScorer(profile, previousMeals);
    this.optimizer = new MultiObjectiveOptimizer(weights || {
      nutrition: 0.35,
      preference: 0.25,
      cost: 0.20,
      variety: 0.20,
    });
    this.learner = new ReinforcementLearner();
  }

  /**
   * Run complete 4-phase optimization
   */
  optimize(
    candidates: Meal[],
    mealsNeeded: number = 3
  ): OptimizationResult {
    console.log('[MealOptimizer] Starting 4-phase optimization...');
    console.log(`Phase 1: Filtering ${candidates.length} candidates...`);

    // Phase 1: Hard constraints
    const filtered = this.filter.filter(candidates);
    console.log(`Phase 1: ${filtered.length} meals passed hard constraints`);

    if (filtered.length === 0) {
      throw new Error('No meals satisfy hard constraints. Relax some restrictions.');
    }

    // Phase 2: Fuzzy scoring
    console.log('Phase 2: Applying fuzzy logic scoring...');
    let scored = this.scorer.score(filtered);

    // Phase 3: RL personalization
    console.log('Phase 3: Applying reinforcement learning adjustments...');
    scored = this.learner.adjustScores(scored);

    // Phase 4: Multi-objective optimization
    console.log('Phase 4: Running multi-objective optimization...');
    const result = this.optimizer.optimize(scored, mealsNeeded, this.profile.calorieTarget);

    console.log('[MealOptimizer] Optimization complete:', {
      selectedMeals: result.selectedMeals.length,
      adherenceScore: result.adherenceScore,
      varietyScore: result.varietyScore,
    });

    return result;
  }

  /**
   * Record user feedback for learning
   */
  recordFeedback(feedback: UserFeedback): void {
    this.learner.addFeedback(feedback);
  }

  /**
   * Get personalization insights
   */
  getInsights(): string[] {
    return this.learner.getInsights();
  }
}
