# Move Agent Kit Integration Plan for ADAS Aptos Plugin

## Overview

This document outlines a comprehensive plan for enhancing the ADAS Aptos Plugin by integrating features from the Move Agent Kit. The integration will significantly expand the plugin's capabilities, enabling it to interact with multiple Aptos protocols including Joule, Amnis, Thala, and others.

## Current State Analysis

### Existing Aptos Plugin Capabilities
- Basic token transfers
- Wallet information retrieval
- Limited protocol interaction

### Move Agent Kit Capabilities
- Comprehensive protocol support (10+ protocols)
- Advanced DeFi operations (lending, borrowing, swapping, staking)
- Token management (transfers, minting, burning)
- NFT operations
- Protocol-specific functions

## Integration Architecture

### 1. Core Components

#### 1.1 Signer Implementation
- Implement `BaseSigner` interface from Move Agent Kit
- Create adapter for existing wallet connections
- Support transaction signing and message signing

```typescript
// src/signers/aptos-signer.ts
import { BaseSigner } from 'move-agent-kit/dist/signers/base-signer';

export class AptosSigner implements BaseSigner {
  // Implementation of required methods
  signTransaction(transaction: AnyRawTransaction): Promise<SignedTransactionResponse>;
  sendTransaction(transaction: InputTransactionData | AnyRawTransaction): Promise<string>;
  signMessage(message: AptosSignMessageInput | string): Promise<AptosSignMessageOutput | string>;
}
```

#### 1.2 Agent Runtime Adapter
- Create adapter for Move Agent Kit's `AgentRuntime`
- Bridge between ADAS architecture and Move Agent Kit

```typescript
// src/adapters/agent-runtime-adapter.ts
import { AgentRuntime } from 'move-agent-kit';

export class AgentRuntimeAdapter {
  private agentRuntime: AgentRuntime;
  
  constructor(signer: BaseSigner, aptos: Aptos, config?: any) {
    this.agentRuntime = new AgentRuntime(signer, aptos, config);
  }
  
  // Proxy methods to AgentRuntime
  getBalance(mint?: string) {
    return this.agentRuntime.getBalance(mint);
  }
  
  // Additional proxy methods for all AgentRuntime capabilities
}
```

### 2. Protocol-Specific Implementations

We'll implement protocol integrations in phases, prioritizing the most important protocols first:

#### Phase 1: Core Token Operations & Joule Finance
- Token transfers, balance checking
- Joule lending and borrowing operations

#### Phase 2: Amnis & Thala
- Amnis staking operations
- Thala DEX and staking operations

#### Phase 3: Additional Protocols
- Liquidswap, Echelon, Aries, etc.

## Implementation Plan

### Phase 1: Foundation & Core Token Operations (Week 1)

#### 1.1 Dependencies Setup
- Add Move Agent Kit as a dependency
- Add required peer dependencies:
  - `@aptos-labs/ts-sdk`
  - Additional dependencies as needed

#### 1.2 Core Adapters
- Implement `BaseSigner` adapter
- Create `AgentRuntime` adapter
- Set up configuration management

#### 1.3 Token Operations
- Implement token transfer actions:
  ```typescript
  // src/actions/token/transfer.ts
  export async function transferToken(
    to: string,
    amount: number,
    mint: string
  ): Promise<string> {
    // Implementation using AgentRuntimeAdapter
  }
  ```
- Implement token balance provider:
  ```typescript
  // src/providers/token/balance.ts
  export async function getTokenBalance(
    address: string,
    mint?: string
  ): Promise<{ token: string, balance: number }> {
    // Implementation using AgentRuntimeAdapter
  }
  ```

#### 1.4 Testing Infrastructure
- Set up test environment for Aptos Mainnet/Testnet
- Create test wallets and fund them
- Implement test utilities

### Phase 2: Joule Finance Integration (Week 1-2)

#### 2.1 Lending Operations
- Implement supply action:
  ```typescript
  // src/actions/joule/supply.ts
  export async function supplyToJoule(
    amount: number,
    mint: string,
    positionId?: string
  ): Promise<{ hash: string, positionId: string }> {
    // Implementation using lendToken from Move Agent Kit
  }
  ```
- Implement withdraw action:
  ```typescript
  // src/actions/joule/withdraw.ts
  export async function withdrawFromJoule(
    amount: number,
    mint: string,
    positionId: string
  ): Promise<string> {
    // Implementation using withdrawToken from Move Agent Kit
  }
  ```

#### 2.2 Borrowing Operations
- Implement borrow action:
  ```typescript
  // src/actions/joule/borrow.ts
  export async function borrowFromJoule(
    amount: number,
    mint: string,
    positionId: string
  ): Promise<string> {
    // Implementation using borrowToken from Move Agent Kit
  }
  ```
- Implement repay action:
  ```typescript
  // src/actions/joule/repay.ts
  export async function repayToJoule(
    amount: number,
    mint: string,
    positionId: string
  ): Promise<string> {
    // Implementation using repayToken from Move Agent Kit
  }
  ```

#### 2.3 Position Management
- Implement position information provider:
  ```typescript
  // src/providers/joule/position.ts
  export async function getJoulePosition(
    userAddress: string,
    positionId: string
  ): Promise<PositionInfo> {
    // Implementation using getUserPosition from Move Agent Kit
  }
  ```

### Phase 3: Amnis Staking Integration (Week 2)

#### 3.1 Staking Operations
- Implement stake action:
  ```typescript
  // src/actions/amnis/stake.ts
  export async function stakeWithAmnis(
    amount: number
  ): Promise<string> {
    // Implementation using stakeTokens from Move Agent Kit
  }
  ```
- Implement unstake action:
  ```typescript
  // src/actions/amnis/unstake.ts
  export async function unstakeFromAmnis(
    amount: number
  ): Promise<string> {
    // Implementation using unstakeTokens from Move Agent Kit
  }
  ```

#### 3.2 Staking Information
- Implement staking information provider:
  ```typescript
  // src/providers/amnis/staking.ts
  export async function getAmnisStakingInfo(
    address: string
  ): Promise<StakingInfo> {
    // Implementation using custom queries
  }
  ```

### Phase 4: Thala Protocol Integration (Week 2-3)

#### 4.1 DEX Operations
- Implement swap action:
  ```typescript
  // src/actions/thala/swap.ts
  export async function swapOnThala(
    fromToken: string,
    toToken: string,
    amount: number
  ): Promise<string> {
    // Implementation using Thala swap from Move Agent Kit
  }
  ```
- Implement liquidity provision actions:
  ```typescript
  // src/actions/thala/liquidity.ts
  export async function addLiquidityToThala(
    tokenA: string,
    tokenB: string,
    amountA: number,
    amountB: number
  ): Promise<string> {
    // Implementation using addLiquidityWithThala from Move Agent Kit
  }
  ```

#### 4.2 Staking Operations
- Implement Thala staking actions:
  ```typescript
  // src/actions/thala/stake.ts
  export async function stakeWithThala(
    amount: number
  ): Promise<string> {
    // Implementation using stakeTokenWithThala from Move Agent Kit
  }
  ```

#### 4.3 MOD Stablecoin Operations
- Implement MOD minting/redeeming:
  ```typescript
  // src/actions/thala/mod.ts
  export async function mintMOD(
    mint: string,
    amount: number
  ): Promise<string> {
    // Implementation using mintMODWithThala from Move Agent Kit
  }
  ```

### Phase 5: Additional Protocols & Integration (Week 3-4)

#### 5.1 Liquidswap Integration
- Implement swap and liquidity operations

#### 5.2 Echelon Integration
- Implement lending/borrowing operations

#### 5.3 Additional Protocol Support
- Implement remaining protocol integrations based on priority

#### 5.4 Agent Integration
- Connect enhanced plugin to DeFi Agent
- Update agent knowledge base with new capabilities
- Test end-to-end workflows

## Testing Strategy

### 1. Unit Testing
- Test each action and provider in isolation
- Mock blockchain interactions where appropriate
- Verify correct parameter handling and error cases

### 2. Integration Testing
- Test interactions between components
- Verify correct data flow between adapters

### 3. Testnet Validation
- Deploy to Aptos Testnet
- Execute real transactions with test tokens
- Validate protocol interactions

### 4. Mainnet Simulation
- Simulate mainnet transactions (read-only)
- Verify gas estimation and transaction building
- Test with small amounts on mainnet for critical paths

## Error Handling & Security

### 1. Error Handling Strategy
- Implement comprehensive error handling
- Create meaningful error messages
- Add retry mechanisms for transient failures

### 2. Security Considerations
- Implement transaction confirmation requirements
- Add amount validation and limits
- Implement security checks before transactions

### 3. Monitoring & Logging
- Add detailed logging for all operations
- Implement transaction tracking
- Create monitoring for protocol health

## Documentation

### 1. API Documentation
- Document all new actions and providers
- Create usage examples
- Document configuration options

### 2. Integration Guide
- Create guide for agent developers
- Document protocol-specific considerations
- Provide troubleshooting information

### 3. User Documentation
- Update user-facing documentation
- Create protocol-specific guides
- Document limitations and considerations

## Implementation Timeline

### Week 1
- Set up dependencies and core adapters
- Implement token operations
- Begin Joule Finance integration

### Week 2
- Complete Joule Finance integration
- Implement Amnis staking
- Begin Thala integration

### Week 3
- Complete Thala integration
- Begin additional protocol integrations
- Start agent integration

### Week 4
- Complete remaining protocol integrations
- Finalize agent integration
- Comprehensive testing
- Documentation and polish

## Conclusion

This implementation plan provides a structured approach to enhancing the ADAS Aptos Plugin with Move Agent Kit capabilities. By following this phased approach, we can incrementally add functionality while ensuring stability and reliability. The enhanced plugin will significantly expand ADAS's ability to interact with the Aptos ecosystem, providing users with comprehensive DeFi capabilities across multiple protocols. 