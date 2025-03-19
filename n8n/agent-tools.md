# ADAS Agent Tools

This document describes the tools available in the ADAS (Aptos DefAI Agent Swarm) system. Each tool represents a specialized agent with specific capabilities.

## analyticsAgent
This tool connects to the Analytics Agent that provides comprehensive market data and DeFi analytics for the Aptos ecosystem.
- Input: Any analytics, metrics, prices, or reporting request for Aptos ecosystem
- Output: Detailed analytics, market data, and visualizations
- Example: "What's the current TVL across all Aptos DeFi protocols?"

#### Capabilities
- Price tracking and analysis (CoinGecko)
- Protocol and Chain TVL metrics (DefiLlama)
- Market trend analysis and sentiment
- Portfolio analysis and tracking
- Protocol performance metrics
- Yield opportunity comparison
- Risk assessment and monitoring
- Custom reporting and visualization
- Historical data analysis
- Market sentiment indicators

#### Implementation Details
- Uses CoinGecko API for price data
- Integrates with DefiLlama for TVL metrics
- Implements custom analytics algorithms
- Provides data visualization tools
- Supports real-time and historical data analysis

## defiAgent
This tool connects to the DeFi Agent that manages all protocol interactions and transactions on Aptos.
- Input: Any DeFi protocol operation or transaction request
- Output: Transaction execution, protocol interaction results, or operational status
- Example: "Supply 100 APT as collateral on Joule Finance"

#### Capabilities
- Protocol interactions (Joule Finance, Amnis, Thala)
- Token swaps and liquidity management
- Lending and borrowing operations
- Staking and yield farming
- LP token management
- Transaction building and submission
- Gas optimization
- Protocol status monitoring
- Error recovery and transaction retry
- Position management

#### Implementation Details
- Direct protocol integration via smart contracts
- Transaction builder and submitter
- Gas estimation and optimization
- Error handling and recovery mechanisms
- Position tracking and management system

## aptosExpertAgent
This tool connects to the Aptos Expert Agent that provides technical expertise and blockchain analysis.
- Input: Any technical question or analysis request about Aptos ecosystem
- Output: Technical explanations, code analysis, and best practices
- Example: "How do I implement a secure Move module for staking?"

#### Capabilities
- Move language expertise and code analysis
- Smart contract security auditing
- Gas estimation and optimization
- Network status monitoring
- Transaction analysis and debugging
- Best practices guidance
- Technical documentation
- Performance optimization
- Resource management
- Blockchain explorer integration

#### Implementation Details
- Move code analyzer and validator
- Security analysis tools
- Network monitoring system
- Documentation generator
- Performance profiling tools 