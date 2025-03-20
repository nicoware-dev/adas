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

Mint 1000 MTK2 tokens (Address: 0x4717b796ed683a11c5946ec13aa982fd4304a73906d12a5bb5558d5238a3a15c) to 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c

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

Total Actions: 47

### Core Aptos Actions (16)

#### Token Actions
1. **BALANCE**
   - Checks token balance on the Aptos blockchain
   - Example: `Check my APT balance`

2. **TRANSFER**
   - Transfers APT from the agent's wallet to another address
   - Example: `Send 10 APT to 0x123...`

3. **TOKEN_TRANSFER**
   - Transfers tokens on the Aptos blockchain
   - Example: `Transfer 100 USDC to 0x456...`

4. **CREATE_TOKEN**
   - Creates a new token on the Aptos blockchain
   - Example: `Create a new token called MyToken with symbol MTK`

5. **MINT_TOKEN**
   - Mints tokens on the Aptos blockchain
   - Example: `Mint 1000 MTK tokens`

6. **BURN_TOKEN**
   - Burns tokens on the Aptos blockchain
   - Example: `Burn 500 MTK tokens`

#### NFT Actions
7. **CREATE_NFT**
   - Creates a new NFT on the Aptos blockchain
   - Example: `Create an NFT called CoolNFT`

8. **TRANSFER_NFT**
   - Transfers an NFT to a recipient
   - Example: `Transfer NFT 0x123... to 0x456...`

9. **BURN_NFT**
   - Burns an NFT on the Aptos blockchain
   - Example: `Burn NFT 0x123...`

#### Information Actions
10. **GET_ACCOUNT**
    - Gets account information from the Aptos blockchain
    - Example: `Get account info for 0x123...`

11. **GET_MODULES**
    - Gets module information from the Aptos blockchain
    - Example: `Show modules for account 0x123...`

12. **GET_TRANSACTION**
    - Gets transaction information from the Aptos blockchain
    - Example: `Get transaction details for 0x123...`

13. **GET_TOKEN_DETAILS**
    - Gets detailed information about a token
    - Example: `Show details for APT token`

14. **GET_TOKEN_PRICE**
    - Gets current price information for a token
    - Example: `What's the price of APT?`

15. **PORTFOLIO**
    - Gets portfolio information for an address
    - Example: `Show my portfolio`

### Joule Finance Actions (9)

1. **JOULE_ALL_POOLS**
   - Gets all pools on Joule Finance
   - Example: `Show all Joule pools`

2. **JOULE_POOL_DETAIL**
   - Gets detailed information about a specific pool
   - Example: `Show APT pool details on Joule`

3. **JOULE_LEND**
   - Lends assets to Joule Finance
   - Example: `Lend 100 APT on Joule`

4. **JOULE_BORROW**
   - Borrows assets from Joule Finance
   - Example: `Borrow 50 USDC from Joule`

5. **JOULE_REPAY**
   - Repays borrowed assets on Joule Finance
   - Example: `Repay 50 USDC to Joule`

6. **JOULE_WITHDRAW**
   - Withdraws lent assets from Joule Finance
   - Example: `Withdraw 100 APT from Joule`

7. **JOULE_CLAIM_REWARD**
   - Claims rewards from Joule Finance
   - Example: `Claim my Joule rewards`

8. **JOULE_USER_POSITION**
   - Gets user position for a specific token
   - Example: `Show my APT position on Joule`

9. **JOULE_USER_ALL_POSITIONS**
   - Gets all user positions
   - Example: `Show all my Joule positions`

### Liquidswap Actions (4)

1. **LIQUIDSWAP_SWAP**
   - Swaps tokens on Liquidswap
   - Example: `Swap 10 APT for USDC on Liquidswap`

2. **LIQUIDSWAP_ADD_LIQUIDITY**
   - Adds liquidity to Liquidswap pools
   - Example: `Add liquidity with 10 APT and 100 USDC to Liquidswap`

3. **LIQUIDSWAP_REMOVE_LIQUIDITY**
   - Removes liquidity from Liquidswap pools
   - Example: `Remove liquidity from APT/USDC pool on Liquidswap`

4. **LIQUIDSWAP_CREATE_POOL**
   - Creates a new Liquidswap pool
   - Example: `Create a new Liquidswap pool with APT and USDC`

### Merkle Trade Actions (6)

1. **MERKLE_GET_POSITIONS**
   - Gets all positions on Merkle Trade
   - Example: `Show my Merkle Trade positions`

2. **MERKLE_PLACE_LIMIT_ORDER**
   - Places a limit order on Merkle Trade
   - Example: `Place limit order for 10 APT at $8`

3. **MERKLE_PLACE_MARKET_ORDER**
   - Places a market order on Merkle Trade
   - Example: `Place market order for 5 APT`

4. **MERKLE_CLOSE_POSITION**
   - Closes a position on Merkle Trade
   - Example: `Close my APT position on Merkle`

### Thala Protocol Actions (5)

1. **THALA_SWAP**
   - Swaps tokens on Thala Protocol
   - Example: `Swap 10 APT for USDC on Thala`

2. **THALA_ADD_LIQUIDITY**
   - Adds liquidity to Thala pools
   - Example: `Add liquidity to Thala APT/USDC pool`

3. **THALA_REMOVE_LIQUIDITY**
   - Removes liquidity from Thala pools
   - Example: `Remove liquidity from Thala APT/USDC pool`

4. **THALA_STAKE**
   - Stakes APT on Thala Protocol
   - Example: `Stake 100 APT on Thala`

5. **THALA_UNSTAKE**
   - Unstakes APT from Thala Protocol
   - Example: `Unstake 50 APT from Thala`

### Amnis Finance Actions (2)

1. **AMNIS_STAKE**
   - Stakes tokens on Amnis Finance
   - Example: `Stake 100 APT on Amnis`

2. **AMNIS_UNSTAKE**
   - Unstakes tokens from Amnis Finance
   - Example: `Unstake 50 APT from Amnis`

### Aries Protocol Actions (5)

1. **ARIES_CREATE_PROFILE**
   - Creates a profile on Aries Protocol
   - Example: `Create profile on Aries`

2. **ARIES_LEND**
   - Lends assets to Aries Protocol
   - Example: `Lend 100 APT on Aries`

3. **ARIES_BORROW**
   - Borrows assets from Aries Protocol
   - Example: `Borrow 50 USDC from Aries`

4. **ARIES_REPAY**
   - Repays borrowed assets on Aries Protocol
   - Example: `Repay 50 USDC to Aries`

5. **ARIES_WITHDRAW**
   - Withdraws lent assets from Aries Protocol
   - Example: `Withdraw 100 APT from Aries`

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
