/**
 * Step 2: Physical Activity
 *
 * Collects activity level, exercise frequency, and fitness goals
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, CheckboxGroup } from '@/components/ui';
import {
  physicalActivitySchema,
  type PhysicalActivityData,
  FITNESS_GOALS,
  EXERCISE_TYPES,
} from '@/lib/validation/onboarding-schemas';

interface Step2Props {
  data: Partial<PhysicalActivityData>;
  onNext: (data: PhysicalActivityData) => void;
  onBack: () => void;
}

export const Step2PhysicalActivity: React.FC<Step2Props> = ({ data, onNext, onBack }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PhysicalActivityData>({
    resolver: zodResolver(physicalActivitySchema),
    defaultValues: data,
  });

  const [fitnessGoals, setFitnessGoals] = useState<string[]>(data.fitnessGoals || []);
  const [preferredExercises, setPreferredExercises] = useState<string[]>(data.preferredExercises || []);

  const handleFitnessGoalsChange = (values: string[]) => {
    setFitnessGoals(values);
    setValue('fitnessGoals', values, { shouldValidate: true });
  };

  const handlePreferredExercisesChange = (values: string[]) => {
    setPreferredExercises(values);
    setValue('preferredExercises', values);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Physical Activity
        </h2>
        <p className="text-gray-600">
          Help us understand your activity level and fitness goals
        </p>
      </div>

      {/* Activity Level */}
      <Controller
        name="activityLevel"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            label="Current Activity Level"
            options={[
              { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
              { value: 'light', label: 'Light (exercise 1-3 days/week)' },
              { value: 'moderate', label: 'Moderate (exercise 3-5 days/week)' },
              { value: 'active', label: 'Active (exercise 6-7 days/week)' },
              { value: 'very-active', label: 'Very Active (intense exercise daily)' },
            ]}
            error={errors.activityLevel?.message}
            required
            fullWidth
          />
        )}
      />

      {/* Exercise Frequency */}
      <Controller
        name="exerciseFrequency"
        control={control}
        render={({ field: { onChange, value, ...field } }) => (
          <Input
            {...field}
            type="number"
            label="How many days per week do you exercise?"
            placeholder="0-7"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
            error={errors.exerciseFrequency?.message}
            min={0}
            max={7}
            required
            fullWidth
          />
        )}
      />

      {/* Fitness Goals */}
      <CheckboxGroup
        label="Fitness Goals (select all that apply)"
        options={FITNESS_GOALS.map(goal => ({ value: goal, label: goal }))}
        value={fitnessGoals}
        onChange={handleFitnessGoalsChange}
        error={errors.fitnessGoals?.message}
        required
        columns={2}
      />

      {/* Preferred Exercises */}
      <CheckboxGroup
        label="Preferred Exercise Types (optional)"
        options={EXERCISE_TYPES.map(type => ({ value: type, label: type }))}
        value={preferredExercises}
        onChange={handlePreferredExercisesChange}
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
