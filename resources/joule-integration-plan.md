# Joule Finance Integration Plan

## Overview

This document outlines the detailed implementation plan for integrating Joule Finance operations from Move Agent Kit into the ADAS Aptos Plugin. Joule Finance is a lending and borrowing protocol on Aptos that allows users to supply assets, borrow against collateral, and earn interest.

## Joule Finance Operations in Move Agent Kit

Based on the analysis of Move Agent Kit's source code, Joule Finance operations are implemented in the following files:

- `src/tools/joule/lend.ts`: Supply assets to Joule
- `src/tools/joule/borrow.ts`: Borrow assets from Joule
- `src/tools/joule/repay.ts`: Repay borrowed assets
- `src/tools/joule/withdraw.ts`: Withdraw supplied assets
- `src/tools/joule/user-position.ts`: Get user position details
- `src/tools/joule/user-all-positions.ts`: Get all user positions
- `src/tools/joule/pool-detail.ts`: Get pool details
- `src/tools/joule/claim-reward.ts`: Claim JOY rewards

These operations are exposed through the `AgentRuntime` class in `src/agent.ts` with methods like:
- `lendToken()`
- `borrowToken()`
- `repayToken()`
- `withdrawToken()`
- `getUserPosition()`
- `getUserAllPositions()`
- `getPoolDetails()`
- `claimReward()`

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

#### 2.1 Create Joule Finance Adapter

```typescript
// src/adapters/joule-adapter.ts
import { AgentRuntime } from 'move-agent-kit';
import { MoveStructId, AccountAddress } from '@aptos-labs/ts-sdk';

export class JouleAdapter {
  constructor(private agentRuntime: AgentRuntime) {}

  /**
   * Supply assets to Joule Finance
   * @param amount Amount to supply
   * @param mint Token to supply
   * @param positionId Existing position ID (optional)
   * @param newPosition Whether to create a new position
   * @param fungibleAsset Whether the token is a fungible asset
   * @returns Transaction hash and position ID
   */
  async supply(
    amount: number,
    mint: string | MoveStructId,
    positionId: string = '',
    newPosition: boolean = positionId === '',
    fungibleAsset: boolean = false
  ): Promise<{ hash: string; positionId: string }> {
    return this.agentRuntime.lendToken(
      amount,
      typeof mint === 'string' ? mint as MoveStructId : mint,
      positionId,
      newPosition,
      fungibleAsset
    );
  }

  /**
   * Borrow assets from Joule Finance
   * @param amount Amount to borrow
   * @param mint Token to borrow
   * @param positionId Position ID to borrow against
   * @param fungibleAsset Whether the token is a fungible asset
   * @returns Transaction hash
   */
  async borrow(
    amount: number,
    mint: string | MoveStructId,
    positionId: string,
    fungibleAsset: boolean = false
  ): Promise<string> {
    const result = await this.agentRuntime.borrowToken(
      amount,
      typeof mint === 'string' ? mint as MoveStructId : mint,
      positionId,
      fungibleAsset
    );
    return result.hash;
  }

  /**
   * Withdraw assets from Joule Finance
   * @param amount Amount to withdraw
   * @param mint Token to withdraw
   * @param positionId Position ID to withdraw from
   * @param fungibleAsset Whether the token is a fungible asset
   * @returns Transaction hash
   */
  async withdraw(
    amount: number,
    mint: string | MoveStructId,
    positionId: string,
    fungibleAsset: boolean = false
  ): Promise<string> {
    const result = await this.agentRuntime.withdrawToken(
      amount,
      typeof mint === 'string' ? mint as MoveStructId : mint,
      positionId,
      fungibleAsset
    );
    return result.hash;
  }

  /**
   * Repay borrowed assets to Joule Finance
   * @param amount Amount to repay
   * @param mint Token to repay
   * @param positionId Position ID to repay for
   * @param fungibleAsset Whether the token is a fungible asset
   * @returns Transaction hash
   */
  async repay(
    amount: number,
    mint: string | MoveStructId,
    positionId: string,
    fungibleAsset: boolean = false
  ): Promise<string> {
    const result = await this.agentRuntime.repayToken(
      amount,
      typeof mint === 'string' ? mint as MoveStructId : mint,
      positionId,
      fungibleAsset
    );
    return result.hash;
  }

  /**
   * Get user position details
   * @param userAddress User address
   * @param positionId Position ID
   * @returns Position details
   */
  async getUserPosition(userAddress: string | AccountAddress, positionId: string): Promise<any> {
    return this.agentRuntime.getUserPosition(
      typeof userAddress === 'string' ? userAddress as AccountAddress : userAddress,
      positionId
    );
  }

  /**
   * Get all user positions
   * @param userAddress User address
   * @returns All positions
   */
  async getUserAllPositions(userAddress: string | AccountAddress): Promise<any> {
    return this.agentRuntime.getUserAllPositions(
      typeof userAddress === 'string' ? userAddress as AccountAddress : userAddress
    );
  }

  /**
   * Get pool details
   * @param mint Token address
   * @returns Pool details
   */
  async getPoolDetails(mint: string): Promise<any> {
    return this.agentRuntime.getPoolDetails(mint);
  }

  /**
   * Claim JOY rewards
   * @param rewardCoinType Reward coin type
   * @returns Transaction hash
   */
  async claimReward(rewardCoinType: string | MoveStructId): Promise<string> {
    return this.agentRuntime.claimReward(rewardCoinType);
  }
}
```

### 3. Action Implementations

#### 3.1 Supply Action

```typescript
// src/actions/joule/supply.ts
import { Content } from '../../types';
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { JouleAdapter } from '../../adapters/joule-adapter';

export interface SupplyContent extends Content {
  token: string;
  amount: number | string;
  positionId?: string;
  newPosition?: boolean;
}

export async function supplyToJoule(content: SupplyContent): Promise<any> {
  const { token, amount, positionId, newPosition } = content;
  
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const jouleAdapter = new JouleAdapter(agentRuntime);
  
  // Convert amount to number if it's a string
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Supply to Joule
  const result = await jouleAdapter.supply(
    amountNum,
    token,
    positionId,
    newPosition !== undefined ? newPosition : !positionId,
    false // Default to standard tokens, not fungible assets
  );
  
  return {
    success: true,
    hash: result.hash,
    positionId: result.positionId,
    message: `Successfully supplied ${amountNum} ${token} to Joule Finance.`
  };
}
```

#### 3.2 Borrow Action

```typescript
// src/actions/joule/borrow.ts
import { Content } from '../../types';
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { JouleAdapter } from '../../adapters/joule-adapter';

export interface BorrowContent extends Content {
  token: string;
  amount: number | string;
  positionId: string;
}

export async function borrowFromJoule(content: BorrowContent): Promise<any> {
  const { token, amount, positionId } = content;
  
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const jouleAdapter = new JouleAdapter(agentRuntime);
  
  // Convert amount to number if it's a string
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Borrow from Joule
  const hash = await jouleAdapter.borrow(
    amountNum,
    token,
    positionId,
    false // Default to standard tokens, not fungible assets
  );
  
  return {
    success: true,
    hash,
    message: `Successfully borrowed ${amountNum} ${token} from Joule Finance.`
  };
}
```

#### 3.3 Withdraw Action

```typescript
// src/actions/joule/withdraw.ts
import { Content } from '../../types';
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { JouleAdapter } from '../../adapters/joule-adapter';

export interface WithdrawContent extends Content {
  token: string;
  amount: number | string;
  positionId: string;
}

export async function withdrawFromJoule(content: WithdrawContent): Promise<any> {
  const { token, amount, positionId } = content;
  
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const jouleAdapter = new JouleAdapter(agentRuntime);
  
  // Convert amount to number if it's a string
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Withdraw from Joule
  const hash = await jouleAdapter.withdraw(
    amountNum,
    token,
    positionId,
    false // Default to standard tokens, not fungible assets
  );
  
  return {
    success: true,
    hash,
    message: `Successfully withdrew ${amountNum} ${token} from Joule Finance.`
  };
}
```

#### 3.4 Repay Action

```typescript
// src/actions/joule/repay.ts
import { Content } from '../../types';
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { JouleAdapter } from '../../adapters/joule-adapter';

export interface RepayContent extends Content {
  token: string;
  amount: number | string;
  positionId: string;
}

export async function repayToJoule(content: RepayContent): Promise<any> {
  const { token, amount, positionId } = content;
  
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const jouleAdapter = new JouleAdapter(agentRuntime);
  
  // Convert amount to number if it's a string
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Repay to Joule
  const hash = await jouleAdapter.repay(
    amountNum,
    token,
    positionId,
    false // Default to standard tokens, not fungible assets
  );
  
  return {
    success: true,
    hash,
    message: `Successfully repaid ${amountNum} ${token} to Joule Finance.`
  };
}
```

### 4. Provider Implementations

#### 4.1 Position Provider

```typescript
// src/providers/joule/position.ts
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { JouleAdapter } from '../../adapters/joule-adapter';

export interface PositionInfo {
  positionId: string;
  owner: string;
  collateral: Array<{
    token: string;
    amount: number;
  }>;
  debt: Array<{
    token: string;
    amount: number;
  }>;
  healthFactor: number;
}

export async function getJoulePosition(userAddress: string, positionId: string): Promise<PositionInfo> {
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const jouleAdapter = new JouleAdapter(agentRuntime);
  
  // Get position details
  const positionData = await jouleAdapter.getUserPosition(userAddress, positionId);
  
  // Transform data into our format
  return transformPositionData(positionData);
}

export async function getAllJoulePositions(userAddress: string): Promise<PositionInfo[]> {
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const jouleAdapter = new JouleAdapter(agentRuntime);
  
  // Get all positions
  const positionsData = await jouleAdapter.getUserAllPositions(userAddress);
  
  // Transform data into our format
  return positionsData.map(transformPositionData);
}

function transformPositionData(data: any): PositionInfo {
  // Implementation depends on the exact format returned by Move Agent Kit
  // This is a placeholder implementation
  return {
    positionId: data.position_id,
    owner: data.owner,
    collateral: data.collateral.map((c: any) => ({
      token: c.token,
      amount: c.amount
    })),
    debt: data.debt.map((d: any) => ({
      token: d.token,
      amount: d.amount
    })),
    healthFactor: data.health_factor
  };
}
```

#### 4.2 Pool Provider

```typescript
// src/providers/joule/pool.ts
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { JouleAdapter } from '../../adapters/joule-adapter';

export interface PoolInfo {
  token: string;
  totalSupply: number;
  totalBorrow: number;
  supplyAPY: number;
  borrowAPY: number;
  utilizationRate: number;
}

export async function getJoulePool(token: string): Promise<PoolInfo> {
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const jouleAdapter = new JouleAdapter(agentRuntime);
  
  // Get pool details
  const poolData = await jouleAdapter.getPoolDetails(token);
  
  // Transform data into our format
  return transformPoolData(poolData, token);
}

function transformPoolData(data: any, token: string): PoolInfo {
  // Implementation depends on the exact format returned by Move Agent Kit
  // This is a placeholder implementation
  return {
    token,
    totalSupply: data.total_supply,
    totalBorrow: data.total_borrow,
    supplyAPY: data.supply_apy,
    borrowAPY: data.borrow_apy,
    utilizationRate: data.utilization_rate
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
    "Joule Finance operations (supply, borrow, withdraw, repay)",
    "Position management",
    "Pool information retrieval"
  ],
  "knowledge": [
    "joule.md",
    "defi-agent.md"
  ]
}
```

#### 5.2 Update Agent Knowledge Base

Add detailed information about Joule Finance operations to the knowledge base:

```markdown
# Joule Finance Operations

## Overview
Joule Finance is a lending and borrowing protocol on Aptos that allows users to supply assets, borrow against collateral, and earn interest.

## Available Operations

### Supply Assets
- Supply tokens to Joule Finance
- Earn interest on supplied assets
- Use supplied assets as collateral for borrowing

### Borrow Assets
- Borrow tokens against supplied collateral
- Pay interest on borrowed assets
- Maintain health factor to avoid liquidation

### Withdraw Assets
- Withdraw previously supplied assets
- Limited by collateral requirements if borrowing

### Repay Borrowed Assets
- Repay borrowed assets plus interest
- Improve position health factor

### Position Management
- View position details
- Monitor health factor
- Track supplied and borrowed assets

### Pool Information
- View pool statistics
- Check current interest rates
- Monitor utilization rates
```

### 6. Testing Plan

#### 6.1 Unit Tests

```typescript
// tests/joule/supply.test.ts
describe('Joule Finance - Supply', () => {
  it('should supply tokens to Joule Finance', async () => {
    // Test implementation
  });
  
  it('should handle errors gracefully', async () => {
    // Test implementation
  });
  
  it('should create a new position when requested', async () => {
    // Test implementation
  });
});

// Similar tests for borrow, withdraw, repay
```

#### 6.2 Integration Tests

```typescript
// tests/integration/joule.test.ts
describe('Joule Finance Integration', () => {
  it('should perform a complete lending cycle', async () => {
    // Supply assets
    // Borrow against collateral
    // Repay borrowed assets
    // Withdraw supplied assets
  });
  
  it('should retrieve accurate position information', async () => {
    // Test implementation
  });
  
  it('should retrieve accurate pool information', async () => {
    // Test implementation
  });
});
```

#### 6.3 Testnet Validation

1. Create test wallets with APT and other tokens
2. Execute supply operations on Aptos testnet
3. Execute borrow operations on Aptos testnet
4. Verify position details are correctly retrieved
5. Execute repay operations on Aptos testnet
6. Execute withdraw operations on Aptos testnet
7. Verify all transactions are successful

### 7. Error Handling

```typescript
// src/utils/error-handler.ts
export class JouleError extends Error {
  constructor(message: string, public code: string, public originalError?: any) {
    super(message);
    this.name = 'JouleError';
  }
}

export function handleJouleError(error: any): JouleError {
  // Parse error message from Joule Finance
  const message = error.message || 'Unknown error occurred';
  
  if (message.includes('insufficient balance')) {
    return new JouleError('Insufficient balance for this operation', 'INSUFFICIENT_BALANCE', error);
  }
  
  if (message.includes('health factor')) {
    return new JouleError('Operation would result in unhealthy position', 'HEALTH_FACTOR_VIOLATION', error);
  }
  
  // Add more specific error handling
  
  return new JouleError('An error occurred with Joule Finance', 'UNKNOWN_ERROR', error);
}
```

### 8. Implementation Timeline

#### Day 1: Core Setup
- Set up dependencies
- Implement JouleAdapter
- Create basic action structure

#### Day 2: Action Implementation
- Implement supply action
- Implement borrow action
- Implement withdraw action
- Implement repay action

#### Day 3: Provider Implementation
- Implement position provider
- Implement pool provider
- Add error handling

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

1. **Advanced Position Management**
   - Automatic health factor monitoring
   - Liquidation risk alerts
   - Collateral optimization suggestions

2. **Yield Optimization**
   - Interest rate tracking over time
   - Optimal supply/borrow strategies
   - APY comparison with other protocols

3. **Transaction Batching**
   - Combine multiple Joule operations in a single transaction
   - Reduce gas costs for complex operations

4. **Protocol Analytics**
   - Historical interest rate data
   - Protocol utilization trends
   - Market share analysis

## Conclusion

This implementation plan provides a detailed roadmap for integrating Joule Finance operations from Move Agent Kit into the ADAS Aptos Plugin. By following this plan, we can quickly add lending and borrowing capabilities to our DeFi Agent, enabling users to interact with one of the most important DeFi protocols on Aptos. 