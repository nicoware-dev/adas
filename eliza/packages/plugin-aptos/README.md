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

### Protocol Integrations
- Joule Finance: Deposit, borrow, and lending operations
- Amnis Finance: Staking and yield farming
- Thala Labs: Swapping, liquidity provision, and DEX operations
- Liquidswap: Swapping, liquidity provision, and pool creation

## Move Agent Kit Integration

The Move Agent Kit provides a comprehensive set of tools for interacting with the Aptos blockchain and its DeFi ecosystem. This plugin implements many of the features from the Move Agent Kit.

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

#### Account and Transaction Information
```
Get account info for 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c
Look up transaction 0xee169de8173ce7f87cecd2859852d519f9b65032f8455e11c4958cc508c39c25
Show me the modules for account 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c
```

### Protocol-Specific Actions

#### Joule Finance
```
Deposit 5 APT on Joule
Borrow 10 USDC from Joule
Repay my USDC loan on Joule
Withdraw 2 APT from Joule
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
Add liquidity to Thala APT/USDC pool
Check my Thala LP positions
Remove liquidity from Thala
What's the current APT/USDC exchange rate on Thala?
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
Claims rewards from Joule Finance.

#### JOULE_USER_POSITION
Retrieves a user's position for a specific token on Joule Finance.

#### JOULE_USER_ALL_POSITIONS
Retrieves all of a user's positions on Joule Finance.

#### JOULE_POOL_DETAIL
Gets detailed information about a specific pool on Joule Finance.

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
