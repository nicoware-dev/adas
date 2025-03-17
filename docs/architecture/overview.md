# ADAS Architecture Overview

## System Architecture

ADAS follows a distributed multi-agent architecture with specialized agents working together to deliver comprehensive functionality:

```
┌─────────────────────────────────────────────────────────────┐
│                      ADAS Architecture                       │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Coordinator Agent (n8n)                  │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Workflows   │    │ Triggers    │    │ Telegram    │     │
│  │             │    │             │    │ Integration │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Analytics Agent │   │   DeFi Agent    │   │ Aptos Expert    │
│   (elizaOS)     │   │   (elizaOS)     │   │ Agent (elizaOS) │
│                 │   │                 │   │                 │
│ ┌─────────────┐ │   │ ┌─────────────┐ │   │ ┌─────────────┐ │
│ │ Data        │ │   │ │ Move Agent  │ │   │ │ RAG         │ │
│ │ Connectors  │ │   │ │ Kit         │ │   │ │ Knowledge   │ │
│ └─────────────┘ │   │ └─────────────┘ │   │ │ Base        │ │
│                 │   │                 │   │ └─────────────┘ │
│ ┌─────────────┐ │   │ ┌─────────────┐ │   │ ┌─────────────┐ │
│ │ REST API    │ │   │ │ Aptos       │ │   │ │ REST API    │ │
│ │             │ │   │ │ Plugin      │ │   │ │             │ │
│ └─────────────┘ │   │ └─────────────┘ │   │ └─────────────┘ │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

## Core Components

### 1. Coordinator Agent

The Coordinator Agent is the central orchestrator of the ADAS system, managing communication and coordination between all other agents. It is implemented using n8n, a powerful workflow automation platform.

**Key Responsibilities:**
- Route user requests to appropriate specialized agents
- Manage conversation context and history
- Coordinate responses from multiple agents
- Handle error recovery and fallback mechanisms
- Provide monitoring and logging

**Implementation:**
- n8n workflows define the coordination logic
- Webhook endpoints for receiving user requests
- HTTP Request nodes for communicating with ElizaOS agents
- Function nodes for processing and transforming data
- Telegram integration for user interaction

### 2. Analytics Agent

The Analytics Agent is responsible for gathering and analyzing data from multiple sources to provide insights about the Aptos ecosystem.

**Key Responsibilities:**
- Fetch real-time price data from CoinGecko
- Retrieve TVL data from DefiLlama
- Track protocol performance metrics
- Analyze market trends
- Generate portfolio analytics

**Implementation:**
- ElizaOS agent with custom character definition
- Data connector interfaces for external APIs
- Processing utilities for data transformation
- REST API endpoints for serving analytics data
- RAG capabilities for contextual information retrieval

### 3. DeFi Agent

The DeFi Agent handles all on-chain operations on the Aptos blockchain, leveraging the Move Agent Kit for interacting with various protocols.

**Key Responsibilities:**
- Execute token transfers
- Perform swaps on DEXs (primarily Thala)
- Manage lending positions (Joule Finance - implemented: deposit, borrow, repay, withdraw)
- Handle staking operations (primarily Amnis)
- Monitor transaction status

**Implementation:**
- ElizaOS agent with custom character definition
- Enhanced Aptos Plugin for blockchain interaction
- Move Agent Kit integration for protocol-specific operations
- Transaction utilities for building and signing transactions
- REST API endpoints for executing operations

### 4. Aptos Expert Agent

The Aptos Expert Agent provides specialized knowledge and guidance about the Aptos ecosystem, helping users navigate protocols and make informed decisions.

**Key Responsibilities:**
- Provide information about Aptos protocols
- Explain DeFi concepts and strategies
- Offer recommendations based on market conditions
- Answer technical questions about Aptos
- Educate users about best practices

**Implementation:**
- ElizaOS agent with custom character definition
- Comprehensive knowledge base of Aptos documentation
- RAG system for accurate information retrieval
- REST API endpoints for knowledge queries
- Recommendation system based on user context

## Integration Points

### ElizaOS

ElizaOS serves as the foundation for all specialized agents, providing:
- Character-based agent definitions
- Plugin system for extending functionality
- Multi-client support (web, Telegram, etc.)
- LLM provider integration (Anthropic Claude, OpenAI)
- Conversation management

### Move Agent Kit

Move Agent Kit is the core integration for blockchain interactions, offering:
- Support for multiple Aptos protocols
- Token operations (transfer, mint, burn)
- DEX operations (swaps, liquidity)
- Lending operations (borrow, repay)
- Staking operations

### n8n

n8n provides the workflow automation for agent orchestration:
- Visual workflow builder
- Webhook endpoints for API access
- HTTP requests for inter-agent communication
- Function nodes for data processing
- Error handling and retries

### Web Client

The web client offers a user interface for interacting with the agent swarm:
- Chat interface for natural language interaction
- Portfolio dashboard for tracking assets
- Analytics visualizations
- Agent directory for discovering capabilities
- Settings management

## Data Flow

1. User sends a request via web interface or Telegram
2. Coordinator Agent receives the request and analyzes intent
3. Coordinator routes the request to appropriate specialized agent(s)
4. Specialized agent processes the request and returns a response
5. Coordinator aggregates responses and formats the final output
6. User receives the response with requested information or confirmation of action

## Security Considerations

- Private keys are stored securely and never exposed
- Environment variables are used for sensitive configuration
- API keys are managed with appropriate access controls
- Transactions require explicit user confirmation
- Rate limiting is implemented to prevent abuse

## Scalability

The multi-agent architecture allows for horizontal scaling:
- New specialized agents can be added for additional functionality
- Existing agents can be replicated for handling increased load
- Stateless design enables distributed deployment
- Modular components can be scaled independently

## Future Extensions

The architecture is designed to accommodate future extensions:
- Additional specialized agents for specific protocols
- Cross-chain capabilities for interoperability
- Advanced AI strategies for portfolio optimization
- Mobile client integration
- Community-contributed agents and plugins 