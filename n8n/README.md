# ADAS n8n Workflows

This directory contains the n8n workflows for the ADAS Coordinator Agent, which orchestrates communication between specialized ElizaOS agents.

## Overview

n8n is used specifically for implementing the Coordinator Agent in the ADAS multi-agent system. The Coordinator Agent is responsible for:

1. Analyzing user requests and intent
2. Routing requests to the appropriate specialized agent
3. Managing conversation context and history
4. Handling responses from specialized agents
5. Delivering responses back to users via Telegram

The specialized agents (Analytics, DeFi, and Aptos Expert) are implemented using the ElizaOS framework and are accessed by the Coordinator Agent through REST API endpoints.

## Setup Instructions

### Prerequisites

- n8n installed (v1.0.0 or higher)
- OpenAI API key for the Coordinator Agent's language model
- Telegram Bot Token for user interactions
- Access to ElizaOS agents' endpoints

### Installation

1. Install n8n:
   ```bash
   npm install n8n -g
   ```

2. Start n8n:
   ```bash
   n8n start
   ```

3. Access the n8n dashboard at `http://localhost:5678`

4. Import the workflow files:
   - `ADAS_Coordinator_Agent.json` - Main coordinator workflow
   - `ADAS_Analytics_Agent.json` - Analytics agent connection
   - `ADAS_DeFi_Agent.json` - DeFi agent connection
   - `ADAS_Expert_Agent.json` - Expert agent connection

### Configuration

1. Set up the following credentials in n8n:
   - OpenAI API key for the coordinator's language model
   - Telegram Bot Token for the chat interface

2. Update the ElizaOS agent endpoints in each workflow to match your deployment:
   - Analytics Agent endpoint in `ADAS_Analytics_Agent.json`
   - DeFi Agent endpoint in `ADAS_DeFi_Agent.json`
   - Expert Agent endpoint in `ADAS_Expert_Agent.json`

## Workflow Files

### Coordinator Agent Workflow
- **File**: `ADAS_Coordinator_Agent.json`
- **Purpose**: Main workflow that:
  - Receives user messages via Telegram
  - Analyzes request intent using GPT-4
  - Routes requests to appropriate specialized agents
  - Manages conversation context
  - Returns responses to users

### Agent Connection Workflows
- **Analytics Agent**: `ADAS_Analytics_Agent.json`
- **DeFi Agent**: `ADAS_DeFi_Agent.json`
- **Expert Agent**: `ADAS_Expert_Agent.json`
- **Purpose**: Handle communication with respective ElizaOS agents

## Usage

1. Import all workflow files into n8n
2. Configure OpenAI and Telegram credentials
3. Update ElizaOS agent endpoints
4. Activate the Coordinator Agent workflow
5. Start chatting with your bot on Telegram

## Troubleshooting

- Verify OpenAI API key is valid and has sufficient credits
- Check Telegram Bot Token is correctly configured
- Ensure ElizaOS agents are running and accessible
- Monitor n8n execution logs for any errors
- Verify webhook URLs are correctly set up

## Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api) 