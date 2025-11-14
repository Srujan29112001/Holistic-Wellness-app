/**
 * Step 7: Confirmation
 *
 * Summary review and final confirmation with terms and conditions
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox } from '@/components/ui';
import {
  confirmationSchema,
  type ConfirmationData,
  type CompleteOnboardingData,
} from '@/lib/validation/onboarding-schemas';

interface Step7Props {
  data: Partial<ConfirmationData>;
  allData: Partial<CompleteOnboardingData>;
  onNext: (data: ConfirmationData) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export const Step7Confirmation: React.FC<Step7Props> = ({
  data,
  allData,
  onNext,
  onBack,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmationData>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: data,
  });

  // Generate summary from collected data
  const getSummary = () => {
    const summary = [];

    if (allData.step1) {
      summary.push({
        title: 'Basic Profile',
        items: [
          `Age: ${allData.step1.age} years`,
          `Sex: ${allData.step1.sex}`,
          `Height: ${allData.step1.height} cm`,
          `Weight: ${allData.step1.weight} kg`,
          `Goal: ${allData.step1.goal === 'maintain' ? 'Maintain weight' : allData.step1.goal === 'lose' ? 'Lose weight' : 'Gain weight'}`,
        ],
      });
    }

    if (allData.step2) {
      summary.push({
        title: 'Physical Activity',
        items: [
          `Activity Level: ${allData.step2.activityLevel}`,
          `Exercise Frequency: ${allData.step2.exerciseFrequency} days/week`,
          `Fitness Goals: ${allData.step2.fitnessGoals?.join(', ') || 'None selected'}`,
        ],
      });
    }

    if (allData.step3) {
      summary.push({
        title: 'Medical Information',
        items: [
          `Medical Conditions: ${allData.step3.medicalConditions?.length ? allData.step3.medicalConditions.join(', ') : 'None'}`,
          `Allergies: ${allData.step3.allergies?.length ? allData.step3.allergies.join(', ') : 'None'}`,
          `Dietary Restrictions: ${allData.step3.dietaryRestrictions?.length ? allData.step3.dietaryRestrictions.join(', ') : 'None'}`,
        ],
      });
    }

    if (allData.step4) {
      summary.push({
        title: 'Dietary Preferences',
        items: [
          `Diet Type: ${allData.step4.dietType}`,
          `Meals Per Day: ${allData.step4.mealsPerDay}`,
          `Cooking Skill: ${allData.step4.cookingSkill}`,
          `Max Prep Time: ${allData.step4.maxPrepTime} minutes`,
        ],
      });
    }

    if (allData.step5) {
      summary.push({
        title: 'Daily Routine',
        items: [
          `Wake Time: ${allData.step5.wakeTime}`,
          `Sleep Time: ${allData.step5.sleepTime}`,
          `Work Schedule: ${allData.step5.workSchedule}`,
        ],
      });
    }

    if (allData.step6) {
      summary.push({
        title: 'Wellness Goals',
        items: [
          `Mental Health Goals: ${allData.step6.mentalHealthGoals?.join(', ') || 'None'}`,
          `Stress Level: ${allData.step6.stressLevel}/5`,
          `Sleep Quality: ${allData.step6.sleepQuality}/5`,
          `Interested in Astrology: ${allData.step6.interestedInAstrology ? 'Yes' : 'No'}`,
        ],
      });
    }

    return summary;
  };

  const summary = getSummary();

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Review & Confirm
        </h2>
        <p className="text-gray-600">
          Please review your information and accept the terms to complete setup
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-green-50 via-indigo-50 to-purple-50 rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Profile Summary</h3>

        {summary.map((section, index) => (
          <div key={index} className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">{section.title}</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Terms and Conditions */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>

        <Controller
          name="agreeToTerms"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Checkbox
              {...field}
              checked={value ?? false}
              onChange={(e) => onChange(e.target.checked)}
              label="I agree to the Terms and Conditions"
              error={errors.agreeToTerms?.message}
              required
            />
          )}
        />

        <Controller
          name="agreeToPrivacy"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Checkbox
              {...field}
              checked={value ?? false}
              onChange={(e) => onChange(e.target.checked)}
              label="I agree to the Privacy Policy"
              error={errors.agreeToPrivacy?.message}
              required
            />
          )}
        />

        <Controller
          name="understandNotMedicalAdvice"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Checkbox
              {...field}
              checked={value ?? false}
              onChange={(e) => onChange(e.target.checked)}
              label="I understand this app provides wellness guidance and is not a substitute for professional medical advice"
              error={errors.understandNotMedicalAdvice?.message}
              required
            />
          )}
        />

        <hr className="my-4" />

        <h4 className="text-sm font-semibold text-gray-700 mb-2">Communication Preferences (optional)</h4>

        <Controller
          name="emailUpdates"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Checkbox
              {...field}
              checked={value ?? false}
              onChange={(e) => onChange(e.target.checked)}
              label="Send me email updates about my wellness journey"
            />
          )}
        />

        <Controller
          name="pushNotifications"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Checkbox
              {...field}
              checked={value ?? false}
              onChange={(e) => onChange(e.target.checked)}
              label="Enable push notifications for reminders and insights"
            />
          )}
        />
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-yellow-800 mb-1">Medical Disclaimer</h4>
            <p className="text-sm text-yellow-700">
              This application provides AI-generated wellness recommendations for informational purposes only.
              It is not intended to diagnose, treat, cure, or prevent any disease. Always seek the advice of
              your physician or other qualified health provider with any questions you may have regarding a
              medical condition.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-8 py-3 bg-gradient-to-r from-green-500 to-indigo-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Your Profile...
            </>
          ) : (
            'Complete Setup'
          )}
        </button>
      </div>
    </form>
  );
};
