# Thala Protocol

## Overview

Thala is a comprehensive DeFi protocol on the Aptos blockchain that offers a decentralized exchange (DEX), stablecoin (MOD), and yield farming opportunities. It is designed to provide a full suite of DeFi primitives for the Aptos ecosystem, enabling users to trade, earn yield, and access stable assets.

## Key Components

### Thala DEX

Thala DEX is an automated market maker (AMM) that allows users to swap tokens, provide liquidity, and earn trading fees. It supports multiple pool types:

- **Constant Product Pools**: Standard x*y=k pools similar to Uniswap V2
- **Stable Pools**: Optimized for trading between assets that should have similar values (e.g., stablecoins)
- **Weighted Pools**: Allows for custom weight distributions between assets

### MOD Stablecoin

MOD is an overcollateralized stablecoin backed by a basket of assets. Users can mint MOD by depositing collateral into Thala vaults. The protocol maintains stability through various mechanisms:

- **Overcollateralization**: All MOD is backed by more than 100% collateral
- **Stability Fees**: Fees charged on minted MOD to maintain peg
- **Liquidation Mechanism**: Automatic liquidation of undercollateralized positions

### Yield Farming

Thala offers yield farming opportunities through:

- **Liquidity Mining**: Earn THL tokens by providing liquidity to specific pools
- **Staking**: Stake THL tokens to earn protocol fees and governance rights
- **Boosted Yields**: Lock THL for veTHL to boost farming rewards

## Core Concepts

### Liquidity Provision

Users can provide liquidity to Thala DEX pools by depositing pairs of tokens. In return, they receive LP tokens representing their share of the pool. These LP tokens can be:

- Staked to earn additional THL rewards
- Redeemed to withdraw the underlying assets plus accumulated fees
- Used as collateral in other DeFi protocols

### MOD Minting and Management

To mint MOD:
1. Deposit collateral into a Thala vault
2. Mint MOD up to the allowed loan-to-value ratio
3. Manage position to avoid liquidation if collateral value decreases

### Governance

Thala is governed by THL token holders who can:
- Vote on protocol parameter changes
- Propose new features or modifications
- Decide on fee distribution and treasury management

## Protocol Parameters

### DEX Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Swap Fee | 0.05-0.3% | Fee charged on swaps, varies by pool type |
| LP Fee Share | 70% | Percentage of swap fees distributed to liquidity providers |
| Protocol Fee | 30% | Percentage of swap fees going to protocol treasury |

### MOD Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Collateral Ratio | 150-200% | Required collateralization ratio, varies by asset |
| Stability Fee | 0.5-2% | Annual fee charged on minted MOD |
| Liquidation Penalty | 10-15% | Penalty applied during liquidations |
| Minimum Collateral | Varies | Minimum collateral required to open a vault |

*Note: Actual values may vary; check the Thala app for current parameters.*

## Smart Contract Interaction

### Main Contracts

- **DEX Contracts**: Handle swaps, liquidity provision, and fee collection
- **MOD Contracts**: Manage vaults, minting, and liquidations
- **Staking Contracts**: Handle THL staking and reward distribution
- **Governance Contracts**: Manage protocol governance and parameter updates

### Common Operations

#### Swap Tokens
```move
// Example of swapping tokens on Thala DEX
public entry fun swap_exact_input(
    account: &signer,
    input_token: address,
    output_token: address,
    amount_in: u64,
    min_amount_out: u64,
) {
    // Implementation details
}
```

#### Add Liquidity
```move
// Example of adding liquidity to a Thala pool
public entry fun add_liquidity(
    account: &signer,
    token_a: address,
    token_b: address,
    amount_a_desired: u64,
    amount_b_desired: u64,
    amount_a_min: u64,
    amount_b_min: u64,
) {
    // Implementation details
}
```

#### Mint MOD
```move
// Example of minting MOD stablecoin
public entry fun mint_mod(
    account: &signer,
    collateral_token: address,
    collateral_amount: u64,
    mod_amount: u64,
) {
    // Implementation details
}
```

#### Stake LP Tokens
```move
// Example of staking LP tokens for rewards
public entry fun stake_lp(
    account: &signer,
    pool_id: u64,
    amount: u64,
) {
    // Implementation details
}
```

## Risk Considerations

- **Impermanent Loss**: Liquidity providers may experience impermanent loss due to price changes
- **Smart Contract Risk**: Potential for bugs or exploits in the protocol code
- **Liquidation Risk**: MOD positions may be liquidated if collateral value decreases
- **Market Risk**: Extreme market conditions may affect protocol stability

## Integration with ADAS

The ADAS DeFi Agent can interact with Thala Protocol to:
- Execute token swaps with optimal routing and slippage protection
- Provide liquidity to earn trading fees and THL rewards
- Mint and manage MOD stablecoin positions
- Stake LP tokens and THL for additional yield
- Monitor positions for liquidation risk and suggest adjustments

## Use Cases with Other Protocols

- **Joule Finance**: Use MOD as collateral for borrowing or LP tokens for yield
- **Amnis**: Provide liquidity for stAPT/APT pairs to earn fees
- **Echelon**: Use MOD in leveraged positions

## Resources

- [Thala Protocol Website](https://thala.fi/)
- [Thala Documentation](https://docs.thala.fi/)
- [Thala GitHub](https://github.com/ThalaLabs) 
