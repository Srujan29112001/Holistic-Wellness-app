/**
 * Base Agent Types for Multi-Agent Architecture
 *
 * Defines the core interfaces for all AI agents in the system.
 * All agents implement these base types and extend with domain-specific capabilities.
 */

import { MCPTool, MCPToolCall, MCPToolResult } from "../protocols/mcp";
import { A2AMessage, A2AAgentCard } from "../protocols/a2a";

/**
 * Agent role types in the system
 */
export type AgentRole =
  | "coordinator"
  | "nutrition"
  | "mental-health"
  | "spiritual"
  | "scheduler"
  | "custom";

/**
 * Agent execution status
 */
export type AgentStatus =
  | "idle"
  | "thinking"
  | "tool-use"
  | "communicating"
  | "error"
  | "complete";

/**
 * Agent context - shared information across agent lifecycle
 */
export interface AgentContext {
  userId: string;
  sessionId: string;
  userProfile?: UserProfile;
  conversationHistory?: ConversationMessage[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Conversation message structure
 */
export interface ConversationMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: Date;
  metadata?: {
    agentId?: string;
    toolCalls?: MCPToolCall[];
    toolResults?: MCPToolResult[];
  };
}

/**
 * User profile structure
 */
export interface UserProfile {
  id: string;
  demographics: {
    age: number;
    gender: string;
    height: number; // cm
    weight: number; // kg
  };
  dietary: {
    restrictions: string[];
    preferences: string[];
    allergies: string[];
    cuisines: string[];
    dietType?: "vegan" | "vegetarian" | "pescatarian" | "omnivore" | "keto" | "paleo";
  };
  health: {
    conditions: string[];
    medications: string[];
    fitnessLevel: "sedentary" | "light" | "moderate" | "active" | "very-active";
    goals: string[];
  };
  mental: {
    stressLevel?: number; // 1-10
    sleepHours?: number;
    moodHistory?: MoodEntry[];
    personalityScores?: PersonalityScores;
  };
  spiritual?: {
    birthDate: Date;
    birthTime?: string;
    birthPlace?: string;
    interests: string[];
    doshaType?: "vata" | "pitta" | "kapha";
  };
  schedule: {
    wakeTime: string;
    sleepTime: string;
    workHours?: { start: string; end: string };
    preferences: Record<string, any>;
  };
}

/**
 * Mood tracking entry
 */
export interface MoodEntry {
  date: Date;
  mood: number; // 1-5 scale
  energy: number; // 1-5 scale
  stress: number; // 1-5 scale
  notes?: string;
}

/**
 * IPIP Big Five personality scores
 */
export interface PersonalityScores {
  openness: number; // 0-100
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

/**
 * Agent response structure
 */
export interface AgentResponse<T = any> {
  agentId: string;
  agentRole: AgentRole;
  status: AgentStatus;
  content: string;
  data?: T;
  toolCalls?: MCPToolCall[];
  toolResults?: MCPToolResult[];
  confidence?: number; // 0-1
  reasoning?: string;
  errors?: AgentError[];
  metadata?: Record<string, any>;
}

/**
 * Agent error structure
 */
export interface AgentError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
}

/**
 * Base Agent interface - all agents must implement this
 */
export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  description: string;

  /**
   * Agent card for A2A protocol discovery
   */
  getAgentCard(): A2AAgentCard;

  /**
   * Available MCP tools this agent can use
   */
  getTools(): MCPTool[];

  /**
   * Process a request with context
   */
  process(
    request: string,
    context: AgentContext
  ): Promise<AgentResponse>;

  /**
   * Handle A2A messages from other agents
   */
  handleA2AMessage(
    message: A2AMessage,
    context: AgentContext
  ): Promise<AgentResponse>;

  /**
   * Execute an MCP tool call
   */
  executeTool(
    toolCall: MCPToolCall,
    context: AgentContext
  ): Promise<MCPToolResult>;
}

/**
 * Agent factory configuration
 */
export interface AgentConfig {
  role: AgentRole;
  apiKeys?: Record<string, string>;
  modelConfig?: {
    provider: "anthropic" | "openai" | "custom";
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  toolConfig?: Record<string, any>;
}

/**
 * Coordinator-specific types
 */
export interface CoordinatorRequest {
  query: string;
  context: AgentContext;
  requiresAgents: AgentRole[];
  priority?: "low" | "normal" | "high";
}

export interface CoordinatorResponse {
  synthesis: string;
  agentResponses: Map<AgentRole, AgentResponse>;
  recommendation: WellnessRecommendation;
  metadata: {
    processingTime: number;
    agentsUsed: AgentRole[];
    confidence: number;
  };
}

/**
 * Holistic wellness recommendation
 */
export interface WellnessRecommendation {
  nutrition?: NutritionPlan;
  mentalHealth?: MentalHealthPlan;
  spiritual?: SpiritualGuidance;
  schedule?: DailySchedule;
  summary: string;
  actionItems: ActionItem[];
}

export interface ActionItem {
  category: "nutrition" | "mental" | "spiritual" | "physical";
  action: string;
  time?: string;
  duration?: number; // minutes
  priority: number; // 1-5
  completed?: boolean;
}

export interface NutritionPlan {
  meals: Meal[];
  totalCalories: number;
  macros: MacroNutrients;
  notes: string[];
}

export interface Meal {
  type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  time?: string;
  foods: FoodItem[];
  calories: number;
  macros: MacroNutrients;
  recipe?: string;
}

export interface FoodItem {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroNutrients {
  protein: number; // grams
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface MentalHealthPlan {
  moodCheck: string;
  exercises: MentalExercise[];
  meditations: Meditation[];
  affirmations: string[];
  notes: string[];
}

export interface MentalExercise {
  type: "breathing" | "cbt" | "journaling" | "mindfulness";
  title: string;
  description: string;
  duration: number; // minutes
  instructions: string[];
}

export interface Meditation {
  title: string;
  duration: number;
  type: "guided" | "silent" | "mantra";
  audioUrl?: string;
  transcript?: string;
}

export interface SpiritualGuidance {
  horoscope?: string;
  ayurvedicTips?: string[];
  practices: SpiritualPractice[];
  insights: string[];
}

export interface SpiritualPractice {
  type: "meditation" | "yoga" | "mantra" | "ritual";
  name: string;
  description: string;
  duration?: number;
  time?: string;
  instructions?: string[];
}

export interface DailySchedule {
  date: Date;
  activities: ScheduledActivity[];
  conflicts: string[];
  optimizationScore: number; // 0-100
}

export interface ScheduledActivity {
  id: string;
  category: "nutrition" | "mental" | "spiritual" | "physical" | "work" | "personal";
  title: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  description?: string;
  priority: number;
  flexible: boolean;
}
