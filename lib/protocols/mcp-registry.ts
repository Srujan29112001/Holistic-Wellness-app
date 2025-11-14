/**
 * MCP Tool Registry Implementation
 *
 * Central registry for managing MCP tools and servers.
 * Provides tool discovery, execution, caching, and circuit breaking.
 */

import type {
  MCPTool,
  MCPToolCall,
  MCPToolResult,
  MCPServer,
  MCPToolRegistry,
  MCPExecutionContext,
  MCPCache,
  CircuitBreaker,
} from "@/types/protocols/mcp";

/**
 * In-memory implementation of MCP Cache
 */
class MemoryMCPCache implements MCPCache {
  private cache: Map<string, { result: MCPToolResult; expiresAt: number }> =
    new Map();

  async get(key: string): Promise<MCPToolResult | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Mark as cached in metadata
    entry.result.metadata = {
      ...entry.result.metadata,
      cached: true,
    };

    return entry.result;
  }

  async set(
    key: string,
    result: MCPToolResult,
    ttl: number = 3600000
  ): Promise<void> {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { result, expiresAt });
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Circuit Breaker implementation for fault tolerance
 */
class SimpleCircuitBreaker implements CircuitBreaker {
  state: "closed" | "open" | "half-open" = "closed";
  failureCount: number = 0;
  lastFailure?: Date;

  private failureThreshold: number = 5;
  private timeout: number = 60000; // 1 minute
  private halfOpenAttempts: number = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should move from open to half-open
    if (
      this.state === "open" &&
      this.lastFailure &&
      Date.now() - this.lastFailure.getTime() > this.timeout
    ) {
      this.state = "half-open";
      this.halfOpenAttempts = 0;
    }

    // If circuit is open, fail fast
    if (this.state === "open") {
      throw new Error(
        `Circuit breaker is OPEN. Last failure: ${this.lastFailure?.toISOString()}`
      );
    }

    try {
      const result = await fn();

      // Success - reset if half-open, or just continue if closed
      if (this.state === "half-open") {
        this.halfOpenAttempts++;
        if (this.halfOpenAttempts >= 3) {
          // After 3 successful attempts, close the circuit
          this.reset();
        }
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailure = new Date();

      // If in half-open, immediately open again
      if (this.state === "half-open") {
        this.state = "open";
      }

      // If failures exceed threshold, open the circuit
      if (this.failureCount >= this.failureThreshold) {
        this.state = "open";
      }

      throw error;
    }
  }

  reset(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.halfOpenAttempts = 0;
    delete this.lastFailure;
  }
}

/**
 * Main MCP Tool Registry
 */
export class MCPToolRegistryImpl implements MCPToolRegistry {
  servers: Map<string, MCPServer> = new Map();
  tools: Map<string, MCPTool> = new Map();
  private cache: MCPCache = new MemoryMCPCache();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  registerServer(server: MCPServer): void {
    this.servers.set(server.id, server);

    // Register all tools from this server
    for (const tool of server.tools) {
      this.tools.set(tool.name, tool);
    }

    // Create circuit breaker for this server
    this.circuitBreakers.set(server.id, new SimpleCircuitBreaker());

    console.log(`[MCP] Registered server: ${server.name} with ${server.tools.length} tools`);
  }

  unregisterServer(serverId: string): void {
    const server = this.servers.get(serverId);
    if (!server) return;

    // Remove tools from this server
    for (const tool of server.tools) {
      this.tools.delete(tool.name);
    }

    this.servers.delete(serverId);
    this.circuitBreakers.delete(serverId);

    console.log(`[MCP] Unregistered server: ${serverId}`);
  }

  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  listTools(category?: string): MCPTool[] {
    const tools = Array.from(this.tools.values());
    if (category) {
      return tools.filter((tool) => tool.category === category);
    }
    return tools;
  }

  async executeTool(call: MCPToolCall): Promise<MCPToolResult> {
    const tool = this.getTool(call.tool);
    if (!tool) {
      return {
        id: call.id,
        tool: call.tool,
        status: "error",
        error: {
          code: "TOOL_NOT_FOUND",
          message: `Tool '${call.tool}' not found in registry`,
        },
        timestamp: new Date(),
      };
    }

    // Check cache first
    const cacheKey = this.getCacheKey(call);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log(`[MCP] Cache hit for ${call.tool}`);
      return cached;
    }

    // Find the server that provides this tool
    let server: MCPServer | undefined;
    for (const srv of this.servers.values()) {
      if (srv.tools.some((t) => t.name === call.tool)) {
        server = srv;
        break;
      }
    }

    if (!server) {
      return {
        id: call.id,
        tool: call.tool,
        status: "error",
        error: {
          code: "SERVER_NOT_FOUND",
          message: `No server found for tool '${call.tool}'`,
        },
        timestamp: new Date(),
      };
    }

    // Get circuit breaker for this server
    const circuitBreaker = this.circuitBreakers.get(server.id);
    if (!circuitBreaker) {
      throw new Error(`Circuit breaker not found for server ${server.id}`);
    }

    // Execute with circuit breaker
    try {
      const startTime = Date.now();
      const result = await circuitBreaker.execute(() =>
        server!.executeTool(call)
      );

      const executionTime = Date.now() - startTime;
      result.metadata = {
        ...result.metadata,
        executionTime,
        cached: false,
      };

      // Cache successful results if tool is cacheable
      if (result.status === "success" && tool.metadata?.cached) {
        await this.cache.set(cacheKey, result);
      }

      console.log(`[MCP] Executed ${call.tool} in ${executionTime}ms`);
      return result;
    } catch (error: any) {
      console.error(`[MCP] Error executing ${call.tool}:`, error.message);

      return {
        id: call.id,
        tool: call.tool,
        status: "error",
        error: {
          code: "EXECUTION_ERROR",
          message: error.message,
          details: error,
        },
        timestamp: new Date(),
      };
    }
  }

  private getCacheKey(call: MCPToolCall): string {
    // Create a deterministic cache key from tool name and parameters
    const params = JSON.stringify(call.parameters, Object.keys(call.parameters).sort());
    return `mcp:${call.tool}:${params}`;
  }

  getCache(): MCPCache {
    return this.cache;
  }

  getCircuitBreaker(serverId: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(serverId);
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const [id, server] of this.servers.entries()) {
      try {
        health[id] = await server.healthCheck();
      } catch {
        health[id] = false;
      }
    }

    return health;
  }
}

// Global singleton instance
let registryInstance: MCPToolRegistryImpl | null = null;

export function getMCPRegistry(): MCPToolRegistryImpl {
  if (!registryInstance) {
    registryInstance = new MCPToolRegistryImpl();
  }
  return registryInstance;
}
