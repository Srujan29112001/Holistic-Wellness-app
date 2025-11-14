# AI Agents Directory

This directory contains all AI agent implementations for the Holistic Wellness platform.

## Agent Structure

Each agent follows a consistent pattern:
- Base agent interface implementation
- Domain-specific logic and tools
- Integration with MCP (Model Context Protocol)
- A2A (Agent-to-Agent) communication capabilities

## Agents

### 1. Coordinator Agent (`coordinator.ts`)
- **Role**: Orchestrates all other agents
- **Responsibilities**:
  - Receives user requests
  - Delegates tasks to specialist agents
  - Aggregates and synthesizes responses
  - Ensures coherent multi-domain recommendations

### 2. Nutrition Agent (`nutrition.ts`)
- **Role**: Nutrition and meal planning expert
- **Responsibilities**:
  - Generate personalized meal plans
  - Calculate nutritional values
  - Integrate with USDA, Edamam, Spoonacular APIs
  - Apply dietary constraints and preferences
  - Multi-constraint optimization for meals

### 3. Mental Health Agent (`mental-health.ts`)
- **Role**: Mental wellness and mindfulness guide
- **Responsibilities**:
  - Mood tracking and analysis
  - Meditation and mindfulness recommendations
  - CBT techniques and stress management
  - Personality assessment integration (IPIP Big Five)

### 4. Spiritual Agent (`spiritual.ts`)
- **Role**: Spiritual guidance and holistic wellness
- **Responsibilities**:
  - Astrological insights (VedicAstro API)
  - Ayurvedic recommendations
  - Daily spiritual practices
  - Mind-body-spirit integration

### 5. Scheduler Agent (`scheduler.ts`)
- **Role**: Daily schedule optimization
- **Responsibilities**:
  - CSP-based schedule generation
  - OR-Tools integration
  - Balance activities across all wellness domains
  - Respect user constraints and preferences

## Communication Flow

```
User Request → Coordinator Agent → [Specialist Agents] → Coordinator → User Response
                                    ↓
                                MCP Tools (APIs, DBs)
```

## Adding New Agents

1. Create a new file in this directory
2. Implement the `Agent` interface from `types/agents`
3. Register with the Coordinator
4. Add MCP tool definitions
5. Update A2A protocol handlers
