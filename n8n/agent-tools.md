# ADAS Agent Tools

This document describes the tools available to each specialized agent in the ADAS (Aptos DefAI Agent Swarm) system. These tools are implemented as n8n nodes that enable agents to perform specific functions.

## Analytics Agent Tools

### Market Data Tools

1. **CoinGecko Price Fetcher**
   - **Description**: Fetches current and historical price data for cryptocurrencies
   - **Parameters**:
     - `coin_id`: Identifier for the cryptocurrency (e.g., "aptos", "bitcoin")
     - `vs_currency`: Currency to compare against (e.g., "usd", "btc")
     - `days`: Number of days for historical data (optional)
   - **Returns**: Current price, 24h change, market cap, and historical data if requested

2. **DefiLlama Protocol Analyzer**
   - **Description**: Retrieves TVL (Total Value Locked) and other metrics for DeFi protocols
   - **Parameters**:
     - `protocol_id`: Identifier for the protocol (e.g., "joule-finance", "thala")
     - `chain`: Blockchain to filter by (default: "aptos")
   - **Returns**: TVL, 24h change, 7d change, protocol details

3. **Portfolio Analyzer**
   - **Description**: Analyzes wallet holdings and provides portfolio metrics
   - **Parameters**:
     - `wallet_address`: Aptos wallet address to analyze
   - **Returns**: Token holdings, portfolio value, allocation percentages, performance metrics

4. **Market Trend Analyzer**
   - **Description**: Identifies market trends and provides sentiment analysis
   - **Parameters**:
     - `asset`: Asset to analyze (e.g., "apt", "btc")
     - `timeframe`: Timeframe for analysis (e.g., "1d", "1w", "1m")
   - **Returns**: Trend direction, strength indicators, support/resistance levels, sentiment score

## DeFi Agent Tools

### Protocol Interaction Tools

1. **Joule Finance Operations**
   - **Description**: Interacts with Joule Finance lending protocol
   - **Operations**:
     - `supply`: Supply assets to Joule
     - `withdraw`: Withdraw supplied assets
     - `borrow`: Borrow assets against collateral
     - `repay`: Repay borrowed assets
     - `get_markets`: Get available markets and rates
   - **Parameters**: Vary by operation (asset, amount, etc.)

2. **Amnis Operations**
   - **Description**: Interacts with Amnis staking protocol
   - **Operations**:
     - `stake`: Stake tokens
     - `unstake`: Unstake tokens
     - `claim_rewards`: Claim staking rewards
     - `get_pools`: Get available staking pools
   - **Parameters**: Vary by operation (pool_id, amount, etc.)

3. **Thala Operations**
   - **Description**: Interacts with Thala DEX and staking
   - **Operations**:
     - `swap`: Swap tokens on Thala DEX
     - `add_liquidity`: Add liquidity to pools
     - `remove_liquidity`: Remove liquidity from pools
     - `stake_lp`: Stake LP tokens
     - `get_pools`: Get available pools and rates
   - **Parameters**: Vary by operation (tokens, amounts, slippage, etc.)

4. **Transaction Builder**
   - **Description**: Builds and submits transactions to the Aptos blockchain
   - **Parameters**:
     - `transaction_payload`: Payload for the transaction
     - `sender_address`: Address of the transaction sender
     - `max_gas_amount`: Maximum gas to use (optional)
   - **Returns**: Transaction hash and status

## Aptos Expert Agent Tools

### Knowledge and Analysis Tools

1. **Move Code Analyzer**
   - **Description**: Analyzes Move code and provides explanations
   - **Parameters**:
     - `code`: Move code to analyze
   - **Returns**: Code explanation, potential issues, optimization suggestions

2. **Aptos Explorer**
   - **Description**: Fetches data from Aptos Explorer
   - **Parameters**:
     - `query_type`: Type of query (transaction, account, module)
     - `query_value`: Value to query (hash, address, module name)
   - **Returns**: Detailed information about the queried item

3. **Gas Estimator**
   - **Description**: Estimates gas costs for Aptos transactions
   - **Parameters**:
     - `transaction_type`: Type of transaction
     - `parameters`: Transaction parameters
   - **Returns**: Estimated gas cost in APT and USD

4. **Network Status**
   - **Description**: Provides Aptos network status and metrics
   - **Parameters**:
     - `metrics`: Specific metrics to retrieve (optional)
   - **Returns**: TPS, block time, validator status, network health

## Integration Tools (Available to All Agents)

1. **Context Manager**
   - **Description**: Manages conversation context and history
   - **Operations**:
     - `get_context`: Retrieves current conversation context
     - `update_context`: Updates conversation context
     - `clear_context`: Clears specific context data

2. **Agent Router**
   - **Description**: Routes requests to specific agents
   - **Parameters**:
     - `target_agent`: Agent to route to
     - `query`: Query to send to the agent
   - **Returns**: Agent response

3. **Response Formatter**
   - **Description**: Formats responses for consistent user experience
   - **Parameters**:
     - `response_data`: Data to format
     - `format_type`: Type of formatting to apply
   - **Returns**: Formatted response

4. **Error Handler**
   - **Description**: Handles errors and provides recovery options
   - **Parameters**:
     - `error`: Error to handle
     - `context`: Context in which the error occurred
   - **Returns**: Error message and recovery suggestions 