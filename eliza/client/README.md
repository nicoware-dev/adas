# ADAS Client

ADAS (Aptos DefAI Agent Swarm) is an advanced multi-agent system for the Aptos blockchain ecosystem, providing AI-powered DeFi operations, analytics, and expert guidance through a modern web interface.

## Features

- Multi-agent system with specialized AI agents:
  - Analytics Agent: Real-time DeFi analytics and market data
  - DeFi Agent: Protocol interactions and transaction management
  - Aptos Expert Agent: Technical guidance and strategy analysis
  - Coordinator Agent: Orchestrates agent interactions

- Protocol Integrations:
  - Joule Finance: Lending and borrowing operations
  - Amnis Finance: Liquid staking
  - Thala Labs: DEX and MOD stablecoin
  - Other major Aptos protocols

- Real-time Analytics:
  - Protocol TVL tracking via DefiLlama
  - Market analytics and visualization
  - Protocol performance metrics
  - Portfolio analytics

## Development

### Prerequisites

- Node.js 16+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in the root directory with:

```
VITE_BACKEND_URL=http://localhost:3000  # URL to your ElizaOS agents API
```

### Running the Development Server

```bash
# Start the development server
pnpm dev
```

## Deployment to Vercel

The project is optimized for deployment on Vercel with serverless functions for API integrations.

### Setup

1. Fork/clone the repository
2. Create a Vercel account if needed
3. Install Vercel CLI: `npm i -g vercel`
4. Login to Vercel: `vercel login`

### Deploy

```bash
# Deploy to Vercel preview
vercel

# Deploy to production
vercel --prod
```

### Important Notes

- The project uses Vercel Edge Functions for API integrations
- Serverless functions handle protocol data aggregation and analytics

## Architecture

### Client Architecture

- React + Vite for the frontend
- TypeScript for type safety
- Tailwind CSS + Shadcn UI for styling
- React Query for data fetching and caching
- React Router for navigation

### Agent System

The client interfaces with multiple specialized AI agents:

1. **Analytics Agent**
   - Real-time protocol analytics
   - Market data visualization
   - Performance metrics

2. **DeFi Agent**
   - Protocol interaction management
   - Transaction handling
   - Position management

3. **Aptos Expert Agent**
   - Technical guidance
   - Strategy analysis
   - Risk assessment

4. **Coordinator Agent**
   - Request routing
   - Agent orchestration
   - Response aggregation

### API Integration

- Serverless functions for external API integration
- Real-time data streaming for analytics
- Protocol-specific API handlers

## Development Workflow

### Local Development

1. Start with mock data for rapid development:
   ```bash
   VITE_ENABLE_MOCK_DATA=true pnpm dev
   ```

2. Test with real data:
   ```bash
   VITE_ENABLE_MOCK_DATA=false pnpm dev
   ```

### Testing

```bash
# Run unit tests
pnpm test

# Run e2e tests
pnpm test:e2e
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

