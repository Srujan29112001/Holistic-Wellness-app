/**
 * Step 6: Wellness Goals
 *
 * Collects mental health goals, stress levels, spiritual interests, and astrology preferences
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, CheckboxGroup } from '@/components/ui';
import {
  wellnessGoalsSchema,
  type WellnessGoalsData,
  MENTAL_HEALTH_GOALS,
  COPING_STRATEGIES,
  THERAPEUTIC_PREFERENCES,
  SPIRITUAL_INTERESTS,
} from '@/lib/validation/onboarding-schemas';

interface Step6Props {
  data: Partial<WellnessGoalsData>;
  onNext: (data: WellnessGoalsData) => void;
  onBack: () => void;
}

export const Step6WellnessGoals: React.FC<Step6Props> = ({ data, onNext, onBack }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<WellnessGoalsData>({
    resolver: zodResolver(wellnessGoalsSchema),
    defaultValues: data,
  });

  const [mentalHealthGoals, setMentalHealthGoals] = useState<string[]>(data.mentalHealthGoals || []);
  const [copingStrategies, setCopingStrategies] = useState<string[]>(data.copingStrategies || []);
  const [therapeuticPreferences, setTherapeuticPreferences] = useState<string[]>(data.therapeuticPreferences || []);
  const [spiritualInterests, setSpiritualInterests] = useState<string[]>(data.spiritualInterests || []);

  const interestedInAstrology = watch('interestedInAstrology');

  const handleMentalHealthGoalsChange = (values: string[]) => {
    setMentalHealthGoals(values);
    setValue('mentalHealthGoals', values, { shouldValidate: true });
  };

  const handleCopingStrategiesChange = (values: string[]) => {
    setCopingStrategies(values);
    setValue('copingStrategies', values);
  };

  const handleTherapeuticPreferencesChange = (values: string[]) => {
    setTherapeuticPreferences(values);
    setValue('therapeuticPreferences', values, { shouldValidate: true });
  };

  const handleSpiritualInterestsChange = (values: string[]) => {
    setSpiritualInterests(values);
    setValue('spiritualInterests', values);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Wellness Goals
        </h2>
        <p className="text-gray-600">
          Let's understand your mental and spiritual wellness aspirations
        </p>
      </div>

      {/* Mental Health Section */}
      <div className="bg-purple-50 rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold text-purple-900 mb-4">
          Mental Health & Wellness
        </h3>

        {/* Mental Health Goals */}
        <CheckboxGroup
          label="Mental Health Goals (select at least one)"
          options={MENTAL_HEALTH_GOALS.map(goal => ({ value: goal, label: goal }))}
          value={mentalHealthGoals}
          onChange={handleMentalHealthGoalsChange}
          error={errors.mentalHealthGoals?.message}
          required
          columns={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stress Level */}
          <Controller
            name="stressLevel"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stress Level <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    {...field}
                    type="range"
                    min="1"
                    max="5"
                    value={value ?? 3}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-purple-600 min-w-[2rem] text-center">
                    {value ?? 3}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>Moderate</span>
                  <span>High</span>
                </div>
                {errors.stressLevel && (
                  <p className="mt-1 text-sm text-red-600">{errors.stressLevel.message}</p>
                )}
              </div>
            )}
          />

          {/* Sleep Quality */}
          <Controller
            name="sleepQuality"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sleep Quality <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    {...field}
                    type="range"
                    min="1"
                    max="5"
                    value={value ?? 3}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-purple-600 min-w-[2rem] text-center">
                    {value ?? 3}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Average</span>
                  <span>Excellent</span>
                </div>
                {errors.sleepQuality && (
                  <p className="mt-1 text-sm text-red-600">{errors.sleepQuality.message}</p>
                )}
              </div>
            )}
          />
        </div>

        {/* Coping Strategies */}
        <CheckboxGroup
          label="Current Coping Strategies"
          options={COPING_STRATEGIES.map(strategy => ({ value: strategy, label: strategy }))}
          value={copingStrategies}
          onChange={handleCopingStrategiesChange}
          columns={2}
        />

        {/* Therapeutic Preferences */}
        <CheckboxGroup
          label="Therapeutic Preferences (select at least one)"
          options={THERAPEUTIC_PREFERENCES.map(pref => ({
            value: pref,
            label: pref.charAt(0).toUpperCase() + pref.slice(1)
          }))}
          value={therapeuticPreferences}
          onChange={handleTherapeuticPreferencesChange}
          error={errors.therapeuticPreferences?.message}
          required
          columns={2}
        />
      </div>

      {/* Spiritual Section */}
      <div className="bg-indigo-50 rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold text-indigo-900 mb-4">
          Spiritual Wellness
        </h3>

        {/* Spiritual Interests */}
        <CheckboxGroup
          label="Spiritual Interests (optional)"
          options={SPIRITUAL_INTERESTS.map(interest => ({
            value: interest,
            label: interest.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          }))}
          value={spiritualInterests}
          onChange={handleSpiritualInterestsChange}
          columns={2}
        />

        {/* Astrology Interest */}
        <div className="flex items-center">
          <Controller
            name="interestedInAstrology"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <input
                {...field}
                type="checkbox"
                checked={value ?? false}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
              />
            )}
          />
          <label className="ml-3 text-sm text-gray-700">
            I'm interested in personalized astrology insights
          </label>
        </div>

        {/* Birth Details (conditional) */}
        {interestedInAstrology && (
          <div className="mt-4 space-y-4 bg-white rounded-lg p-4">
            <p className="text-sm text-indigo-800">
              Please provide your birth details for accurate astrological guidance:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Controller
                name="birthDate"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    label="Birth Date"
                    error={errors.birthDate?.message}
                    required
                    fullWidth
                  />
                )}
              />

              <Controller
                name="birthTime"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="time"
                    label="Birth Time (optional)"
                    error={errors.birthTime?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="birthPlace"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    label="Birth Place (optional)"
                    placeholder="City, Country"
                    error={errors.birthPlace?.message}
                    fullWidth
                  />
                )}
              />
            </div>
          </div>
        )}

        {/* Ayurveda Interest */}
        <div className="flex items-center">
          <Controller
            name="interestedInAyurveda"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <input
                {...field}
                type="checkbox"
                checked={value ?? false}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
              />
            )}
          />
          <label className="ml-3 text-sm text-gray-700">
            I'm interested in Ayurvedic wellness recommendations
          </label>
        </div>

        {/* Belief System */}
        <Controller
          name="beliefSystem"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Belief System (optional)"
              options={[
                { value: 'vedic', label: 'Vedic/Eastern Astrology' },
                { value: 'western-astrology', label: 'Western Astrology' },
                { value: 'spiritual-general', label: 'Spiritual (General)' },
                { value: 'none', label: 'Prefer not to say' },
              ]}
              placeholder="Select if applicable"
              fullWidth
            />
          )}
        />
      </div>

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
