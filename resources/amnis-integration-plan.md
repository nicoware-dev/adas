# Amnis Finance Integration Plan

## Overview

This document outlines the detailed implementation plan for integrating Amnis Finance staking operations from Move Agent Kit into the ADAS Aptos Plugin. Amnis Finance is a liquid staking protocol on Aptos that allows users to stake APT tokens and receive stAPT tokens in return, which can be used in other DeFi protocols while still earning staking rewards.

## Amnis Finance Operations in Move Agent Kit

Based on the analysis of Move Agent Kit's source code, Amnis Finance operations are implemented in the following files:

- `src/tools/amnis/stake-token.ts`: Stake APT tokens on Amnis
- `src/tools/amnis/withdraw-stake.ts`: Withdraw staked APT tokens from Amnis

These operations are exposed through the `AgentRuntime` class in `src/agent.ts` with methods like:
- `stakeTokensWithAmnis()`
- `withdrawStakeFromAmnis()`

## Implementation Plan

### 1. Core Dependencies

First, we need to ensure we have the necessary dependencies:

```json
{
  "dependencies": {
    "move-agent-kit": "^0.2.0"
  },
  "peerDependencies": {
    "@aptos-labs/ts-sdk": "^1.33.1"
  }
}
```

### 2. Adapter Implementation

#### 2.1 Create Amnis Finance Adapter

```typescript
// src/adapters/amnis-adapter.ts
import { AgentRuntime } from 'move-agent-kit';
import { AccountAddress } from '@aptos-labs/ts-sdk';

export class AmnisAdapter {
  constructor(private agentRuntime: AgentRuntime) {}

  /**
   * Stake APT tokens on Amnis
   * @param amount Amount of APT to stake
   * @param to Recipient address (defaults to sender)
   * @returns Transaction hash
   */
  async stake(amount: number, to?: string | AccountAddress): Promise<string> {
    // If no recipient is provided, use the sender's address
    const recipient = to || this.agentRuntime.account.getAddress();
    
    // Convert string address to AccountAddress if needed
    const recipientAddress = typeof recipient === 'string' 
      ? recipient as AccountAddress 
      : recipient;
    
    return this.agentRuntime.stakeTokensWithAmnis(recipientAddress, amount);
  }

  /**
   * Withdraw staked APT tokens from Amnis
   * @param amount Amount of stAPT to withdraw
   * @param to Recipient address (defaults to sender)
   * @returns Transaction hash
   */
  async withdraw(amount: number, to?: string | AccountAddress): Promise<string> {
    // If no recipient is provided, use the sender's address
    const recipient = to || this.agentRuntime.account.getAddress();
    
    // Convert string address to AccountAddress if needed
    const recipientAddress = typeof recipient === 'string' 
      ? recipient as AccountAddress 
      : recipient;
    
    return this.agentRuntime.withdrawStakeFromAmnis(recipientAddress, amount);
  }

  /**
   * Get stAPT balance for an address
   * Note: This is a custom implementation as Move Agent Kit doesn't provide this directly
   * @param address Address to check
   * @returns stAPT balance
   */
  async getStakedBalance(address?: string | AccountAddress): Promise<number> {
    const targetAddress = address || this.agentRuntime.account.getAddress();
    
    // The stAPT token address on Aptos
    const stAptTokenAddress = "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::staking::StakedAptos";
    
    // Use the getBalance method to check stAPT balance
    const balance = await this.agentRuntime.getBalance(stAptTokenAddress);
    
    return balance.amount;
  }

  /**
   * Get current stAPT/APT exchange rate
   * Note: This is a custom implementation as Move Agent Kit doesn't provide this directly
   * @returns Exchange rate (how much APT 1 stAPT is worth)
   */
  async getExchangeRate(): Promise<number> {
    // This would require a custom implementation to query the Amnis contract
    // For now, we'll return a placeholder
    // In a real implementation, we would query the contract directly
    
    // Placeholder implementation
    return 1.05; // Example: 1 stAPT = 1.05 APT
  }
}
```

### 3. Action Implementations

#### 3.1 Stake Action

```typescript
// src/actions/amnis/stake.ts
import { Content } from '../../types';
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { AmnisAdapter } from '../../adapters/amnis-adapter';

export interface StakeContent extends Content {
  amount: number | string;
  recipient?: string;
}

export async function stakeWithAmnis(content: StakeContent): Promise<any> {
  const { amount, recipient } = content;
  
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const amnisAdapter = new AmnisAdapter(agentRuntime);
  
  // Convert amount to number if it's a string
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Stake APT
  const hash = await amnisAdapter.stake(amountNum, recipient);
  
  return {
    success: true,
    hash,
    message: `Successfully staked ${amountNum} APT on Amnis Finance.`
  };
}
```

#### 3.2 Withdraw Action

```typescript
// src/actions/amnis/withdraw.ts
import { Content } from '../../types';
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { AmnisAdapter } from '../../adapters/amnis-adapter';

export interface WithdrawContent extends Content {
  amount: number | string;
  recipient?: string;
}

export async function withdrawFromAmnis(content: WithdrawContent): Promise<any> {
  const { amount, recipient } = content;
  
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const amnisAdapter = new AmnisAdapter(agentRuntime);
  
  // Convert amount to number if it's a string
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Withdraw staked APT
  const hash = await amnisAdapter.withdraw(amountNum, recipient);
  
  return {
    success: true,
    hash,
    message: `Successfully withdrew ${amountNum} stAPT from Amnis Finance.`
  };
}
```

### 4. Provider Implementations

#### 4.1 Staking Information Provider

```typescript
// src/providers/amnis/staking.ts
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { AmnisAdapter } from '../../adapters/amnis-adapter';

export interface StakingInfo {
  stakedBalance: number;
  exchangeRate: number;
  aptEquivalent: number;
}

export async function getAmnisStakingInfo(address?: string): Promise<StakingInfo> {
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const amnisAdapter = new AmnisAdapter(agentRuntime);
  
  // Get staked balance
  const stakedBalance = await amnisAdapter.getStakedBalance(address);
  
  // Get exchange rate
  const exchangeRate = await amnisAdapter.getExchangeRate();
  
  // Calculate APT equivalent
  const aptEquivalent = stakedBalance * exchangeRate;
  
  return {
    stakedBalance,
    exchangeRate,
    aptEquivalent
  };
}
```

#### 4.2 APT Balance Provider Enhancement

```typescript
// src/providers/token/balance.ts
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { AmnisAdapter } from '../../adapters/amnis-adapter';

export interface TokenBalance {
  token: string;
  balance: number;
}

export interface AptBalances {
  apt: number;
  stApt: number;
  totalAptEquivalent: number;
}

export async function getTokenBalance(address: string, mint?: string): Promise<TokenBalance> {
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  
  // Get balance
  const balance = await agentRuntime.getBalance(mint);
  
  return {
    token: mint || 'APT',
    balance: balance.amount
  };
}

export async function getAptBalances(address?: string): Promise<AptBalances> {
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const amnisAdapter = new AmnisAdapter(agentRuntime);
  
  // Get APT balance
  const aptBalance = await agentRuntime.getBalance();
  
  // Get stAPT balance
  const stAptBalance = await amnisAdapter.getStakedBalance(address);
  
  // Get exchange rate
  const exchangeRate = await amnisAdapter.getExchangeRate();
  
  // Calculate total APT equivalent
  const totalAptEquivalent = aptBalance.amount + (stAptBalance * exchangeRate);
  
  return {
    apt: aptBalance.amount,
    stApt: stAptBalance,
    totalAptEquivalent
  };
}
```

### 5. Integration with DeFi Agent

#### 5.1 Update Agent Character File

```json
{
  "name": "DeFi Agent",
  "description": "ADAS's blockchain operations specialist for the Aptos ecosystem",
  "capabilities": [
    "Token transfers",
    "Balance checking",
    "Amnis Finance staking operations",
    "Liquid staking management"
  ],
  "knowledge": [
    "amnis.md",
    "defi-agent.md"
  ]
}
```

#### 5.2 Update Agent Knowledge Base

Add detailed information about Amnis Finance operations to the knowledge base:

```markdown
# Amnis Finance Operations

## Overview
Amnis Finance is a liquid staking protocol on Aptos that allows users to stake APT tokens and receive stAPT tokens in return. These stAPT tokens can be used in other DeFi protocols while still earning staking rewards.

## Available Operations

### Stake APT
- Stake APT tokens on Amnis
- Receive stAPT tokens in return
- Earn staking rewards automatically
- stAPT tokens appreciate in value relative to APT

### Withdraw APT
- Withdraw staked APT tokens from Amnis
- Convert stAPT back to APT
- Access original staked capital plus rewards

### Staking Information
- View staked balance
- Check current exchange rate
- Calculate APT equivalent of stAPT holdings

## Benefits of Liquid Staking

### Capital Efficiency
- Use stAPT in other DeFi protocols while earning staking rewards
- Provide liquidity in stAPT/APT pools
- Use as collateral in lending protocols

### Automatic Compounding
- Staking rewards automatically increase the value of stAPT
- No need to manually claim and restake rewards

### Flexibility
- No lockup period
- Withdraw anytime (subject to liquidity)
- Partial withdrawals supported
```

### 6. Testing Plan

#### 6.1 Unit Tests

```typescript
// tests/amnis/stake.test.ts
describe('Amnis Finance - Stake', () => {
  it('should stake APT tokens on Amnis', async () => {
    // Test implementation
  });
  
  it('should handle errors gracefully', async () => {
    // Test implementation
  });
  
  it('should stake to a different recipient when specified', async () => {
    // Test implementation
  });
});

// tests/amnis/withdraw.test.ts
describe('Amnis Finance - Withdraw', () => {
  it('should withdraw staked APT tokens from Amnis', async () => {
    // Test implementation
  });
  
  it('should handle errors gracefully', async () => {
    // Test implementation
  });
  
  it('should withdraw to a different recipient when specified', async () => {
    // Test implementation
  });
});
```

#### 6.2 Integration Tests

```typescript
// tests/integration/amnis.test.ts
describe('Amnis Finance Integration', () => {
  it('should perform a complete staking cycle', async () => {
    // Stake APT
    // Verify stAPT balance
    // Withdraw staked APT
    // Verify APT balance
  });
  
  it('should retrieve accurate staking information', async () => {
    // Test implementation
  });
  
  it('should calculate APT equivalent correctly', async () => {
    // Test implementation
  });
});
```

#### 6.3 Testnet Validation

1. Create test wallets with APT tokens
2. Execute stake operations on Aptos testnet
3. Verify stAPT balance is correctly updated
4. Execute withdraw operations on Aptos testnet
5. Verify APT balance is correctly updated
6. Test staking information retrieval
7. Verify all transactions are successful

### 7. Error Handling

```typescript
// src/utils/error-handler.ts
export class AmnisError extends Error {
  constructor(message: string, public code: string, public originalError?: any) {
    super(message);
    this.name = 'AmnisError';
  }
}

export function handleAmnisError(error: any): AmnisError {
  // Parse error message from Amnis Finance
  const message = error.message || 'Unknown error occurred';
  
  if (message.includes('insufficient balance')) {
    return new AmnisError('Insufficient APT balance for staking', 'INSUFFICIENT_BALANCE', error);
  }
  
  if (message.includes('insufficient staked balance')) {
    return new AmnisError('Insufficient stAPT balance for withdrawal', 'INSUFFICIENT_STAKED_BALANCE', error);
  }
  
  // Add more specific error handling
  
  return new AmnisError('An error occurred with Amnis Finance', 'UNKNOWN_ERROR', error);
}
```

### 8. Implementation Timeline

#### Day 1: Core Setup
- Set up dependencies
- Implement AmnisAdapter
- Create basic action structure

#### Day 2: Action Implementation
- Implement stake action
- Implement withdraw action
- Add error handling

#### Day 3: Provider Implementation
- Implement staking information provider
- Enhance APT balance provider
- Add exchange rate calculation

#### Day 4: Testing & Integration
- Write unit tests
- Write integration tests
- Test on Aptos testnet
- Update agent knowledge base

#### Day 5: Documentation & Finalization
- Document all implemented features
- Create usage examples
- Finalize integration with DeFi Agent

### 9. Future Enhancements

1. **Advanced Staking Analytics**
   - Historical staking rewards tracking
   - APY calculation and comparison
   - Reward projection calculator

2. **Validator Selection**
   - View and select specific validators
   - Validator performance metrics
   - Diversification across multiple validators

3. **Liquid Staking Strategies**
   - Automated stAPT deployment strategies
   - Integration with other DeFi protocols
   - Yield optimization recommendations

4. **Instant Unstaking**
   - Support for instant unstaking (with fee)
   - Fee calculation and comparison
   - Optimal unstaking strategy recommendations

## Conclusion

This implementation plan provides a detailed roadmap for integrating Amnis Finance staking operations from Move Agent Kit into the ADAS Aptos Plugin. By following this plan, we can quickly add liquid staking capabilities to our DeFi Agent, enabling users to stake their APT tokens while maintaining liquidity through stAPT tokens. 