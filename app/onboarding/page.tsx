'use client';

/**
 * Onboarding Page
 *
 * 7-step onboarding wizard with validation, persistence, and profile creation
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressBar } from '@/components/ui';
import { Step1BasicProfile } from '@/components/onboarding/Step1BasicProfile';
import { Step2PhysicalActivity } from '@/components/onboarding/Step2PhysicalActivity';
import { Step3MedicalInfo } from '@/components/onboarding/Step3MedicalInfo';
import { Step4DietaryPreferences } from '@/components/onboarding/Step4DietaryPreferences';
import { Step5DailyRoutine } from '@/components/onboarding/Step5DailyRoutine';
import { Step6WellnessGoals } from '@/components/onboarding/Step6WellnessGoals';
import { Step7Confirmation } from '@/components/onboarding/Step7Confirmation';
import type { CompleteOnboardingData } from '@/lib/validation/onboarding-schemas';

const STORAGE_KEY = 'wellness_onboarding_progress';

const STEP_NAMES = [
  'Basic Info',
  'Activity',
  'Medical',
  'Diet',
  'Routine',
  'Wellness',
  'Confirm',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CompleteOnboardingData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData || {});
        setCurrentStep(parsed.currentStep || 1);
      } catch (e) {
        console.error('Failed to load saved progress:', e);
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ formData, currentStep })
      );
    }
  }, [formData, currentStep]);

  const handleNext = (stepKey: keyof CompleteOnboardingData, data: any) => {
    setFormData((prev) => ({ ...prev, [stepKey]: data }));
    setError(null);

    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setError(null);
    }
  };

  const handleSubmit = async (confirmationData: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const completeData = {
        ...formData,
        step7: confirmationData,
      };

      // Submit to profile API
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Flatten the data structure for the profile API
          ...completeData.step1,
          ...completeData.step2,
          ...completeData.step3,
          ...completeData.step4,
          ...completeData.step5,
          ...completeData.step6,
          preferences: {
            emailUpdates: confirmationData.emailUpdates,
            pushNotifications: confirmationData.pushNotifications,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create profile');
      }

      // Clear saved progress
      localStorage.removeItem(STORAGE_KEY);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding submission error:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicProfile
            data={formData.step1 || {}}
            onNext={(data) => handleNext('step1', data)}
          />
        );
      case 2:
        return (
          <Step2PhysicalActivity
            data={formData.step2 || {}}
            onNext={(data) => handleNext('step2', data)}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <Step3MedicalInfo
            data={formData.step3 || {}}
            onNext={(data) => handleNext('step3', data)}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <Step4DietaryPreferences
            data={formData.step4 || {}}
            onNext={(data) => handleNext('step4', data)}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <Step5DailyRoutine
            data={formData.step5 || {}}
            onNext={(data) => handleNext('step5', data)}
            onBack={handleBack}
          />
        );
      case 6:
        return (
          <Step6WellnessGoals
            data={formData.step6 || {}}
            onNext={(data) => handleNext('step6', data)}
            onBack={handleBack}
          />
        );
      case 7:
        return (
          <Step7Confirmation
            data={formData.step7 || {}}
            allData={formData}
            onNext={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold wellness-gradient bg-clip-text text-transparent mb-2">
            Welcome to Your Wellness Journey
          </h1>
          <p className="text-gray-600">
            Complete your profile to receive personalized AI-powered recommendations
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar
            currentStep={currentStep}
            totalSteps={7}
            steps={STEP_NAMES}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-red-800 mb-1">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          {renderStep()}
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Your progress is automatically saved. You can return anytime to complete your profile.
          </p>
        </div>
      </div>
    </div>
  );
}
