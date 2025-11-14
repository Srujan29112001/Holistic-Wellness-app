'use client';

/**
 * Onboarding Page - 7-Step Wizard
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createBrowserClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/stores/user-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

// Validation schemas for each step
const step1Schema = z.object({
  age: z.number().min(13).max(120),
  gender: z.string().min(1),
  height: z.number().min(50).max(300),
  weight: z.number().min(20).max(500),
});

const step2Schema = z.object({
  fitness_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very-active']),
});

const step3Schema = z.object({
  health_conditions: z.array(z.string()),
  medications: z.array(z.string()),
  allergies: z.array(z.string()),
});

const step4Schema = z.object({
  diet_type: z.enum(['vegan', 'vegetarian', 'pescatarian', 'omnivore', 'keto', 'paleo']),
  dietary_restrictions: z.array(z.string()),
  cuisine_preferences: z.array(z.string()),
});

const step5Schema = z.object({
  wake_time: z.string(),
  sleep_time: z.string(),
  work_hours_start: z.string(),
  work_hours_end: z.string(),
});

const step6Schema = z.object({
  health_goals: z.array(z.string()),
  target_weight: z.number().optional(),
});

const step7Schema = z.object({
  birth_date: z.string().optional(),
  spiritual_interests: z.array(z.string()),
  dosha_type: z.enum(['vata', 'pitta', 'kapha', 'unknown']).optional(),
});

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const { setProfile } = useUserStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data state
  const [formData, setFormData] = useState<any>({
    age: 0,
    gender: '',
    height: 0,
    weight: 0,
    fitness_level: 'moderate',
    health_conditions: [],
    medications: [],
    allergies: [],
    diet_type: 'omnivore',
    dietary_restrictions: [],
    cuisine_preferences: [],
    wake_time: '07:00',
    sleep_time: '23:00',
    work_hours_start: '09:00',
    work_hours_end: '17:00',
    health_goals: [],
    target_weight: undefined,
    birth_date: '',
    spiritual_interests: [],
    dosha_type: 'unknown',
  });

  const totalSteps = 7;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No authenticated user');

      // Calculate target calories (simplified Harris-Benedict)
      const bmr = formData.gender === 'male'
        ? 88.362 + (13.397 * formData.weight) + (4.799 * formData.height) - (5.677 * formData.age)
        : 447.593 + (9.247 * formData.weight) + (3.098 * formData.height) - (4.330 * formData.age);

      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        'very-active': 1.9
      };

      const targetCalories = Math.round(bmr * activityMultipliers[formData.fitness_level as keyof typeof activityMultipliers]);

      // Prepare profile data
      const profileData = {
        user_id: user.id,
        ...formData,
        work_hours: {
          start: formData.work_hours_start,
          end: formData.work_hours_end
        },
        targetCalories,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Remove temporary fields
      delete profileData.work_hours_start;
      delete profileData.work_hours_end;

      // Save to database
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setProfile(data);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (updates: any) => {
    setFormData({ ...formData, ...updates });
  };

  const toggleArrayItem = (key: string, value: string) => {
    const current = formData[key] || [];
    const updated = current.includes(value)
      ? current.filter((item: string) => item !== value)
      : [...current, value];
    updateFormData({ [key]: updated });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'Basic Information'}
              {currentStep === 2 && 'Physical Activity'}
              {currentStep === 3 && 'Health Information'}
              {currentStep === 4 && 'Dietary Preferences'}
              {currentStep === 5 && 'Daily Routine'}
              {currentStep === 6 && 'Wellness Goals'}
              {currentStep === 7 && 'Spiritual Wellness (Optional)'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Tell us about yourself'}
              {currentStep === 2 && 'How active are you?'}
              {currentStep === 3 && 'Help us personalize your experience'}
              {currentStep === 4 && 'What do you like to eat?'}
              {currentStep === 5 && 'When do you wake up and sleep?'}
              {currentStep === 6 && 'What are you working towards?'}
              {currentStep === 7 && 'Enhance your spiritual wellness'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Input
                  type="number"
                  label="Age"
                  value={formData.age || ''}
                  onChange={(e) => updateFormData({ age: parseInt(e.target.value) })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.gender}
                    onChange={(e) => updateFormData({ gender: e.target.value })}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input
                  type="number"
                  label="Height (cm)"
                  value={formData.height || ''}
                  onChange={(e) => updateFormData({ height: parseFloat(e.target.value) })}
                  required
                />
                <Input
                  type="number"
                  label="Weight (kg)"
                  value={formData.weight || ''}
                  onChange={(e) => updateFormData({ weight: parseFloat(e.target.value) })}
                  required
                />
              </div>
            )}

            {/* Step 2: Activity Level */}
            {currentStep === 2 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select your typical activity level
                </label>
                {[
                  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
                  { value: 'light', label: 'Lightly Active', desc: 'Exercise 1-3 days/week' },
                  { value: 'moderate', label: 'Moderately Active', desc: 'Exercise 3-5 days/week' },
                  { value: 'active', label: 'Active', desc: 'Exercise 6-7 days/week' },
                  { value: 'very-active', label: 'Very Active', desc: 'Intense exercise daily' },
                ].map((level) => (
                  <div
                    key={level.value}
                    onClick={() => updateFormData({ fitness_level: level.value })}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.fitness_level === level.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{level.label}</div>
                    <div className="text-sm text-gray-600">{level.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Health Info */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Health Conditions (select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['diabetes', 'hypertension', 'heart_disease', 'thyroid', 'none'].map((condition) => (
                      <button
                        key={condition}
                        type="button"
                        onClick={() => toggleArrayItem('health_conditions', condition)}
                        className={`p-2 border rounded-lg text-sm ${
                          formData.health_conditions?.includes(condition)
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {condition.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergies (select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['nuts', 'dairy', 'gluten', 'shellfish', 'soy', 'eggs', 'none'].map((allergy) => (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => toggleArrayItem('allergies', allergy)}
                        className={`p-2 border rounded-lg text-sm ${
                          formData.allergies?.includes(allergy)
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {allergy}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Dietary Preferences */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diet Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.diet_type}
                    onChange={(e) => updateFormData({ diet_type: e.target.value })}
                  >
                    <option value="omnivore">Omnivore (Eat everything)</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="pescatarian">Pescatarian</option>
                    <option value="keto">Keto</option>
                    <option value="paleo">Paleo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuisine Preferences
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['italian', 'indian', 'chinese', 'mexican', 'mediterranean', 'japanese'].map((cuisine) => (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => toggleArrayItem('cuisine_preferences', cuisine)}
                        className={`p-2 border rounded-lg text-sm capitalize ${
                          formData.cuisine_preferences?.includes(cuisine)
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Daily Routine */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <Input
                  type="time"
                  label="Wake Time"
                  value={formData.wake_time}
                  onChange={(e) => updateFormData({ wake_time: e.target.value })}
                  required
                />
                <Input
                  type="time"
                  label="Sleep Time"
                  value={formData.sleep_time}
                  onChange={(e) => updateFormData({ sleep_time: e.target.value })}
                  required
                />
                <Input
                  type="time"
                  label="Work Start Time"
                  value={formData.work_hours_start}
                  onChange={(e) => updateFormData({ work_hours_start: e.target.value })}
                  required
                />
                <Input
                  type="time"
                  label="Work End Time"
                  value={formData.work_hours_end}
                  onChange={(e) => updateFormData({ work_hours_end: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Step 6: Wellness Goals */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select your wellness goals
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'weight_loss',
                      'muscle_gain',
                      'better_sleep',
                      'stress_reduction',
                      'improved_energy',
                      'mindfulness'
                    ].map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleArrayItem('health_goals', goal)}
                        className={`p-2 border rounded-lg text-sm ${
                          formData.health_goals?.includes(goal)
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {goal.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.health_goals?.includes('weight_loss') && (
                  <Input
                    type="number"
                    label="Target Weight (kg)"
                    value={formData.target_weight || ''}
                    onChange={(e) => updateFormData({ target_weight: parseFloat(e.target.value) })}
                  />
                )}
              </div>
            )}

            {/* Step 7: Spiritual (Optional) */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    This section is optional. Skip if you prefer to focus only on physical and mental wellness.
                  </p>
                </div>

                <Input
                  type="date"
                  label="Birth Date (for astrological insights)"
                  value={formData.birth_date}
                  onChange={(e) => updateFormData({ birth_date: e.target.value })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spiritual Interests
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['meditation', 'yoga', 'astrology', 'ayurveda', 'mindfulness', 'none'].map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleArrayItem('spiritual_interests', interest)}
                        className={`p-2 border rounded-lg text-sm capitalize ${
                          formData.spiritual_interests?.includes(interest)
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isLoading}
              >
                Back
              </Button>

              {currentStep < totalSteps ? (
                <Button onClick={handleNext}>
                  Continue
                </Button>
              ) : (
                <Button onClick={handleComplete} isLoading={isLoading}>
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
