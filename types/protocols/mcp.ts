/**
 * Model Context Protocol (MCP) Types
 *
 * Implements the Model Context Protocol standard by Anthropic for
 * standardized AI-to-tool communication.
 *
 * MCP allows AI agents to:
 * - Discover available tools
 * - Call external APIs and services
 * - Access data sources uniformly
 * - Handle tool execution results
 *
 * Reference: https://modelcontextprotocol.io
 */

/**
 * MCP Tool definition - describes a callable tool/API
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: MCPToolInputSchema;
  category?: "nutrition" | "mental-health" | "spiritual" | "utility" | "data";
  metadata?: {
    apiProvider?: string;
    rateLimit?: number;
    cached?: boolean;
    cost?: number;
  };
}

/**
 * JSON Schema for tool input parameters
 */
export interface MCPToolInputSchema {
  type: "object";
  properties: Record<string, MCPSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface MCPSchemaProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description?: string;
  enum?: any[];
  items?: MCPSchemaProperty;
  properties?: Record<string, MCPSchemaProperty>;
  default?: any;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

/**
 * MCP Tool Call - represents a request to execute a tool
 */
export interface MCPToolCall {
  id: string;
  tool: string; // tool name
  parameters: Record<string, any>;
  timestamp: Date;
}

/**
 * MCP Tool Result - response from tool execution
 */
export interface MCPToolResult {
  id: string; // matches MCPToolCall.id
  tool: string;
  status: "success" | "error" | "partial";
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    executionTime?: number; // ms
    cached?: boolean;
    cost?: number;
    apiCalls?: number;
  };
  timestamp: Date;
}

/**
 * MCP Server - represents a tool server providing capabilities
 */
export interface MCPServer {
  id: string;
  name: string;
  description: string;
  version: string;
  protocol: "stdio" | "http" | "https";
  endpoint?: string; // for http/https
  tools: MCPTool[];
  healthCheck(): Promise<boolean>;
  executeTool(call: MCPToolCall): Promise<MCPToolResult>;
}

/**
 * MCP Tool Registry - manages available tools across servers
 */
export interface MCPToolRegistry {
  servers: Map<string, MCPServer>;
  tools: Map<string, MCPTool>;

  registerServer(server: MCPServer): void;
  unregisterServer(serverId: string): void;
  getTool(name: string): MCPTool | undefined;
  listTools(category?: string): MCPTool[];
  executeTool(call: MCPToolCall): Promise<MCPToolResult>;
}

/**
 * Nutrition MCP Tools
 */
export interface NutritionToolParams {
  // USDA Food Search
  usdaFoodSearch: {
    query: string;
    pageSize?: number;
    dataType?: string[];
  };

  // Edamam Recipe Search
  edamamRecipeSearch: {
    query: string;
    diet?: string[];
    health?: string[];
    cuisineType?: string[];
    mealType?: string[];
    calories?: string; // "min-max" format
  };

  // Spoonacular Meal Plan
  spoonacularMealPlan: {
    timeFrame: "day" | "week";
    targetCalories: number;
    diet?: string;
    exclude?: string;
  };

  // Calculate Nutrition
  calculateNutrition: {
    foods: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
}

/**
 * Mental Health MCP Tools
 */
export interface MentalHealthToolParams {
  // IPIP Personality Assessment
  ipipAssessment: {
    responses: number[]; // 1-5 scale responses
    scale: "big5" | "detailed";
  };

  // Mood Analysis
  analyzeMood: {
    journalEntry: string;
    date: Date;
    context?: string;
  };

  // Meditation Library
  getMeditation: {
    duration?: number;
    type?: "guided" | "silent" | "mantra";
    focus?: "stress" | "sleep" | "anxiety" | "general";
  };
}

/**
 * Spiritual MCP Tools
 */
export interface SpiritualToolParams {
  // VedicAstro API
  getHoroscope: {
    sign?: string;
    date: Date;
    type?: "daily" | "weekly" | "monthly";
  };

  getBirthChart: {
    birthDate: Date;
    birthTime: string;
    birthPlace: {
      latitude: number;
      longitude: number;
      timezone: string;
    };
  };

  // Ayurveda
  getAyurvedicGuidance: {
    doshaType: "vata" | "pitta" | "kapha";
    season?: string;
    concern?: string;
  };

  // Panchang (Vedic Calendar)
  getPanchang: {
    date: Date;
    location: {
      latitude: number;
      longitude: number;
    };
  };
}

/**
 * Utility MCP Tools
 */
export interface UtilityToolParams {
  // Weather
  getWeather: {
    location: string;
    date?: Date;
  };

  // Time Zone
  convertTime: {
    time: string;
    fromZone: string;
    toZone: string;
  };
}

/**
 * MCP Tool execution context
 */
export interface MCPExecutionContext {
  userId: string;
  sessionId: string;
  apiKeys: Record<string, string>;
  cache?: MCPCache;
  circuitBreaker?: CircuitBreaker;
}

/**
 * MCP Cache for tool results
 */
export interface MCPCache {
  get(key: string): Promise<MCPToolResult | null>;
  set(key: string, result: MCPToolResult, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
}

/**
 * Circuit breaker for fault tolerance
 */
export interface CircuitBreaker {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailure?: Date;
  execute<T>(fn: () => Promise<T>): Promise<T>;
  reset(): void;
}

/**
 * MCP Tool call builder - helper for constructing tool calls
 */
export class MCPToolCallBuilder {
  private call: Partial<MCPToolCall>;

  constructor(toolName: string) {
    this.call = {
      id: `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tool: toolName,
      timestamp: new Date(),
      parameters: {},
    };
  }

  withParam(key: string, value: any): this {
    this.call.parameters![key] = value;
    return this;
  }

  withParams(params: Record<string, any>): this {
    this.call.parameters = { ...this.call.parameters, ...params };
    return this;
  }

  build(): MCPToolCall {
    if (!this.call.tool) {
      throw new Error("Tool name is required");
    }
    return this.call as MCPToolCall;
  }
}
