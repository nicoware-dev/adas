# Welcome to ADAS Documentation

👋 Welcome to the official documentation for ADAS (Aptos DefAI Agent Swarm). This comprehensive guide will help you understand, install, and use our advanced multi-agent system for the Aptos blockchain ecosystem.

ADAS makes DeFi on Aptos simpler and more accessible by providing an AI-powered interface to manage your positions, analyze market data, and receive expert guidance—all through natural language interactions.

Whether you're a developer looking to contribute, a DeFi enthusiast wanting to optimize your positions, or just curious about AI agents in blockchain, this documentation will guide you through everything ADAS has to offer.

## About ADAS

ADAS is an advanced multi-agent system designed for the Aptos blockchain ecosystem, focusing on DeFi operations and analytics. It leverages the power of AI agents to provide autonomous management of user positions across various Aptos protocols.

The system consists of five specialized agents:

1. **Coordinator Agent**: Orchestrates the entire agent swarm using n8n workflows
2. **DeFi Agent**: Executes on-chain actions across the Aptos ecosystem
3. **Analytics Agent**: Gathers and analyzes data from multiple sources
4. **Aptos Expert Agent**: Provides expert knowledge and guidance
5. **Meme Agent**: Manages community engagement and social media presence

Our architecture leverages ElizaOS for four of the agents (DeFi, Analytics, Expert, and Meme), while the Coordinator Agent is implemented using n8n. This combination provides a robust, scalable foundation for complex DeFi operations.

## Current Status

ADAS is currently in Phase 1 (MVP) development. The core functionality is implemented, including:

- Multi-agent architecture with ElizaOS integration
- Core Aptos blockchain operations (token transfers, balance checking)
- Extended Aptos Plugin with 47 different actions across 6 protocols:
  - Joule Finance (lending, borrowing)
  - Amnis Finance (staking)
  - Liquidswap (DEX)
  - Aries Protocol (lending)
  - Merkle Trade (trading)
  - Thala Labs (DEX, staking)
- Custom Analytics Plugin with integrations to:
  - CoinGecko
  - DeFiLlama
  - GeckoTerminal
- Comprehensive knowledge base with RAG capabilities
- Web client with persistent chat history, example prompts, and Markdown support
- Telegram integration through the Coordinator Agent

Recently completed features include:
- Markdown formatting for chat responses
- Improved portfolio display with better token representation
- Persistent chat history implementation
- Example prompts with toggle functionality
- Comprehensive user guide with example prompts

See the [Implementation Status](./architecture/implementation-status.md) document for detailed information on the current state of development.

## Documentation Structure

- **[getting-started/](./getting-started/)**: Quick start guides and installation instructions
  - [Installation Guide](./getting-started/installation.md)
  - [Project Overview](./getting-started/overview.md)
  - [User Guide](./getting-started/user-guide.md)
  
- **[architecture/](./architecture/)**: System architecture and design documentation
  - [Architecture Overview](./architecture/overview.md)
  - [Features & Integrations](./architecture/features-integrations.md)
  - [Implementation Status](./architecture/implementation-status.md)
  - [Development Roadmap](./architecture/roadmap.md)
  
- **[agents/](./agents/)**: Documentation for each agent in the system
  - [Agent Overview](./agents/README.md)
  - [Coordinator Agent](./agents/coordinator-agent.md)
  - [Analytics Agent](./agents/analytics-agent.md)
  - [DeFi Agent](./agents/defi-agent.md)
  - [Aptos Expert Agent](./agents/aptos-expert-agent.md)
  - [Meme Agent](./agents/meme-agent.md)
  
- **[aptos-plugin/](./aptos-plugin/)**: Documentation for the Aptos plugin and Move Agent Kit integration
  - [Aptos Plugin Overview](./aptos-plugin/README.md)
  - [Move Agent Kit Integration](./aptos-plugin/move-agent-kit.md)
  
- **[api/](./api/)**: API documentation for the ADAS system
  - [API Overview](./api/README.md)
  - [Endpoints Reference](./api/endpoints.md)
  
- **[deployment/](./deployment/)**: Deployment guides and configuration
  - [Deployment Overview](./deployment/README.md)
  - [Docker Deployment](./deployment/docker.md)
  - [Cloud Deployment](./deployment/cloud.md)
  
- **[contributing/](./contributing/)**: Guidelines for contributing to the project
  - [Contributing Guidelines](./contributing/README.md)
  - [Code Style Guide](./contributing/code-style.md)
  - [Pull Request Process](./contributing/pull-requests.md)
  
- **[ui/](./ui/)**: Documentation for the user interface
  - [UI Components](./ui/components.md)
  - [Markdown Support](./ui/markdown.md)
  - [Chat Interface](./ui/chat-interface.md)

## Quick Links

- [Project Overview](./getting-started/overview.md)
- [Installation Guide](./getting-started/installation.md)
- [User Guide](./getting-started/user-guide.md)
- [Architecture Overview](./architecture/overview.md)
- [Features & Integrations](./architecture/features-integrations.md)
- [Implementation Status](./architecture/implementation-status.md)
- [Development Roadmap](./architecture/roadmap.md)
- [Agent Documentation](./agents/README.md)
- [API Reference](./api/README.md)
- [Deployment Guide](./deployment/README.md)
- [Contributing Guidelines](./contributing/README.md)

## Contributing to Documentation

We welcome contributions to the documentation! Please follow these steps:

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes to the documentation
4. Submit a pull request

Please ensure that your documentation follows our style guide and includes all necessary information.

## License

This documentation is licensed under the MIT License - see the LICENSE file for details. 