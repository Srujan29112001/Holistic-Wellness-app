/**
 * Agent-to-Agent (A2A) Protocol Types
 *
 * Implements the A2A protocol standard for multi-agent communication.
 * Enables agents to discover, communicate, and collaborate with each other.
 *
 * A2A Protocol allows:
 * - Agent discovery via Agent Cards
 * - Structured inter-agent messaging
 * - Task delegation and coordination
 * - Result aggregation
 *
 * Reference: Google's A2A Protocol (2025)
 */

import { AgentRole } from "../agents/base";

/**
 * A2A Agent Card - describes agent capabilities for discovery
 * Similar to OpenAPI spec but for AI agents
 */
export interface A2AAgentCard {
  id: string;
  role: AgentRole;
  name: string;
  version: string;
  description: string;
  capabilities: A2ACapability[];
  inputSchema: A2ASchema;
  outputSchema: A2ASchema;
  metadata: {
    provider?: string;
    model?: string;
    language?: string[];
    domains?: string[];
    tags?: string[];
  };
  endpoints?: {
    direct?: string; // URL for direct communication
    callback?: string; // URL for async responses
  };
  status: "active" | "busy" | "offline" | "error";
}

/**
 * Agent capability descriptor
 */
export interface A2ACapability {
  name: string;
  description: string;
  inputSchema: A2ASchema;
  outputSchema: A2ASchema;
  examples?: Array<{
    input: any;
    output: any;
  }>;
  constraints?: {
    maxTokens?: number;
    timeout?: number; // ms
    rateLimit?: number;
  };
}

/**
 * JSON Schema for A2A I/O
 */
export interface A2ASchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  description?: string;
}

/**
 * A2A Message - communication between agents
 */
export interface A2AMessage {
  id: string;
  protocol: "a2a/1.0";
  timestamp: Date;
  sender: {
    agentId: string;
    role: AgentRole;
  };
  receiver: {
    agentId?: string; // specific agent, or null for broadcast
    role?: AgentRole; // target role
  };
  type: A2AMessageType;
  content: A2AMessageContent;
  context?: A2AContext;
  metadata?: {
    priority?: "low" | "normal" | "high" | "urgent";
    expectsResponse?: boolean;
    correlationId?: string; // for linking request/response
    replyTo?: string; // message ID to reply to
  };
}

/**
 * Types of A2A messages
 */
export type A2AMessageType =
  | "request" // asking another agent to do something
  | "response" // replying to a request
  | "inform" // sharing information
  | "query" // asking for information
  | "delegate" // handing off a task
  | "acknowledge" // confirming receipt
  | "error"; // reporting an error

/**
 * Message content union type
 */
export type A2AMessageContent =
  | A2ARequestContent
  | A2AResponseContent
  | A2AInformContent
  | A2AQueryContent
  | A2ADelegateContent
  | A2AAcknowledgeContent
  | A2AErrorContent;

export interface A2ARequestContent {
  type: "request";
  task: string;
  parameters?: Record<string, any>;
  constraints?: {
    timeout?: number;
    maxTokens?: number;
    requiredFields?: string[];
  };
}

export interface A2AResponseContent {
  type: "response";
  status: "success" | "failure" | "partial";
  result?: any;
  reasoning?: string;
  confidence?: number; // 0-1
  alternatives?: any[];
}

export interface A2AInformContent {
  type: "inform";
  topic: string;
  data: any;
  source?: string;
}

export interface A2AQueryContent {
  type: "query";
  question: string;
  parameters?: Record<string, any>;
}

export interface A2ADelegateContent {
  type: "delegate";
  task: string;
  reason: string;
  suggestedAgent?: AgentRole;
  context: any;
}

export interface A2AAcknowledgeContent {
  type: "acknowledge";
  receivedMessageId: string;
  status: "received" | "processing" | "queued";
}

export interface A2AErrorContent {
  type: "error";
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
}

/**
 * A2A Context - shared context for conversation
 */
export interface A2AContext {
  conversationId: string;
  userId: string;
  sessionId: string;
  sharedData?: Record<string, any>;
  history?: A2AMessage[];
}

/**
 * A2A Protocol Handler - manages agent communication
 */
export interface A2AProtocolHandler {
  /**
   * Register an agent in the A2A network
   */
  registerAgent(card: A2AAgentCard): Promise<void>;

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): Promise<void>;

  /**
   * Discover agents by role or capability
   */
  discoverAgents(criteria: {
    role?: AgentRole;
    capability?: string;
    status?: string;
  }): Promise<A2AAgentCard[]>;

  /**
   * Send a message to another agent
   */
  sendMessage(message: A2AMessage): Promise<void>;

  /**
   * Receive messages for this agent
   */
  receiveMessages(agentId: string): Promise<A2AMessage[]>;

  /**
   * Request-response pattern (synchronous-like)
   */
  requestResponse(
    request: A2AMessage,
    timeout?: number
  ): Promise<A2AMessage>;
}

/**
 * A2A Message Router - routes messages between agents
 */
export interface A2AMessageRouter {
  /**
   * Route a message to appropriate agent(s)
   */
  route(message: A2AMessage): Promise<void>;

  /**
   * Broadcast to all agents of a certain role
   */
  broadcast(message: A2AMessage, role: AgentRole): Promise<void>;

  /**
   * Subscribe to messages of certain types
   */
  subscribe(
    agentId: string,
    filter: {
      types?: A2AMessageType[];
      senders?: string[];
    }
  ): void;
}

/**
 * A2A Conversation Manager - tracks multi-agent conversations
 */
export interface A2AConversation {
  id: string;
  participants: string[]; // agent IDs
  messages: A2AMessage[];
  status: "active" | "paused" | "completed" | "failed";
  startTime: Date;
  endTime?: Date;
  context: A2AContext;

  addMessage(message: A2AMessage): void;
  getHistory(): A2AMessage[];
  getSummary(): string;
}

/**
 * Helper: Build A2A messages fluently
 */
export class A2AMessageBuilder {
  private message: Partial<A2AMessage>;

  constructor(sender: { agentId: string; role: AgentRole }) {
    this.message = {
      id: `a2a_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      protocol: "a2a/1.0",
      timestamp: new Date(),
      sender,
      receiver: {},
      metadata: {},
    };
  }

  to(receiver: { agentId?: string; role?: AgentRole }): this {
    this.message.receiver = receiver;
    return this;
  }

  request(task: string, parameters?: Record<string, any>): this {
    this.message.type = "request";
    this.message.content = {
      type: "request",
      task,
      parameters,
    };
    return this;
  }

  response(
    status: "success" | "failure" | "partial",
    result?: any
  ): this {
    this.message.type = "response";
    this.message.content = {
      type: "response",
      status,
      result,
    };
    return this;
  }

  inform(topic: string, data: any): this {
    this.message.type = "inform";
    this.message.content = {
      type: "inform",
      topic,
      data,
    };
    return this;
  }

  query(question: string, parameters?: Record<string, any>): this {
    this.message.type = "query";
    this.message.content = {
      type: "query",
      question,
      parameters,
    };
    return this;
  }

  withContext(context: A2AContext): this {
    this.message.context = context;
    return this;
  }

  withPriority(priority: "low" | "normal" | "high" | "urgent"): this {
    this.message.metadata!.priority = priority;
    return this;
  }

  expectsResponse(expects: boolean = true): this {
    this.message.metadata!.expectsResponse = expects;
    return this;
  }

  replyTo(messageId: string): this {
    this.message.metadata!.replyTo = messageId;
    return this;
  }

  build(): A2AMessage {
    if (!this.message.type || !this.message.content) {
      throw new Error("Message type and content are required");
    }
    return this.message as A2AMessage;
  }
}

/**
 * A2A Coordinator Strategy - how coordinator delegates to agents
 */
export interface A2ACoordinationStrategy {
  /**
   * Determine which agents should handle a request
   */
  selectAgents(
    request: string,
    context: A2AContext
  ): Promise<AgentRole[]>;

  /**
   * Determine the order of agent execution
   */
  determineOrder(agents: AgentRole[]): AgentRole[];

  /**
   * Decide if agents should run in parallel or sequence
   */
  getExecutionMode(agents: AgentRole[]): "parallel" | "sequential";

  /**
   * Synthesize results from multiple agents
   */
  synthesizeResults(
    results: Map<AgentRole, A2AMessage>
  ): Promise<any>;
}
