/**
 * ProgressBar Component
 *
 * Visual progress indicator for multi-step forms
 */

import React from 'react';

export interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  steps,
}) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-green-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step Indicators */}
      {steps && (
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isFuture = stepNumber > currentStep;

            return (
              <div
                key={index}
                className="flex flex-col items-center flex-1"
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300
                    ${isCompleted ? 'bg-indigo-600 text-white' : ''}
                    ${isCurrent ? 'bg-indigo-500 text-white ring-4 ring-indigo-200' : ''}
                    ${isFuture ? 'bg-gray-200 text-gray-500' : ''}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={`
                    text-xs mt-2 text-center hidden sm:block
                    ${isCurrent ? 'text-indigo-600 font-semibold' : 'text-gray-500'}
                  `}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Current Step Text */}
      <div className="text-center mt-4 text-sm text-gray-600">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
};
