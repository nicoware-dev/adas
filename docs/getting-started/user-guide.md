# ADAS User Guide

This guide provides detailed instructions on how to use the ADAS (Aptos DefAI Agent Swarm) platform, including example prompts for all implemented features. Whether you're checking your portfolio, executing DeFi operations, or analyzing market data, this guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Core Aptos Operations](#core-aptos-operations)
  - [Wallet and Balance Management](#wallet-and-balance-management)
  - [Token Operations](#token-operations)
  - [NFT Operations](#nft-operations)
  - [Transaction and Account Information](#transaction-and-account-information)
  - [Portfolio Management](#portfolio-management)
- [DeFi Protocol Interactions](#defi-protocol-interactions)
  - [Joule Finance](#joule-finance)
  - [Amnis Finance](#amnis-finance)
  - [Liquidswap](#liquidswap)
  - [Thala Labs](#thala-labs)
  - [Merkle Trade](#merkle-trade)
  - [Aries Protocol](#aries-protocol)
- [Analytics and Market Data](#analytics-and-market-data)
  - [Token Prices](#token-prices)
  - [TVL and Protocol Analytics](#tvl-and-protocol-analytics)
  - [DEX and Pool Analytics](#dex-and-pool-analytics)
- [Tips and Best Practices](#tips-and-best-practices)
- [Troubleshooting](#troubleshooting)

## Getting Started

ADAS utilizes a natural language interface, allowing you to interact with the Aptos blockchain and its DeFi ecosystem using simple, conversational prompts. When communicating with ADAS, keep the following in mind:

1. **Be specific**: Include token symbols, amounts, and addresses when relevant
2. **One operation at a time**: Focus each prompt on a single action or query
3. **Confirm transactions**: Always review transaction details before confirming
4. **Utilize Markdown**: Chat responses support Markdown formatting for better readability

## Core Aptos Operations

### Wallet and Balance Management

Check your wallet address and balances:

```
What's my wallet address?
```

```
Check my APT balance
```

```
What's my USDC balance?
```

Transfer tokens to another address:

```
Transfer 0.001 APT to 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c
```

```
Send 5 USDC to 0x17a8c3f994621216ad8bac210eb7de3346268696bc14e89e254fd4c7a0c0ed82
```

### Token Operations

Get token details and prices:

```
Get token details for 0x1::aptos_coin::AptosCoin
```

```
What's the current price of APT?
```

Create and manage tokens:

```
Create a new token named "MyToken" with symbol "MTK" and supply of 1000
```

```
Mint 100 MTK tokens to 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c
```

```
Burn 10 MTK tokens
```

```
Transfer 50 MTK tokens to 0x17a8c3f994621216ad8bac210eb7de3346268696bc14e89e254fd4c7a0c0ed82
```

### NFT Operations

Create and manage NFTs:

```
Create an NFT called "My First NFT" in collection "My Collection"
```

```
Create a digital asset named "Awesome Art" with description "My awesome digital artwork"
```

```
Create an NFT called "Gift NFT" and send it to 0x17a8c3f994621216ad8bac210eb7de3346268696bc14e89e254fd4c7a0c0ed82
```

```
Transfer my NFT at [token_id] to 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c
```

### Transaction and Account Information

Retrieve transaction and account details:

```
Look up transaction 0xb1ba1d22c162c4f694270858828ba6aafeee758f3054a6efc5978c51f08d73ed
```

```
Get account info for 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c
```

```
Show me the modules for account 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c
```

### Portfolio Management

View your complete portfolio with token values and NFT holdings:

```
Show my portfolio
```

```
Check the wallet holdings for 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c
```

```
What tokens and NFTs do I have in my wallet?
```

## DeFi Protocol Interactions

### Joule Finance

Lending and borrowing operations on Joule Finance:

```
Lend 0.001 APT on Joule
```

```
Borrow 0.0001 APT from Joule
```

```
Repay 0.0001 APT loan on Joule
```

```
Withdraw 0.001 APT from Joule
```

```
Claim my rewards on Joule Finance
```

View positions and pool information:

```
Check my position for APT on Joule
```

```
Show all my positions on Joule Finance
```

```
What are the details for the USDC pool on Joule?
```

```
Show me all available pools on Joule Finance
```

### Amnis Finance

Staking operations on Amnis Finance:

```
Stake 0.1 APT on Amnis
```

```
Unstake 0.05 APT from Amnis
```

```
Check my staking rewards on Amnis Finance
```

```
What's the current APT staking APY on Amnis?
```

### Liquidswap

DEX operations on Liquidswap:

```
Swap 0.01 APT for USDC on Liquidswap
```

```
Add liquidity with 0.1 APT and 1 USDC to Liquidswap
```

```
Remove 0.5 LP tokens from Liquidswap APT/USDC pool
```

```
Create a new Liquidswap pool with 10 USDC and 10 USDT
```

### Thala Labs

DEX and staking operations on Thala Labs:

```
Swap 0.01 APT for USDC on Thala
```

```
Add liquidity with 0.05 APT and 0.5 USDC to Thala pool
```

```
Remove liquidity from Thala APT/USDC pool
```

```
Stake 0.1 APT on Thala
```

```
Unstake 0.05 APT from Thala
```

### Merkle Trade

Trading operations on Merkle Trade:

```
Show my positions on Merkle Trade
```

```
Place a limit order to buy 1 APT at $5 on Merkle Trade
```

```
Place a market order to sell 0.5 APT on Merkle Trade
```

```
Close my APT/USDC position on Merkle Trade
```

### Aries Protocol

Lending and borrowing operations on Aries Protocol:

```
Create a profile on Aries Protocol with name 'Trading Account'
```

```
Lend 0.1 APT on Aries Protocol
```

```
Borrow 0.5 USDC from Aries Protocol
```

```
Repay 0.2 USDC loan on Aries Protocol
```

```
Withdraw 0.05 APT from Aries Protocol
```

## Analytics and Market Data

### Token Prices

Get real-time token prices:

```
What's the current price of APT?
```

```
Show me the price of Bitcoin
```

```
How much is Ethereum worth right now?
```

```
Get prices for APT, BTC, and ETH
```

```
What's the 24h change for APT?
```

### TVL and Protocol Analytics

Get TVL (Total Value Locked) data:

```
What's the TVL of Aptos?
```

```
What's the TVL of Thala on Aptos?
```

```
Show me Joule's TVL
```

```
Get the TVL for Amnis
```

```
What are the top protocols on Aptos?
```

```
Which protocol has the highest dominance on Aptos?
```

### DEX and Pool Analytics

Get DEX trading data:

```
What are the top 5 pools on Aptos by volume?
```

```
Which pools have the most trading activity on Aptos?
```

```
Show me the trading volume for the APT/USDC pool on Thala
```

```
What's the liquidity in the USDC/USDT pool on Liquidswap?
```

## Tips and Best Practices

1. **Start with small amounts**: When testing new DeFi operations, use small amounts to minimize risk
2. **Double-check addresses**: Always verify recipient addresses before confirming transfers
3. **Monitor gas fees**: Be aware that all transactions require APT for gas fees
4. **Portfolio tracking**: Use the portfolio command regularly to monitor your holdings
5. **Be specific**: When interacting with protocols, specify token amounts and pools clearly
6. **Utilize analytics**: Check prices and TVL before making significant DeFi decisions
7. **Read transaction details**: Always review transaction details before confirming

## Troubleshooting

**Transaction Failures**

If a transaction fails, check the following:
- Sufficient APT balance for gas fees
- Correct token addresses and amounts
- Required protocol approvals
- Network congestion (try again later)

**Price or TVL Data Issues**

If analytics data isn't loading:
- Verify the token symbol or protocol name is correct
- Try again later as the data providers might be experiencing issues
- Use alternative commands to get similar information

**Portfolio Display Issues**

If your portfolio isn't displaying correctly:
- Ensure your wallet address is correctly set up
- Try viewing specific token balances individually
- Check transaction history to verify recent operations

---

This guide covers the most common operations available in ADAS. As new features are added, this document will be updated accordingly. For technical support or to report issues, please contact our team or submit an issue on GitHub.
