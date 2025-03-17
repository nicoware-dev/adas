# ADAS n8n Workflows

This directory contains the n8n workflows used for agent orchestration in the ADAS project.

## Overview

n8n is used as the coordinator for the multi-agent system, managing communication between agents and orchestrating complex workflows. The coordinator agent is implemented as a set of n8n workflows that handle:

1. User request routing
2. Agent communication
3. Task delegation
4. Error handling and recovery
5. Monitoring and logging

## Setup Instructions

### Prerequisites

- n8n installed (v1.0.0 or higher)
- Access to ElizaOS agents via REST API
- Required API keys configured in environment variables

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

4. Import the workflow files from this directory

### Configuration

1. Configure the following environment variables in n8n:
   - `ELIZA_API_URL`: URL of the ElizaOS API
   - `ANALYTICS_AGENT_ID`: ID of the Analytics Agent
   - `DEFI_AGENT_ID`: ID of the DeFi Agent
   - `EXPERT_AGENT_ID`: ID of the Aptos Expert Agent
   - `TELEGRAM_BOT_TOKEN`: Token for Telegram integration (optional)

2. Update the webhook URLs in the workflows to match your deployment

## Workflow Files

### Coordinator Agent Workflow

The main workflow that handles user requests and coordinates agent responses.

- **File**: `ADAS_Coordinator_Agent.json`
- **Description**: Routes user requests to appropriate agents, manages conversation context, and handles agent responses.

### Eliza Agent Workflow

Handles communication with ElizaOS agents.

- **File**: `ADAS_Eliza_Agent.json`
- **Description**: Manages API calls to ElizaOS agents, handles authentication, and processes agent responses.

## Usage

1. Activate the workflows in n8n
2. Send requests to the coordinator webhook endpoint
3. Monitor workflow executions in the n8n dashboard

## Customization

You can customize the workflows by:

1. Adding new nodes for additional agents
2. Modifying the routing logic for different use cases
3. Adding integrations with other services
4. Implementing custom error handling

## Troubleshooting

- Check the n8n logs for execution errors
- Verify that all environment variables are correctly set
- Ensure that ElizaOS agents are running and accessible
- Check webhook URLs for correct configuration

## References

- [n8n Documentation](https://docs.n8n.io/)
- [ElizaOS API Documentation](https://elizaos.github.io/eliza/docs/api)
- [HiveFi n8n Implementation](https://github.com/yourusername/hivefi-v2/tree/main/n8n) 