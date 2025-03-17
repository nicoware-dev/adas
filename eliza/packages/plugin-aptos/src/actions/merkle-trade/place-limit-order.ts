import { elizaLogger } from "@elizaos/core";
import {
    Action,
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
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
 * Interface for Merkle Trade Place Limit Order content
 */
export interface MerklePlaceLimitOrderContent extends Content {
    pair: string;
    sizeDelta: string | number;
    collateralDelta: string | number;
    price: string | number;
    isLong: boolean | string;
}

/**
 * Type guard for Merkle Trade Place Limit Order content
 */
function isMerklePlaceLimitOrderContent(content: unknown): content is MerklePlaceLimitOrderContent {
    elizaLogger.info("Content for Merkle Trade Place Limit Order", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;

    // Validate required fields
    return typeof c.pair === "string" &&
        (typeof c.sizeDelta === "string" || typeof c.sizeDelta === "number") &&
        (typeof c.collateralDelta === "string" || typeof c.collateralDelta === "number") &&
        (typeof c.price === "string" || typeof c.price === "number") &&
        (typeof c.isLong === "boolean" || typeof c.isLong === "string");
}

/**
 * Template for extracting limit order information
 */
const merklePlaceLimitOrderTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "pair": "BTC_USD",
    "sizeDelta": 10,
    "collateralDelta": 10,
    "price": 60000,
    "isLong": true
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Merkle Trade limit order:
- Trading pair (e.g. "BTC_USD", "ETH_USD")
- Size delta (amount of the position in USD)
- Collateral delta (amount of collateral in USD)
- Price (target price for the limit order)
- Is long (true for long position, false for short position)

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Helper to normalize boolean values
 */
function toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        const lowercased = value.toLowerCase();
        return lowercased === 'true' || lowercased === 'yes' || lowercased === '1' ||
               lowercased === 'long';
    }
    return Boolean(value);
}

/**
 * Places a limit order on Merkle Trade
 */
async function placeLimitOrderWithMerkleTrade(
    aptosClient: Aptos,
    account: Account,
    pair: string,
    sizeDelta: number,
    collateralDelta: number,
    price: number,
    isLong: boolean
): Promise<string> {
    try {
        elizaLogger.info(`Placing limit order on Merkle Trade: ${JSON.stringify({
            pair, sizeDelta, collateralDelta, price, isLong
        })}`);

        // Initialize Merkle Trade client
        const merkleConfig = await MerkleClient.mainnetConfig();
        const merkle = new MerkleClient(merkleConfig);

        // Create limit order payload
        const payload = merkle.payloads.placeLimitOrder({
            pair,
            userAddress: account.accountAddress,
            sizeDelta: fromNumber(sizeDelta, 6),
            collateralDelta: fromNumber(collateralDelta, 6),
            price: fromNumber(price, 10),
            isLong,
            isIncrease: true,
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
            throw new FailedSendTransactionError("Place limit order failed", signedTransaction as UserTransactionResponse);
        }

        elizaLogger.info("Limit order placed successfully");
        return signedTransaction.hash;
    } catch (error) {
        if (error instanceof MerkleBaseError) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Place limit order failed: ${errorMessage}`);
    }
}

/**
 * Handler for MERKLE_PLACE_LIMIT_ORDER action
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
            template: merklePlaceLimitOrderTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isMerklePlaceLimitOrderContent(content)) {
            elizaLogger.error("Invalid content for MERKLE_PLACE_LIMIT_ORDER action.");
            callback?.({
                text: "Unable to process limit order request. Please provide pair, size, collateral, price, and position type (long/short).",
                content: { action: "MERKLE_PLACE_LIMIT_ORDER", status: "error", error: "Invalid limit order content" },
            });
            return false;
        }

        // Send a confirmation message first
        const positionType = toBoolean(content.isLong) ? "Long" : "Short";
        callback?.({
            text: `Processing ${positionType} limit order for ${content.pair} at price $${content.price}...`,
            content: {
                action: "MERKLE_PLACE_LIMIT_ORDER",
                status: "pending",
                pair: content.pair,
                sizeDelta: content.sizeDelta,
                collateralDelta: content.collateralDelta,
                price: content.price,
                isLong: toBoolean(content.isLong),
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

        // Place limit order
        const hash = await placeLimitOrderWithMerkleTrade(
            aptosClient,
            account,
            content.pair,
            Number(content.sizeDelta),
            Number(content.collateralDelta),
            Number(content.price),
            toBoolean(content.isLong)
        );

        // Format the response
        const leverage = Number(content.sizeDelta) / Number(content.collateralDelta);
        const response = [
            `# ${positionType} Limit Order Placed Successfully`,
            "",
            `**Pair**: ${content.pair}`,
            `**Order Type**: Limit ${positionType}`,
            `**Size**: ${content.sizeDelta} USDC`,
            `**Collateral**: ${content.collateralDelta} USDC`,
            `**Leverage**: ${leverage.toFixed(2)}x`,
            `**Price**: $${content.price}`,
            `**Transaction Hash**: \`${hash}\``,
            "",
            "Your limit order has been placed successfully. It will be executed when the market price reaches your specified limit price.",
            "You can check the status of your order in your Merkle Trade positions."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "MERKLE_PLACE_LIMIT_ORDER",
                status: "complete",
                transactionHash: hash,
                pair: content.pair,
                sizeDelta: content.sizeDelta,
                collateralDelta: content.collateralDelta,
                price: content.price,
                isLong: toBoolean(content.isLong)
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in MERKLE_PLACE_LIMIT_ORDER handler:", error);
        callback?.({
            text: `Failed to place limit order on Merkle Trade: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "MERKLE_PLACE_LIMIT_ORDER", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for placing limit orders on Merkle Trade
 */
const merklePlaceLimitOrderAction: Action = {
    name: "MERKLE_PLACE_LIMIT_ORDER",
    description: "Place a limit order on Merkle Trade",
    similes: [
        "PLACE_LIMIT_ORDER_MERKLE",
        "MERKLE_LIMIT_ORDER",
        "CREATE_LIMIT_ORDER_MERKLE",
        "MAKE_LIMIT_ORDER_MERKLE"
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Place a limit order to buy BTC at $60,000 on Merkle Trade with 10 USDC collateral"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Create a short limit order for ETH at $2,500 with 5x leverage on Merkle Trade"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Set up a long limit order for BTC_USD at $58,000 with 20 USDC size and 10 USDC collateral on Merkle"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return messageText.includes("limit order") &&
               (messageText.includes("merkle") || messageText.includes("merkle trade"));
    },
    suppressInitialMessage: true
};

export default merklePlaceLimitOrderAction;
