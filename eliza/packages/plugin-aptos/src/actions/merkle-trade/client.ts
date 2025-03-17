import { elizaLogger } from "@elizaos/core";
import type { AccountAddress } from "@aptos-labs/ts-sdk";
import { MerkleClientConfig, MerkleOrderPayload, MerklePosition } from "./types";
import { PositionNotFoundError } from "./error";

/**
 * A client for interacting with Merkle Trade
 */
export class MerkleClient {
    private readonly config: MerkleClientConfig;
    private readonly network: string;

    constructor(config: MerkleClientConfig, network: string = "mainnet") {
        this.config = config;
        this.network = network;
        elizaLogger.info(`Initialized MerkleClient with network: ${network}`);
    }

    /**
     * Get the mainnet configuration
     */
    static async mainnetConfig(): Promise<MerkleClientConfig> {
        // This is a fixed configuration for mainnet
        return {
            moduleAddress: "0xc0deb00c405f84c85dc13442e305df75d1288500dd13e18ea600109b7c6a5c7f",
            endpoints: {
                mainnet: "https://merkle-trade-mainnet.vercel.app/api",
                testnet: "https://merkle-trade-testnet.vercel.app/api",
            },
            sdkEndpoint: "https://merkle-trade-mainnet.vercel.app/api",
        };
    }

    /**
     * Get positions for an address
     */
    async getPositions({ address }: { address: string }): Promise<MerklePosition[]> {
        try {
            const endpoint = this.config.endpoints[this.network as keyof typeof this.config.endpoints];
            elizaLogger.info(`Fetching positions from ${endpoint} for address ${address}`);

            // Fetch positions from Merkle Trade API
            const response = await fetch(`${endpoint}/positions?address=${address}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch positions: ${response.statusText}`);
            }

            const data = await response.json();
            elizaLogger.info(`Found ${data.positions?.length || 0} positions`);

            return data.positions || [];
        } catch (error) {
            elizaLogger.error("Error fetching positions:", error);
            throw error;
        }
    }

    /**
     * Payload generators for different order types
     */
    payloads = {
        /**
         * Create payload for placing a limit order
         */
        placeLimitOrder: ({
            pair,
            userAddress,
            sizeDelta,
            collateralDelta,
            price,
            isLong,
            isIncrease,
        }: {
            pair: string;
            userAddress: AccountAddress;
            sizeDelta: string;
            collateralDelta: string;
            price: string;
            isLong: boolean;
            isIncrease: boolean;
        }): MerkleOrderPayload => {
            elizaLogger.info(`Creating limit order payload: ${JSON.stringify({
                pair, sizeDelta, collateralDelta, price, isLong, isIncrease
            })}`);

            return {
                function: `${this.config.moduleAddress}::merkle_trade::place_limit_order`,
                typeArguments: [],
                functionArguments: [
                    pair,
                    sizeDelta,
                    collateralDelta,
                    price,
                    isLong,
                    isIncrease,
                ],
            };
        },

        /**
         * Create payload for placing a market order
         */
        placeMarketOrder: ({
            pair,
            userAddress,
            sizeDelta,
            collateralDelta,
            isLong,
            isIncrease,
        }: {
            pair: string;
            userAddress: AccountAddress;
            sizeDelta: string;
            collateralDelta: string;
            isLong: boolean;
            isIncrease: boolean;
        }): MerkleOrderPayload => {
            elizaLogger.info(`Creating market order payload: ${JSON.stringify({
                pair, sizeDelta, collateralDelta, isLong, isIncrease
            })}`);

            return {
                function: `${this.config.moduleAddress}::merkle_trade::place_market_order`,
                typeArguments: [],
                functionArguments: [
                    pair,
                    sizeDelta,
                    collateralDelta,
                    isLong,
                    isIncrease,
                ],
            };
        },
    };
}

/**
 * Helper to convert a number to a string with the given number of decimals
 */
export function fromNumber(num: number, decimals: number): string {
    const factor = Math.pow(10, decimals);
    return (num * factor).toString();
}

/**
 * Helper to convert a string to a number with the given number of decimals
 */
export function toNumber(value: string, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Number(value) / factor;
}
