/**
 * USDA FoodData Central API Client
 *
 * Provides access to USDA nutritional database with 300,000+ food items.
 * Free API with 1,000 requests/hour limit.
 *
 * API Documentation: https://fdc.nal.usda.gov/api-guide.html
 */

import axios from "axios";

const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";

export interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: USDANutrient[];
  servingSize?: number;
  servingSizeUnit?: string;
  brandOwner?: string;
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface USDASearchResult {
  foods: USDAFood[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

export interface USDASearchParams {
  query: string;
  pageSize?: number;
  pageNumber?: number;
  dataType?: string[]; // "Foundation", "SR Legacy", "Branded"
  sortBy?: "dataType.keyword" | "lowercaseDescription.keyword" | "fdcId";
  sortOrder?: "asc" | "desc";
}

/**
 * Search for foods in USDA database
 */
export async function searchUSDAFoods(
  params: USDASearchParams
): Promise<USDASearchResult> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    throw new Error("USDA_API_KEY not configured");
  }

  try {
    const response = await axios.post(
      `${USDA_API_BASE}/foods/search`,
      {
        query: params.query,
        pageSize: params.pageSize || 25,
        pageNumber: params.pageNumber || 1,
        dataType: params.dataType,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
      {
        params: { api_key: apiKey },
        headers: { "Content-Type": "application/json" },
      }
    );

    return {
      foods: response.data.foods || [],
      totalHits: response.data.totalHits || 0,
      currentPage: response.data.currentPage || 1,
      totalPages: response.data.totalPages || 1,
    };
  } catch (error: any) {
    console.error("[USDA API Error]", error.response?.data || error.message);
    throw new Error(`USDA API error: ${error.message}`);
  }
}

/**
 * Get detailed food information by FDC ID
 */
export async function getUSDAFoodDetails(fdcId: number): Promise<USDAFood> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    throw new Error("USDA_API_KEY not configured");
  }

  try {
    const response = await axios.get(`${USDA_API_BASE}/food/${fdcId}`, {
      params: { api_key: apiKey },
    });

    return response.data;
  } catch (error: any) {
    console.error("[USDA API Error]", error.response?.data || error.message);
    throw new Error(`USDA API error: ${error.message}`);
  }
}

/**
 * Get multiple foods by FDC IDs
 */
export async function getUSDAFoodsBatch(fdcIds: number[]): Promise<USDAFood[]> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    throw new Error("USDA_API_KEY not configured");
  }

  try {
    const response = await axios.post(
      `${USDA_API_BASE}/foods`,
      {
        fdcIds,
        format: "full",
      },
      {
        params: { api_key: apiKey },
        headers: { "Content-Type": "application/json" },
      }
    );

    return response.data || [];
  } catch (error: any) {
    console.error("[USDA API Error]", error.response?.data || error.message);
    throw new Error(`USDA API error: ${error.message}`);
  }
}

/**
 * Extract specific nutrient from food
 */
export function getNutrientValue(
  food: USDAFood,
  nutrientName: string
): number | null {
  const nutrient = food.foodNutrients.find(
    (n) => n.nutrientName.toLowerCase() === nutrientName.toLowerCase()
  );
  return nutrient ? nutrient.value : null;
}

/**
 * Get macronutrients for a food
 */
export function getMacros(food: USDAFood): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
} {
  return {
    calories: getNutrientValue(food, "Energy") || 0,
    protein: getNutrientValue(food, "Protein") || 0,
    carbs: getNutrientValue(food, "Carbohydrate, by difference") || 0,
    fat: getNutrientValue(food, "Total lipid (fat)") || 0,
    fiber: getNutrientValue(food, "Fiber, total dietary") || 0,
  };
}

/**
 * Calculate nutrition for a recipe
 */
export async function calculateRecipeNutrition(
  ingredients: Array<{ query: string; amount: number; unit: string }>
): Promise<{
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
}> {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;

  for (const ingredient of ingredients) {
    const searchResult = await searchUSDAFoods({
      query: ingredient.query,
      pageSize: 1,
    });

    if (searchResult.foods.length > 0) {
      const food = searchResult.foods[0];
      const macros = getMacros(food);

      // Simple scaling (assuming amounts are in grams per 100g base)
      const scale = ingredient.amount / 100;

      totalCalories += macros.calories * scale;
      totalProtein += macros.protein * scale;
      totalCarbs += macros.carbs * scale;
      totalFat += macros.fat * scale;
      totalFiber += macros.fiber * scale;
    }
  }

  return {
    totalCalories: Math.round(totalCalories),
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    totalFiber: Math.round(totalFiber * 10) / 10,
  };
}
