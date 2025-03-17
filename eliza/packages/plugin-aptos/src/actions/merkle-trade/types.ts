import type { InputGenerateTransactionPayloadData } from "@aptos-labs/ts-sdk";

/**
 * Interface for Merkle position
 */
export interface MerklePosition {
    id: string;
    pairType: string;
    isLong: boolean;
    size: string;
    collateral: string;
    avgPrice: string;
    stopLossTriggerPrice: string;
    takeProfitTriggerPrice: string;
    liquidationPrice: string;
    leverage: string;
    unrealizedPnl: string;
    unrealizedPnlPercentage: string;
}

/**
 * Human readable position with numeric values
 */
export interface HumanReadableMerklePosition {
    id: string;
    pairType: string;
    isLong: boolean;
    size: number;
    collateral: number;
    avgPrice: number;
    stopLossTriggerPrice: number;
    takeProfitTriggerPrice: number;
    liquidationPrice: number;
    leverage: number;
    unrealizedPnl: number;
    unrealizedPnlPercentage: number;
}

/**
 * Configuration for MerkleClient
 */
export interface MerkleClientConfig {
    moduleAddress: string;
    endpoints: {
        mainnet: string;
        testnet: string;
    };
    sdkEndpoint: string;
}

/**
 * Payload for place order operations
 */
export interface MerkleOrderPayload extends InputGenerateTransactionPayloadData {
}
