# Aptos Plugin Quick-Start Testing Guide

This guide provides a streamlined approach to quickly test the core functionality of the Aptos plugin.

## Setup

1. **Environment Configuration**
   ```
   APTOS_PRIVATE_KEY=<Your Aptos private key>
   APTOS_NETWORK=testnet  # Start with testnet for safety
   ```

2. **Get Testnet Tokens**
   - Visit the [Aptos Faucet](https://aptoslabs.com/testnet-faucet) to get testnet APT
   - Request: `0.5 APT to your_wallet_address`

## Essential Tests (15-minute check)

Run these tests in sequence to verify basic functionality:

### 1. Balance Check
```
Check my APT balance
```
✓ Expected: Shows your current APT balance

### 2. Token Details
```
Get token details for 0x1::aptos_coin::AptosCoin
```
✓ Expected: Shows APT token details including name, symbol, and decimals

### 3. Token Price
```
What's the current price of APT?
```
✓ Expected: Shows current APT price in USD

### 4. Small Transfer
```
Transfer 0.001 APT to 0x17a8c3f994621216ad8bac210eb7de3346268696bc14e89e254fd4c7a0c0ed82
```
✓ Expected: Confirms transfer with transaction hash

### 5. Transaction Lookup
```
Look up transaction <hash_from_previous_step>
```
✓ Expected: Shows details of your recent transaction

## Protocol Tests (30-minute check)

If the essential tests pass, try these protocol-specific tests:

### Joule Finance
```
Show me all available pools on Joule Finance
```
✓ Expected: Lists available pools on Joule

### Amnis Finance
```
What's the current APT staking APY on Amnis?
```
✓ Expected: Shows current APY information

### Liquidswap
```
Show me the liquidity pools on Liquidswap
```
✓ Expected: Lists available pools on Liquidswap

### Thala Labs
```
What's the current APT/USDC exchange rate on Thala?
```
✓ Expected: Shows current exchange rate

## Common Issues & Quick Fixes

### "Invalid private key" error
- Ensure private key is in the correct format (with 0x prefix)
- Check that the key has no extra spaces or characters

### "Network not supported" error
- Verify APTOS_NETWORK is set to either "mainnet" or "testnet"

### "Insufficient funds" error
- Get more testnet tokens from the faucet
- Try a smaller amount for the transaction

### "Transaction failed" error
- Check transaction details using GET_TRANSACTION
- Verify token addresses are correct

## Next Steps

If all quick tests pass:
1. Proceed to the comprehensive [test-actions.md](./test-actions.md) guide
2. Use the checklist to methodically test all actions
3. Document any issues in the testing results log

If tests fail:
1. Consult the [debugging-guide.md](./debugging-guide.md) for detailed troubleshooting
2. Check the implementation status in [implementation-status.md](./implementation-status.md)

## Quick Reference: Test Addresses

- Aptos Coin: `0x1::aptos_coin::AptosCoin`
- USDC (testnet): `0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T`
- Test Recipient: `0x17a8c3f994621216ad8bac210eb7de3346268696bc14e89e254fd4c7a0c0ed82` 
