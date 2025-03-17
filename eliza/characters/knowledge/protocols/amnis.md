# Amnis Protocol

## Overview

Amnis is a liquid staking protocol on the Aptos blockchain that allows users to stake their APT tokens while maintaining liquidity. When users stake APT through Amnis, they receive stAPT (staked APT) tokens that represent their staked position. These stAPT tokens can be used in other DeFi protocols while the underlying APT continues to earn staking rewards.

## Key Features

- **Liquid Staking**: Stake APT while maintaining liquidity through stAPT tokens
- **Automatic Compounding**: Staking rewards are automatically compounded
- **No Lockup Period**: Unlike native Aptos staking, no lockup period is required
- **Decentralized Validator Set**: Stake is distributed across multiple validators
- **Governance**: Protocol governance through the AMNIS token

## Core Concepts

### Staking

Users deposit APT into the Amnis protocol and receive stAPT tokens in return. The exchange rate between APT and stAPT increases over time as staking rewards accrue, meaning each stAPT token becomes worth more APT over time.

### Unstaking

Users can unstake their APT by returning their stAPT tokens to the protocol. There are two unstaking methods:
1. **Instant Unstaking**: Immediately receive APT but pay a small fee (typically 0.3-0.5%)
2. **Regular Unstaking**: Wait for the unstaking period (typically 14-21 days) and receive the full amount with no fee

### Validator Management

Amnis distributes staked APT across a set of validators based on performance, commission rates, and other factors. The protocol automatically rebalances stake to optimize returns and minimize risk.

## Protocol Parameters

### Staking Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Minimum Stake | 0.1 APT | Minimum amount that can be staked |
| Instant Unstake Fee | 0.3-0.5% | Fee for instant unstaking |
| Regular Unstake Period | 14-21 days | Waiting period for fee-free unstaking |
| Protocol Fee | 10% | Percentage of staking rewards taken as protocol fee |

*Note: Actual values may vary; check the Amnis app for current parameters.*

### Validator Selection Criteria

- **Performance**: Historical uptime and reliability
- **Commission Rate**: Lower rates are preferred
- **Stake Distribution**: Preference for decentralization
- **Governance Participation**: Active participation in Aptos governance

## Smart Contract Interaction

### Main Contracts

- **Staking Contract**: Handles staking and unstaking operations
- **Validator Management Contract**: Manages validator selection and stake distribution
- **Treasury Contract**: Manages protocol fees and rewards
- **Governance Contract**: Handles protocol governance

### Common Operations

#### Stake APT
```move
// Example of staking APT to Amnis
public entry fun stake_apt(
    account: &signer,
    amount: u64,
) {
    // Implementation details
}
```

#### Instant Unstake
```move
// Example of instant unstaking from Amnis
public entry fun instant_unstake(
    account: &signer,
    st_apt_amount: u64,
) {
    // Implementation details
}
```

#### Regular Unstake
```move
// Example of regular unstaking from Amnis
public entry fun regular_unstake(
    account: &signer,
    st_apt_amount: u64,
) {
    // Implementation details
}
```

#### Claim Unstaked APT
```move
// Example of claiming APT after regular unstaking period
public entry fun claim_unstaked(
    account: &signer,
) {
    // Implementation details
}
```

## Risk Considerations

- **Validator Risk**: Poor validator performance can impact staking returns
- **Smart Contract Risk**: Potential for bugs or exploits in the protocol code
- **Slashing Risk**: If validators are slashed, stakers may lose a portion of their stake
- **Exchange Rate Risk**: The value of stAPT relative to other assets may fluctuate

## Integration with ADAS

The ADAS DeFi Agent can interact with Amnis Protocol to:
- Stake APT to receive stAPT
- Track staking rewards and APT/stAPT exchange rate
- Perform unstaking operations (instant or regular)
- Monitor validator performance and distribution
- Suggest optimal staking/unstaking strategies based on market conditions

## Use Cases with Other Protocols

- **Joule Finance**: Use stAPT as collateral to borrow other assets
- **Thala**: Provide liquidity to stAPT/APT pools to earn trading fees
- **Echelon**: Use stAPT in leveraged positions

## Resources

- [Amnis Protocol Website](https://amnis.finance/)
- [Amnis Documentation](https://docs.amnis.finance/)
- [Amnis GitHub](https://github.com/amnis-finance) 
