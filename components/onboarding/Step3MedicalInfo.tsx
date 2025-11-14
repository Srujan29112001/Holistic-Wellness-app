/**
 * Step 3: Medical Info
 *
 * Collects medical conditions, allergies, medications, and dietary restrictions
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, CheckboxGroup } from '@/components/ui';
import {
  medicalInfoSchema,
  type MedicalInfoData,
  MEDICAL_CONDITIONS,
  DIETARY_RESTRICTIONS,
} from '@/lib/validation/onboarding-schemas';

interface Step3Props {
  data: Partial<MedicalInfoData>;
  onNext: (data: MedicalInfoData) => void;
  onBack: () => void;
}

const COMMON_ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Milk/Dairy',
  'Eggs',
  'Wheat/Gluten',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
  'None',
];

export const Step3MedicalInfo: React.FC<Step3Props> = ({ data, onNext, onBack }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MedicalInfoData>({
    resolver: zodResolver(medicalInfoSchema),
    defaultValues: data,
  });

  const [medicalConditions, setMedicalConditions] = useState<string[]>(data.medicalConditions || []);
  const [allergies, setAllergies] = useState<string[]>(data.allergies || []);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(data.dietaryRestrictions || []);

  const hasDiabetes = watch('hasDiabetes');

  const handleMedicalConditionsChange = (values: string[]) => {
    setMedicalConditions(values);
    setValue('medicalConditions', values);

    // Auto-set diabetes flag
    const hasDiabetesCondition = values.some(v => v.includes('Diabetes'));
    setValue('hasDiabetes', hasDiabetesCondition);
  };

  const handleAllergiesChange = (values: string[]) => {
    setAllergies(values);
    setValue('allergies', values);
  };

  const handleDietaryRestrictionsChange = (values: string[]) => {
    setDietaryRestrictions(values);
    setValue('dietaryRestrictions', values);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Medical Information
        </h2>
        <p className="text-gray-600">
          This helps us create safe and appropriate recommendations
        </p>
        <p className="text-sm text-gray-500 mt-2">
          All information is kept confidential and secure
        </p>
      </div>

      {/* Medical Conditions */}
      <CheckboxGroup
        label="Medical Conditions (select all that apply)"
        options={MEDICAL_CONDITIONS.map(condition => ({ value: condition, label: condition }))}
        value={medicalConditions}
        onChange={handleMedicalConditionsChange}
        columns={2}
      />

      {/* Diabetes Type (conditional) */}
      {hasDiabetes && (
        <Controller
          name="diabetesType"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Diabetes Type"
              options={[
                { value: 'type1', label: 'Type 1 Diabetes' },
                { value: 'type2', label: 'Type 2 Diabetes' },
              ]}
              error={errors.diabetesType?.message}
              required
              fullWidth
            />
          )}
        />
      )}

      {/* Allergies */}
      <CheckboxGroup
        label="Food Allergies (select all that apply)"
        options={COMMON_ALLERGIES.map(allergy => ({ value: allergy, label: allergy }))}
        value={allergies}
        onChange={handleAllergiesChange}
        columns={2}
      />

      {/* Dietary Restrictions */}
      <CheckboxGroup
        label="Dietary Restrictions (select all that apply)"
        options={DIETARY_RESTRICTIONS.map(restriction => ({
          value: restriction,
          label: restriction.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        }))}
        value={dietaryRestrictions}
        onChange={handleDietaryRestrictionsChange}
        columns={2}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              <strong>Disclaimer:</strong> This app provides wellness guidance and is not a substitute for professional medical advice. Always consult with healthcare providers for medical conditions.
            </p>
          </div>
        </div>
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
