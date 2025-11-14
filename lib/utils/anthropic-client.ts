/**
 * Anthropic Claude Client Wrapper
 *
 * Provides a configured Claude client with:
 * - Model selection (Sonnet, Haiku)
 * - Prompt caching support
 * - Streaming responses
 * - Error handling
 * - Token counting
 */

import Anthropic from "@anthropic-ai/sdk";

// Initialize the Anthropic client
const getAnthropicClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set in environment variables");
  }

  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
};

// Model configurations
export const CLAUDE_MODELS = {
  SONNET: "claude-3-5-sonnet-20241022",
  HAIKU: "claude-3-5-haiku-20241022",
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeOptions {
  model?: ClaudeModel;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
}

export interface ClaudeResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
  };
  stopReason?: string;
}

/**
 * Call Claude with a single message
 */
export async function callClaude(
  message: string,
  options: ClaudeOptions = {}
): Promise<ClaudeResponse> {
  const client = getAnthropicClient();

  const {
    model = CLAUDE_MODELS.SONNET,
    temperature = 0.7,
    maxTokens = 4096,
    systemPrompt,
  } = options;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    return {
      content: content.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheCreationInputTokens: response.usage.cache_creation_input_tokens,
        cacheReadInputTokens: response.usage.cache_read_input_tokens,
      },
      stopReason: response.stop_reason,
    };
  } catch (error: any) {
    console.error("[Claude API Error]", error);
    throw new Error(`Claude API error: ${error.message}`);
  }
}

/**
 * Call Claude with conversation history
 */
export async function callClaudeConversation(
  messages: ClaudeMessage[],
  options: ClaudeOptions = {}
): Promise<ClaudeResponse> {
  const client = getAnthropicClient();

  const {
    model = CLAUDE_MODELS.SONNET,
    temperature = 0.7,
    maxTokens = 4096,
    systemPrompt,
  } = options;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    return {
      content: content.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheCreationInputTokens: response.usage.cache_creation_input_tokens,
        cacheReadInputTokens: response.usage.cache_read_input_tokens,
      },
      stopReason: response.stop_reason,
    };
  } catch (error: any) {
    console.error("[Claude API Error]", error);
    throw new Error(`Claude API error: ${error.message}`);
  }
}

/**
 * Call Claude with streaming response
 */
export async function* callClaudeStream(
  message: string,
  options: ClaudeOptions = {}
): AsyncGenerator<string, ClaudeResponse, undefined> {
  const client = getAnthropicClient();

  const {
    model = CLAUDE_MODELS.SONNET,
    temperature = 0.7,
    maxTokens = 4096,
    systemPrompt,
  } = options;

  try {
    const stream = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      stream: true,
    });

    let fullContent = "";
    let usage: any = {};

    for await (const event of stream) {
      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          const text = event.delta.text;
          fullContent += text;
          yield text;
        }
      } else if (event.type === "message_start") {
        usage = event.message.usage;
      } else if (event.type === "message_delta") {
        usage = { ...usage, ...event.usage };
      }
    }

    return {
      content: fullContent,
      usage: {
        inputTokens: usage.input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
        cacheCreationInputTokens: usage.cache_creation_input_tokens,
        cacheReadInputTokens: usage.cache_read_input_tokens,
      },
    };
  } catch (error: any) {
    console.error("[Claude Streaming Error]", error);
    throw new Error(`Claude streaming error: ${error.message}`);
  }
}

/**
 * Estimate token count (rough approximation)
 * More accurate would be to use tiktoken, but this is a quick estimate
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost for Claude API usage
 */
export function calculateCost(
  usage: {
    inputTokens: number;
    outputTokens: number;
  },
  model: ClaudeModel = CLAUDE_MODELS.SONNET
): number {
  // Pricing per 1M tokens (as of 2024)
  const pricing = {
    [CLAUDE_MODELS.SONNET]: {
      input: 3.0, // $3 per 1M input tokens
      output: 15.0, // $15 per 1M output tokens
    },
    [CLAUDE_MODELS.HAIKU]: {
      input: 0.25, // $0.25 per 1M input tokens
      output: 1.25, // $1.25 per 1M output tokens
    },
  };

  const modelPricing = pricing[model];
  const inputCost = (usage.inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (usage.outputTokens / 1_000_000) * modelPricing.output;

  return inputCost + outputCost;
}
