/**
 * Onboarding Form Validation Schemas
 *
 * Comprehensive Zod schemas for 7-step onboarding process.
 * Ensures data integrity and provides clear error messages.
 */

import { z } from 'zod';

// ==================== Step 1: Basic Profile ====================

export const basicProfileSchema = z.object({
  age: z.number()
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Please enter a valid age'),

  sex: z.enum(['male', 'female'], {
    required_error: 'Please select your sex',
  }),

  height: z.number()
    .min(100, 'Height must be at least 100 cm')
    .max(250, 'Height must be less than 250 cm'),

  weight: z.number()
    .min(30, 'Weight must be at least 30 kg')
    .max(300, 'Weight must be less than 300 kg'),

  goal: z.enum(['maintain', 'lose', 'gain'], {
    required_error: 'Please select your goal',
  }),
});

export type BasicProfileData = z.infer<typeof basicProfileSchema>;

// ==================== Step 2: Physical Activity ====================

export const physicalActivitySchema = z.object({
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very-active'], {
    required_error: 'Please select your activity level',
  }),

  exerciseFrequency: z.number()
    .min(0, 'Cannot be negative')
    .max(7, 'Cannot exceed 7 days per week'),

  fitnessGoals: z.array(z.string()).min(1, 'Select at least one fitness goal'),

  preferredExercises: z.array(z.string()).optional(),
});

export type PhysicalActivityData = z.infer<typeof physicalActivitySchema>;

// ==================== Step 3: Medical Conditions & Allergies ====================

export const medicalInfoSchema = z.object({
  medicalConditions: z.array(z.string()),

  allergies: z.array(z.string()),

  medications: z.array(z.string()).optional(),

  dietaryRestrictions: z.array(z.string()),

  // Conditional fields
  hasDiabetes: z.boolean().optional(),
  diabetesType: z.enum(['type1', 'type2', 'none']).optional(),

  hasHeartCondition: z.boolean().optional(),

  hasKidneyDisease: z.boolean().optional(),
}).refine(
  data => {
    // If has diabetes, must specify type
    if (data.hasDiabetes && !data.diabetesType) {
      return false;
    }
    return true;
  },
  {
    message: 'Please specify diabetes type',
    path: ['diabetesType'],
  }
);

export type MedicalInfoData = z.infer<typeof medicalInfoSchema>;

// ==================== Step 4: Dietary Preferences ====================

export const dietaryPreferencesSchema = z.object({
  dietType: z.enum([
    'standard',
    'vegetarian',
    'vegan',
    'keto',
    'paleo',
    'mediterranean',
    'pescatarian',
    'whole30',
  ], {
    required_error: 'Please select a diet type',
  }),

  mealsPerDay: z.number()
    .min(2, 'Must have at least 2 meals per day')
    .max(6, 'Maximum 6 meals per day'),

  cuisinePreferences: z.array(z.string())
    .min(1, 'Select at least one cuisine preference'),

  dislikedFoods: z.array(z.string()).optional(),

  cookingSkill: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: 'Please select your cooking skill',
  }),

  maxPrepTime: z.number()
    .min(5, 'Must be at least 5 minutes')
    .max(120, 'Maximum 120 minutes'),

  budgetPerWeek: z.number()
    .min(20, 'Minimum budget $20/week')
    .max(500, 'Maximum budget $500/week')
    .optional(),
});

export type DietaryPreferencesData = z.infer<typeof dietaryPreferencesSchema>;

// ==================== Step 5: Daily Routine Preferences ====================

export const dailyRoutineSchema = z.object({
  wakeTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),

  sleepTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),

  workSchedule: z.enum(['regular', 'shift', 'flexible', 'none'], {
    required_error: 'Please select your work schedule',
  }),

  workStartTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
    .optional(),

  workEndTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
    .optional(),

  preferredBreakfastTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),

  preferredLunchTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),

  preferredDinnerTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),

  energyPeakHours: z.array(z.string())
    .min(1, 'Select at least one peak energy time'),

  stressfulTimes: z.array(z.string()).optional(),
}).refine(
  data => {
    // If work schedule is regular or shift, work times are required
    if ((data.workSchedule === 'regular' || data.workSchedule === 'shift') &&
        (!data.workStartTime || !data.workEndTime)) {
      return false;
    }
    return true;
  },
  {
    message: 'Work times required for regular/shift schedule',
    path: ['workStartTime'],
  }
);

export type DailyRoutineData = z.infer<typeof dailyRoutineSchema>;

// ==================== Step 6: Wellness Goals ====================

export const wellnessGoalsSchema = z.object({
  mentalHealthGoals: z.array(z.string())
    .min(1, 'Select at least one mental health goal'),

  stressLevel: z.number()
    .min(1, 'Please rate your stress level')
    .max(5, 'Rating must be between 1-5'),

  sleepQuality: z.number()
    .min(1, 'Please rate your sleep quality')
    .max(5, 'Rating must be between 1-5'),

  copingStrategies: z.array(z.string()),

  therapeuticPreferences: z.array(z.string())
    .min(1, 'Select at least one therapeutic preference'),

  // Spiritual
  spiritualInterests: z.array(z.string()),

  interestedInAstrology: z.boolean(),

  birthDate: z.string()
    .optional()
    .refine(
      val => !val || !isNaN(Date.parse(val)),
      'Invalid date format'
    ),

  birthTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
    .optional(),

  birthPlace: z.string()
    .min(2, 'Birth place must be at least 2 characters')
    .optional(),

  interestedInAyurveda: z.boolean(),

  beliefSystem: z.enum([
    'vedic',
    'western-astrology',
    'spiritual-general',
    'none',
  ]).optional(),
}).refine(
  data => {
    // If interested in astrology, birth date is required
    if (data.interestedInAstrology && !data.birthDate) {
      return false;
    }
    return true;
  },
  {
    message: 'Birth date required for astrology features',
    path: ['birthDate'],
  }
);

export type WellnessGoalsData = z.infer<typeof wellnessGoalsSchema>;

// ==================== Step 7: Summary & Confirmation ====================

export const confirmationSchema = z.object({
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),

  agreeToPrivacy: z.boolean().refine(val => val === true, {
    message: 'You must agree to the privacy policy',
  }),

  understandNotMedicalAdvice: z.boolean().refine(val => val === true, {
    message: 'You must acknowledge this is not medical advice',
  }),

  emailUpdates: z.boolean().optional(),

  pushNotifications: z.boolean().optional(),
});

export type ConfirmationData = z.infer<typeof confirmationSchema>;

// ==================== Complete Onboarding Schema ====================

export const completeOnboardingSchema = z.object({
  step1: basicProfileSchema,
  step2: physicalActivitySchema,
  step3: medicalInfoSchema,
  step4: dietaryPreferencesSchema,
  step5: dailyRoutineSchema,
  step6: wellnessGoalsSchema,
  step7: confirmationSchema,
});

export type CompleteOnboardingData = z.infer<typeof completeOnboardingSchema>;

// ==================== Option Lists (for dropdowns/checkboxes) ====================

export const FITNESS_GOALS = [
  'Weight Loss',
  'Muscle Gain',
  'Improve Endurance',
  'Increase Flexibility',
  'Better Posture',
  'General Health',
  'Sports Performance',
  'Injury Recovery',
] as const;

export const EXERCISE_TYPES = [
  'Running',
  'Walking',
  'Cycling',
  'Swimming',
  'Weightlifting',
  'Yoga',
  'Pilates',
  'HIIT',
  'Dancing',
  'Sports',
  'Hiking',
] as const;

export const MEDICAL_CONDITIONS = [
  'Diabetes (Type 1)',
  'Diabetes (Type 2)',
  'Heart Disease',
  'High Blood Pressure',
  'High Cholesterol',
  'Kidney Disease',
  'Liver Disease',
  'Thyroid Disorder',
  'PCOS',
  'IBS',
  'Celiac Disease',
  'None',
] as const;

export const DIETARY_RESTRICTIONS = [
  'gluten-free',
  'dairy-free',
  'nut-free',
  'shellfish-free',
  'soy-free',
  'halal',
  'kosher',
  'low-sodium',
  'low-sugar',
  'diabetic-friendly',
] as const;

export const CUISINE_PREFERENCES = [
  'American',
  'Italian',
  'Mexican',
  'Chinese',
  'Indian',
  'Japanese',
  'Thai',
  'Mediterranean',
  'Middle Eastern',
  'French',
  'Korean',
  'Vietnamese',
  'Greek',
] as const;

export const MENTAL_HEALTH_GOALS = [
  'Reduce Stress',
  'Improve Sleep',
  'Manage Anxiety',
  'Boost Mood',
  'Increase Focus',
  'Build Resilience',
  'Better Relationships',
  'Self-Compassion',
] as const;

export const COPING_STRATEGIES = [
  'Deep Breathing',
  'Meditation',
  'Journaling',
  'Exercise',
  'Talking to Friends',
  'Music',
  'Art/Creativity',
  'Nature Walks',
  'Reading',
  'Therapy',
] as const;

export const THERAPEUTIC_PREFERENCES = [
  'meditation',
  'journaling',
  'exercise',
  'social',
] as const;

export const SPIRITUAL_INTERESTS = [
  'astrology',
  'ayurveda',
  'yoga',
  'meditation',
  'mindfulness',
  'energy-work',
  'nature-connection',
] as const;

// ==================== Validation Helpers ====================

/**
 * Validate individual step
 */
export function validateStep(step: number, data: any): { success: boolean; errors?: any } {
  try {
    switch (step) {
      case 1:
        basicProfileSchema.parse(data);
        break;
      case 2:
        physicalActivitySchema.parse(data);
        break;
      case 3:
        medicalInfoSchema.parse(data);
        break;
      case 4:
        dietaryPreferencesSchema.parse(data);
        break;
      case 5:
        dailyRoutineSchema.parse(data);
        break;
      case 6:
        wellnessGoalsSchema.parse(data);
        break;
      case 7:
        confirmationSchema.parse(data);
        break;
      default:
        throw new Error('Invalid step number');
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, errors: error.errors };
  }
}

/**
 * Calculate form completion percentage
 */
export function calculateCompletion(data: Partial<CompleteOnboardingData>): number {
  const steps = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7'];
  const completed = steps.filter(step => {
    const stepData = (data as any)[step];
    if (!stepData) return false;

    try {
      switch (step) {
        case 'step1': basicProfileSchema.parse(stepData); break;
        case 'step2': physicalActivitySchema.parse(stepData); break;
        case 'step3': medicalInfoSchema.parse(stepData); break;
        case 'step4': dietaryPreferencesSchema.parse(stepData); break;
        case 'step5': dailyRoutineSchema.parse(stepData); break;
        case 'step6': wellnessGoalsSchema.parse(stepData); break;
        case 'step7': confirmationSchema.parse(stepData); break;
      }
      return true;
    } catch {
      return false;
    }
  });

  return Math.round((completed.length / steps.length) * 100);
}
