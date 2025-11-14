# Holistic Wellness AI Platform

> An AI-powered holistic wellness application integrating nutrition, mental health, and spiritual guidance through a cutting-edge multi-agent architecture.

## 🌟 Overview

The Holistic Wellness AI Platform is a comprehensive GenAI application that treats mind, body, and spirit as interconnected aspects of wellness. Built with modern AI protocols (MCP & A2A), it provides personalized recommendations across multiple wellness domains through collaborative AI agents.

### Key Features

- **🥗 Personalized Nutrition**: AI-driven meal planning with multi-constraint optimization
- **🧘 Mental Wellness**: Mood tracking, meditation guidance, and CBT techniques
- **✨ Spiritual Guidance**: Astrological insights and Ayurvedic recommendations
- **📅 Smart Scheduling**: CSP-based daily schedule optimization
- **🤖 Multi-Agent AI**: Coordinated specialist agents for holistic recommendations
- **🔒 Privacy-First**: Row-Level Security and HIPAA-aligned data protection

## 🏗️ Architecture

### Multi-Agent System

The platform uses a sophisticated multi-agent architecture:

```
┌─────────────────────────────────────────────────────┐
│               Coordinator Agent                      │
│          (Claude LLM Orchestrator)                  │
└──────────────┬──────────────┬──────────────┬────────┘
               │              │              │
    ┌──────────▼─────┐ ┌─────▼──────┐ ┌────▼────────┐
    │   Nutrition    │ │   Mental    │ │  Spiritual  │
    │     Agent      │ │ Health Agent│ │    Agent    │
    └────────┬───────┘ └──────┬──────┘ └─────┬───────┘
             │                │              │
             ▼                ▼              ▼
        MCP Tools        MCP Tools      MCP Tools
    (USDA, Edamam)   (IPIP, Meditate)  (VedicAstro)
```

### Core Protocols

#### **MCP (Model Context Protocol)**
- Standardized AI-to-tool communication
- Enables agents to call external APIs uniformly
- Supports caching and circuit breaking for reliability

#### **A2A (Agent-to-Agent Protocol)**
- Inter-agent communication and coordination
- Agent discovery via Agent Cards
- Task delegation and result synthesis

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** with App Router and React 19
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Hook Form + Zod** for form validation

### Backend & Infrastructure
- **Supabase** (PostgreSQL + Auth + Row-Level Security)
- **Anthropic Claude** (3.5 Sonnet & Haiku) for AI reasoning
- **Vercel** for serverless deployment
- **Redis** for caching
- **TimescaleDB** for time-series data (mood tracking, progress)

### AI & Optimization
- **Google OR-Tools** for meal planning and scheduling optimization
- **MCP Protocol** for tool integration
- **A2A Protocol** for agent collaboration
- **Reinforcement Learning** for personalized recommendations

### External APIs
- **USDA FoodData Central** - Nutrition database
- **Edamam / Spoonacular** - Recipe and meal planning
- **VedicAstro API** - Astrological calculations
- **IPIP** - Personality assessment

## 📁 Project Structure

```
holistic-wellness-app/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Dashboard pages
│   ├── api/                 # API routes
│   │   ├── agents/          # Agent endpoints
│   │   └── wellness/        # Wellness endpoints
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # UI primitives
│   ├── forms/               # Form components
│   ├── onboarding/          # Onboarding flow
│   └── dashboard/           # Dashboard components
├── lib/                     # Core library code
│   ├── agents/              # AI agent implementations
│   │   ├── coordinator.ts   # Coordinator agent
│   │   ├── nutrition.ts     # Nutrition agent
│   │   ├── mental-health.ts # Mental health agent
│   │   └── spiritual.ts     # Spiritual agent
│   ├── protocols/           # MCP & A2A implementations
│   │   ├── mcp-registry.ts  # MCP tool registry
│   │   └── a2a-handler.ts   # A2A message handler
│   ├── supabase/            # Supabase client & config
│   │   ├── client.ts        # Supabase clients
│   │   ├── auth.ts          # Auth utilities
│   │   ├── database.types.ts # TypeScript types
│   │   └── schema.sql       # Database schema
│   ├── apis/                # External API integrations
│   └── utils/               # Utility functions
├── types/                   # TypeScript type definitions
│   ├── agents/              # Agent types
│   ├── protocols/           # Protocol types (MCP, A2A)
│   └── api/                 # API types
├── public/                  # Static assets
├── .env.example             # Environment variables template
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies

```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.18.0
- **npm** >= 9.0.0
- **Supabase** account and project
- **Anthropic API** key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd holistic-wellness-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your API keys and credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key

   # Anthropic Claude
   ANTHROPIC_API_KEY=your_anthropic_key

   # External APIs
   USDA_API_KEY=your_usda_key
   EDAMAM_APP_ID=your_edamam_id
   EDAMAM_APP_KEY=your_edamam_key
   VEDIC_ASTRO_API_KEY=your_vedic_key
   ```

4. **Set up Supabase database**
   - Go to your Supabase project
   - Run the SQL schema from `lib/supabase/schema.sql` in the SQL Editor
   - Enable Row-Level Security policies

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Security & Privacy

### Data Protection
- **Row-Level Security (RLS)**: All database tables protected with Supabase RLS
- **JWT Authentication**: Secure token-based authentication
- **Encryption**: Data encrypted at rest and in transit (TLS)
- **GDPR Compliance**: Users can export and delete their data

### HIPAA Alignment
While not a covered HIPAA entity, the platform follows HIPAA best practices:
- Minimum necessary data collection
- Audit logging of all agent sessions
- Secure API key storage
- Clear disclaimers (not medical advice)

## 📊 Database Schema

Key tables:
- `user_profiles` - Extended user information
- `mood_entries` - Daily mood tracking (TimescaleDB)
- `meal_plans` - Generated meal plans
- `meal_logs` - Actual meals consumed
- `wellness_plans` - Holistic daily/weekly plans
- `activities` - Scheduled and completed activities
- `agent_sessions` - AI agent execution logs
- `api_cache` - Cached external API results

See `lib/supabase/schema.sql` for full schema.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow the existing project structure
- Add types for all functions and components
- Write descriptive commit messages

## 📝 Development Roadmap

### Phase 1: Foundation (Weeks 1-2) ✅
- [x] Project setup and configuration
- [x] Multi-agent architecture foundation
- [x] MCP & A2A protocol implementation
- [x] Supabase database and auth setup
- [x] Basic UI and routing

### Phase 2: Core Features (Weeks 3-5)
- [ ] Nutrition Agent with USDA integration
- [ ] Mental Health Agent with mood tracking
- [ ] Spiritual Agent with VedicAstro API
- [ ] Coordinator Agent with Claude
- [ ] 7-step onboarding form

### Phase 3: Optimization (Weeks 6-8)
- [ ] OR-Tools meal planning optimization
- [ ] CSP-based schedule generation
- [ ] Reinforcement learning for personalization
- [ ] Performance optimization and caching

### Phase 4: Polish & Launch (Weeks 9-12)
- [ ] UI/UX refinement
- [ ] Testing and bug fixes
- [ ] Monitoring and observability (Helicone, Sentry)
- [ ] Documentation and deployment

## 🎯 Key Design Decisions

### Why Multi-Agent Architecture?
- **Separation of Concerns**: Each agent specializes in one domain
- **Scalability**: Easy to add new agents or capabilities
- **Maintainability**: Easier to debug and update individual agents
- **Flexibility**: Agents can be swapped or upgraded independently

### Why MCP & A2A?
- **Standardization**: Industry-standard protocols from Anthropic & Google
- **Interoperability**: Agents and tools can be reused across projects
- **Future-Proof**: Follows emerging AI architecture patterns

### Why OR-Tools?
- **Proven**: Battle-tested optimization library from Google
- **Powerful**: Handles complex constraint satisfaction problems
- **Free**: Open-source with no licensing costs

## 📖 Documentation

- [Architecture Guide](./ARCHITECTURE.md) - Detailed system architecture
- [Agent Development Guide](./lib/agents/README.md) - How to create new agents
- [API Reference](./docs/api-reference.md) - API endpoints documentation
- [Database Schema](./lib/supabase/schema.sql) - Complete database structure

## 🐛 Troubleshooting

### Common Issues

**Issue**: `Module not found: @supabase/ssr`
- **Solution**: Run `npm install @supabase/ssr`

**Issue**: Environment variables not loading
- **Solution**: Ensure `.env.local` exists and restart dev server

**Issue**: Database permissions error
- **Solution**: Check RLS policies in Supabase dashboard

**Issue**: Claude API rate limit
- **Solution**: Implement request queuing or upgrade API tier

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anthropic** for Claude and MCP protocol
- **Google** for A2A protocol and OR-Tools
- **Supabase** for backend infrastructure
- **Vercel** for hosting platform
- **Open-source community** for various libraries and tools

## 📧 Contact

For questions, feedback, or support:
- Create an issue on GitHub
- Email: support@holisticwellness.ai
- Documentation: https://docs.holisticwellness.ai

---

**Built with ❤️ using cutting-edge AI technology for holistic wellness.**
