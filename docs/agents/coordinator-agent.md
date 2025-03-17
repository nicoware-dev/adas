# Coordinator Agent

The Coordinator Agent is the central orchestrator of the ADAS system, managing communication and coordination between all other agents. It is implemented using n8n, a powerful workflow automation platform.

## Overview

**Primary Role**: Orchestration and coordination
**Implementation**: n8n workflows
**Location**: `n8n/workflows/`

## Capabilities

The Coordinator Agent serves as the central hub for the ADAS system, with several key responsibilities:

### Request Routing

| Capability | Description | Status |
|------------|-------------|--------|
| Intent Recognition | Identify the user's intent from natural language | ✅ Implemented |
| Agent Selection | Route requests to appropriate specialized agents | ✅ Implemented |
| Multi-agent Coordination | Coordinate responses from multiple agents | ✅ Implemented |
| Fallback Handling | Provide responses when specialized agents fail | ✅ Implemented |

### Conversation Management

| Capability | Description | Status |
|------------|-------------|--------|
| Context Tracking | Maintain conversation context across interactions | ✅ Implemented |
| History Management | Store and retrieve conversation history | ✅ Implemented |
| User Preferences | Remember and apply user preferences | 🔄 In Progress |
| Session Management | Handle multiple concurrent user sessions | ✅ Implemented |

### System Management

| Capability | Description | Status |
|------------|-------------|--------|
| Error Handling | Detect and recover from agent errors | ✅ Implemented |
| Monitoring | Track system performance and agent status | 🔄 In Progress |
| Logging | Record interactions for analysis and debugging | ✅ Implemented |
| Rate Limiting | Prevent abuse through request rate limiting | ✅ Implemented |

## Implementation Details

The Coordinator Agent is implemented using n8n, a workflow automation platform that enables the creation of complex workflows through a visual interface.

### Workflow Architecture

The Coordinator Agent consists of several interconnected workflows:

1. **Main Workflow**: Handles incoming requests, intent recognition, and agent routing
2. **Analytics Workflow**: Manages interactions with the Analytics Agent
3. **DeFi Workflow**: Manages interactions with the DeFi Agent
4. **Expert Workflow**: Manages interactions with the Aptos Expert Agent
5. **Fallback Workflow**: Provides responses when specialized agents are unavailable

### Request Processing Flow

1. User sends a request through a client interface (web, Telegram, etc.)
2. Request is received by the Main Workflow
3. Intent recognition determines the appropriate specialized agent(s)
4. Request is routed to the specialized agent workflow(s)
5. Specialized agent processes the request and returns a response
6. Response is formatted and returned to the user
7. Conversation context is updated

### Integration Points

The Coordinator Agent integrates with:

- **Client Interfaces**: Web client, Telegram bot
- **Specialized Agents**: ElizaOS agents via REST API
- **Storage Systems**: Database for conversation history and user preferences
- **Monitoring Systems**: Logging and performance tracking

## Configuration

The Coordinator Agent can be configured through environment variables and workflow settings:

### Environment Variables

```env
# Agent Endpoints
ANALYTICS_AGENT_ENDPOINT=http://localhost:3001/api
DEFI_AGENT_ENDPOINT=http://localhost:3002/api
EXPERT_AGENT_ENDPOINT=http://localhost:3003/api

# Client Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
WEB_CLIENT_URL=http://localhost:3000

# System Configuration
LOG_LEVEL=info
MAX_REQUESTS_PER_MINUTE=60
```

### Workflow Settings

Each workflow can be configured through the n8n interface:
- Webhook endpoints
- Error handling behavior
- Retry settings
- Timeout values

## Testing

### Test Scenarios

Use these scenarios to test the Coordinator Agent's capabilities:

#### Basic Routing

1. Send a price query: "What's the current price of APT?"
   - Should route to Analytics Agent

2. Send a transfer request: "Transfer 0.1 APT to 0x123..."
   - Should route to DeFi Agent

3. Send a knowledge query: "Explain how Joule Finance works"
   - Should route to Aptos Expert Agent

#### Multi-agent Coordination

1. Send a complex query: "What's the best yield farming strategy on Aptos right now?"
   - Should coordinate between Analytics Agent and Aptos Expert Agent

2. Send a transaction with context: "Swap 1 APT for USDC on the DEX with the best rate"
   - Should coordinate between Analytics Agent and DeFi Agent

3. Send a trading query: "Should I place a limit order for APT on Merkle Trade?"
   - Should coordinate between Analytics Agent and Aptos Expert Agent

4. Send a lending comparison: "Compare Joule Finance and Aries Protocol lending rates"
   - Should coordinate between Analytics Agent and Aptos Expert Agent

#### Error Handling

1. Test with an unavailable agent
   - Should use fallback mechanisms

2. Test with an invalid request
   - Should provide helpful error message

## Deployment

The Coordinator Agent can be deployed in several ways:

### Local Deployment

```bash
cd n8n
pnpm start
```

### Docker Deployment

```bash
docker-compose up -d n8n
```

### Cloud Deployment

The Coordinator Agent can be deployed to cloud platforms like:
- n8n Cloud
- AWS
- Google Cloud
- Azure

## Monitoring and Maintenance

### Monitoring

The Coordinator Agent provides several monitoring points:
- Workflow execution logs
- Error logs
- Performance metrics
- Request/response logs

### Maintenance Tasks

Regular maintenance includes:
- Updating workflow definitions
- Monitoring error rates
- Optimizing performance
- Adding new routing rules as capabilities expand

## Future Development

The Coordinator Agent is continuously being enhanced with new capabilities:

### Short-term Priorities

1. Enhanced intent recognition
2. Improved error recovery
3. Better context management
4. User preference tracking

### Long-term Goals

1. Advanced multi-agent orchestration
2. Predictive routing based on user history
3. Autonomous workflow optimization
4. Integration with additional client interfaces

## Resources

- [n8n Documentation](https://docs.n8n.io/)
- [ElizaOS API Documentation](../../eliza/README.md)
- [ADAS Architecture Overview](../architecture/overview.md)

*Last updated: [Current Date]* 