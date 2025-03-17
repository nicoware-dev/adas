import { elizaLogger } from "@elizaos/core";
import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    Content,
    composeContext,
    generateObjectDeprecated,
} from "@elizaos/core";
import {
    Aptos,
    AptosConfig,
    Network,
    Account,
    Ed25519PrivateKey,
    PrivateKey,
    PrivateKeyVariants,
    UserTransactionResponse
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../../enviroment";
import { MerkleClient, fromNumber } from "./client";
import { FailedSendTransactionError, MerkleBaseError } from "./error";

/**
 * Interface for Merkle Trade Market Order content
 */
export interface MerklePlaceMarketOrderContent extends Content {
    pair: string;
    sizeDelta: string | number;
    collateralDelta: string | number;
    isLong: boolean | string;
}

/**
 * Type guard for Merkle Trade Market Order content
 */
function isMerklePlaceMarketOrderContent(content: unknown): content is MerklePlaceMarketOrderContent {
    elizaLogger.info("Content for Merkle market order", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    // Check required fields
    return typeof c.pair === "string" &&
        (typeof c.sizeDelta === "string" || typeof c.sizeDelta === "number") &&
        (typeof c.collateralDelta === "string" || typeof c.collateralDelta === "number") &&
        (typeof c.isLong === "boolean" || typeof c.isLong === "string");
}

/**
 * Template for extracting market order information
 */
const merkleMarketOrderTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "pair": "BTC_USD",
    "sizeDelta": "10",
    "collateralDelta": "5",
    "isLong": true
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Merkle Trade market order:
- Trading pair (e.g., "BTC_USD", "ETH_USD")
- Size delta (the size of the position)
- Collateral delta (the amount of collateral to use)
- Whether this is a long position (true) or short position (false)

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Helper function to convert various inputs to boolean
 */
function toBoolean(value: unknown): boolean {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        const lowered = value.toLowerCase();
        return lowered === "true" ||
               lowered === "yes" ||
               lowered === "long" ||
               lowered === "buy" ||
               lowered === "1";
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    return false;
}

/**
 * Place a market order on Merkle Trade
 */
async function placeMarketOrderWithMerkleTrade(
    aptosClient: Aptos,
    account: Account,
    pair: string,
    sizeDelta: number,
    collateralDelta: number,
    isLong: boolean
): Promise<string> {
    try {
        elizaLogger.info(`Placing market order on Merkle Trade: ${pair}, size: ${sizeDelta}, collateral: ${collateralDelta}, isLong: ${isLong}`);

        // Initialize Merkle client
        const merkleConfig = await MerkleClient.mainnetConfig();
        const merkle = new MerkleClient(merkleConfig);

        // Convert numbers to the expected format
        const sizeStr = fromNumber(sizeDelta, 8);
        const collateralStr = fromNumber(collateralDelta, 8);

        // Create the market order payload
        const payload = merkle.payloads.placeMarketOrder({
            pair,
            userAddress: account.accountAddress,
            sizeDelta: sizeStr,
            collateralDelta: collateralStr,
            isLong,
            isIncrease: true // Default to increasing position
        });

        // Build transaction
        elizaLogger.info("Building transaction");
        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: payload,
        });

        // Sign and submit transaction
        elizaLogger.info("Signing and submitting transaction");
        const transactionHash = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction
        });

        // Wait for transaction to be processed
        elizaLogger.info(`Transaction submitted with hash: ${transactionHash.hash}`);
        const signedTransaction = await aptosClient.waitForTransaction({ transactionHash: transactionHash.hash });

        if (!signedTransaction.success) {
            elizaLogger.error("Transaction failed:", signedTransaction);
            throw new Error("Market order failed");
        }

        elizaLogger.info("Market order placed successfully");
        return signedTransaction.hash;
    } catch (error) {
        if (error instanceof MerkleBaseError) {
            throw new Error(`Merkle Trade error: ${error.message}`);
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Market order failed: ${errorMessage}`);
    }
}

/**
 * Handler for MERKLE_PLACE_MARKET_ORDER action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract parameters from message
        const context = composeContext({
            state,
            template: merkleMarketOrderTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isMerklePlaceMarketOrderContent(content)) {
            elizaLogger.error("Invalid content for MERKLE_PLACE_MARKET_ORDER action.");
            callback?.({
                text: "Unable to process market order request. Please provide pair, size, collateral amount, and position direction (long/short).",
                content: { action: "MERKLE_PLACE_MARKET_ORDER", status: "error", error: "Invalid market order content" },
            });
            return false;
        }

        // Convert inputs to appropriate types
        const isLong = toBoolean(content.isLong);
        const positionType = isLong ? "long" : "short";

        // Send a confirmation message first
        callback?.({
            text: `Processing request to place a ${positionType} market order for ${content.pair} with size ${content.sizeDelta} and collateral ${content.collateralDelta} on Merkle Trade...`,
            content: {
                action: "MERKLE_PLACE_MARKET_ORDER",
                status: "pending",
                pair: content.pair,
                sizeDelta: content.sizeDelta,
                collateralDelta: content.collateralDelta,
                isLong
            }
        });

        // Initialize Aptos client
        const config = await validateAptosConfig(runtime);
        const network = config.APTOS_NETWORK as Network;
        const aptosConfig = new AptosConfig({ network });
        const aptosClient = new Aptos(aptosConfig);

        // Create account from private key
        const privateKey = new Ed25519PrivateKey(
            PrivateKey.formatPrivateKey(
                config.APTOS_PRIVATE_KEY,
                PrivateKeyVariants.Ed25519
            )
        );
        const account = Account.fromPrivateKey({ privateKey });

        // Place market order
        const hash = await placeMarketOrderWithMerkleTrade(
            aptosClient,
            account,
            content.pair,
            Number(content.sizeDelta),
            Number(content.collateralDelta),
            isLong
        );

        // Format the response
        const response = [
            "# Market Order Placed Successfully",
            "",
            `**Trading Pair**: ${content.pair}`,
            `**Direction**: ${positionType.toUpperCase()}`,
            `**Size**: ${content.sizeDelta}`,
            `**Collateral**: ${content.collateralDelta}`,
            `**Transaction Hash**: \`${hash}\``,
            "",
            "Your market order has been successfully placed on Merkle Trade.",
            "You can check your positions to monitor this trade."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "MERKLE_PLACE_MARKET_ORDER",
                status: "complete",
                transactionHash: hash,
                pair: content.pair,
                sizeDelta: content.sizeDelta,
                collateralDelta: content.collateralDelta,
                isLong
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in MERKLE_PLACE_MARKET_ORDER handler:", error);
        callback?.({
            text: `Failed to place market order on Merkle Trade: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "MERKLE_PLACE_MARKET_ORDER", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for placing market orders on Merkle Trade
 */
const merklePlaceMarketOrderAction: Action = {
    name: "MERKLE_PLACE_MARKET_ORDER",
    description: "Place a market order on Merkle Trade",
    similes: [
        "PLACE_MARKET_ORDER_MERKLE",
        "MERKLE_MARKET_ORDER",
        "CREATE_MARKET_ORDER_MERKLE",
        "MAKE_MARKET_ORDER_MERKLE"
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Place a market order to buy BTC on Merkle Trade with 10 USDC collateral"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Create a short market order for ETH with 5x leverage on Merkle Trade"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Execute a long market order for BTC_USD with 20 USDC size and 10 USDC collateral on Merkle"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return messageText.includes("market order") &&
               (messageText.includes("merkle") || messageText.includes("merkle trade"));
    },
    suppressInitialMessage: true
};

export default merklePlaceMarketOrderAction;
