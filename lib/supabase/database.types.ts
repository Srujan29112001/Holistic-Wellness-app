/**
 * Supabase Database Types
 *
 * Auto-generated types for database schema.
 * These types align with the actual Supabase database structure.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          // Demographics
          age: number | null;
          gender: string | null;
          height: number | null; // cm
          weight: number | null; // kg
          // Dietary preferences
          dietary_restrictions: string[] | null;
          dietary_preferences: string[] | null;
          allergies: string[] | null;
          cuisine_preferences: string[] | null;
          diet_type: string | null;
          // Health info
          health_conditions: string[] | null;
          medications: string[] | null;
          fitness_level: string | null;
          health_goals: string[] | null;
          // Mental health
          personality_scores: Json | null;
          // Spiritual
          birth_date: string | null;
          birth_time: string | null;
          birth_place: Json | null;
          spiritual_interests: string[] | null;
          dosha_type: string | null;
          // Schedule
          wake_time: string | null;
          sleep_time: string | null;
          work_hours: Json | null;
          schedule_preferences: Json | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_profiles"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
      };
      mood_entries: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          date: string;
          mood: number; // 1-5
          energy: number; // 1-5
          stress: number; // 1-5
          sleep_hours: number | null;
          notes: string | null;
          tags: string[] | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["mood_entries"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["mood_entries"]["Insert"]>;
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          date: string;
          plan_data: Json; // Full meal plan object
          total_calories: number;
          macros: Json;
          status: "pending" | "active" | "completed";
          adherence_score: number | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["meal_plans"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["meal_plans"]["Insert"]>;
      };
      meal_logs: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          date: string;
          meal_type: "breakfast" | "lunch" | "dinner" | "snack";
          foods: Json;
          total_calories: number;
          macros: Json;
          rating: number | null; // 1-5
          notes: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["meal_logs"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["meal_logs"]["Insert"]>;
      };
      wellness_plans: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          date: string;
          plan_type: "daily" | "weekly" | "custom";
          plan_data: Json; // Full wellness plan
          status: "draft" | "active" | "completed";
          completion_rate: number | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["wellness_plans"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["wellness_plans"]["Insert"]>;
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          date: string;
          category: "nutrition" | "mental" | "spiritual" | "physical" | "work";
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          duration: number; // minutes
          completed: boolean;
          rating: number | null;
          notes: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["activities"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["activities"]["Insert"]>;
      };
      meditation_sessions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          date: string;
          duration: number; // minutes
          type: "guided" | "silent" | "mantra";
          focus: string | null;
          rating: number | null;
          notes: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["meditation_sessions"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["meditation_sessions"]["Insert"]>;
      };
      agent_sessions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          session_id: string;
          agent_role: string;
          request: string;
          response: Json;
          execution_time: number | null; // ms
          tokens_used: number | null;
          cost: number | null;
          status: "success" | "error" | "timeout";
          error_message: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["agent_sessions"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["agent_sessions"]["Insert"]>;
      };
      api_cache: {
        Row: {
          id: string;
          cache_key: string;
          data: Json;
          created_at: string;
          expires_at: string;
          hit_count: number;
        };
        Insert: Omit<
          Database["public"]["Tables"]["api_cache"]["Row"],
          "id" | "created_at" | "hit_count"
        >;
        Update: Partial<Database["public"]["Tables"]["api_cache"]["Insert"]>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
