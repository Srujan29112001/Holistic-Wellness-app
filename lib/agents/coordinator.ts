/**
 * Coordinator Agent
 *
 * Orchestrates all specialist agents (Nutrition, Mental Health, Spiritual)
 * to provide holistic wellness recommendations.
 *
 * Responsibilities:
 * - Analyze user requests
 * - Determine which agents to invoke
 * - Coordinate agent execution (parallel or sequential)
 * - Synthesize results into coherent recommendations
 */

import type {
  Agent,
  AgentContext,
  AgentResponse,
  AgentRole,
  CoordinatorRequest,
  CoordinatorResponse,
  WellnessRecommendation,
} from "@/types/agents/base";
import type {
  A2AAgentCard,
  A2AMessage,
  A2AContext,
} from "@/types/protocols/a2a";
import type { MCPTool, MCPToolCall, MCPToolResult } from "@/types/protocols/mcp";

import { callClaude, CLAUDE_MODELS } from "@/lib/utils/anthropic-client";
import { getA2AHandler, createConversationContext } from "@/lib/protocols/a2a-handler";
import { A2AMessageBuilder } from "@/types/protocols/a2a";

export class CoordinatorAgent implements Agent {
  id: string = "coordinator-1";
  role: AgentRole = "coordinator";
  name: string = "Wellness Coordinator";
  description: string = "Orchestrates holistic wellness recommendations across nutrition, mental health, and spiritual domains";

  private agentRegistry: Map<AgentRole, Agent> = new Map();

  /**
   * Register a specialist agent
   */
  registerAgent(agent: Agent): void {
    this.agentRegistry.set(agent.role, agent);
    console.log(`[Coordinator] Registered agent: ${agent.name}`);
  }

  /**
   * Get agent card for A2A discovery
   */
  getAgentCard(): A2AAgentCard {
    return {
      id: this.id,
      role: this.role,
      name: this.name,
      version: "1.0.0",
      description: this.description,
      capabilities: [
        {
          name: "coordinate-wellness-plan",
          description: "Generate holistic wellness plans integrating multiple domains",
          inputSchema: {
            type: "object",
            properties: {
              request: { type: "string" },
              userId: { type: "string" },
            },
            required: ["request", "userId"],
          },
          outputSchema: {
            type: "object",
            properties: {
              plan: { type: "object" },
              synthesis: { type: "string" },
            },
          },
        },
      ],
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          context: { type: "object" },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          recommendation: { type: "object" },
        },
      },
      metadata: {
        model: CLAUDE_MODELS.SONNET,
        domains: ["nutrition", "mental-health", "spiritual", "scheduling"],
        tags: ["orchestration", "synthesis", "holistic"],
      },
      status: "active",
    };
  }

  /**
   * Get available MCP tools (coordinator doesn't use tools directly)
   */
  getTools(): MCPTool[] {
    return [];
  }

  /**
   * Main coordination logic
   */
  async process(
    request: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Analyze request to determine required agents
      const requiredAgents = await this.determineRequiredAgents(request, context);

      console.log(`[Coordinator] Required agents: ${requiredAgents.join(", ")}`);

      // Step 2: Create A2A conversation
      const a2aContext = createConversationContext(
        context.userId,
        context.sessionId
      );

      // Step 3: Delegate to specialist agents (parallel execution)
      const agentResponses = await this.delegateToAgents(
        request,
        requiredAgents,
        context,
        a2aContext
      );

      // Step 4: Synthesize results
      const synthesis = await this.synthesizeResults(
        request,
        agentResponses,
        context
      );

      // Step 5: Build final recommendation
      const recommendation = this.buildRecommendation(
        agentResponses,
        synthesis
      );

      const executionTime = Date.now() - startTime;

      return {
        agentId: this.id,
        agentRole: this.role,
        status: "complete",
        content: synthesis,
        data: {
          recommendation,
          agentResponses: Object.fromEntries(agentResponses),
          executionTime,
        },
        confidence: 0.9,
        metadata: {
          executionTime,
          agentsUsed: requiredAgents,
        },
      };
    } catch (error: any) {
      console.error("[Coordinator Error]", error);
      return {
        agentId: this.id,
        agentRole: this.role,
        status: "error",
        content: "Failed to generate wellness plan",
        errors: [
          {
            code: "COORDINATION_ERROR",
            message: error.message,
            recoverable: true,
          },
        ],
      };
    }
  }

  /**
   * Determine which agents are needed for this request
   */
  private async determineRequiredAgents(
    request: string,
    context: AgentContext
  ): Promise<AgentRole[]> {
    const systemPrompt = `You are an intelligent coordinator for a holistic wellness application.
Analyze user requests and determine which wellness domains are relevant.

Available domains:
- nutrition: Meal planning, diet, recipes, calories, macros
- mental-health: Mood tracking, meditation, stress management, mindfulness
- spiritual: Astrology, Ayurveda, spiritual practices, horoscopes
- scheduler: Daily schedule optimization, time management

Return a JSON array of required domains. Examples:
- "Plan my day" → ["nutrition", "mental-health", "spiritual", "scheduler"]
- "What should I eat for dinner?" → ["nutrition"]
- "I'm feeling stressed" → ["mental-health"]
- "Give me my horoscope" → ["spiritual"]`;

    try {
      const response = await callClaude(
        `User request: "${request}"

User context: ${context.userProfile?.health.goals.join(", ") || "general wellness"}

Return only a JSON array of required domain strings.`,
        {
          model: CLAUDE_MODELS.HAIKU, // Use cheaper model for this
          temperature: 0.3,
          maxTokens: 200,
          systemPrompt,
        }
      );

      // Parse response as JSON array
      const domains = JSON.parse(response.content.trim());
      return domains as AgentRole[];
    } catch (error) {
      console.error("[Agent Determination Error]", error);
      // Default to all agents if parsing fails
      return ["nutrition", "mental-health", "spiritual"];
    }
  }

  /**
   * Delegate request to multiple agents in parallel
   */
  private async delegateToAgents(
    request: string,
    requiredAgents: AgentRole[],
    context: AgentContext,
    a2aContext: A2AContext
  ): Promise<Map<AgentRole, AgentResponse>> {
    const promises = requiredAgents.map(async (role) => {
      const agent = this.agentRegistry.get(role);
      if (!agent) {
        console.warn(`[Coordinator] Agent not found: ${role}`);
        return null;
      }

      try {
        // Create A2A message
        const message = new A2AMessageBuilder({
          agentId: this.id,
          role: this.role,
        })
          .to({ role })
          .request(request)
          .withContext(a2aContext)
          .withPriority("normal")
          .expectsResponse(true)
          .build();

        // Process via agent
        const response = await agent.process(request, context);

        return { role, response };
      } catch (error: any) {
        console.error(`[Coordinator] Error from ${role} agent:`, error);
        return {
          role,
          response: {
            agentId: agent.id,
            agentRole: role,
            status: "error",
            content: `Error from ${role} agent: ${error.message}`,
            errors: [{ code: "AGENT_ERROR", message: error.message, recoverable: true }],
          } as AgentResponse,
        };
      }
    });

    const results = await Promise.all(promises);

    const responseMap = new Map<AgentRole, AgentResponse>();
    results.forEach((result) => {
      if (result) {
        responseMap.set(result.role, result.response);
      }
    });

    return responseMap;
  }

  /**
   * Synthesize results from multiple agents into coherent narrative
   */
  async synthesizeResults(
    request: string,
    agentResponses: Map<AgentRole, AgentResponse>,
    context: AgentContext
  ): Promise<string> {
    const systemPrompt = `You are a holistic wellness coordinator synthesizing recommendations from multiple specialist AI agents.

Your role:
1. Integrate recommendations from nutrition, mental health, and spiritual domains
2. Ensure recommendations are coherent and complementary
3. Prioritize based on user goals and current needs
4. Provide a warm, supportive tone
5. Always include disclaimers that this is not medical advice

Format your response as a friendly wellness plan summary.`;

    // Build context from agent responses
    let agentOutputs = "";
    agentResponses.forEach((response, role) => {
      agentOutputs += `\n## ${role.toUpperCase()} Agent:\n${response.content}\n`;
    });

    const userContext = context.userProfile
      ? `User goals: ${context.userProfile.health.goals.join(", ")}\n` +
        `Dietary: ${context.userProfile.dietary.dietType || "flexible"}\n` +
        `Fitness level: ${context.userProfile.health.fitnessLevel}`
      : "General wellness";

    try {
      const response = await callClaude(
        `User Request: "${request}"

User Context:
${userContext}

Agent Recommendations:
${agentOutputs}

Synthesize these into a holistic wellness plan for the user. Be encouraging and supportive.`,
        {
          model: CLAUDE_MODELS.SONNET,
          temperature: 0.7,
          maxTokens: 2048,
          systemPrompt,
        }
      );

      return response.content;
    } catch (error: any) {
      console.error("[Synthesis Error]", error);
      return "I've gathered recommendations from our wellness experts, but encountered an issue synthesizing them. Please try again.";
    }
  }

  /**
   * Build structured wellness recommendation from agent responses
   */
  private buildRecommendation(
    agentResponses: Map<AgentRole, AgentResponse>,
    synthesis: string
  ): WellnessRecommendation {
    const recommendation: WellnessRecommendation = {
      summary: synthesis,
      actionItems: [],
    };

    // Extract nutrition plan
    const nutritionResponse = agentResponses.get("nutrition");
    if (nutritionResponse?.data?.mealPlan) {
      recommendation.nutrition = nutritionResponse.data.mealPlan;
    }

    // Extract mental health plan
    const mentalResponse = agentResponses.get("mental-health");
    if (mentalResponse?.data?.mentalPlan) {
      recommendation.mentalHealth = mentalResponse.data.mentalPlan;
    }

    // Extract spiritual guidance
    const spiritualResponse = agentResponses.get("spiritual");
    if (spiritualResponse?.data?.guidance) {
      recommendation.spiritual = spiritualResponse.data.guidance;
    }

    // Extract schedule
    const schedulerResponse = agentResponses.get("scheduler");
    if (schedulerResponse?.data?.schedule) {
      recommendation.schedule = schedulerResponse.data.schedule;
    }

    // Generate action items from all responses
    agentResponses.forEach((response, role) => {
      if (response.data?.actionItems) {
        recommendation.actionItems.push(...response.data.actionItems);
      }
    });

    return recommendation;
  }

  /**
   * Handle A2A messages
   */
  async handleA2AMessage(
    message: A2AMessage,
    context: AgentContext
  ): Promise<AgentResponse> {
    if (message.type === "request" && message.content.type === "request") {
      return this.process(message.content.task, context);
    }

    return {
      agentId: this.id,
      agentRole: this.role,
      status: "error",
      content: "Unsupported message type",
      errors: [
        {
          code: "UNSUPPORTED_MESSAGE",
          message: `Message type ${message.type} not supported`,
          recoverable: false,
        },
      ],
    };
  }

  /**
   * Execute tool (coordinator doesn't use tools)
   */
  async executeTool(
    toolCall: MCPToolCall,
    context: AgentContext
  ): Promise<MCPToolResult> {
    return {
      id: toolCall.id,
      tool: toolCall.tool,
      status: "error",
      error: {
        code: "NOT_SUPPORTED",
        message: "Coordinator agent does not use tools directly",
      },
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const coordinatorAgent = new CoordinatorAgent();
