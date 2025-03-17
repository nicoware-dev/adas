# ADAS: Aptos DefAI Agent Swarm

<div align="center">
  <h3>Revolutionizing Aptos DeFi with AI-Powered Agent Swarms</h3>
  <p>Simplify your DeFi experience on Aptos blockchain with the power of Multi-Agent Systems (MAS)</p>
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
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🌟 Overview

ADAS is an innovative open-source project revolutionizing the Aptos DeFi landscape through AI-powered agent swarms. By employing a sophisticated multi-agent system, ADAS streamlines and automates DeFi operations on the Aptos blockchain, offering users a seamless and efficient experience. Its modular design ensures scalability and adaptability, empowering users to navigate the complexities of Aptos DeFi with ease and confidence.

### Why Multi-Agent Systems (MAS)?

Our platform leverages a Multi-Agent System architecture where each agent specializes in specific tasks—from fetching metrics to executing trades—enabling modular, scalable, and efficient operations. This approach ensures:

- **🎯 Specialization**: Optimized performance through task-specific agents
- **📈 Scalability**: Easy addition of new agents and features
- **🛡️ Robustness**: Continued operation even if individual agents fail
- **⚡ Efficiency**: Parallel task execution for improved performance
- **🔄 Adaptability**: Seamless integration with new protocols on Aptos

<div align="center">
  <p><em>ADAS Architecture</em></p>
</div>

## ✨ Features

### Core Features

- 💬 Natural language processing
- 🤖 Multi-Agent System (MAS) architecture
- 🔅 Integrated website & web app
- 🔗 Support for multiple LLM providers (Anthropic, OpenAI)
- 📚 RAG Knowledge base with Aptos DeFi expertise
- 💰 Real-time prices using CoinGecko API
- 🚀 Real-time TVL using DefiLlama API
- 📊 DEX analytics
- 📈 Data visualization and analytics
- 🚀 Highly extensible plugin architecture

### Aptos Ecosystem Features

#### Analytics Module
- 📊 Real-time price data via CoinGecko
- 📈 DEX analytics
- 💹 TVL tracking via DefiLlama
- 💼 Portfolio analytics and tracking
- 📉 Protocol performance metrics
- 📊 Market trend analysis

#### DeFi Operations
- 💰 Wallet management
- 💸 Token transfers
- 💱 DEX operations (Thala)
- 💸 Lending operations (Joule)
- 🌾 Staking operations (Amnis)
- 💼 Portfolio management

### 🖥️ Web App Features
- 🚀 Landing page
- 📄 Agents directory
- 🤖 Chat with agent swarm through web interface
- 👛 Wallet connector
- 📊 Portfolio & analytics dashboards
- 📝 Chat history
- 💬 Example Prompts
- ⚙️ Settings and preferences

## 🧰 Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, ShadcnUI
- **State Management**: React Context API / Zustand
- **Blockchain Integration**: Aptos SDK, Move Agent Kit
- **Build & Deployment**: Vite, Vercel
- **Agent Framework**: ElizaOS
- **Workflow Automation & Orchestration**: n8n
- **Package Management**: pnpm

## 🤖 Agent Categories

### Core Agents
1. **Coordinator Agent**: Multi-agent orchestration and task delegation
2. **Analytics Agent**: Aptos data analysis and visualization
3. **DeFi Agent**: Aptos-specific DeFi operations
4. **Aptos Expert Agent**: Technical guidance and knowledge base

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
cd adas-v0

# Install dependencies
pnpm install

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
```

## 🧪 How to Use

1. Start the ElizaOS agents:

Test Agent:

 ```bash
   cd eliza
    pnpm start --characters="characters/test-agent.character.json"
```

Or, all agents:

```bash
    pnpm start --characters="characters/defi-agent.character.json,characters/analytics-agent.character.json,characters/aptos-expert-agent.character.json"
```


2. Start the web client:
   ```bash
   cd client
   pnpm dev
   ```

4. Access the web interface at `http://localhost:3000`

## 🛠️ Development

### Project Structure

```
adas-v0/
├── assets/            # Project assets and media files
├── docs/              # Documentation
├── eliza/             # ElizaOS agent implementation
│   ├── agent/         # Agent core functionality
│   ├── characters/    # Agent character definitions
│   ├── client/        # Client implementations
│   └── packages/      # ElizaOS packages
├── n8n/               # n8n workflows and configuration
└── resources/         # Development resources and references
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
