/**
 * A2A Protocol Handler Implementation
 *
 * Manages agent-to-agent communication, discovery, and message routing.
 */

import type {
  A2AAgentCard,
  A2AMessage,
  A2AProtocolHandler,
  A2AMessageRouter,
  A2AConversation,
  A2AContext,
  A2AMessageType,
} from "@/types/protocols/a2a";
import type { AgentRole } from "@/types/agents/base";

/**
 * In-memory message queue for agent communication
 */
class MessageQueue {
  private queues: Map<string, A2AMessage[]> = new Map();

  enqueue(agentId: string, message: A2AMessage): void {
    if (!this.queues.has(agentId)) {
      this.queues.set(agentId, []);
    }
    this.queues.get(agentId)!.push(message);
  }

  dequeue(agentId: string): A2AMessage[] {
    const messages = this.queues.get(agentId) || [];
    this.queues.set(agentId, []); // Clear after reading
    return messages;
  }

  peek(agentId: string): A2AMessage[] {
    return this.queues.get(agentId) || [];
  }
}

/**
 * Message Router Implementation
 */
class A2AMessageRouterImpl implements A2AMessageRouter {
  private messageQueue: MessageQueue = new MessageQueue();
  private subscriptions: Map<
    string,
    { types?: A2AMessageType[]; senders?: string[] }
  > = new Map();

  async route(message: A2AMessage): Promise<void> {
    // If specific receiver, route to that agent
    if (message.receiver.agentId) {
      this.messageQueue.enqueue(message.receiver.agentId, message);
      return;
    }

    // If role-based, route to all agents with that role
    if (message.receiver.role) {
      // This would need access to the registry of agents
      // For now, log that broadcast is needed
      console.log(`[A2A] Broadcast message to role: ${message.receiver.role}`);
    }
  }

  async broadcast(message: A2AMessage, role: AgentRole): Promise<void> {
    // Broadcast to all agents of a specific role
    // Implementation would need agent registry
    console.log(`[A2A] Broadcasting to all ${role} agents`);
  }

  subscribe(
    agentId: string,
    filter: { types?: A2AMessageType[]; senders?: string[] }
  ): void {
    this.subscriptions.set(agentId, filter);
  }

  getMessages(agentId: string): A2AMessage[] {
    return this.messageQueue.dequeue(agentId);
  }

  peekMessages(agentId: string): A2AMessage[] {
    return this.messageQueue.peek(agentId);
  }
}

/**
 * Conversation Manager
 */
class A2AConversationImpl implements A2AConversation {
  id: string;
  participants: string[];
  messages: A2AMessage[];
  status: "active" | "paused" | "completed" | "failed";
  startTime: Date;
  endTime?: Date;
  context: A2AContext;

  constructor(context: A2AContext, participants: string[]) {
    this.id = context.conversationId;
    this.context = context;
    this.participants = participants;
    this.messages = [];
    this.status = "active";
    this.startTime = new Date();
  }

  addMessage(message: A2AMessage): void {
    this.messages.push(message);
    // Update context history
    if (this.context.history) {
      this.context.history.push(message);
    } else {
      this.context.history = [message];
    }
  }

  getHistory(): A2AMessage[] {
    return [...this.messages];
  }

  getSummary(): string {
    const duration = this.endTime
      ? this.endTime.getTime() - this.startTime.getTime()
      : Date.now() - this.startTime.getTime();

    return `Conversation ${this.id}: ${this.messages.length} messages, ${this.participants.length} participants, ${Math.round(duration / 1000)}s duration`;
  }

  complete(): void {
    this.status = "completed";
    this.endTime = new Date();
  }
}

/**
 * Main A2A Protocol Handler
 */
export class A2AProtocolHandlerImpl implements A2AProtocolHandler {
  private agents: Map<string, A2AAgentCard> = new Map();
  private router: A2AMessageRouterImpl = new A2AMessageRouterImpl();
  private conversations: Map<string, A2AConversationImpl> = new Map();
  private pendingResponses: Map<string, (message: A2AMessage) => void> = new Map();

  async registerAgent(card: A2AAgentCard): Promise<void> {
    this.agents.set(card.id, card);
    console.log(`[A2A] Registered agent: ${card.name} (${card.role})`);
  }

  async unregisterAgent(agentId: string): Promise<void> {
    this.agents.delete(agentId);
    console.log(`[A2A] Unregistered agent: ${agentId}`);
  }

  async discoverAgents(criteria: {
    role?: AgentRole;
    capability?: string;
    status?: string;
  }): Promise<A2AAgentCard[]> {
    let agents = Array.from(this.agents.values());

    if (criteria.role) {
      agents = agents.filter((agent) => agent.role === criteria.role);
    }

    if (criteria.capability) {
      agents = agents.filter((agent) =>
        agent.capabilities.some((cap) => cap.name === criteria.capability)
      );
    }

    if (criteria.status) {
      agents = agents.filter((agent) => agent.status === criteria.status);
    }

    return agents;
  }

  async sendMessage(message: A2AMessage): Promise<void> {
    console.log(
      `[A2A] Sending ${message.type} from ${message.sender.role} to ${message.receiver.role || message.receiver.agentId || "broadcast"}`
    );

    // Add to conversation if context exists
    if (message.context?.conversationId) {
      const conversation = this.conversations.get(message.context.conversationId);
      if (conversation) {
        conversation.addMessage(message);
      }
    }

    // Route the message
    await this.router.route(message);

    // If this is a response to a pending request, resolve it
    if (
      message.type === "response" &&
      message.metadata?.replyTo
    ) {
      const resolver = this.pendingResponses.get(message.metadata.replyTo);
      if (resolver) {
        resolver(message);
        this.pendingResponses.delete(message.metadata.replyTo);
      }
    }
  }

  async receiveMessages(agentId: string): Promise<A2AMessage[]> {
    const messages = this.router.getMessages(agentId);
    console.log(`[A2A] Agent ${agentId} received ${messages.length} messages`);
    return messages;
  }

  async requestResponse(
    request: A2AMessage,
    timeout: number = 30000
  ): Promise<A2AMessage> {
    return new Promise(async (resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.pendingResponses.delete(request.id);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      // Store resolver
      this.pendingResponses.set(request.id, (response: A2AMessage) => {
        clearTimeout(timeoutId);
        resolve(response);
      });

      // Send the request
      await this.sendMessage(request);
    });
  }

  createConversation(context: A2AContext, participants: string[]): A2AConversation {
    const conversation = new A2AConversationImpl(context, participants);
    this.conversations.set(conversation.id, conversation);
    console.log(`[A2A] Created conversation: ${conversation.id}`);
    return conversation;
  }

  getConversation(conversationId: string): A2AConversation | undefined {
    return this.conversations.get(conversationId);
  }

  completeConversation(conversationId: string): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.complete();
      console.log(`[A2A] Completed conversation: ${conversationId}`);
    }
  }

  getAgentCard(agentId: string): A2AAgentCard | undefined {
    return this.agents.get(agentId);
  }

  listAgents(): A2AAgentCard[] {
    return Array.from(this.agents.values());
  }
}

// Global singleton instance
let handlerInstance: A2AProtocolHandlerImpl | null = null;

export function getA2AHandler(): A2AProtocolHandlerImpl {
  if (!handlerInstance) {
    handlerInstance = new A2AProtocolHandlerImpl();
  }
  return handlerInstance;
}

/**
 * Helper function to create a conversation context
 */
export function createConversationContext(
  userId: string,
  sessionId?: string
): A2AContext {
  return {
    conversationId: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    sessionId: sessionId || `session_${Date.now()}`,
    sharedData: {},
    history: [],
  };
}
