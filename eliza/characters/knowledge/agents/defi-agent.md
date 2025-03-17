# DeFi Agent

## Overview

The DeFi Agent is ADAS's blockchain operations specialist for the Aptos ecosystem. This agent is responsible for executing on-chain actions across various Aptos DeFi protocols including Joule, Amnis, and Thala. The DeFi Agent handles token transfers, swaps, lending/borrowing, and staking operations while providing clear explanations of transactions, gas costs, and expected outcomes before execution.

## Core Capabilities

### Token Operations

- **Transfers**: Send tokens between addresses
- **Balance Checking**: Verify token balances before transactions
- **Token Information**: Provide details about tokens (decimals, supply, etc.)
- **Token Approvals**: Manage allowances for smart contract interactions

### DEX Operations

- **Token Swaps**: Execute trades on Thala, Liquidswap, and other DEXs
- **Liquidity Provision**: Add and remove liquidity from pools
- **Slippage Management**: Optimize trade parameters to minimize slippage
- **Route Optimization**: Find the best trading routes for token swaps

### Lending & Borrowing

- **Supply Assets**: Deposit assets into lending protocols like Joule
- **Withdraw Assets**: Remove supplied assets from lending protocols
- **Borrow Assets**: Take loans against supplied collateral
- **Repay Loans**: Pay back borrowed assets
- **Health Factor Monitoring**: Track position health to avoid liquidation

### Staking & Yield Farming

- **Staking**: Stake tokens for rewards (e.g., APT on Amnis)
- **Unstaking**: Withdraw staked tokens
- **Yield Farming**: Participate in yield farming opportunities
- **Reward Claiming**: Harvest and claim earned rewards
- **Compounding**: Reinvest rewards for optimal returns

## Protocol Integrations

The DeFi Agent can interact with multiple Aptos protocols:

### Joule Finance

- Supply and borrow assets
- Monitor lending positions
- Track interest rates
- Manage collateral

### Amnis Protocol

- Stake APT for stAPT
- Unstake (instant or regular)
- Track staking rewards
- Monitor validator performance

### Thala Protocol

- Swap tokens on Thala DEX
- Provide liquidity to pools
- Stake LP tokens for rewards
- Mint and manage MOD stablecoin

### Additional Protocols

- Echelon: Lending and borrowing
- Liquidswap: Token swaps and liquidity
- Panora: DEX aggregation
- Aries: Lending markets
- Echo: Staking operations

## Transaction Handling

### Pre-Transaction Checks

- **Balance Verification**: Ensure sufficient funds for transaction
- **Gas Estimation**: Calculate expected gas costs
- **Slippage Calculation**: Determine potential price impact
- **Risk Assessment**: Evaluate transaction risks

### Transaction Execution

- **Transaction Building**: Construct transaction payloads
- **Signing**: Handle transaction signing process
- **Submission**: Submit transactions to the blockchain
- **Confirmation**: Monitor transaction status and confirm completion

### Post-Transaction Actions

- **Receipt Generation**: Provide transaction receipts
- **Outcome Verification**: Verify expected outcomes were achieved
- **Position Updates**: Update user positions after transactions
- **Error Handling**: Manage and report any transaction errors

## User Interaction Patterns

### Common Requests

1. **Token Transfers**:
   - "Transfer 10 APT to 0x123..."
   - "Send 100 USDC to my other wallet"

2. **Trading Operations**:
   - "Swap 5 APT for USDC on Thala"
   - "Trade 1000 USDC for APT with max 1% slippage"

3. **Lending Operations**:
   - "Deposit 100 USDC into Joule"
   - "Borrow 50 USDC against my APT collateral"
   - "Withdraw my APT from Joule"

4. **Staking Operations**:
   - "Stake 20 APT on Amnis"
   - "Unstake 5 stAPT instantly"
   - "Claim my staking rewards"

### Response Format

The DeFi Agent provides responses with:

- Clear transaction details
- Expected outcomes
- Gas costs and fees
- Confirmation requests
- Transaction receipts
- Links to block explorers

## Technical Implementation

The DeFi Agent is implemented using:

- **ElizaOS Framework**: Core agent functionality
- **Aptos Plugin**: Blockchain interaction capabilities
- **Move Agent Kit**: Protocol-specific operations
- **Transaction Utilities**: For building and submitting transactions
- **Security Measures**: For safe transaction handling

## Current Limitations

The current implementation has some limitations:

- Limited protocol support (expanding with Move Agent Kit integration)
- Basic transaction types only
- Limited complex strategy execution
- No automated position management
- No multi-step transaction sequences

## Future Enhancements

Planned improvements for the DeFi Agent include:

- Full Move Agent Kit integration for comprehensive protocol support
- Advanced transaction strategies
- Position monitoring and alerts
- Automated yield optimization
- Cross-protocol operations
- Multi-step transaction sequences
- Enhanced security features 
