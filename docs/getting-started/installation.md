# ADAS Installation Guide

This guide provides step-by-step instructions for setting up and running ADAS on your local machine.

## Prerequisites

Before installing ADAS, ensure you have the following prerequisites:

- **Node.js**: Version 23.0.0 or higher
  - [Download from nodejs.org](https://nodejs.org/)
  - Verify with `node --version`

- **pnpm**: Package manager
  - Install with `npm install -g pnpm`
  - Verify with `pnpm --version`

- **Git**: Version control
  - [Download from git-scm.com](https://git-scm.com/downloads)
  - Verify with `git --version`

- **Aptos CLI** (optional but recommended):
  - [Installation instructions](https://aptos.dev/tools/aptos-cli/install-cli/)
  - Verify with `aptos --version`

## API Keys

You'll need API keys for the following services:

1. **LLM Provider** (at least one):
   - [Anthropic API Key](https://www.anthropic.com/) (recommended for Claude)
   - [OpenAI API Key](https://platform.openai.com/) (alternative)

2. **Blockchain Access** (required for on-chain operations):
   - Aptos private key for the wallet you want to use

3. **Optional API Keys**:
   - [CoinGecko API Key](https://www.coingecko.com/en/api) (for enhanced price data)
   - [DefiLlama API Key](https://defillama.com/docs/api) (for enhanced TVL data)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/nicoware-dev/adas.git
cd adas
```

### 2. Install Dependencies

```bash
pnpm install --no-frozen-lockfile
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file and add your API keys and configuration:

```env
# Required for blockchain operations
APTOS_PRIVATE_KEY=your_private_key
APTOS_NETWORK=mainnet  # or testnet for testing

# LLM Provider (choose one or both)
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key

# Optional API Keys
COINGECKO_API_KEY=your_coingecko_api_key
DEFILLAMA_API_KEY=your_defillama_api_key

# Client Configuration (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### 4. Build the Project

```bash
pnpm build
```

## Running ADAS

### Starting the ElizaOS Agents

You can start individual agents or all agents at once:

#### Test Agent (for initial testing)

```bash
cd eliza
pnpm start --characters="characters/test-agent.character.json"
```

#### All Agents

```bash
cd eliza
pnpm start --characters="characters/defi-agent.character.json,characters/analytics-agent.character.json,characters/aptos-expert-agent.character.json"
```

### Starting the Web Client

```bash
cd client
pnpm dev
```

Access the web interface at `http://localhost:3000`

### Starting the Coordinator (n8n)

```bash
cd n8n
pnpm start
```

Access the n8n dashboard at `http://localhost:5678`

## Verifying Installation

To verify that your installation is working correctly:

1. Open the web client at `http://localhost:3000`
2. Connect your wallet
3. Try a simple query like "What's the current price of APT?"

## Troubleshooting

### Common Issues

#### Agent Not Responding
- Check that the ElizaOS agents are running
- Verify your LLM API keys are correct
- Check the ElizaOS logs for errors

#### Transaction Failures
- Ensure your Aptos private key is correct
- Check that you have sufficient APT for gas fees
- Verify you're connected to the correct network

#### Web Client Issues
- Clear browser cache and reload
- Check browser console for errors
- Verify that all services are running

### Getting Help

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting Guide](../troubleshooting.md)
2. Search for similar issues in the [GitHub Issues](https://github.com/nicoware-dev/adas/issues)
3. Join our [Discord community](https://discord.gg/adas) for support

## Development Setup

For developers who want to contribute to ADAS:

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the upstream remote:
   ```bash
   git remote add upstream https://github.com/nicoware-dev/adas.git
   ```
4. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. Follow the [Contributing Guidelines](../contributing/README.md)

## Next Steps

- [Project Overview](./overview.md)
- [Architecture Overview](../architecture/overview.md)
- [Agent Documentation](../agents/README.md)
- [API Reference](../api/README.md)

*Last updated: [Current Date]* 