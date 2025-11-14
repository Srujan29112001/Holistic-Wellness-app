/**
 * Wellness Store
 *
 * Global state management for wellness plans and recommendations
 */

import { create } from 'zustand';

interface WellnessPlan {
  id?: string;
  date: string;
  nutrition?: any;
  mentalHealth?: any;
  spiritual?: any;
  schedule?: any;
  summary?: string;
  status?: 'draft' | 'active' | 'completed';
}

interface WellnessState {
  currentPlan: WellnessPlan | null;
  isGenerating: boolean;
  error: string | null;

  setCurrentPlan: (plan: WellnessPlan) => void;
  updatePlanSection: (section: keyof WellnessPlan, data: any) => void;
  clearPlan: () => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWellnessStore = create<WellnessState>((set) => ({
  currentPlan: null,
  isGenerating: false,
  error: null,

  setCurrentPlan: (plan) => set({ currentPlan: plan }),

  updatePlanSection: (section, data) =>
    set((state) => ({
      currentPlan: state.currentPlan
        ? { ...state.currentPlan, [section]: data }
        : null
    })),

  clearPlan: () => set({ currentPlan: null, error: null }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setError: (error) => set({ error })
}));
