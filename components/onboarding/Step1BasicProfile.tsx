/**
 * Step 1: Basic Profile
 *
 * Collects basic user information: age, sex, height, weight, goal
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select } from '@/components/ui';
import { basicProfileSchema, type BasicProfileData } from '@/lib/validation/onboarding-schemas';

interface Step1Props {
  data: Partial<BasicProfileData>;
  onNext: (data: BasicProfileData) => void;
}

export const Step1BasicProfile: React.FC<Step1Props> = ({ data, onNext }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicProfileData>({
    resolver: zodResolver(basicProfileSchema),
    defaultValues: data,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Let's Get Started
        </h2>
        <p className="text-gray-600">
          Tell us a bit about yourself to personalize your wellness journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Age */}
        <Controller
          name="age"
          control={control}
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              {...field}
              type="number"
              label="Age"
              placeholder="Enter your age"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
              error={errors.age?.message}
              required
              fullWidth
            />
          )}
        />

        {/* Sex */}
        <Controller
          name="sex"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Sex"
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
              error={errors.sex?.message}
              required
              fullWidth
            />
          )}
        />

        {/* Height */}
        <Controller
          name="height"
          control={control}
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              {...field}
              type="number"
              label="Height (cm)"
              placeholder="Enter height in cm"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
              error={errors.height?.message}
              helperText="Example: 170 cm"
              required
              fullWidth
            />
          )}
        />

        {/* Weight */}
        <Controller
          name="weight"
          control={control}
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              {...field}
              type="number"
              label="Weight (kg)"
              placeholder="Enter weight in kg"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
              error={errors.weight?.message}
              helperText="Example: 70 kg"
              required
              fullWidth
            />
          )}
        />
      </div>

      {/* Goal */}
      <Controller
        name="goal"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            label="What's your primary goal?"
            options={[
              { value: 'maintain', label: 'Maintain Current Weight' },
              { value: 'lose', label: 'Lose Weight' },
              { value: 'gain', label: 'Gain Weight/Muscle' },
            ]}
            error={errors.goal?.message}
            required
            fullWidth
          />
        )}
      />

      <button
        type="submit"
        className="w-full px-8 py-3 bg-gradient-to-r from-green-500 to-indigo-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
      >
        Continue
      </button>
    </form>
  );
};
