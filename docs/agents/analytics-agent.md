# Analytics Agent

The Analytics Agent is ADAS's data analysis specialist for the Aptos blockchain ecosystem. It tracks, analyzes, and visualizes key metrics across the Aptos network and its DeFi protocols, providing comprehensive analytics to help users make informed decisions.

## Overview

**Primary Role**: Data analysis and visualization for Aptos ecosystem
**Plugin**: `@elizaos-plugins/plugin-aptos-analytics`
**Character File**: `eliza/characters/analytics-agent.character.json`
**Knowledge Base**: `eliza/characters/knowledge/protocols/`

## Capabilities

The Analytics Agent provides comprehensive data analysis through integrations with multiple data providers:

### CoinGecko Integration

| Category | Capabilities | Status |
|----------|--------------|--------|
| Token Prices | Get current price of specific tokens | ✅ Implemented |
| | Compare prices of multiple tokens | ✅ Implemented |
| Market Data | Get 24h trading volume | ✅ Implemented |
| | Track price changes over time | ✅ Implemented |
| | Get market capitalization | ✅ Implemented |

### DeFiLlama Integration

| Category | Capabilities | Status |
|----------|--------------|--------|
| TVL Analysis | Get TVL for Aptos chain | ✅ Implemented |
| | Get TVL for specific protocols | ✅ Implemented |
| | Compare TVL across chains | ✅ Implemented |
| | Compare TVL across protocols | ✅ Implemented |
| Protocol Metrics | Get protocol-specific TVL by chain | ✅ Implemented |
| | List top protocols by TVL | ✅ Implemented |
| | Get global DeFi statistics | ✅ Implemented |

### GeckoTerminal Integration

| Category | Capabilities | Status |
|----------|--------------|--------|
| Pool Analysis | Get trending liquidity pools | ✅ Implemented |
| | Get detailed pool information | ✅ Implemented |
| | List top pools by volume/liquidity | ✅ Implemented |
| Token Analysis | Get detailed token information | ✅ Implemented |

## Implementation Details

The Analytics Agent leverages the Aptos Analytics plugin to gather and process data from multiple sources. The plugin provides a comprehensive set of actions that the agent can use to retrieve various metrics.

### Data Sources

1. **CoinGecko API**: Real-time price data and market information
2. **DeFiLlama API**: TVL data across protocols and chains
3. **GeckoTerminal API**: DEX trading data and liquidity information

### Data Processing

The Analytics Agent processes raw data to provide:
- Trend analysis
- Comparative metrics
- Historical performance
- Risk assessments
- Yield opportunities

### Caching Mechanism

To optimize performance and reduce API calls, the Analytics Agent implements caching:
- Token prices: 5-minute TTL
- TVL data: 15-minute TTL
- Pool information: 10-minute TTL

## Testing

### Test Prompts

Use these prompts to test the Analytics Agent's capabilities:

#### CoinGecko Module

```
What's the current price of APT?
Show me the price of Bitcoin
How much is Ethereum worth right now?
Get prices for APT, BTC, and ETH
What's the 24h change for APT?
```

#### DeFiLlama Module

```
What's the TVL of Aptos?
What's the TVL of Thala on Aptos?
Show me Joule's TVL
Get the TVL for Amnis
What are the top protocols on Aptos?
Which protocol has the highest dominance on Aptos?
```

#### GeckoTerminal Module

```
What are the top 5 pools on Aptos by volume?
Which pools have the most trading activity on Aptos?
Show me information about the APT/USDC pool
What's the trading volume for APT today?
```

## Use Cases

The Analytics Agent supports various use cases:

### Market Analysis

- Track price movements of key tokens
- Monitor TVL trends across protocols
- Identify emerging protocols by growth rate
- Compare performance across different chains

### Portfolio Analysis

- Analyze asset distribution
- Calculate portfolio performance metrics
- Identify yield opportunities
- Assess risk exposure

### Protocol Comparison

- Compare APYs across lending protocols
- Analyze liquidity depth across DEXs
- Track fee generation by protocol
- Monitor protocol dominance changes

### Yield Optimization

- Identify highest yielding opportunities
- Compare risk-adjusted returns
- Track yield trends over time
- Suggest portfolio rebalancing

## Integration with Other Agents

The Analytics Agent works closely with other agents in the ADAS system:

- **DeFi Agent**: Provides market data to inform transaction decisions
- **Aptos Expert Agent**: Supplies data to enhance recommendations
- **Coordinator Agent**: Receives analytics requests and delivers insights

## Future Development

The Analytics Agent is continuously being enhanced with new capabilities:

### Short-term Priorities

1. Enhanced portfolio tracking
2. Protocol-specific metrics (e.g., lending utilization, DEX volume)
3. Advanced visualization options
4. Historical trend analysis

### Long-term Goals

1. Predictive analytics
2. Risk scoring system
3. Automated strategy recommendations
4. Custom alert system

## Resources

- [Aptos Analytics Plugin Documentation](../../eliza/packages/plugin-aptos-analytics/README.md)
- [CoinGecko API Documentation](https://www.coingecko.com/en/api/documentation)
- [DeFiLlama API Documentation](https://defillama.com/docs/api)
- [GeckoTerminal API Documentation](https://geckoterminal.com/docs)

*Last updated: [Current Date]* 