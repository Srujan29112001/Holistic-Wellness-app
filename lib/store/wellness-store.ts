/**
 * Wellness Store (Zustand)
 *
 * Global state management for the Holistic Wellness app.
 * Handles:
 * - User profile and auth state
 * - Onboarding progress
 * - Current wellness plan
 * - Mood tracking
 * - UI state (loading, errors)
 *
 * Using Zustand for lightweight, performant state management.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ==================== Types ====================

export interface UserProfile {
  // Basic
  age?: number;
  sex?: 'male' | 'female';
  height?: number;  // cm
  weight?: number;  // kg

  // Nutrition
  calorieTarget?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
  dietaryRestrictions?: string[];
  dietaryPreferences?: string[];
  allergies?: string[];
  mealsPerDay?: number;
  dietType?: string;

  // Fitness
  activityLevel?: string;
  fitnessGoals?: string[];

  // Mental Health
  personalityTraits?: any;
  stressors?: string[];
  copingStrategies?: string[];
  mentalHealthGoals?: string[];
  therapeuticPreferences?: string[];
  currentStressLevel?: number;
  sleepQuality?: number;

  // Spiritual
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  sunSign?: string;
  moonSign?: string;
  dosha?: string;
  spiritualInterests?: string[];
  spiritualPractices?: string[];
  beliefSystem?: string;

  // Location
  location?: {
    lat: number;
    lon: number;
  };

  // Meta
  onboardingCompleted?: boolean;
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  data: Partial<UserProfile>;
}

export interface WellnessPlan {
  date: string;
  mealPlan?: any;
  mentalWellness?: any;
  spiritualGuidance?: any;
  schedule?: any;
  summary?: string;
}

export interface MoodEntry {
  date: string;
  moodRating: number;
  stressLevel: number;
  energyLevel: number;
  sleepQuality?: number;
  notes?: string;
  tags?: string[];
}

// ==================== Store State ====================

interface WellnessState {
  // Auth & Profile
  user: any | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;

  // Onboarding
  onboarding: OnboardingState;

  // Wellness Plan
  currentPlan: WellnessPlan | null;
  planLoading: boolean;
  planError: string | null;

  // Mood
  recentMoods: MoodEntry[];
  moodTrends: any | null;

  // UI State
  loading: boolean;
  error: string | null;

  // Actions
  setUser: (user: any) => void;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;

  // Onboarding Actions
  setOnboardingStep: (step: number) => void;
  updateOnboardingData: (data: Partial<UserProfile>) => void;
  completeOnboardingStep: (step: number) => void;
  resetOnboarding: () => void;

  // Plan Actions
  setCurrentPlan: (plan: WellnessPlan) => void;
  setPlanLoading: (loading: boolean) => void;
  setPlanError: (error: string | null) => void;
  clearCurrentPlan: () => void;

  // Mood Actions
  addMoodEntry: (mood: MoodEntry) => void;
  setRecentMoods: (moods: MoodEntry[]) => void;
  setMoodTrends: (trends: any) => void;

  // General Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ==================== Initial State ====================

const initialOnboardingState: OnboardingState = {
  currentStep: 1,
  totalSteps: 7,
  completedSteps: [],
  data: {},
};

// ==================== Store ====================

export const useWellnessStore = create<WellnessState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      profile: null,
      isAuthenticated: false,

      onboarding: initialOnboardingState,

      currentPlan: null,
      planLoading: false,
      planError: null,

      recentMoods: [],
      moodTrends: null,

      loading: false,
      error: null,

      // Auth & Profile Actions
      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),

      setProfile: (profile) =>
        set({ profile }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates }
            : updates as UserProfile,
        })),

      // Onboarding Actions
      setOnboardingStep: (step) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            currentStep: step,
          },
        })),

      updateOnboardingData: (data) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            data: {
              ...state.onboarding.data,
              ...data,
            },
          },
        })),

      completeOnboardingStep: (step) =>
        set((state) => {
          const completedSteps = [...state.onboarding.completedSteps];
          if (!completedSteps.includes(step)) {
            completedSteps.push(step);
          }
          return {
            onboarding: {
              ...state.onboarding,
              completedSteps,
            },
          };
        }),

      resetOnboarding: () =>
        set({ onboarding: initialOnboardingState }),

      // Plan Actions
      setCurrentPlan: (plan) =>
        set({ currentPlan: plan, planError: null }),

      setPlanLoading: (loading) =>
        set({ planLoading: loading }),

      setPlanError: (error) =>
        set({ planError: error, planLoading: false }),

      clearCurrentPlan: () =>
        set({ currentPlan: null, planError: null }),

      // Mood Actions
      addMoodEntry: (mood) =>
        set((state) => ({
          recentMoods: [mood, ...state.recentMoods].slice(0, 30),  // Keep last 30
        })),

      setRecentMoods: (moods) =>
        set({ recentMoods: moods }),

      setMoodTrends: (trends) =>
        set({ moodTrends: trends }),

      // General Actions
      setLoading: (loading) =>
        set({ loading }),

      setError: (error) =>
        set({ error }),

      reset: () =>
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          onboarding: initialOnboardingState,
          currentPlan: null,
          planLoading: false,
          planError: null,
          recentMoods: [],
          moodTrends: null,
          loading: false,
          error: null,
        }),
    }),
    {
      name: 'wellness-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain fields
      partialize: (state) => ({
        profile: state.profile,
        onboarding: state.onboarding,
        recentMoods: state.recentMoods,
      }),
    }
  )
);

// ==================== Selectors ====================

// Convenience selectors for common queries
export const useUser = () => useWellnessStore((state) => state.user);
export const useProfile = () => useWellnessStore((state) => state.profile);
export const useIsAuthenticated = () => useWellnessStore((state) => state.isAuthenticated);
export const useOnboarding = () => useWellnessStore((state) => state.onboarding);
export const useCurrentPlan = () => useWellnessStore((state) => state.currentPlan);
export const usePlanLoading = () => useWellnessStore((state) => state.planLoading);
export const useRecentMoods = () => useWellnessStore((state) => state.recentMoods);

// ==================== Hooks ====================

/**
 * Hook to fetch and cache user profile
 */
export const useFetchProfile = () => {
  const { setProfile, setLoading, setError } = useWellnessStore();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return fetchProfile;
};

/**
 * Hook to fetch wellness plan
 */
export const useFetchPlan = () => {
  const { setCurrentPlan, setPlanLoading, setPlanError } = useWellnessStore();

  const fetchPlan = async (date?: string) => {
    setPlanLoading(true);
    try {
      const url = date ? `/api/wellness/plan?date=${date}` : '/api/wellness/plan';
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.plan) {
        setCurrentPlan(data.plan);
      } else {
        setPlanError(data.error || 'Failed to fetch plan');
      }
    } catch (error: any) {
      console.error('Error fetching plan:', error);
      setPlanError(error.message);
    } finally {
      setPlanLoading(false);
    }
  };

  return fetchPlan;
};

/**
 * Hook to generate new wellness plan
 */
export const useGeneratePlan = () => {
  const { setCurrentPlan, setPlanLoading, setPlanError } = useWellnessStore();

  const generatePlan = async (options?: {
    date?: string;
    focus?: 'nutrition' | 'mental' | 'spiritual' | 'all';
  }) => {
    setPlanLoading(true);
    try {
      const response = await fetch('/api/wellness/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      });

      const data = await response.json();

      if (data.success && data.plan) {
        setCurrentPlan(data.plan);
      } else {
        setPlanError(data.error || 'Failed to generate plan');
      }
    } catch (error: any) {
      console.error('Error generating plan:', error);
      setPlanError(error.message);
    } finally {
      setPlanLoading(false);
    }
  };

  return generatePlan;
};

/**
 * Hook to log mood entry
 */
export const useLogMood = () => {
  const { addMoodEntry, setError } = useWellnessStore();

  const logMood = async (moodData: Partial<MoodEntry>) => {
    try {
      const response = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moodData),
      });

      const data = await response.json();

      if (data.success && data.entry) {
        addMoodEntry({
          date: data.entry.date,
          moodRating: data.entry.mood_rating,
          stressLevel: data.entry.stress_level,
          energyLevel: data.entry.energy_level,
          sleepQuality: data.entry.sleep_quality,
          notes: data.entry.notes,
          tags: data.entry.tags,
        });
        return data;
      } else {
        throw new Error(data.error || 'Failed to log mood');
      }
    } catch (error: any) {
      console.error('Error logging mood:', error);
      setError(error.message);
      throw error;
    }
  };

  return logMood;
};

/**
 * Hook to fetch mood history
 */
export const useFetchMoods = () => {
  const { setRecentMoods, setMoodTrends, setError } = useWellnessStore();

  const fetchMoods = async (days: number = 30, includeTrends: boolean = true) => {
    try {
      const url = `/api/mood?days=${days}&trends=${includeTrends}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        if (data.moods) {
          const moods: MoodEntry[] = data.moods.map((m: any) => ({
            date: m.date,
            moodRating: m.mood_rating,
            stressLevel: m.stress_level,
            energyLevel: m.energy_level,
            sleepQuality: m.sleep_quality,
            notes: m.notes,
            tags: m.tags,
          }));
          setRecentMoods(moods);
        }

        if (data.trends) {
          setMoodTrends(data.trends);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch moods');
      }
    } catch (error: any) {
      console.error('Error fetching moods:', error);
      setError(error.message);
    }
  };

  return fetchMoods;
};
