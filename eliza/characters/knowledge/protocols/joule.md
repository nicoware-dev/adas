# Joule Finance

## Overview

Joule Finance is a premier lending and borrowing protocol on the Aptos blockchain. It allows users to supply assets as collateral and borrow other assets against that collateral. Joule implements an isolated lending model where each market operates independently, providing better risk management compared to shared collateral models.

## Key Features

- **Isolated Lending Markets**: Each market operates independently, limiting risk contagion
- **Multiple Asset Support**: Supports APT, BTC, ETH, USDC, USDT, and other assets
- **Variable Interest Rates**: Interest rates that adjust based on market utilization
- **Liquidation Mechanism**: Automatic liquidation of undercollateralized positions
- **Governance**: Protocol governance through the JOULE token

## Core Concepts

### Supply/Deposit

Users can supply assets to Joule markets. When supplying, users receive jTokens (e.g., jAPT, jUSDC) representing their share of the supplied asset pool. These jTokens accrue interest over time based on the supply APY.

### Borrow

Users can borrow assets against their supplied collateral. Each asset has a collateral factor that determines how much can be borrowed against it. For example, if APT has a 70% collateral factor, users can borrow up to 70% of the value of their supplied APT.

### Health Factor

The health factor represents the safety of a user's position. It is calculated as:
```
Health Factor = (Collateral Value * Collateral Factor) / Borrowed Value
```

A health factor below 1.0 makes the position eligible for liquidation.

### Liquidation

When a user's health factor falls below 1.0, their position can be liquidated. Liquidators repay a portion of the borrowed assets and receive a discount on the collateral, typically 5-10%.

## Protocol Parameters

### Markets

| Asset | Supply APY | Borrow APY | Collateral Factor | Liquidation Threshold |
|-------|------------|------------|-------------------|------------------------|
| APT   | Variable   | Variable   | 70%               | 75%                    |
| USDC  | Variable   | Variable   | 80%               | 85%                    |
| USDT  | Variable   | Variable   | 80%               | 85%                    |
| BTC   | Variable   | Variable   | 75%               | 80%                    |
| ETH   | Variable   | Variable   | 75%               | 80%                    |

*Note: Actual values may vary; check the Joule Finance app for current rates and parameters.*

### Fees

- **Borrow Fee**: 0.1% on borrowed amount
- **Flash Loan Fee**: 0.09% on flash loan amount
- **Liquidation Penalty**: 5-10% depending on the asset

## Smart Contract Interaction

### Main Contracts

- **Market Contract**: Handles deposits, withdrawals, borrows, and repayments
- **Oracle Contract**: Provides price feeds for assets
- **Liquidation Contract**: Manages the liquidation process
- **Governance Contract**: Handles protocol governance

### Common Operations

#### Supply Assets
```move
// Example of supplying APT to Joule
public entry fun supply_apt(
    account: &signer,
    amount: u64,
) {
    // Implementation details
}
```

#### Withdraw Assets
```move
// Example of withdrawing APT from Joule
public entry fun withdraw_apt(
    account: &signer,
    amount: u64,
) {
    // Implementation details
}
```

#### Borrow Assets
```move
// Example of borrowing USDC from Joule
public entry fun borrow_usdc(
    account: &signer,
    amount: u64,
) {
    // Implementation details
}
```

#### Repay Loan
```move
// Example of repaying USDC loan
public entry fun repay_usdc(
    account: &signer,
    amount: u64,
) {
    // Implementation details
}
```

## Risk Considerations

- **Market Risk**: Asset price volatility can lead to liquidations
- **Interest Rate Risk**: Variable interest rates can change based on market conditions
- **Liquidation Risk**: Positions with low health factors risk liquidation
- **Smart Contract Risk**: Potential for bugs or exploits in the protocol code

## Integration with ADAS

The ADAS DeFi Agent can interact with Joule Finance to:
- Check current market conditions and interest rates
- Supply assets to earn interest
- Borrow assets against collateral
- Monitor health factors and suggest adjustments to avoid liquidation
- Execute repayments and withdrawals

## Resources

- [Joule Finance Website](https://joule.finance/)
- [Joule Finance Documentation](https://docs.joule.finance/)
- [Joule Finance GitHub](https://github.com/joule-finance) 
