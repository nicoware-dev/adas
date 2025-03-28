# ADAS: Aptos DefAI Agent Swarm

<div align="center">
  <img src="./assets/logos/hero.png" alt="ADAS Logo" width="200" />
  <h3>Revolutionizing Aptos DeFi with AI-Powered Agent Swarms</h3>
  <p>Simplify your DeFi experience on Aptos blockchain with the power of Multi-Agent Systems (MAS)</p>
  
  <p align="center">
    <a href="https://adas-rose.vercel.app/" target="_blank">Website</a> •
    <a href="https://twitter.com/ADAS_DefAI" target="_blank">Twitter</a> •
    <a href="https://discord.gg/G6GaZYzRgN" target="_blank">Discord</a> •
    <a href="https://t.me/+0BvBZ8KWJQNjZTIx" target="_blank">Telegram</a> •
    <a href="https://github.com/nicoware-dev/adas" target="_blank">GitHub</a> •
    <a href="https://adas-4.gitbook.io/adas" target="_blank">Docs</a>
  </p>
</div>

---

## 📚 Table of Contents

- [🌟 Overview](#-overview)
  - [Why Multi-Agent Systems (MAS)?](#why-multi-agent-systems-mas)
- [✨ Features](#-features)
  - [Core Features](#core-features)
  - [Aptos Ecosystem Features](#aptos-ecosystem-features)
  - [Web App Features](#-web-app-features)
- [🧰 Tech Stack](#-tech-stack)
- [🤖 Agent Categories](#-agent-categories)
- [🏠 Self-Hosting](#-self-hosting)
- [🚀 Quick Start](#-quick-start)
- [🧪 How to Use](#-how-to-use)
- [🛠️ Development](#️-development)
- [👥 Community](#-community)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

📖 [View Full Documentation](./docs/README.md)


## 🌟 Overview

ADAS is an innovative open-source project revolutionizing the Aptos DeFi landscape through AI-powered agent swarms. By employing a sophisticated multi-agent system, ADAS streamlines and automates DeFi operations on the Aptos blockchain, offering users a seamless and efficient experience. Its modular design ensures scalability and adaptability, empowering users to navigate the complexities of Aptos DeFi with ease and confidence.

## Video Demo

<div align="center">
  <a href="https://youtu.be/OU0QgKNF1Pw">
    <img src="https://img.youtube.com/vi/OU0QgKNF1Pw/maxresdefault.jpg" alt="ADAS Demo Video" width="600" />
  </a>
  <p><em>Click to watch the ADAS demo video on YouTube</em></p>
</div>

### Why Multi-Agent Systems (MAS)?

Our platform leverages a Multi-Agent System architecture where each agent specializes in specific tasks—from fetching metrics to executing trades—enabling modular, scalable, and efficient operations. This approach ensures:

- **🎯 Specialization**: Optimized performance through task-specific agents
- **📈 Scalability**: Easy addition of new agents and features
- **🛡️ Robustness**: Continued operation even if individual agents fail
- **⚡ Efficiency**: Parallel task execution for improved performance
- **🔄 Adaptability**: Seamless integration with new protocols on Aptos

<div align="center">
  <img src="./assets/architecture.png" alt="ADAS Architecture" width="800" />
  <p><em>ADAS Architecture</em></p>
</div>

## ✨ Features

### Core Features

- 💬 Natural language processing with Markdown formatting support
- 🤖 Multi-Agent System (MAS) architecture
- 🔅 Integrated website & web app with persistent chat history
- 🔗 Support for multiple LLM providers (Anthropic, OpenAI)
- 📚 RAG Knowledge base with Aptos DeFi expertise
- 💰 Real-time prices using CoinGecko API
- 🚀 Real-time TVL using DefiLlama API
- 📊 DEX analytics
- 📈 Data visualization and analytics
- 🚀 Highly extensible plugin architecture
- 📱 Responsive interface with example prompts

### Aptos Ecosystem Features

#### Analytics Module
- 📊 Real-time price data via CoinGecko
- 📈 DEX analytics
- 💹 TVL tracking via DefiLlama
- 💼 Portfolio analytics and tracking with improved formatting
- 📉 Protocol performance metrics
- 📊 Market trend analysis

#### DeFi Operations
- 💼 Portfolio management
- 💰 Wallet management
- 💸 Token transfers
- 💱 DEX operations (Thala)
- 💸 Lending operations (Joule)
- 🌾 Staking operations (Amnis)

### 🖥️ Web App Features
- 🚀 Modern landing page with gradient design
- 📄 Agents directory showcasing specialized AI agents
- 🤖 Chat interface with Markdown support and persistent history
- 📊 Analytics dashboard with protocol distribution
- 💬 Context-aware example prompts based on selected agent

<div align="center">
  <img src="./assets/webapp.png" alt="ADAS Web Interface" width="800" />
  <p><em>ADAS Web Interface</em></p>
</div>

## 🧰 Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, ShadcnUI
- **State Management**: React Context API
- **Build & Deployment**: Vite, Vercel
- **Agent Framework**: ElizaOS
- **Workflow Automation & Orchestration**: n8n
- **Package Management**: pnpm
- **Text Formatting**: Markdown with react-markdown

## 🤖 Agent Categories

### Core Agents
1. **Coordinator Agent**: Multi-agent orchestration and task delegation
2. **Analytics Agent**: Aptos data analysis and visualization
3. **DeFi Agent**: Aptos-specific DeFi operations
4. **Aptos Expert Agent**: Technical guidance and knowledge base

### Internal Agents
5. **Twitter Agent**: Social media management and content creation
   - Manages ADAS Twitter presence
   - Creates engaging content and memes
   - Builds community engagement
   - Tracks social metrics and sentiment
   - *Note: Internal use only, not available in public interfaces*

## 🏠 Self-Hosting

ADAS is and will always be open source! We strongly encourage users to self-host their own instance of ADAS. This gives you full control over your data and agents.

### Requirements for Self-Hosting
- Server or cloud instance (e.g., AWS, DigitalOcean, or your local machine)
- API keys for required services
- Basic knowledge of TypeScript/Node.js for customization

## 🚀 Quick Start

### Prerequisites

- [Node.js 23+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [Git](https://git-scm.com/downloads)
- [pnpm](https://pnpm.io/installation)

### Installation

```bash
# Clone the repository
git clone https://github.com/nicoware-dev/adas
cd adas

# Install dependencies
pnpm install --no-frozen-lockfile

# Build project
pnpm build

# Copy environment file
cp .env.example .env
```

### Configuration

Edit `.env` file and add your credentials:

```env
# Required for blockchain operations
APTOS_PRIVATE_KEY=your_private_key

# LLM Provider (choose one)
ANTHROPIC_API_KEY=                 # For Claude (preferred)
OPENAI_API_KEY=                    # OpenAI API key (backup)

# Client Configuration (optional)
TELEGRAM_BOT_TOKEN=                # Telegram bot token

# Twitter Configuration (internal use only)
TWITTER_API_KEY=                   # Twitter API key
TWITTER_API_SECRET=                # Twitter API secret
TWITTER_ACCESS_TOKEN=              # Twitter access token
TWITTER_ACCESS_SECRET=             # Twitter access token secret
```

## 🧪 How to Use

1. Start the ElizaOS agents:

Core Agents:
```bash
cd eliza
pnpm start --characters="characters/defi-agent.character.json,characters/analytics-agent.character.json,characters/aptos-expert-agent.character.json"
```

For Meme Agent
```bash
cd eliza
pnpm start --characters="characters/meme-agent.character.json"
```

2. Start the web client:
```bash
cd client
pnpm dev
```

3. Access the web interface at `http://localhost:5173`

## 📖 Using ADAS

ADAS provides an intuitive natural language interface for interacting with the Aptos blockchain and its DeFi ecosystem. You can manage your portfolio, execute transactions, analyze market data, and interact with various DeFi protocols through simple text prompts.

### 💬 Example Prompts

<details>
<summary><b>🧮 Portfolio Management</b></summary>

```
Show my portfolio
Check the wallet holdings for 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c
What tokens and NFTs do I have in my wallet?
```
</details>

<details>
<summary><b>💸 Token Operations</b></summary>

```
Check my APT balance
What's my wallet address?
Transfer 0.001 APT to 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c
Get token details for 0x1::aptos_coin::AptosCoin
```
</details>

<details>
<summary><b>🏦 DeFi Operations</b></summary>

```
Lend 0.001 APT on Joule
Stake 0.1 APT on Amnis
Swap 0.01 APT for USDC on Thala
Show my positions on Joule Finance
Check my staking rewards on Amnis Finance
```
</details>

<details>
<summary><b>📊 Analytics & Market Data</b></summary>

```
What's the current price of APT?
What's the TVL of Aptos?
Show me Joule's TVL
What are the top protocols on Aptos?
What are the top 5 pools on Aptos by volume?
```
</details>

### 📚 Full Documentation

For comprehensive instructions on all available features, including:
- Detailed protocol-specific commands
- Analytics operations
- Portfolio management
- NFT operations
- Transaction and account information
- Troubleshooting guidance

**[➡️ View the complete User Guide](./docs/getting-started/user-guide.md)**

The user guide contains copy-pastable prompts for every implemented feature, making it easy to explore all of ADAS's capabilities. It also provides best practices, tips, and troubleshooting advice to enhance your experience.

## 🛠️ Development

### Project Structure

```
adas/
├── assets/            # Project assets and media files
├── docs/              # Documentation
├── eliza/             # ElizaOS agent implementation
│   ├── agent/         # Agent core functionality
│   ├── characters/    # Agent character definitions
│   ├── client/        # Client implementations with Markdown support
│   └── packages/      # ElizaOS packages
│       ├── plugin-aptos/           # Core Aptos blockchain interaction plugin
│       │   └── src/                # Source code for Aptos operations
│       │       └── actions/        # Implementations for 47+ Aptos actions
│       │           ├── joule/      # Joule Finance protocol actions
│       │           ├── amnis/      # Amnis Finance protocol actions
│       │           ├── thala/      # Thala protocol actions
│       │           ├── liquidswap/ # Liquidswap protocol actions
│       │           ├── merkle-trade/ # Merkle Trade protocol actions
│       │           └── aries/      # Aries protocol actions
│       │
│       └── plugin-aptos-analytics/ # Aptos DeFi analytics and market data plugin
│           └── src/                # Source code for analytics operations
│               └── analytics/      # Analytics implementations
│                   ├── coingecko/  # CoinGecko integration for price data
│                   ├── defillama/  # DefiLlama integration for TVL data
│                   ├── geckoterminal/ # GeckoTerminal integration for DEX data
│                   └── utils/      # Utility functions
│
└── n8n/               # n8n workflows and configuration
```

#### Aptos Plugin Features
- **Token Operations**: Transfers, creation, minting, burning
- **NFT Management**: Creation, transfers, burning
- **Wallet Operations**: Balance checking, account info, portfolio viewing
- **DeFi Protocol Integrations**:
  - **Joule Finance**: Lending, borrowing, withdrawal, position tracking
  - **Amnis Finance**: Staking, unstaking operations
  - **Thala Labs**: Token swapping, liquidity operations
  - **Liquidswap**: DEX operations, pool management
  - **Merkle Trade**: Trading positions, order placement
  - **Aries Protocol**: Lending and borrowing

#### Aptos Analytics Plugin Features
- **CoinGecko Integration**: Real-time token prices, market caps, volume data
- **DefiLlama Integration**: Protocol TVL, chain TVL, protocol rankings
- **GeckoTerminal Integration**: DEX pools, trading volumes, liquidity data
- **Market Analysis**: Price trends, TVL changes, protocol comparisons

## 👥 Community

Join our thriving community to get the latest updates, ask questions, and share your experience with ADAS:

- 🐦 [Twitter: @ADAS_DefAI](https://twitter.com/ADAS_DefAI)
- 💬 [Telegram Group](https://t.me/+0BvBZ8KWJQNjZTIx)
- 🎛️ [Telegram Coordinator Bot](https://t.me/adascoordinator_bot)
- 🗨️ [Discord Server](https://discord.gg/G6GaZYzRgN)
- 🌍 [Website](https://adas-rose.vercel.app/)
- 📺 [YouTube](https://youtu.be/OU0QgKNF1Pw)
- 🔗 [LinkTree](https://linktr.ee/adas_ai)
- 🛠 [GitHub Repository](https://github.com/nicoware-dev/adas)
- 📖 [Documentation](https://adas-4.gitbook.io/adas)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
