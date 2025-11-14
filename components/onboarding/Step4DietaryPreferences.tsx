/**
 * Step 4: Dietary Preferences
 *
 * Collects diet type, meal preferences, cuisine preferences, and budget
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, CheckboxGroup } from '@/components/ui';
import {
  dietaryPreferencesSchema,
  type DietaryPreferencesData,
  CUISINE_PREFERENCES,
} from '@/lib/validation/onboarding-schemas';

interface Step4Props {
  data: Partial<DietaryPreferencesData>;
  onNext: (data: DietaryPreferencesData) => void;
  onBack: () => void;
}

const COMMON_DISLIKED_FOODS = [
  'Mushrooms',
  'Olives',
  'Onions',
  'Garlic',
  'Cilantro',
  'Seafood',
  'Organ Meats',
  'Spicy Foods',
];

export const Step4DietaryPreferences: React.FC<Step4Props> = ({ data, onNext, onBack }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<DietaryPreferencesData>({
    resolver: zodResolver(dietaryPreferencesSchema),
    defaultValues: data,
  });

  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>(data.cuisinePreferences || []);
  const [dislikedFoods, setDislikedFoods] = useState<string[]>(data.dislikedFoods || []);

  const handleCuisinePreferencesChange = (values: string[]) => {
    setCuisinePreferences(values);
    setValue('cuisinePreferences', values, { shouldValidate: true });
  };

  const handleDislikedFoodsChange = (values: string[]) => {
    setDislikedFoods(values);
    setValue('dislikedFoods', values);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Dietary Preferences
        </h2>
        <p className="text-gray-600">
          Let's personalize your meal recommendations
        </p>
      </div>

      {/* Diet Type */}
      <Controller
        name="dietType"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            label="Diet Type"
            options={[
              { value: 'standard', label: 'Standard (No restrictions)' },
              { value: 'vegetarian', label: 'Vegetarian' },
              { value: 'vegan', label: 'Vegan' },
              { value: 'keto', label: 'Ketogenic' },
              { value: 'paleo', label: 'Paleo' },
              { value: 'mediterranean', label: 'Mediterranean' },
              { value: 'pescatarian', label: 'Pescatarian' },
              { value: 'whole30', label: 'Whole30' },
            ]}
            error={errors.dietType?.message}
            required
            fullWidth
          />
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meals Per Day */}
        <Controller
          name="mealsPerDay"
          control={control}
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              {...field}
              type="number"
              label="Meals Per Day"
              placeholder="2-6"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
              error={errors.mealsPerDay?.message}
              helperText="Include snacks as meals"
              min={2}
              max={6}
              required
              fullWidth
            />
          )}
        />

        {/* Cooking Skill */}
        <Controller
          name="cookingSkill"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Cooking Skill Level"
              options={[
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' },
              ]}
              error={errors.cookingSkill?.message}
              required
              fullWidth
            />
          )}
        />

        {/* Max Prep Time */}
        <Controller
          name="maxPrepTime"
          control={control}
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              {...field}
              type="number"
              label="Max Prep Time (minutes)"
              placeholder="5-120"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
              error={errors.maxPrepTime?.message}
              helperText="Maximum time for meal preparation"
              min={5}
              max={120}
              required
              fullWidth
            />
          )}
        />

        {/* Budget Per Week */}
        <Controller
          name="budgetPerWeek"
          control={control}
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              {...field}
              type="number"
              label="Weekly Budget (USD, optional)"
              placeholder="20-500"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
              error={errors.budgetPerWeek?.message}
              helperText="Approximate budget for groceries"
              min={20}
              max={500}
              fullWidth
            />
          )}
        />
      </div>

      {/* Cuisine Preferences */}
      <CheckboxGroup
        label="Cuisine Preferences (select at least one)"
        options={CUISINE_PREFERENCES.map(cuisine => ({ value: cuisine, label: cuisine }))}
        value={cuisinePreferences}
        onChange={handleCuisinePreferencesChange}
        error={errors.cuisinePreferences?.message}
        required
        columns={3}
      />

      {/* Disliked Foods */}
      <CheckboxGroup
        label="Disliked Foods (optional)"
        options={COMMON_DISLIKED_FOODS.map(food => ({ value: food, label: food }))}
        value={dislikedFoods}
        onChange={handleDislikedFoodsChange}
        columns={2}
      />

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 px-8 py-3 bg-gradient-to-r from-green-500 to-indigo-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      </div>
    </form>
  );
};
