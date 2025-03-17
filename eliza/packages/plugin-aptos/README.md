# @elizaos-plugins/plugin-aptos

A plugin for interacting with the Aptos blockchain network within the ElizaOS ecosystem.

## Description

The Aptos plugin enables seamless token transfers and wallet management on the Aptos blockchain. It provides functionality to transfer APT tokens, monitor wallet balances, and interact with various DeFi protocols on the Aptos ecosystem.

## Installation

```bash
pnpm install @elizaos-plugins/plugin-aptos
```

## Configuration

The plugin requires the following environment variables to be set:

```typescript
APTOS_PRIVATE_KEY=<Your Aptos private key>
APTOS_NETWORK=<"mainnet" | "testnet">
```

## Features

### Core Functionality
- Token transfers and wallet management
- Balance checking and monitoring
- Transaction building and submission
- Token creation and management
- NFT transfers and management
- Account and module information
- Portfolio viewing with token values and NFT holdings

### Protocol Integrations
- Joule Finance: Lending, borrowing, withdrawal, repayment and position checking with Move Agent Kit
- Amnis Finance: APT staking and unstaking operations with Move Agent Kit
- Thala Labs: Swapping, liquidity provision, and DEX operations
- Liquidswap: Swapping, liquidity provision, and pool creation
- Merkle Trade: Position management, market orders, and limit orders
- Aries Protocol: User profile management, lending, borrowing, repayment, and withdrawal

## Move Agent Kit Integration

The Move Agent Kit provides a comprehensive set of tools for interacting with the Aptos blockchain and its DeFi ecosystem. This plugin implements many of the features from the Move Agent Kit, ensuring reliable blockchain operations with production-ready code.

## Testing Guide

Use the following prompts to test each feature of the Aptos plugin:

### Core Aptos Actions

#### Token Operations
```
Transfer 0.001 APT to 0x17a8c3f994621216ad8bac210eb7de3346268696bc14e89e254fd4c7a0c0ed82
Check my APT balance
What's my wallet address?
Get token details for 0x4717b796ed683a11c5946ec13aa982fd4304a73906d12a5bb5558d5238a3a15c
What's the current price of APT?
```

#### Token Management
```
Create a new token named "MyToken2" with symbol "MTK2" and 1000 tokens supply and 8 decimals

Mint 1000 MTK2 tokens (address: 0x4717b796ed683a11c5946ec13aa982fd4304a73906d12a5bb5558d5238a3a15c) to 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c

Burn 1 of my TTK tokens (address: 0x4717b796ed683a11c5946ec13aa982fd4304a73906d12a5bb5558d5238a3a15c)

Transfer 100 TTK tokens (address: 0x4717b796ed683a11c5946ec13aa982fd4304a73906d12a5bb5558d5238a3a15c) to 0x17a8c3f994621216ad8bac210eb7de3346268696bc14e89e254fd4c7a0c0ed82
```

#### NFT Operations
```
Create an NFT called "My First NFT" in collection "My Collection"
Create a digital asset named "Awesome Art" with description "My awesome digital artwork" 
Create an NFT called "Gift NFT" and send it to 0x17a8c3f994621216ad8bac210eb7de3346268696bc14e89e254fd4c7a0c0ed82
Transfer my NFT at 0x1::aptos_token::TokenId to 0x123456789abcdef
Burn my NFT at 0x1::aptos_token::TokenId
```

#### Account and Portfolio Information
```
Get account info for 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c
Look up transaction 0xee169de8173ce7f87cecd2859852d519f9b65032f8455e11c4958cc508c39c25
Show me the modules for account 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c
Show my portfolio
Check the wallet holdings for 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c
What tokens and NFTs do I have in my wallet?
```

### Protocol-Specific Actions

#### Joule Finance
```
Lend 0.001 APT on Joule
Borrow 0.001 APT from Joule
Repay 0.001 APT loan on Joule
Withdraw 0.001 APT from Joule
Claim my rewards on Joule Finance
Check my position for APT on Joule
Show all my positions on Joule Finance
What are the details for the USDC pool on Joule?
Show me all available pools on Joule Finance
```

#### Amnis Finance
```
Stake 2 APT on Amnis
Unstake 1 APT from Amnis
Check my staking rewards on Amnis Finance
What's the current APT staking APY on Amnis?
```

#### Liquidswap
```
Swap 10 APT for USDC on Liquidswap
Add liquidity with 5 APT and 50 USDC to Liquidswap
Remove 10 LP tokens from Liquidswap APT/USDC pool
Create a new Liquidswap pool with 100 USDC and 100 USDT
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

## Implemented Actions

### Core Aptos Actions

#### SEND_TOKEN / TRANSFER_TOKEN
Transfers APT tokens or other tokens from the agent's wallet to another address.

#### CHECK_BALANCE
Checks the APT balance of the agent's wallet or a specified address.

#### GET_TOKEN_DETAILS
Retrieves detailed information about a token on the Aptos blockchain.

#### GET_TOKEN_PRICE
Fetches the current price of a token from the Pyth network.

#### GET_TRANSACTION
Looks up transaction details on the Aptos blockchain.

#### CREATE_TOKEN
Creates a new fungible asset token on the Aptos blockchain.

#### MINT_TOKEN
Mints additional tokens to a specified address.

#### BURN_TOKEN
Burns tokens, removing them from circulation.

#### TRANSFER_NFT
Transfers an NFT from the agent's wallet to another address.

#### BURN_NFT
Burns an NFT, permanently removing it from circulation.

#### GET_ACCOUNT
Retrieves account information including balances and resources.

#### GET_MODULES
Retrieves information about modules (smart contracts) published by an account.

#### CREATE_NFT
Creates a collection and mints a new NFT on the Aptos blockchain, with optional transfer to a recipient.

#### PORTFOLIO
Displays a comprehensive view of a wallet's holdings, including token balances with USD values and owned NFTs. Supports both the agent's wallet and specified wallet addresses.

### Joule Finance Actions

#### JOULE_DEPOSIT
Deposits APT or other supported tokens into Joule Finance.

#### JOULE_BORROW
Borrows tokens from Joule Finance.

#### JOULE_REPAY
Repays borrowed tokens on Joule Finance.

#### JOULE_WITHDRAW
Withdraws tokens from Joule Finance.

#### JOULE_CLAIM_REWARD
Claims rewards from Joule Finance using the Move Agent Kit approach.

#### JOULE_USER_POSITION
Retrieves a user's position for a specific token on Joule Finance, including supply and borrow data.

#### JOULE_USER_ALL_POSITIONS
Retrieves all of a user's positions on Joule Finance across multiple tokens.

#### JOULE_POOL_DETAIL
Gets detailed information about a specific pool on Joule Finance, including APY rates and utilization.

#### JOULE_ALL_POOLS
Lists all available pools on Joule Finance.

### Amnis Finance Actions

#### AMNIS_STAKE
Stakes APT tokens on Amnis Finance.

#### AMNIS_UNSTAKE
Unstakes APT tokens from Amnis Finance.

#### AMNIS_CHECK_REWARDS
Checks staking rewards on Amnis Finance.

#### AMNIS_CHECK_APY
Checks current staking APY on Amnis Finance.

### Liquidswap Actions

#### LIQUIDSWAP_SWAP
Swaps tokens on the Liquidswap DEX.

#### LIQUIDSWAP_ADD_LIQUIDITY
Adds liquidity to a Liquidswap pool.

#### LIQUIDSWAP_REMOVE_LIQUIDITY
Removes liquidity from a Liquidswap pool.

#### LIQUIDSWAP_CREATE_POOL
Creates a new Liquidswap pool.

### Thala Labs Actions

#### THALA_SWAP
Swaps tokens on Thala DEX.

#### THALA_ADD_LIQUIDITY
Adds liquidity to Thala pools.

#### THALA_REMOVE_LIQUIDITY
Removes liquidity from Thala pools.

#### THALA_STAKE
Stakes tokens on Thala Protocol.

#### THALA_UNSTAKE
Unstakes tokens from Thala Protocol.

### Merkle Trade Actions

#### MERKLE_GET_POSITIONS
Retrieves a user's current trading positions on Merkle Trade.

#### MERKLE_PLACE_LIMIT_ORDER
Places a limit order on Merkle Trade at a specified price.

#### MERKLE_PLACE_MARKET_ORDER
Places a market order on Merkle Trade at the current market price.

#### MERKLE_CLOSE_POSITION
Closes an existing trading position on Merkle Trade.

### Aries Protocol Actions

#### ARIES_CREATE_PROFILE
Creates a user profile on Aries Protocol, required for using other Aries features.

#### ARIES_LEND
Lends tokens to the Aries Protocol lending pool to earn interest.

#### ARIES_BORROW
Borrows tokens from Aries Protocol against collateral.

#### ARIES_REPAY
Repays borrowed tokens to Aries Protocol.

#### ARIES_WITHDRAW
Withdraws lent tokens from Aries Protocol.

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

## Related Plugins

- [@elizaos-plugins/plugin-aptos-analytics](https://github.com/elizaos/eliza/tree/main/packages/plugin-aptos-analytics) - Analytics plugin for Aptos blockchain providing price data, TVL metrics, and DeFi analytics.

## License

MIT
