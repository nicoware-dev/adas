# DeFi Agent

The DeFi Agent is ADAS's blockchain operations specialist for the Aptos ecosystem. It handles all on-chain actions across various Aptos DeFi protocols, including token transfers, swaps, lending/borrowing, and staking operations.

## Overview

**Primary Role**: Execute blockchain operations on Aptos
**Plugin**: `@elizaos-plugins/plugin-aptos`
**Character File**: `eliza/characters/defi-agent.character.json`
**Knowledge Base**: `eliza/characters/knowledge/protocols/`

## Capabilities

The DeFi Agent can perform a wide range of operations on the Aptos blockchain:

### Core Aptos Operations

| Category | Capabilities | Status |
|----------|--------------|--------|
| Token Operations | Transfer APT and other tokens | ✅ Implemented |
| | Check balances | ✅ Implemented |
| | Get token details | ✅ Implemented |
| | Get token prices | ✅ Implemented |
| Token Management | Create new tokens | ✅ Implemented |
| | Mint tokens | ✅ Implemented |
| | Burn tokens | ✅ Implemented |
| NFT Operations | Create NFTs | ✅ Implemented |
| | Transfer NFTs | ⚠️ Partial |
| | Burn NFTs | ⚠️ Partial |
| Account Info | Get account details | ✅ Implemented |
| | Look up transactions | ✅ Implemented |
| | Show account modules | ✅ Implemented |

### Protocol-Specific Operations

#### Joule Finance

| Operation | Description | Status |
|-----------|-------------|--------|
| Deposit | Supply assets to Joule lending pools | ✅ Implemented |
| Borrow | Borrow assets against collateral | ✅ Implemented |
| Repay | Repay borrowed assets | ✅ Implemented |
| Withdraw | Withdraw supplied assets | ✅ Implemented |
| Claim Rewards | Claim JOY token rewards | ✅ Implemented |
| Check Position | View current lending/borrowing position | ✅ Implemented |
| Pool Information | Get details about lending pools | ✅ Implemented |

#### Amnis Finance

| Operation | Description | Status |
|-----------|-------------|--------|
| Stake | Stake APT to receive stAPT | ✅ Implemented |
| Unstake | Unstake APT from stAPT | ✅ Implemented |


#### Liquidswap

| Operation | Description | Status |
|-----------|-------------|--------|
| Swap | Swap tokens on Liquidswap | ✅ Implemented |
| Add Liquidity | Provide liquidity to pools | ⚠️ Partial |
| Remove Liquidity | Remove liquidity from pools | ⚠️ Partial |
| Create Pool | Create new liquidity pools | ⚠️ Partial |

#### Thala Labs

| Operation | Description | Status |
|-----------|-------------|--------|
| Swap | Swap tokens on Thala DEX | ✅ Implemented |
| Add Liquidity | Provide liquidity to Thala pools | ✅ Implemented |
| Remove Liquidity | Remove liquidity from Thala pools | ✅ Implemented |
| Stake | Stake tokens on Thala Protocol | ✅ Implemented |
| Unstake | Unstake tokens from Thala Protocol | ✅ Implemented |

#### Merkle Trade

| Operation | Description | Status |
|-----------|-------------|--------|
| Get Positions | View current trading positions | ✅ Implemented |
| Place Limit Order | Create limit orders at specified price | ✅ Implemented |
| Place Market Order | Execute trades at current market price | ✅ Implemented |
| Close Position | Close existing trading positions | ✅ Implemented |

#### Aries Protocol

| Operation | Description | Status |
|-----------|-------------|--------|
| Create Profile | Create a user profile on Aries Protocol | ✅ Implemented |
| Lend | Lend tokens to Aries lending pools | ✅ Implemented |
| Borrow | Borrow tokens against collateral | ✅ Implemented |
| Repay | Repay borrowed tokens | ✅ Implemented |
| Withdraw | Withdraw lent tokens | ✅ Implemented |

## Implementation Details

The DeFi Agent leverages the Aptos plugin to interact with the Aptos blockchain. The plugin provides a comprehensive set of actions that the agent can use to execute various operations.

### Action Flow

1. User sends a request to the DeFi Agent
2. Agent parses the request to identify the intended operation
3. Agent retrieves relevant information (e.g., token prices, gas estimates)
4. Agent presents transaction details to the user for confirmation
5. Upon confirmation, agent executes the transaction
6. Agent monitors transaction status and reports results

### Security Measures

- Private keys are stored securely and never exposed
- All transactions require explicit user confirmation
- Risk assessments are provided before executing operations
- Comprehensive error handling and recovery mechanisms

## Testing

### Test Prompts

Use these prompts to test the DeFi Agent's capabilities:

#### Core Aptos Actions

```
Transfer 0.001 APT to 0x17a8c3f994621216ad8bac210eb7de3346268696bc14e89e254fd4c7a0c0ed82
Check my APT balance
What's my wallet address?
Get token details for 0x1::aptos_coin::AptosCoin
What's the current price of APT?
```

#### Token Management

```
Create a new token named "MyToken" with symbol "MTK"
Mint 1000 tokens
Burn 500 of my tokens
```

#### NFT Operations

```
Create an NFT called "My First NFT" in collection "My Collection"
Transfer my NFT to 0x123456789abcdef
```

#### Joule Finance

```
Deposit 5 APT on Joule
Borrow 10 USDC from Joule
Repay my USDC loan on Joule
Withdraw 2 APT from Joule
Claim my rewards on Joule Finance
Check my position for APT on Joule
```

#### Amnis Finance

```
Stake 2 APT on Amnis
Unstake 1 APT from Amnis
Check my staking rewards on Amnis
```

#### Liquidswap

```
Swap 0.1 APT for USDC on Liquidswap
Add liquidity with 5 APT and 50 USDC to Liquidswap
```

#### Thala Labs

```
Swap 1 APT for USDC on Thala
Add liquidity with 0.1 APT and 1 USDC to Thala pool
Remove liquidity from Thala APT/USDC pool
Stake 1 APT on Thala
Unstake 0.5 APT from Thala
```

#### Merkle Trade

```
Show my positions on Merkle Trade
Place a limit order to buy 10 APT at $5 on Merkle Trade
Place a market order to sell 5 APT on Merkle Trade
Close my APT/USDC position on Merkle Trade
```

#### Aries Protocol

```
Create a profile on Aries Protocol with name 'Trading Account'
Lend 10 APT on Aries Protocol
Borrow 5 USDC from Aries Protocol
Repay 2 USDC loan on Aries Protocol
Withdraw 5 APT from Aries Protocol
```

## Future Development

The DeFi Agent is continuously being enhanced with new capabilities:

### Short-term Priorities

1. Comprehensive testing of all implemented protocol integrations
2. Error handling improvements for complex transactions
3. Performance optimization for chain operations
4. Enhanced user feedback for transaction status

### Long-term Goals

1. Support for additional Aptos protocols
2. Advanced portfolio management strategies
3. Automated yield optimization
4. Cross-protocol operations

## Resources

- [Aptos Plugin Documentation](../../eliza/packages/plugin-aptos/README.md)
- [Joule Finance Documentation](https://docs.joule.finance/)
- [Amnis Finance Documentation](https://docs.amnis.finance/)
- [Thala Labs Documentation](https://docs.thala.fi/)
- [Merkle Trade Documentation](https://docs.merkle.trade/)
- [Aries Protocol Documentation](https://docs.ariesmarkets.xyz/)

*Last updated: [Current Date]* 