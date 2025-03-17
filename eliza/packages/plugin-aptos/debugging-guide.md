# Aptos Plugin Debugging Guide

This guide provides troubleshooting steps for common issues encountered when using the Aptos plugin.

## Common Error Types

### 1. Configuration Errors

#### Symptoms
- "Invalid private key" errors
- "Network not supported" errors
- Actions fail immediately without attempting blockchain interaction

#### Troubleshooting Steps
1. Verify that `APTOS_PRIVATE_KEY` is correctly set and in the proper format
2. Confirm that `APTOS_NETWORK` is set to either "mainnet" or "testnet"
3. Check that the private key corresponds to the account you're trying to use
4. Ensure the environment variables are accessible to the plugin

#### Example Fix
```typescript
// Correct format for environment variables
APTOS_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
APTOS_NETWORK=testnet
```

### 2. Transaction Failures

#### Symptoms
- "Insufficient funds" errors
- "Transaction failed" messages
- Transactions show as failed in the response

#### Troubleshooting Steps
1. Check your wallet balance for sufficient APT to cover gas fees
2. Verify that token addresses are correctly formatted
3. Ensure you have sufficient token balances for the requested operation
4. Check if the transaction requires additional approvals

#### Example Fix
For insufficient funds:
```
// First, add funds to your wallet
Transfer 1 APT to your_wallet_address

// Then retry the original transaction
```

### 3. Contract Interaction Errors

#### Symptoms
- "Function not found" errors
- "Type mismatch" errors
- "Resource not found" errors

#### Troubleshooting Steps
1. Verify that the contract addresses are correct
2. Check if the contract functions exist and have the expected signatures
3. Ensure the parameters being passed match the expected types
4. Confirm that the contract is deployed on the network you're using

#### Example Fix
For incorrect contract address:
```
// Instead of
Stake 2 APT on Amnis using contract 0xincorrect_address

// Use
Stake 2 APT on Amnis
```

### 4. Protocol-Specific Issues

#### Joule Finance

##### Common Issues
- Pool liquidity constraints
- Collateral requirements not met
- Interest rate changes

##### Troubleshooting Steps
1. Check current pool liquidity using `JOULE_POOL_DETAIL`
2. Verify your collateral position with `JOULE_USER_POSITION`
3. Ensure you're using the correct token addresses

#### Amnis Finance

##### Common Issues
- Staking pool capacity limits
- Reward calculation discrepancies
- Unstaking timelock periods

##### Troubleshooting Steps
1. Check current APY using `AMNIS_CHECK_APY`
2. Verify your staking rewards with `AMNIS_CHECK_REWARDS`
3. Ensure you're staking to the correct pool ID

#### Liquidswap

##### Common Issues
- Price impact too high
- Slippage tolerance exceeded
- Pool imbalance issues

##### Troubleshooting Steps
1. Try smaller transaction amounts
2. Check pool liquidity before swapping
3. Verify token pair exists in the protocol

#### Thala Labs

##### Common Issues
- Oracle price feed issues
- Liquidity constraints
- Protocol pauses or upgrades

##### Troubleshooting Steps
1. Check if the protocol is currently active
2. Verify token pair support
3. Try with different token amounts

## Debugging Techniques

### 1. Logging

Enable detailed logging to see what's happening during action execution:

```typescript
// Set environment variable for verbose logging
DEBUG=elizaos:plugin-aptos:*
```

### 2. Transaction Inspection

Use the `GET_TRANSACTION` action to inspect failed transactions:

```
Look up transaction 0x123456789abcdef
```

### 3. Account State Verification

Check your account state before and after operations:

```
Get account info for my_address
```

### 4. Network Testing

Verify you're connected to the correct network:

```
// For testnet testing
Check my APT balance on testnet

// For mainnet operations
Check my APT balance on mainnet
```

## Reporting Issues

When reporting issues with the plugin, please include:

1. The exact prompt used
2. Any error messages received
3. Transaction hash (if available)
4. Network being used (mainnet/testnet)
5. Steps to reproduce the issue
6. Expected vs. actual behavior

Submit issues to the repository with the tag `[plugin-aptos]` for faster resolution.

## Common Action-Specific Fixes

### Token Operations

| Action | Common Issue | Fix |
|--------|--------------|-----|
| TRANSFER_TOKEN | Insufficient funds | Ensure wallet has enough APT for gas + transfer amount |
| CHECK_BALANCE | Wrong address format | Use full address with 0x prefix |
| GET_TOKEN_DETAILS | Token not found | Verify token address exists on the network |
| GET_TOKEN_PRICE | Price feed error | Check if Pyth oracle supports the token |

### Protocol Actions

| Action | Common Issue | Fix |
|--------|--------------|-----|
| JOULE_DEPOSIT | Deposit cap reached | Check pool details for current capacity |
| AMNIS_STAKE | Wrong pool ID | Verify pool ID exists and is accepting stakes |
| LIQUIDSWAP_SWAP | High slippage | Try smaller amounts or adjust slippage tolerance |
| THALA_ADD_LIQUIDITY | Imbalanced provision | Provide tokens in the correct ratio |

## Advanced Troubleshooting

For persistent issues:

1. Try using the Aptos CLI directly to verify if the issue is with the plugin or the blockchain
2. Check the Aptos Explorer for network status and transaction history
3. Verify contract ABIs haven't changed due to protocol upgrades
4. Test with minimal transaction values before attempting larger operations 
