# Thala Protocol Integration Plan

## Overview

This document outlines the detailed implementation plan for integrating Thala Protocol operations from Move Agent Kit into the ADAS Aptos Plugin. Thala Protocol is a comprehensive DeFi platform on Aptos that includes a DEX, staking mechanisms, and the MOD stablecoin system.

## Thala Protocol Operations in Move Agent Kit

Based on the analysis of Move Agent Kit's source code, Thala Protocol operations are implemented in the following files:

- `src/tools/thala/stake.ts`: Stake APT tokens on Thala
- `src/tools/thala/unstake.ts`: Unstake APT tokens from Thala
- `src/tools/thala/add-liquidity.ts`: Add liquidity to Thala pools
- `src/tools/thala/remove-liquidity.ts`: Remove liquidity from Thala pools
- `src/tools/thala/create-pool.ts`: Create a new liquidity pool on Thala
- `src/tools/thala/mint-mod.ts`: Mint MOD stablecoin
- `src/tools/thala/redeem-mod.ts`: Redeem MOD stablecoin

These operations are exposed through the `AgentRuntime` class in `src/agent.ts` with methods like:
- `stakeTokensWithThala()`
- `unstakeTokensWithThala()`
- `addLiquidityWithThala()`
- `removeLiquidityWithThala()`
- `createPoolWithThala()`
- `mintMODWithThala()`
- `redeemMODWithThala()`

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

#### 2.1 Create Thala Protocol Adapter

```typescript
// src/adapters/thala-adapter.ts
import { AgentRuntime } from 'move-agent-kit';
import { MoveStructId } from '@aptos-labs/ts-sdk';

export class ThalaAdapter {
  constructor(private agentRuntime: AgentRuntime) {}

  /**
   * Stake APT tokens on Thala
   * @param amount Amount of APT to stake
   * @returns Transaction hash
   */
  async stakeAPT(amount: number): Promise<string> {
    return this.agentRuntime.stakeTokensWithThala(amount);
  }

  /**
   * Unstake APT tokens from Thala
   * @param amount Amount of APT to unstake
   * @returns Transaction hash
   */
  async unstakeAPT(amount: number): Promise<string> {
    return this.agentRuntime.unstakeTokensWithThala(amount);
  }

  /**
   * Add liquidity to a Thala pool
   * @param tokenA First token in the pair
   * @param tokenB Second token in the pair
   * @param amountA Amount of first token
   * @param amountB Amount of second token
   * @returns Transaction hash
   */
  async addLiquidity(
    tokenA: string | MoveStructId,
    tokenB: string | MoveStructId,
    amountA: number,
    amountB: number
  ): Promise<string> {
    // Convert string addresses to MoveStructId if needed
    const mintX = typeof tokenA === 'string' ? tokenA as MoveStructId : tokenA;
    const mintY = typeof tokenB === 'string' ? tokenB as MoveStructId : tokenB;
    
    return this.agentRuntime.addLiquidityWithThala(mintX, mintY, amountA, amountB);
  }

  /**
   * Remove liquidity from a Thala pool
   * @param tokenA First token in the pair
   * @param tokenB Second token in the pair
   * @param lpAmount Amount of LP tokens to burn
   * @returns Transaction hash
   */
  async removeLiquidity(
    tokenA: string | MoveStructId,
    tokenB: string | MoveStructId,
    lpAmount: number
  ): Promise<string> {
    // Convert string addresses to MoveStructId if needed
    const mintX = typeof tokenA === 'string' ? tokenA as MoveStructId : tokenA;
    const mintY = typeof tokenB === 'string' ? tokenB as MoveStructId : tokenB;
    
    return this.agentRuntime.removeLiquidityWithThala(mintX, mintY, lpAmount);
  }

  /**
   * Create a new pool on Thala
   * @param tokenA First token in the pair
   * @param tokenB Second token in the pair
   * @param amountA Initial amount of first token
   * @param amountB Initial amount of second token
   * @param feeTier Fee tier (in basis points)
   * @param amplificationFactor Amplification factor for stable pools
   * @returns Transaction hash
   */
  async createPool(
    tokenA: string | MoveStructId,
    tokenB: string | MoveStructId,
    amountA: number,
    amountB: number,
    feeTier: number = 30, // Default 0.3%
    amplificationFactor: number = 1 // Default for volatile pairs
  ): Promise<string> {
    return this.agentRuntime.createPoolWithThala(
      tokenA,
      tokenB,
      amountA,
      amountB,
      feeTier,
      amplificationFactor
    );
  }

  /**
   * Mint MOD stablecoin
   * @param collateralToken Collateral token
   * @param amount Amount of collateral to deposit
   * @returns Transaction hash
   */
  async mintMOD(
    collateralToken: string | MoveStructId,
    amount: number
  ): Promise<string> {
    // Convert string address to MoveStructId if needed
    const mint = typeof collateralToken === 'string' ? collateralToken as MoveStructId : collateralToken;
    
    return this.agentRuntime.mintMODWithThala(mint, amount);
  }

  /**
   * Redeem MOD stablecoin
   * @param collateralToken Collateral token to receive
   * @param amount Amount of MOD to redeem
   * @returns Transaction hash
   */
  async redeemMOD(
    collateralToken: string | MoveStructId,
    amount: number
  ): Promise<string> {
    // Convert string address to MoveStructId if needed
    const mint = typeof collateralToken === 'string' ? collateralToken as MoveStructId : collateralToken;
    
    return this.agentRuntime.redeemMODWithThala(mint, amount);
  }

  /**
   * Get pool information (custom implementation)
   * @param tokenA First token in the pair
   * @param tokenB Second token in the pair
   * @returns Pool information
   */
  async getPoolInfo(
    tokenA: string | MoveStructId,
    tokenB: string | MoveStructId
  ): Promise<any> {
    // This would require a custom implementation to query the Thala contracts
    // For now, we'll return a placeholder
    // In a real implementation, we would query the contract directly
    
    // Placeholder implementation
    return {
      tokenA: tokenA.toString(),
      tokenB: tokenB.toString(),
      reserves: {
        reserveA: 1000000,
        reserveB: 1000000
      },
      liquidity: 1000000,
      fee: 0.003
    };
  }

  /**
   * Get MOD vault information (custom implementation)
   * @param collateralToken Collateral token
   * @returns Vault information
   */
  async getVaultInfo(collateralToken: string | MoveStructId): Promise<any> {
    // This would require a custom implementation to query the Thala contracts
    // For now, we'll return a placeholder
    // In a real implementation, we would query the contract directly
    
    // Placeholder implementation
    return {
      collateralToken: collateralToken.toString(),
      collateralAmount: 1000000,
      modMinted: 800000,
      collateralRatio: 1.25,
      minimumCollateralRatio: 1.1,
      liquidationThreshold: 1.05
    };
  }
}
```

### 3. Action Implementations

#### 3.1 Staking Actions

```typescript
// src/actions/thala/stake.ts
import { Content } from '../../types';
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { ThalaAdapter } from '../../adapters/thala-adapter';

export interface StakeContent extends Content {
  amount: number | string;
}

export async function stakeWithThala(content: StakeContent): Promise<any> {
  const { amount } = content;
  
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const thalaAdapter = new ThalaAdapter(agentRuntime);
  
  // Convert amount to number if it's a string
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Stake APT
  const hash = await thalaAdapter.stakeAPT(amountNum);
  
  return {
    success: true,
    hash,
    message: `Successfully staked ${amountNum} APT on Thala Protocol.`
  };
}

// src/actions/thala/unstake.ts
export interface UnstakeContent extends Content {
  amount: number | string;
}

export async function unstakeFromThala(content: UnstakeContent): Promise<any> {
  const { amount } = content;
  
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const thalaAdapter = new ThalaAdapter(agentRuntime);
  
  // Convert amount to number if it's a string
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Unstake APT
  const hash = await thalaAdapter.unstakeAPT(amountNum);
  
  return {
    success: true,
    hash,
    message: `Successfully unstaked ${amountNum} APT from Thala Protocol.`
  };
}
```

#### 3.2 Liquidity Actions

```typescript
// src/actions/thala/liquidity.ts
import { Content } from '../../types';
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { ThalaAdapter } from '../../adapters/thala-adapter';

export interface AddLiquidityContent extends Content {
  tokenA: string;
  tokenB: string;
  amountA: number | string;
  amountB: number | string;
}

export async function addLiquidityToThala(content: AddLiquidityContent): Promise<any> {
  const { tokenA, tokenB, amountA, amountB } = content;
  
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const thalaAdapter = new ThalaAdapter(agentRuntime);
  
  // Convert amounts to numbers if they're strings
  const amountANum = typeof amountA === 'string' ? parseFloat(amountA) : amountA;
  const amountBNum = typeof amountB === 'string' ? parseFloat(amountB) : amountB;
  
  // Add liquidity
  const hash = await thalaAdapter.addLiquidity(tokenA, tokenB, amountANum, amountBNum);
  
  return {
    success: true,
    hash,
    message: `Successfully added liquidity (${amountANum} ${tokenA} and ${amountBNum} ${tokenB}) to Thala Protocol.`
  };
}

export interface RemoveLiquidityContent extends Content {
  tokenA: string;
  tokenB: string;
  lpAmount: number | string;
}

export async function removeLiquidityFromThala(content: RemoveLiquidityContent): Promise<any> {
  const { tokenA, tokenB, lpAmount } = content;
  
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const thalaAdapter = new ThalaAdapter(agentRuntime);
  
  // Convert amount to number if it's a string
  const lpAmountNum = typeof lpAmount === 'string' ? parseFloat(lpAmount) : lpAmount;
  
  // Remove liquidity
  const hash = await thalaAdapter.removeLiquidity(tokenA, tokenB, lpAmountNum);
  
  return {
    success: true,
    hash,
    message: `Successfully removed ${lpAmountNum} LP tokens from Thala Protocol.`
  };
}

export interface CreatePoolContent extends Content {
  tokenA: string;
  tokenB: string;
  amountA: number | string;
  amountB: number | string;
  feeTier?: number;
  amplificationFactor?: number;
}

export async function createPoolOnThala(content: CreatePoolContent): Promise<any> {
  const { tokenA, tokenB, amountA, amountB, feeTier, amplificationFactor } = content;
  
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const thalaAdapter = new ThalaAdapter(agentRuntime);
  
  // Convert amounts to numbers if they're strings
  const amountANum = typeof amountA === 'string' ? parseFloat(amountA) : amountA;
  const amountBNum = typeof amountB === 'string' ? parseFloat(amountB) : amountB;
  
  // Create pool
  const hash = await thalaAdapter.createPool(
    tokenA,
    tokenB,
    amountANum,
    amountBNum,
    feeTier,
    amplificationFactor
  );
  
  return {
    success: true,
    hash,
    message: `Successfully created a new pool (${tokenA}/${tokenB}) on Thala Protocol.`
  };
}
```

#### 3.3 MOD Stablecoin Actions

```typescript
// src/actions/thala/mod.ts
import { Content } from '../../types';
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { ThalaAdapter } from '../../adapters/thala-adapter';

export interface MintMODContent extends Content {
  collateralToken: string;
  amount: number | string;
}

export async function mintMODWithThala(content: MintMODContent): Promise<any> {
  const { collateralToken, amount } = content;
  
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const thalaAdapter = new ThalaAdapter(agentRuntime);
  
  // Convert amount to number if it's a string
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Mint MOD
  const hash = await thalaAdapter.mintMOD(collateralToken, amountNum);
  
  return {
    success: true,
    hash,
    message: `Successfully minted MOD using ${amountNum} ${collateralToken} as collateral.`
  };
}

export interface RedeemMODContent extends Content {
  collateralToken: string;
  amount: number | string;
}

export async function redeemMODWithThala(content: RedeemMODContent): Promise<any> {
  const { collateralToken, amount } = content;
  
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const thalaAdapter = new ThalaAdapter(agentRuntime);
  
  // Convert amount to number if it's a string
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Redeem MOD
  const hash = await thalaAdapter.redeemMOD(collateralToken, amountNum);
  
  return {
    success: true,
    hash,
    message: `Successfully redeemed ${amountNum} MOD for ${collateralToken}.`
  };
}
```

### 4. Provider Implementations

#### 4.1 Pool Information Provider

```typescript
// src/providers/thala/pool.ts
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { ThalaAdapter } from '../../adapters/thala-adapter';

export interface PoolInfo {
  tokenA: string;
  tokenB: string;
  reserveA: number;
  reserveB: number;
  liquidity: number;
  fee: number;
}

export async function getThalaPoolInfo(tokenA: string, tokenB: string): Promise<PoolInfo> {
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const thalaAdapter = new ThalaAdapter(agentRuntime);
  
  // Get pool information
  const poolData = await thalaAdapter.getPoolInfo(tokenA, tokenB);
  
  // Transform data into our format
  return {
    tokenA: poolData.tokenA,
    tokenB: poolData.tokenB,
    reserveA: poolData.reserves.reserveA,
    reserveB: poolData.reserves.reserveB,
    liquidity: poolData.liquidity,
    fee: poolData.fee
  };
}
```

#### 4.2 MOD Vault Provider

```typescript
// src/providers/thala/vault.ts
import { AgentRuntimeAdapter } from '../../adapters/agent-runtime-adapter';
import { ThalaAdapter } from '../../adapters/thala-adapter';

export interface VaultInfo {
  collateralToken: string;
  collateralAmount: number;
  modMinted: number;
  collateralRatio: number;
  minimumCollateralRatio: number;
  liquidationThreshold: number;
}

export async function getThalaVaultInfo(collateralToken: string): Promise<VaultInfo> {
  // Get agent runtime
  const agentRuntime = AgentRuntimeAdapter.getInstance().getAgentRuntime();
  const thalaAdapter = new ThalaAdapter(agentRuntime);
  
  // Get vault information
  const vaultData = await thalaAdapter.getVaultInfo(collateralToken);
  
  // Return vault information
  return {
    collateralToken: vaultData.collateralToken,
    collateralAmount: vaultData.collateralAmount,
    modMinted: vaultData.modMinted,
    collateralRatio: vaultData.collateralRatio,
    minimumCollateralRatio: vaultData.minimumCollateralRatio,
    liquidationThreshold: vaultData.liquidationThreshold
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
    "Thala Protocol operations",
    "Liquidity provision",
    "MOD stablecoin management",
    "Staking operations"
  ],
  "knowledge": [
    "thala.md",
    "defi-agent.md"
  ]
}
```

#### 5.2 Update Agent Knowledge Base

Add detailed information about Thala Protocol operations to the knowledge base:

```markdown
# Thala Protocol Operations

## Overview
Thala Protocol is a comprehensive DeFi platform on Aptos that includes a DEX, staking mechanisms, and the MOD stablecoin system.

## Available Operations

### Staking
- Stake APT tokens on Thala
- Earn THL rewards
- Unstake APT tokens when needed

### Liquidity Provision
- Add liquidity to Thala pools
- Remove liquidity from Thala pools
- Create new liquidity pools
- Earn trading fees and THL rewards

### MOD Stablecoin
- Mint MOD stablecoin using collateral
- Redeem MOD for collateral
- Manage collateral ratio
- Monitor vault health

## Benefits of Thala Protocol

### Comprehensive DeFi Platform
- One-stop solution for multiple DeFi needs
- Integrated ecosystem with shared rewards
- Governance through THL token

### Capital Efficiency
- Earn multiple yield sources simultaneously
- Optimize returns across different Thala products
- Use MOD in other DeFi protocols

### Stable Value
- MOD provides a stable unit of account
- Over-collateralized for stability
- Multiple collateral options
```

### 6. Testing Plan

#### 6.1 Unit Tests

```typescript
// tests/thala/stake.test.ts
describe('Thala Protocol - Stake', () => {
  it('should stake APT tokens on Thala', async () => {
    // Test implementation
  });
  
  it('should handle errors gracefully', async () => {
    // Test implementation
  });
});

// Similar tests for unstake, add-liquidity, remove-liquidity, mint-mod, redeem-mod
```

#### 6.2 Integration Tests

```typescript
// tests/integration/thala.test.ts
describe('Thala Protocol Integration', () => {
  it('should perform a complete staking cycle', async () => {
    // Stake APT
    // Verify staking status
    // Unstake APT
    // Verify APT balance
  });
  
  it('should perform a complete liquidity cycle', async () => {
    // Add liquidity
    // Verify LP token balance
    // Remove liquidity
    // Verify token balances
  });
  
  it('should perform a complete MOD cycle', async () => {
    // Mint MOD
    // Verify MOD balance and vault status
    // Redeem MOD
    // Verify collateral balance
  });
});
```

#### 6.3 Testnet Validation

1. Create test wallets with APT and other tokens
2. Execute staking operations on Aptos testnet
3. Execute liquidity operations on Aptos testnet
4. Execute MOD operations on Aptos testnet
5. Verify all balances are correctly updated
6. Test information retrieval for pools and vaults
7. Verify all transactions are successful

### 7. Error Handling

```typescript
// src/utils/error-handler.ts
export class ThalaError extends Error {
  constructor(message: string, public code: string, public originalError?: any) {
    super(message);
    this.name = 'ThalaError';
  }
}

export function handleThalaError(error: any): ThalaError {
  // Parse error message from Thala Protocol
  const message = error.message || 'Unknown error occurred';
  
  if (message.includes('insufficient balance')) {
    return new ThalaError('Insufficient balance for this operation', 'INSUFFICIENT_BALANCE', error);
  }
  
  if (message.includes('slippage')) {
    return new ThalaError('Slippage tolerance exceeded', 'SLIPPAGE_EXCEEDED', error);
  }
  
  if (message.includes('collateral ratio')) {
    return new ThalaError('Collateral ratio below minimum requirement', 'INSUFFICIENT_COLLATERAL', error);
  }
  
  // Add more specific error handling
  
  return new ThalaError('An error occurred with Thala Protocol', 'UNKNOWN_ERROR', error);
}
```

### 8. Implementation Timeline

#### Day 1: Core Setup
- Set up dependencies
- Implement ThalaAdapter
- Create basic action structure

#### Day 2: Staking & Liquidity Implementation
- Implement stake/unstake actions
- Implement liquidity actions
- Add error handling

#### Day 3: MOD Stablecoin Implementation
- Implement MOD actions
- Implement pool and vault providers
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

1. **Advanced Pool Analytics**
   - Historical volume and fee tracking
   - APY calculation for liquidity providers
   - Impermanent loss calculator

2. **MOD Vault Optimization**
   - Collateral ratio recommendations
   - Liquidation risk alerts
   - Auto-adjustment of collateral

3. **THL Staking and Governance**
   - THL staking for boosted rewards
   - Governance proposal creation and voting
   - Reward optimization strategies

4. **Multi-hop Swaps**
   - Optimal routing across multiple pools
   - Gas-efficient swap paths
   - Price impact minimization

## Conclusion

This implementation plan provides a detailed roadmap for integrating Thala Protocol operations from Move Agent Kit into the ADAS Aptos Plugin. By following this plan, we can quickly add comprehensive DeFi capabilities to our DeFi Agent, enabling users to interact with one of the most important DeFi platforms on Aptos. 