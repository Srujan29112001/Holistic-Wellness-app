/**
 * Step 5: Daily Routine
 *
 * Collects wake/sleep times, work schedule, meal times, and energy patterns
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, CheckboxGroup } from '@/components/ui';
import {
  dailyRoutineSchema,
  type DailyRoutineData,
} from '@/lib/validation/onboarding-schemas';

interface Step5Props {
  data: Partial<DailyRoutineData>;
  onNext: (data: DailyRoutineData) => void;
  onBack: () => void;
}

const PEAK_ENERGY_HOURS = [
  { value: 'early-morning', label: 'Early Morning (5-8 AM)' },
  { value: 'morning', label: 'Morning (8-11 AM)' },
  { value: 'midday', label: 'Midday (11 AM-2 PM)' },
  { value: 'afternoon', label: 'Afternoon (2-5 PM)' },
  { value: 'evening', label: 'Evening (5-8 PM)' },
  { value: 'night', label: 'Night (8 PM-12 AM)' },
];

const STRESSFUL_TIMES = [
  { value: 'morning-rush', label: 'Morning Rush Hour' },
  { value: 'work-start', label: 'Start of Work' },
  { value: 'midday', label: 'Midday/Lunch' },
  { value: 'work-end', label: 'End of Work' },
  { value: 'evening-commute', label: 'Evening Commute' },
  { value: 'bedtime', label: 'Bedtime' },
];

export const Step5DailyRoutine: React.FC<Step5Props> = ({ data, onNext, onBack }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DailyRoutineData>({
    resolver: zodResolver(dailyRoutineSchema),
    defaultValues: data,
  });

  const [energyPeakHours, setEnergyPeakHours] = useState<string[]>(data.energyPeakHours || []);
  const [stressfulTimes, setStressfulTimes] = useState<string[]>(data.stressfulTimes || []);

  const workSchedule = watch('workSchedule');
  const showWorkTimes = workSchedule === 'regular' || workSchedule === 'shift';

  const handleEnergyPeakHoursChange = (values: string[]) => {
    setEnergyPeakHours(values);
    setValue('energyPeakHours', values, { shouldValidate: true });
  };

  const handleStressfulTimesChange = (values: string[]) => {
    setStressfulTimes(values);
    setValue('stressfulTimes', values);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Daily Routine
        </h2>
        <p className="text-gray-600">
          Help us optimize your wellness plan around your schedule
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wake Time */}
        <Controller
          name="wakeTime"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="time"
              label="Wake Time"
              error={errors.wakeTime?.message}
              required
              fullWidth
            />
          )}
        />

        {/* Sleep Time */}
        <Controller
          name="sleepTime"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="time"
              label="Sleep Time"
              error={errors.sleepTime?.message}
              required
              fullWidth
            />
          )}
        />
      </div>

      {/* Work Schedule */}
      <Controller
        name="workSchedule"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            label="Work Schedule"
            options={[
              { value: 'regular', label: 'Regular (9-5 or similar)' },
              { value: 'shift', label: 'Shift Work' },
              { value: 'flexible', label: 'Flexible/Remote' },
              { value: 'none', label: 'Not Currently Working' },
            ]}
            error={errors.workSchedule?.message}
            required
            fullWidth
          />
        )}
      />

      {/* Work Times (conditional) */}
      {showWorkTimes && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="workStartTime"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="time"
                label="Work Start Time"
                error={errors.workStartTime?.message}
                required
                fullWidth
              />
            )}
          />

          <Controller
            name="workEndTime"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="time"
                label="Work End Time"
                error={errors.workEndTime?.message}
                required
                fullWidth
              />
            )}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Meal Times */}
        <Controller
          name="preferredBreakfastTime"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="time"
              label="Breakfast Time"
              error={errors.preferredBreakfastTime?.message}
              required
              fullWidth
            />
          )}
        />

        <Controller
          name="preferredLunchTime"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="time"
              label="Lunch Time"
              error={errors.preferredLunchTime?.message}
              required
              fullWidth
            />
          )}
        />

        <Controller
          name="preferredDinnerTime"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="time"
              label="Dinner Time"
              error={errors.preferredDinnerTime?.message}
              required
              fullWidth
            />
          )}
        />
      </div>

      {/* Energy Peak Hours */}
      <CheckboxGroup
        label="When do you have the most energy? (select at least one)"
        options={PEAK_ENERGY_HOURS}
        value={energyPeakHours}
        onChange={handleEnergyPeakHoursChange}
        error={errors.energyPeakHours?.message}
        required
        columns={2}
      />

      {/* Stressful Times */}
      <CheckboxGroup
        label="When are you typically most stressed? (optional)"
        options={STRESSFUL_TIMES}
        value={stressfulTimes}
        onChange={handleStressfulTimesChange}
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
