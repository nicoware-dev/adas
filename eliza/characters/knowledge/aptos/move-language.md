# Move Language

## Overview

Move is a programming language designed for secure implementation of custom transaction logic and smart contracts on the Aptos blockchain. Originally developed by Facebook (now Meta) for the Diem blockchain, Move has been adopted and enhanced by Aptos to provide a safe, flexible, and verifiable language for blockchain development.

## Key Features

### Resource-Oriented Programming

The most distinctive feature of Move is its first-class resources. Unlike traditional programming languages where values can be copied or implicitly discarded, Move's resources:

- Cannot be copied
- Cannot be implicitly discarded
- Can only be moved between program storage locations

This resource-oriented approach directly maps to the requirements of digital assets, preventing issues like double-spending or asset loss through programming errors.

### Static Type System

Move employs a strong static type system that catches many errors at compile time:

- Comprehensive type checking
- Generics support
- Ability-based access control
- Resource safety guarantees

### Module System

Move code is organized into modules:

- **Modules**: Collections of functions and type definitions
- **Scripts**: Entry points that can call module functions
- **Structs**: Custom data types that can be defined as resources

### Bytecode Verification

Move includes a bytecode verifier that performs static analysis to ensure:

- Type safety
- Resource safety
- Reference safety
- No unauthorized memory access

## Move on Aptos

Aptos has extended the Move language with several enhancements:

- **Parallel Execution**: Support for parallel transaction execution
- **Table Data Structure**: Efficient key-value storage
- **Fine-grained Storage**: Optimized on-chain storage model
- **Entry Functions**: Simplified transaction entry points
- **View Functions**: Read-only functions for querying state

## Core Concepts

### Modules and Scripts

```move
module my_address::basic_coin {
    struct Coin has key, store {
        value: u64,
    }
    
    public fun mint(amount: u64): Coin {
        Coin { value: amount }
    }
    
    public fun value(coin: &Coin): u64 {
        coin.value
    }
}

script {
    use my_address::basic_coin;
    
    fun main(account: signer) {
        let coin = basic_coin::mint(100);
        // Use coin...
    }
}
```

### Resources and Abilities

Move uses "abilities" to control how types can be used:

- **copy**: Value can be copied
- **drop**: Value can be discarded without explicit destruction
- **key**: Value can be used as a key for global storage
- **store**: Value can be stored inside another structure

Resources typically have the `key` and `store` abilities but not `copy` or `drop`.

### Ownership and Borrowing

Move uses an ownership system similar to Rust:

- Values can be moved (transferring ownership)
- Values can be borrowed immutably (&T) or mutably (&mut T)
- The compiler enforces borrowing rules to prevent data races

### Global Storage

Move provides a global storage model where resources are stored under account addresses:

```move
// Store a resource
move_to(&account, resource);

// Borrow a resource
let resource_ref = borrow_global<ResourceType>(address);

// Mutably borrow a resource
let resource_mut_ref = borrow_global_mut<ResourceType>(address);

// Remove a resource
let resource = move_from<ResourceType>(address);

// Check if a resource exists
let exists = exists<ResourceType>(address);
```

## Common Patterns in Move

### Capability Pattern

Using resources as capabilities to control access to sensitive operations:

```move
module example::capability {
    struct AdminCapability has key {
        // fields...
    }
    
    public fun initialize(admin: &signer) {
        move_to(admin, AdminCapability { /* ... */ });
    }
    
    public fun admin_only_function(_cap: &AdminCapability) {
        // Only callable with admin capability
    }
}
```

### One-Time Witness Pattern

Creating a unique type that can only be constructed once during module initialization:

```move
module example::witness {
    struct WITNESS has drop {}
    
    fun init(witness: WITNESS) {
        // This can only be called once during initialization
        assert!(type_name::get<WITNESS>() == type_name::get_module(), 0);
    }
}
```

### Event Pattern

Emitting events for off-chain tracking:

```move
module example::events {
    struct TransferEvent has drop, store {
        from: address,
        to: address,
        amount: u64,
    }
    
    public fun transfer(from: address, to: address, amount: u64) {
        // Transfer logic...
        
        // Emit event
        event::emit(TransferEvent { from, to, amount });
    }
}
```

## Development Tools

- **Aptos CLI**: Command-line interface for interacting with Aptos
- **Move Prover**: Formal verification tool for Move programs
- **Move Analyzer**: Language server for IDE integration
- **Move Package Manager**: Dependency management for Move packages

## Best Practices

1. **Resource Safety**: Always handle resources properly, ensuring they are never copied or discarded
2. **Error Handling**: Use descriptive error codes and proper error handling
3. **Access Control**: Implement proper access control using capabilities or signer-based checks
4. **Testing**: Write comprehensive unit tests for modules
5. **Gas Optimization**: Optimize code for gas efficiency
6. **Formal Verification**: Use the Move Prover for critical contracts
7. **Code Comments**: Document code thoroughly with inline comments

## Common DeFi Patterns

### Token Implementation

```move
module example::basic_token {
    struct Token has key {
        balance: u64,
    }
    
    public fun transfer(from: &signer, to: address, amount: u64) acquires Token {
        let from_addr = signer::address_of(from);
        let from_token = borrow_global_mut<Token>(from_addr);
        
        assert!(from_token.balance >= amount, 1); // Insufficient balance
        from_token.balance = from_token.balance - amount;
        
        if (exists<Token>(to)) {
            let to_token = borrow_global_mut<Token>(to);
            to_token.balance = to_token.balance + amount;
        } else {
            move_to(to, Token { balance: amount });
        }
    }
}
```

### AMM (Automated Market Maker)

```move
module example::simple_amm {
    struct LiquidityPool has key {
        token_a: u64,
        token_b: u64,
    }
    
    public fun swap_a_to_b(pool: &mut LiquidityPool, amount_in: u64): u64 {
        let k = pool.token_a * pool.token_b; // Constant product formula
        let new_token_a = pool.token_a + amount_in;
        let new_token_b = k / new_token_a;
        
        let amount_out = pool.token_b - new_token_b;
        
        pool.token_a = new_token_a;
        pool.token_b = new_token_b;
        
        amount_out
    }
}
```

## Resources for Learning Move

- [Aptos Move Documentation](https://aptos.dev/move/move-on-aptos)
- [Move Book](https://move-language.github.io/move/)
- [Aptos Developer Tutorials](https://aptos.dev/tutorials)
- [Move Examples Repository](https://github.com/move-language/move/tree/main/language/documentation/examples)
- [Aptos Framework](https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/framework) 
