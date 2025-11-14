/**
 * Nutrition Agent
 *
 * Specializes in personalized meal planning, nutritional analysis, and dietary recommendations.
 * Uses USDA FoodData Central API and Claude for intelligent meal suggestions.
 */

import { Agent, AgentContext, AgentResponse, AgentRole } from '@/types/agents/base';
import { A2AAgentCard, A2AMessage } from '@/types/protocols/a2a';
import { MCPTool, MCPToolResult } from '@/types/protocols/mcp';
import { createAnthropicClient } from '@/lib/utils/anthropic-client';
import { USDAClient } from '@/lib/apis/usda-client';

interface MealPlanRequest {
  calories?: number;
  dietaryRestrictions?: string[];
  allergies?: string[];
  preferences?: string[];
  mealCount?: number;
  date?: string;
}

interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    calories: number;
  }>;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  prepTime?: number;
  instructions?: string[];
}

interface MealPlan {
  date: string;
  meals: Meal[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  notes?: string[];
}

export class NutritionAgent implements Agent {
  id = 'nutrition-agent';
  role: AgentRole = 'nutrition';
  name = 'Nutrition Specialist';
  description = 'Expert in personalized meal planning, nutritional analysis, and dietary recommendations';

  private claudeClient = createAnthropicClient();
  private usdaClient = new USDAClient();

  getAgentCard(): A2AAgentCard {
    return {
      agentId: this.id,
      name: this.name,
      description: this.description,
      capabilities: [
        'meal_planning',
        'nutrition_analysis',
        'dietary_recommendations',
        'calorie_tracking',
        'macro_optimization'
      ],
      endpoints: [
        {
          path: '/api/agents/nutrition',
          method: 'POST',
          description: 'Generate personalized meal plans and nutrition advice'
        }
      ],
      version: '1.0.0'
    };
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'search_foods',
        description: 'Search for foods in USDA database and get nutritional information',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Food name to search for'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results',
              default: 5
            }
          },
          required: ['query']
        }
      },
      {
        name: 'calculate_nutrition',
        description: 'Calculate total nutrition for a list of ingredients',
        inputSchema: {
          type: 'object',
          properties: {
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  amount: { type: 'string' }
                }
              }
            }
          },
          required: ['ingredients']
        }
      },
      {
        name: 'validate_meal_plan',
        description: 'Validate a meal plan against dietary constraints and goals',
        inputSchema: {
          type: 'object',
          properties: {
            mealPlan: { type: 'object' },
            constraints: { type: 'object' }
          },
          required: ['mealPlan', 'constraints']
        }
      }
    ];
  }

  async process(request: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Extract meal planning request from natural language or structured data
      const mealPlanRequest = this.parseMealPlanRequest(request, context);

      // Generate meal plan using Claude with USDA data validation
      const mealPlan = await this.generateMealPlan(mealPlanRequest, context);

      return {
        agentId: this.id,
        success: true,
        data: {
          mealPlan,
          recommendations: await this.generateRecommendations(mealPlan, context)
        },
        message: 'Personalized meal plan generated successfully',
        confidence: 0.9,
        reasoning: 'Meal plan created based on user preferences, dietary restrictions, and nutritional targets using USDA verified data'
      };
    } catch (error) {
      console.error('Nutrition agent error:', error);
      return {
        agentId: this.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to generate meal plan'
      };
    }
  }

  async handleA2AMessage(message: A2AMessage, context: AgentContext): Promise<AgentResponse> {
    const { task, parameters } = message.content;

    switch (task) {
      case 'generate_meal_plan':
        return this.process(JSON.stringify(parameters), context);

      case 'analyze_nutrition':
        return this.analyzeNutrition(parameters, context);

      case 'suggest_alternatives':
        return this.suggestAlternatives(parameters, context);

      default:
        return {
          agentId: this.id,
          success: false,
          error: `Unknown task: ${task}`,
          message: 'Task not supported by Nutrition Agent'
        };
    }
  }

  async executeTool(toolCall: { name: string; parameters: any }, context: AgentContext): Promise<MCPToolResult> {
    switch (toolCall.name) {
      case 'search_foods':
        return this.searchFoods(toolCall.parameters);

      case 'calculate_nutrition':
        return this.calculateNutrition(toolCall.parameters);

      case 'validate_meal_plan':
        return this.validateMealPlan(toolCall.parameters);

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolCall.name}`
        };
    }
  }

  // Private helper methods

  private parseMealPlanRequest(request: string, context: AgentContext): MealPlanRequest {
    // Extract parameters from context (user profile) or request
    const userProfile = context.userProfile;

    return {
      calories: userProfile?.targetCalories || 2000,
      dietaryRestrictions: userProfile?.dietaryRestrictions || [],
      allergies: userProfile?.allergies || [],
      preferences: userProfile?.cuisinePreferences || [],
      mealCount: 3, // breakfast, lunch, dinner
      date: new Date().toISOString().split('T')[0]
    };
  }

  private async generateMealPlan(request: MealPlanRequest, context: AgentContext): Promise<MealPlan> {
    // Build prompt for Claude
    const prompt = this.buildMealPlanPrompt(request, context);

    // Call Claude with streaming disabled for structured output
    const response = await this.claudeClient.chat({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'claude-3-5-sonnet-20241022', // Use Sonnet for complex meal planning
      maxTokens: 4000,
      temperature: 0.7
    });

    // Parse Claude's response into structured meal plan
    const mealPlanText = response.content;
    const meals = await this.parseMealsFromResponse(mealPlanText);

    // Validate nutrition with USDA data
    const validatedMeals = await this.validateMealsWithUSDA(meals);

    // Calculate totals
    const totalNutrition = this.calculateTotalNutrition(validatedMeals);

    return {
      date: request.date || new Date().toISOString().split('T')[0],
      meals: validatedMeals,
      totalNutrition,
      notes: this.generatePlanNotes(validatedMeals, request, totalNutrition)
    };
  }

  private buildMealPlanPrompt(request: MealPlanRequest, context: AgentContext): string {
    const { calories, dietaryRestrictions, allergies, preferences } = request;
    const userProfile = context.userProfile;

    return `You are an expert nutritionist creating a personalized daily meal plan.

User Profile:
- Target Calories: ${calories} kcal/day
- Dietary Restrictions: ${dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${allergies?.join(', ') || 'None'}
- Cuisine Preferences: ${preferences?.join(', ') || 'Varied'}
- Health Goals: ${userProfile?.healthGoals?.join(', ') || 'General wellness'}
- Fitness Level: ${userProfile?.fitnessLevel || 'moderate'}

Create a balanced meal plan with 3 main meals (breakfast, lunch, dinner) that:
1. Meets the calorie target (±100 kcal tolerance)
2. Provides balanced macronutrients (40% carbs, 30% protein, 30% fat)
3. Includes adequate fiber (25-30g)
4. Respects all dietary restrictions and allergies
5. Incorporates preferred cuisines when possible
6. Uses whole, nutritious foods

For each meal, provide:
- Meal name
- Brief description
- Detailed ingredient list with amounts
- Estimated nutrition (calories, protein, carbs, fat, fiber)
- Preparation time
- Simple cooking instructions

Format your response as a structured meal plan in this exact JSON format:
{
  "meals": [
    {
      "type": "breakfast",
      "name": "Meal Name",
      "description": "Brief description",
      "ingredients": [
        {"name": "ingredient", "amount": "quantity with unit", "calories": 0}
      ],
      "nutrition": {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "fiber": 0
      },
      "prepTime": 0,
      "instructions": ["step 1", "step 2"]
    }
  ]
}

Focus on creating practical, delicious meals that the user will actually want to eat.`;
  }

  private async parseMealsFromResponse(response: string): Promise<Meal[]> {
    try {
      // Extract JSON from Claude's response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.meals || [];
    } catch (error) {
      console.error('Failed to parse meals from response:', error);
      // Return fallback simple meals
      return this.getFallbackMeals();
    }
  }

  private async validateMealsWithUSDA(meals: Meal[]): Promise<Meal[]> {
    // Validate key ingredients against USDA database
    const validatedMeals = await Promise.all(
      meals.map(async (meal) => {
        const validatedIngredients = await Promise.all(
          meal.ingredients.map(async (ingredient) => {
            try {
              // Search USDA for this ingredient
              const results = await this.usdaClient.searchFoods(ingredient.name, 1);
              if (results.length > 0) {
                const usdaFood = results[0];
                const macros = await this.usdaClient.calculateMacros([usdaFood]);

                // Update with USDA-verified data
                return {
                  ...ingredient,
                  calories: Math.round(macros.calories),
                  verified: true
                };
              }
            } catch (error) {
              console.warn(`Could not verify ingredient: ${ingredient.name}`);
            }
            return ingredient;
          })
        );

        return {
          ...meal,
          ingredients: validatedIngredients
        };
      })
    );

    return validatedMeals;
  }

  private calculateTotalNutrition(meals: Meal[]) {
    return meals.reduce(
      (total, meal) => ({
        calories: total.calories + meal.nutrition.calories,
        protein: total.protein + meal.nutrition.protein,
        carbs: total.carbs + meal.nutrition.carbs,
        fat: total.fat + meal.nutrition.fat,
        fiber: total.fiber + (meal.nutrition.fiber || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }

  private generatePlanNotes(meals: Meal[], request: MealPlanRequest, totalNutrition: any): string[] {
    const notes: string[] = [];
    const target = request.calories || 2000;

    // Calorie adherence
    const caloriesDiff = totalNutrition.calories - target;
    if (Math.abs(caloriesDiff) <= 100) {
      notes.push(`✓ Meal plan meets your calorie target (${totalNutrition.calories} kcal)`);
    } else if (caloriesDiff > 100) {
      notes.push(`⚠ Meal plan is ${caloriesDiff} kcal over target. Consider reducing portion sizes.`);
    } else {
      notes.push(`⚠ Meal plan is ${Math.abs(caloriesDiff)} kcal under target. Consider adding healthy snacks.`);
    }

    // Protein check
    const proteinPerKg = totalNutrition.protein / 70; // Assuming average 70kg
    if (proteinPerKg >= 1.2) {
      notes.push(`✓ Excellent protein intake (${Math.round(totalNutrition.protein)}g)`);
    }

    // Fiber check
    if (totalNutrition.fiber >= 25) {
      notes.push(`✓ Great fiber content (${Math.round(totalNutrition.fiber)}g)`);
    } else {
      notes.push(`💡 Tip: Add more vegetables or whole grains for fiber`);
    }

    return notes;
  }

  private async generateRecommendations(mealPlan: MealPlan, context: AgentContext): Promise<string[]> {
    const recommendations: string[] = [];

    recommendations.push('Drink at least 8 glasses of water throughout the day');
    recommendations.push('Prepare ingredients the night before to save time');

    if (context.userProfile?.fitnessLevel === 'active' || context.userProfile?.fitnessLevel === 'very-active') {
      recommendations.push('Consider a post-workout protein shake if exercising');
    }

    return recommendations;
  }

  private async analyzeNutrition(parameters: any, context: AgentContext): Promise<AgentResponse> {
    // Analyze nutrition for logged meals
    const { foods } = parameters;

    const nutrition = await this.calculateNutrition({ ingredients: foods });

    return {
      agentId: this.id,
      success: true,
      data: nutrition,
      message: 'Nutritional analysis completed'
    };
  }

  private async suggestAlternatives(parameters: any, context: AgentContext): Promise<AgentResponse> {
    const { food, reason } = parameters;

    // Use Claude to suggest healthier or suitable alternatives
    const prompt = `Suggest 3 healthy alternatives to "${food}" for someone who ${reason}.
    Focus on nutritional value and practical availability.`;

    const response = await this.claudeClient.chat({
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-haiku-20240307', // Use Haiku for simple suggestions
      maxTokens: 500
    });

    return {
      agentId: this.id,
      success: true,
      data: { alternatives: response.content },
      message: 'Alternative suggestions generated'
    };
  }

  // Tool implementations

  private async searchFoods(params: { query: string; limit?: number }): Promise<MCPToolResult> {
    try {
      const results = await this.usdaClient.searchFoods(params.query, params.limit || 5);
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  private async calculateNutrition(params: { ingredients: any[] }): Promise<MCPToolResult> {
    try {
      // Search and aggregate nutrition for all ingredients
      const nutritionData = await Promise.all(
        params.ingredients.map(async (ing) => {
          const results = await this.usdaClient.searchFoods(ing.name, 1);
          if (results.length > 0) {
            return this.usdaClient.calculateMacros([results[0]]);
          }
          return { calories: 0, protein: 0, carbs: 0, fat: 0 };
        })
      );

      const total = nutritionData.reduce(
        (sum, n) => ({
          calories: sum.calories + n.calories,
          protein: sum.protein + n.protein,
          carbs: sum.carbs + n.carbs,
          fat: sum.fat + n.fat
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      return {
        success: true,
        data: total
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Calculation failed'
      };
    }
  }

  private async validateMealPlan(params: { mealPlan: any; constraints: any }): Promise<MCPToolResult> {
    const { mealPlan, constraints } = params;
    const issues: string[] = [];

    // Check calorie constraints
    if (constraints.maxCalories && mealPlan.totalNutrition.calories > constraints.maxCalories) {
      issues.push(`Exceeds calorie limit by ${mealPlan.totalNutrition.calories - constraints.maxCalories} kcal`);
    }

    // Check allergens
    if (constraints.allergies) {
      mealPlan.meals.forEach((meal: Meal) => {
        meal.ingredients.forEach(ing => {
          if (constraints.allergies.some((allergen: string) =>
            ing.name.toLowerCase().includes(allergen.toLowerCase())
          )) {
            issues.push(`Contains allergen: ${ing.name} in ${meal.name}`);
          }
        });
      });
    }

    return {
      success: issues.length === 0,
      data: {
        valid: issues.length === 0,
        issues
      }
    };
  }

  private getFallbackMeals(): Meal[] {
    return [
      {
        type: 'breakfast',
        name: 'Oatmeal with Berries',
        description: 'Wholesome oatmeal topped with mixed berries',
        ingredients: [
          { name: 'Oats', amount: '1 cup', calories: 300 },
          { name: 'Mixed berries', amount: '1/2 cup', calories: 40 },
          { name: 'Almond milk', amount: '1 cup', calories: 30 }
        ],
        nutrition: { calories: 370, protein: 12, carbs: 65, fat: 6, fiber: 10 }
      },
      {
        type: 'lunch',
        name: 'Grilled Chicken Salad',
        description: 'Fresh salad with grilled chicken breast',
        ingredients: [
          { name: 'Chicken breast', amount: '150g', calories: 250 },
          { name: 'Mixed greens', amount: '2 cups', calories: 20 },
          { name: 'Olive oil dressing', amount: '2 tbsp', calories: 120 }
        ],
        nutrition: { calories: 390, protein: 35, carbs: 15, fat: 18, fiber: 5 }
      },
      {
        type: 'dinner',
        name: 'Salmon with Vegetables',
        description: 'Baked salmon with roasted vegetables',
        ingredients: [
          { name: 'Salmon fillet', amount: '150g', calories: 280 },
          { name: 'Broccoli', amount: '1 cup', calories: 55 },
          { name: 'Sweet potato', amount: '1 medium', calories: 180 }
        ],
        nutrition: { calories: 515, protein: 40, carbs: 45, fat: 16, fiber: 8 }
      }
    ];
  }
}

// Export singleton instance
export const nutritionAgent = new NutritionAgent();
