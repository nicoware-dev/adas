# Aptos Plugin Testing Guide

This document provides a structured approach to testing all the implemented actions in the Aptos plugin.

## Prerequisites

1. Ensure you have set up the required environment variables:
   ```
   APTOS_PRIVATE_KEY=<Your Aptos private key>
   APTOS_NETWORK=<"mainnet" | "testnet">
   ```

2. Make sure you have some APT tokens in your wallet for testing transactions.

## Testing Process

For each action, follow these steps:
1. Use the provided test prompt
2. Verify the response contains the expected information
3. Check for any errors or unexpected behavior
4. Document any issues found
5. Mark the action as tested in the checklist

## Testing Checklist

Use this checklist to track your testing progress:

### Core Aptos Actions

#### Basic Operations
- [X] TRANSFER_APT - Transfer APT
- [X] CHECK_BALANCE - Check APT balance
- [X] GET_TOKEN_DETAILS - Get token details
- [X] GET_TOKEN_PRICE - Get token price

#### Token Management
- [X] CREATE_TOKEN - Create new token
- [X] MINT_TOKEN - Mint tokens
- [X] BURN_TOKEN - Burn tokens
- [X] TRANSFER_TOKEN - Transfer specific tokens

#### NFT Operations
- [X] CREATE_nft - Create NFT
- [X] TRANSFER_NFT - Transfer NFT
- [ ] BURN_NFT - Burn NFT

#### Account and Transaction Information
- [X] GET_ACCOUNT - Get account info
- [X] GET_TRANSACTION - Look up transaction
- [X] GET_MODULES - Show account modules

### Protocol-Specific Actions

#### Joule Finance
- [X] JOULE_DEPOSIT - Deposit tokens
- [X] JOULE_BORROW - Borrow tokens
- [X] JOULE_REPAY - Repay loan
- [X] JOULE_WITHDRAW - Withdraw tokens
- [X] JOULE_CLAIM_REWARD - Claim rewards
- [X] JOULE_USER_POSITION - Check position
- [X] JOULE_USER_ALL_POSITIONS - Check all positions
- [X] JOULE_POOL_DETAIL - Get pool details
- [ ] JOULE_ALL_POOLS - List all pools

#### Amnis Finance
- [X] AMNIS_STAKE - Stake tokens
- [X] AMNIS_UNSTAKE - Unstake tokens

#### Liquidswap
- [X] LIQUIDSWAP_SWAP - Swap tokens
- [ ] LIQUIDSWAP_ADD_LIQUIDITY - Add liquidity
- [ ] LIQUIDSWAP_REMOVE_LIQUIDITY - Remove liquidity
- [ ] LIQUIDSWAP_CREATE_POOL - Create pool

#### Thala Labs
- [ ] THALA_SWAP - Swap tokens
- [ ] THALA_ADD_LIQUIDITY - Add liquidity
- [ ] THALA_REMOVE_LIQUIDITY - Remove liquidity
- [ ] THALA_STAKE - Stake tokens
- [ ] THALA_UNSTAKE - Unstake tokens

#### Merkle Trade
- [ ] MERKLE_GET_POSITIONS - Get positions
- [ ] MERKLE_PLACE_LIMIT_ORDER - Place limit order
- [ ] MERKLE_PLACE_MARKET_ORDER - Place market order
- [ ] MERKLE_CLOSE_POSITION - Close position

#### Aries Protocol
- [ ] ARIES_CREATE_PROFILE - Create profile
- [ ] ARIES_LEND - Lend tokens
- [ ] ARIES_BORROW - Borrow tokens
- [ ] ARIES_REPAY - Repay loan
- [ ] ARIES_WITHDRAW - Withdraw tokens

## Core Aptos Actions

### Token Operations

| Action | Test Prompt | Expected Result |
|--------|-------------|----------------|
| TRANSFER_TOKEN | `Transfer 0.001 APT to 0x17a8c3f994621216ad8bac210eb7de3346268696bc14e89e254fd4c7a0c0ed82` | Confirmation of transfer with transaction hash |
| CHECK_BALANCE | `Check my APT balance` | Current APT balance displayed |
| GET_TOKEN_DETAILS | `Get token details for 0x1::aptos_coin::AptosCoin` | Token name, symbol, decimals, and other metadata |
| GET_TOKEN_PRICE | `What's the current price of APT?` | Current APT price in USD |

### Token Management

| Action | Test Prompt | Expected Result |
|--------|-------------|----------------|
| CREATE_TOKEN | `Create a new token named "MyToken" with symbol "MTK"` | Confirmation with token address |
| MINT_TOKEN | `Mint 1000 tokens` | Confirmation of minting with transaction hash |
| BURN_TOKEN | `Burn 500 of my tokens at 0x1::coin::CoinType` | Confirmation of burning with transaction hash |
| TRANSFER_TOKEN | `Transfer 100 tokens at 0x1::aptos_coin::AptosCoin to 0x123456789abcdef` | Confirmation of transfer with transaction hash |

### NFT Operations

| Action | Test Prompt | Expected Result |
|--------|-------------|----------------|
| TRANSFER_NFT | `Transfer my NFT at 0x1::aptos_token::TokenId to 0x123456789abcdef` | Confirmation of transfer with transaction hash |
| BURN_NFT | `Burn my NFT at 0x1::aptos_token::TokenId` | Confirmation of burning with transaction hash |

### Account and Transaction Information

| Action | Test Prompt | Expected Result |
|--------|-------------|----------------|
| GET_ACCOUNT | `Get account info for 0x17a8c3f994621216ad8bac210eb7de3346268696bc14e89e254fd4c7a0c0ed82` | Account details including balances and resources |
| GET_TRANSACTION | `Look up transaction 0xb1ba1d22c162c4f694270858828ba6aafeee758f3054a6efc5978c51f08d73ed` | Transaction details including status and events |
| GET_MODULES | `Show me the modules for account 0x17a8c3f994621216ad8bac210eb7de3346268696bc14e89e254fd4c7a0c0ed82` | List of modules published by the account |

## Protocol-Specific Actions

### Joule Finance

| Action | Test Prompt | Expected Result |
|--------|-------------|----------------|
| JOULE_DEPOSIT | `Lend 0.001 APT on Joule` | Confirmation of deposit with transaction hash |
| JOULE_BORROW | `Borrow 0.0001 APT from Joule` | Confirmation of borrowing with transaction hash |
| JOULE_REPAY | `Repay 0.0001 APT loan on Joule` | Confirmation of repayment with transaction hash |
| JOULE_WITHDRAW | `Withdraw 0.001 APT from Joule` | Confirmation of withdrawal with transaction hash |
| JOULE_CLAIM_REWARD | `Claim my rewards on Joule Finance` | Confirmation of claiming rewards with transaction hash |
| JOULE_USER_POSITION | `Check my position for APT on Joule` | Details of user's position for APT |
| JOULE_USER_ALL_POSITIONS | `Show all my positions on Joule Finance` | List of all user positions |
| JOULE_POOL_DETAIL | `What are the details for the USDC pool on Joule?` | Details of the USDC pool |
| JOULE_ALL_POOLS | `Show me all available pools on Joule Finance` | List of all available pools |

### Amnis Finance

| Action | Test Prompt | Expected Result |
|--------|-------------|----------------|
| AMNIS_STAKE | `Stake 0.001 APT on Amnis` | Confirmation of staking with transaction hash |
| AMNIS_UNSTAKE | `Unstake 0.001 APT from Amnis` | Confirmation of unstaking with transaction hash |

### Liquidswap

| Action | Test Prompt | Expected Result |
|--------|-------------|----------------|
| LIQUIDSWAP_SWAP | `Swap 0.001 APT for USDC on Liquidswap` | Confirmation of swap with transaction hash |
| LIQUIDSWAP_ADD_LIQUIDITY | `Add liquidity with 0.001 APT and 0.001 USDC to Liquidswap` | Confirmation of adding liquidity with transaction hash |
| LIQUIDSWAP_REMOVE_LIQUIDITY | `Remove 10 LP tokens from Liquidswap APT/USDC pool` | Confirmation of removing liquidity with transaction hash |
| LIQUIDSWAP_CREATE_POOL | `Create a new Liquidswap pool with 100 USDC and 100 USDT` | Confirmation of pool creation with transaction hash |

### Thala Labs

| Action | Test Prompt | Expected Result |
|--------|-------------|----------------|
| THALA_SWAP | `Swap 1 APT for USDC on Thala` | Confirmation of swap with transaction hash |
| THALA_ADD_LIQUIDITY | `Add liquidity with 0.1 APT and 1 USDC to Thala pool` | Confirmation of adding liquidity with transaction hash |
| THALA_REMOVE_LIQUIDITY | `Remove liquidity from Thala APT/USDC pool` | Confirmation of removing liquidity with transaction hash |
| THALA_STAKE | `Stake 1 APT on Thala` | Confirmation of staking with transaction hash |
| THALA_UNSTAKE | `Unstake 0.5 APT from Thala` | Confirmation of unstaking with transaction hash |

### Merkle Trade

| Action | Test Prompt | Expected Result |
|--------|-------------|----------------|
| MERKLE_GET_POSITIONS | `Show my positions on Merkle Trade` | List of current trading positions |
| MERKLE_PLACE_LIMIT_ORDER | `Place a limit order to buy 10 APT at $5 on Merkle Trade` | Confirmation of limit order placement with transaction hash |
| MERKLE_PLACE_MARKET_ORDER | `Place a market order to sell 5 APT on Merkle Trade` | Confirmation of market order placement with transaction hash |
| MERKLE_CLOSE_POSITION | `Close my APT/USDC position on Merkle Trade` | Confirmation of position closure with transaction hash |

### Aries Protocol

| Action | Test Prompt | Expected Result |
|--------|-------------|----------------|
| ARIES_CREATE_PROFILE | `Create a profile on Aries Protocol with name 'Trading Account'` | Confirmation of profile creation with transaction hash |
| ARIES_LEND | `Lend 10 APT on Aries Protocol` | Confirmation of lending with transaction hash |
| ARIES_BORROW | `Borrow 5 USDC from Aries Protocol` | Confirmation of borrowing with transaction hash |
| ARIES_REPAY | `Repay 2 USDC loan on Aries Protocol` | Confirmation of loan repayment with transaction hash |
| ARIES_WITHDRAW | `Withdraw 5 APT from Aries Protocol` | Confirmation of withdrawal with transaction hash |

## Testing Results Log

Use this section to log any issues or observations during testing:

| Date | Action | Result | Issues/Notes |
|------|--------|--------|-------------|
|      |        |        |             |
|      |        |        |             |
|      |        |        |             |

## Troubleshooting Common Issues

### Transaction Failures
- Check that you have sufficient APT for gas fees
- Verify that token addresses are correct
- Ensure you have sufficient token balances for the operations

### Connection Issues
- Verify that the APTOS_NETWORK environment variable is set correctly
- Check network connectivity to the Aptos blockchain

### Permission Issues
- Ensure that the APTOS_PRIVATE_KEY is correct and has the necessary permissions

## Reporting Bugs

If you encounter any issues during testing, please report them with the following information:
1. Action name
2. Test prompt used
3. Expected behavior
4. Actual behavior
5. Any error messages received
6. Environment details (network, etc.) 
