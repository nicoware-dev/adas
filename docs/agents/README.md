# ADAS Agent Documentation

This directory contains documentation for each agent in the ADAS system. Each agent has specific capabilities, knowledge, and responsibilities within the multi-agent architecture.

## Agent Overview

ADAS employs a Multi-Agent System (MAS) architecture with specialized agents working together to provide comprehensive functionality:

| Agent | Primary Role | Key Capabilities |
|-------|-------------|------------------|
| [Coordinator Agent](./coordinator-agent.md) | Orchestration | Task delegation, conversation management, error handling |
| [Analytics Agent](./analytics-agent.md) | Data Analysis | Price tracking, TVL analysis, market trends, portfolio analytics |
| [DeFi Agent](./defi-agent.md) | Blockchain Operations | Token transfers, swaps, lending, staking, protocol interactions, trading |
| [Aptos Expert Agent](./aptos-expert-agent.md) | Knowledge & Guidance | Protocol explanations, strategy recommendations, technical support |

## Agent Architecture

Each agent in ADAS is built on the ElizaOS framework and follows a consistent architecture:

1. **Character Definition**: JSON configuration defining the agent's personality, knowledge, and behavior
2. **Knowledge Base**: Markdown files containing domain-specific information
3. **Plugin Integration**: Specialized plugins providing specific capabilities
4. **LLM Integration**: Connection to language models (primarily Claude) for reasoning

## Agent Communication

Agents communicate through the Coordinator Agent, which:
1. Receives user requests
2. Routes requests to appropriate specialized agents
3. Aggregates responses
4. Manages conversation context
5. Handles error recovery

## Agent Capabilities

### Coordinator Agent

The Coordinator Agent is implemented using n8n workflows and serves as the central orchestrator of the ADAS system.

**Key Responsibilities:**
- Route user requests to appropriate specialized agents
- Manage conversation context and history
- Coordinate responses from multiple agents
- Handle error recovery and fallback mechanisms
- Provide monitoring and logging

### Analytics Agent

The Analytics Agent provides data analysis and insights about the Aptos ecosystem.

**Key Responsibilities:**
- Fetch real-time price data from CoinGecko
- Retrieve TVL data from DefiLlama
- Track protocol performance metrics
- Analyze market trends
- Generate portfolio analytics

**Plugins:**
- `@elizaos-plugins/plugin-aptos-analytics`

### DeFi Agent

The DeFi Agent handles all on-chain operations on the Aptos blockchain.

**Key Responsibilities:**
- Execute token transfers and balance checks
- Perform swaps on DEXs (Liquidswap, Thala)
- Manage lending positions (Joule Finance, Aries Protocol)
- Handle staking operations (Amnis Finance, Thala)
- Execute trading operations (Merkle Trade)
- Monitor transaction status
- Create and manage tokens and NFTs

**Protocols Supported:**
- Joule Finance: Lending and borrowing
- Amnis Finance: Staking
- Liquidswap: Token swapping
- Thala Labs: DEX operations and staking
- Merkle Trade: Trading operations
- Aries Protocol: Lending platform

**Plugins:**
- `@elizaos-plugins/plugin-aptos`

### Aptos Expert Agent

The Aptos Expert Agent provides specialized knowledge and guidance about the Aptos ecosystem.

**Key Responsibilities:**
- Provide information about Aptos protocols
- Explain DeFi concepts and strategies
- Offer recommendations based on market conditions
- Answer technical questions about Aptos
- Educate users about best practices

**Plugins:**
- `@elizaos-plugins/plugin-aptos`

## Agent Development

### Adding New Capabilities

To add new capabilities to an agent:

1. Update the relevant plugin with new actions
2. Enhance the agent's knowledge base with information about the new capabilities
3. Test the agent with prompts targeting the new capabilities
4. Update the agent's character definition if needed

### Creating a New Agent

To create a new specialized agent:

1. Create a new character definition JSON file in `eliza/characters/`
2. Set up the agent's knowledge base in `eliza/characters/knowledge/`
3. Configure the agent with appropriate plugins
4. Update the Coordinator Agent to integrate with the new agent
5. Add documentation for the new agent

## Testing Agents

Each agent should be tested with a variety of prompts to ensure it can handle its responsibilities effectively. See the individual agent documentation for specific testing prompts.

## Agent Documentation

- [Coordinator Agent](./coordinator-agent.md)
- [Analytics Agent](./analytics-agent.md)
- [DeFi Agent](./defi-agent.md)
- [Aptos Expert Agent](./aptos-expert-agent.md)

*Last updated: [Current Date]* 