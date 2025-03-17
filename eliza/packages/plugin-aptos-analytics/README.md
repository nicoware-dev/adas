# @elizaos-plugins/plugin-aptos-analytics

A plugin for accessing analytics and market data for the Aptos blockchain and broader crypto ecosystem within the ElizaOS framework.

## Description

The Aptos Analytics plugin provides comprehensive DeFi analytics, token price data, and market information for the Aptos blockchain ecosystem and beyond. It integrates with multiple data providers to offer real-time insights into token prices, protocol TVL, DEX trading data, and market trends.

## Installation

```bash
pnpm install @elizaos-plugins/plugin-aptos-analytics
```

## Analytics Module

The Analytics Module provides real-time market data, price information, and analytics capabilities for the Aptos ecosystem and broader crypto market. This module integrates with three major data providers to offer comprehensive insights:

### CoinGecko Integration

The CoinGecko integration provides real-time price data and market information for cryptocurrencies and tokens.

#### Key Features
- Real-time token price data for APT and other major cryptocurrencies
- Market capitalization information
- 24-hour trading volume statistics
- Price change tracking (24-hour)
- Support for multiple cryptocurrencies with intelligent token name extraction
- Cached responses to minimize API calls and improve performance

### DeFiLlama Integration

The DeFiLlama integration provides comprehensive DeFi analytics by tracking Total Value Locked (TVL) across Aptos protocols and other blockchains.

#### Key Features
- Protocol TVL analysis with historical trends
- Protocol statistics (TVL, volume, fees, revenue)
- Chain-specific TVL data with percentage changes
- Multiple protocol comparison
- Top protocols by chain with dominance metrics
- Global DeFi statistics
- Protocol TVL breakdown by chain

### GeckoTerminal Integration

The GeckoTerminal integration provides DEX trading data and liquidity information for Aptos and other supported networks.

#### Key Features
- Trending pools across supported networks
- Detailed pool information with token pair data
- Top pools by volume and liquidity
- Token information and trading metrics
- Pool analysis with volume and liquidity trends

## Analytics Actions

### CoinGecko Actions

#### GET_TOKEN_PRICE

Retrieves the current price and market data for a specific cryptocurrency or token.

#### GET_MULTIPLE_TOKEN_PRICES

Retrieves current prices and market data for multiple cryptocurrencies or tokens at once.

### DeFiLlama Actions

#### GET_CHAIN_TVL

Gets the current TVL for a specific blockchain, along with percentage changes over different time periods.

#### GET_PROTOCOL_TVL

Gets the current TVL for a specific DeFi protocol on Aptos or other chains.

#### GET_MULTIPLE_CHAIN_TVL

Compares TVL data across multiple blockchains.

#### GET_MULTIPLE_PROTOCOL_TVL

Compares TVL data across multiple DeFi protocols.

#### GET_PROTOCOL_TVL_BY_CHAIN

Gets the TVL of a specific protocol on a specific blockchain, along with the percentage of the protocol's total TVL on that chain.

#### GET_TOP_PROTOCOLS_BY_CHAIN

Gets a list of the top protocols by TVL on a specific blockchain, along with additional information such as category, percentage changes, and dominance.

#### GET_GLOBAL_STATS

Retrieves global DeFi statistics including total TVL, dominance metrics, and trends.

### GeckoTerminal Actions

#### GET_TRENDING_POOLS

Retrieves the currently trending liquidity pools across supported networks or for a specific network.

#### GET_POOL_INFO

Gets detailed information about a specific liquidity pool including token pair, volume, and liquidity.

#### GET_TOP_POOLS

Lists the top liquidity pools by volume or liquidity for a specific network.

#### GET_TOKEN_INFO

Retrieves detailed information about a specific token on a supported network.

## Example Prompts

Here are example prompts you can use to test each feature of the Aptos Analytics plugin:

### CoinGecko Module

#### Token Price Queries
```
What's the current price of APT?
Show me the price of Bitcoin
How much is Ethereum worth right now?
Get prices for APT, BTC, and ETH
What's the 24h change for APT?
```

### DeFiLlama Module

#### Aptos TVL Queries
```
What's the TVL of Aptos?
```

#### Protocol TVL Queries
```
What's the TVL of Thala on Aptos?
Show me Joule's TVL
Get the TVL for Amnis
```

#### Top Protocols by Chain Queries
```
What are the top protocols on Aptos?
Which protocol has the highest dominance on Aptos?
```

### GeckoTerminal Module

#### Top Pools Queries
```
What are the top 5 pools on Aptos by volume?
Which pools have the most trading activity on Aptos?
```


## API Reference

### CoinGecko Actions

#### GET_TOKEN_PRICE

Retrieves the current price and market data for a specific cryptocurrency or token.

**Aliases:**
- TOKEN_PRICE
- PRICE
- CHECK_PRICE

#### GET_MULTIPLE_TOKEN_PRICES

Retrieves current prices and market data for multiple cryptocurrencies or tokens at once.

**Aliases:**
- MULTIPLE_TOKEN_PRICES
- COMPARE_PRICES
- CHECK_MULTIPLE_PRICES

### DeFiLlama Actions

#### GET_CHAIN_TVL

Gets the current TVL for a specific blockchain.

**Aliases:**
- CHAIN_TVL
- TVL_OF_CHAIN
- TOTAL_VALUE_LOCKED
- VALUE_LOCKED
- CHAIN_VALUE

#### GET_PROTOCOL_TVL

Gets the current TVL for a specific DeFi protocol on Aptos or other chains.

**Aliases:**
- PROTOCOL_TVL
- TVL
- CHECK_TVL

#### GET_MULTIPLE_CHAIN_TVL

Compares TVL data across multiple blockchains.

**Aliases:**
- COMPARE_CHAIN_TVL
- MULTIPLE_CHAINS_TVL

#### GET_MULTIPLE_PROTOCOL_TVL

Compares TVL data across multiple DeFi protocols.

**Aliases:**
- COMPARE_PROTOCOL_TVL
- MULTIPLE_PROTOCOLS_TVL

#### GET_PROTOCOL_TVL_BY_CHAIN

Gets the TVL of a specific protocol on a specific blockchain.

**Aliases:**
- PROTOCOL_TVL_ON_SPECIFIC_CHAIN
- CHAIN_SPECIFIC_PROTOCOL_TVL
- PROTOCOL_TVL_FOR_SPECIFIC_CHAIN
- PROTOCOL_TVL_ON_CHAIN
- PROTOCOL_CHAIN_TVL

#### GET_TOP_PROTOCOLS_BY_CHAIN

Gets a list of the top protocols by TVL on a specific blockchain.

**Aliases:**
- TOP_PROTOCOLS
- BIGGEST_PROTOCOLS
- LARGEST_PROTOCOLS
- TOP_PROTOCOLS_BY_CHAIN
- TOP_PROTOCOLS_ON_CHAIN
- CHAIN_TOP_PROTOCOLS

#### GET_GLOBAL_STATS

Retrieves global DeFi statistics.

**Aliases:**
- GLOBAL_STATS
- DEFI_STATS
- GLOBAL_TVL

### GeckoTerminal Actions

#### GET_TRENDING_POOLS

Retrieves the currently trending liquidity pools.

**Aliases:**
- TRENDING_POOLS
- HOT_POOLS
- POPULAR_POOLS

#### GET_POOL_INFO

Gets detailed information about a specific liquidity pool.

**Aliases:**
- POOL_INFO
- POOL_DETAILS
- TRADING_PAIR_INFO

#### GET_TOP_POOLS

Lists the top liquidity pools by volume or liquidity.

**Aliases:**
- TOP_POOLS
- HIGHEST_VOLUME_POOLS
- LARGEST_POOLS

#### GET_TOKEN_INFO

Retrieves detailed information about a specific token.

**Aliases:**
- TOKEN_INFO
- TOKEN_DETAILS
- TOKEN_MARKETS

## Development

```bash
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

## Common Issues & Troubleshooting

1. **Price Fetching Issues**
   - Check connection to CoinGecko API
   - Verify cache functionality (5-minute TTL)
   - Monitor retry mechanism (3 attempts with exponential backoff)
   - Check if token symbol is supported in the mappings

2. **TVL Data Issues**
   - Check connection to DeFiLlama API
   - Verify protocol name is supported in the mappings
   - Ensure chain name is correctly specified
   - Check cache expiration (15-minute TTL)

3. **GeckoTerminal Issues**
   - Verify network ID is supported
   - Check pool ID format for specific pool queries
   - Ensure token address is correctly formatted for token info queries

## Related Plugins

- [@elizaos-plugins/plugin-aptos](https://github.com/elizaos/eliza/tree/main/packages/plugin-aptos) - Core Aptos plugin for blockchain interactions, token transfers, and protocol operations.

## License

MIT
