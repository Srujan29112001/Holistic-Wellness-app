/**
 * User Store
 *
 * Global state management for user profile and authentication
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  id: string;
  user_id: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  dietary_restrictions?: string[];
  dietary_preferences?: string[];
  allergies?: string[];
  cuisine_preferences?: string[];
  diet_type?: string;
  health_conditions?: string[];
  medications?: string[];
  fitness_level?: string;
  health_goals?: string[];
  personality_scores?: Record<string, number>;
  birth_date?: string;
  birth_time?: string;
  birth_place?: { latitude: number; longitude: number; timezone: string };
  spiritual_interests?: string[];
  dosha_type?: string;
  wake_time?: string;
  sleep_time?: string;
  work_hours?: { start: string; end: string };
  schedule_preferences?: Record<string, any>;
  targetCalories?: number;
}

interface UserState {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  setUser: (user: any) => void;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),

      setProfile: (profile) => set({ profile }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null
        })),

      clearUser: () => set({ user: null, profile: null, error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error })
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        // Only persist user and profile, not loading/error states
        user: state.user,
        profile: state.profile
      })
    }
  )
);
