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
import { MerkleClient } from "./client";
import { FailedSendTransactionError, MerkleBaseError, PositionNotFoundError } from "./error";
import { HumanReadableMerklePosition } from "./types";

/**
 * Interface for Merkle Trade Close Position content
 */
export interface MerkleClosePositionContent extends Content {
    positionId?: string | number | null;
    pair?: string | null;
}

/**
 * Type guard for Merkle Trade Close Position content
 */
function isMerkleClosePositionContent(content: unknown): content is MerkleClosePositionContent {
    elizaLogger.info("Content for Merkle Trade Close Position", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;

    // Either positionId or pair is required
    return (
        (c.positionId !== undefined && (typeof c.positionId === "string" || typeof c.positionId === "number" || c.positionId === null)) ||
        (c.pair !== undefined && (typeof c.pair === "string" || c.pair === null))
    );
}

/**
 * Template for extracting close position information
 */
const merkleClosePositionTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "positionId": "1",
    "pair": "BTC_USD"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the Merkle Trade position to close:
- Position ID (if specified)
- Trading pair (e.g. "BTC_USD", "ETH_USD", etc.)

Note: Either position ID or pair (or both) should be provided.

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Closes a position on Merkle Trade
 */
async function closePositionWithMerkleTrade(
    aptosClient: Aptos,
    account: Account,
    positionId?: string | number | null,
    pair?: string | null
): Promise<{ hash: string; position: HumanReadableMerklePosition }> {
    try {
        // Initialize Merkle Trade client
        const merkleConfig = await MerkleClient.mainnetConfig();
        const merkle = new MerkleClient(merkleConfig);

        // Fetch user positions
        const positions = await merkle.getPositions(account.accountAddress.toString());
        if (!positions || positions.length === 0) {
            throw new PositionNotFoundError("No positions found for this account");
        }

        // Find the position to close
        let positionToClose: HumanReadableMerklePosition | undefined;

        if (positionId !== null && positionId !== undefined) {
            // Find by position ID
            const id = String(positionId);
            positionToClose = positions.find(pos => pos.id === id);
        } else if (pair !== null && pair !== undefined) {
            // Find by pair
            positionToClose = positions.find(pos => pos.pairType === pair);
        }

        if (!positionToClose) {
            const searchCriteria = positionId !== null && positionId !== undefined
                ? `position ID: ${positionId}`
                : `pair: ${pair}`;
            throw new PositionNotFoundError(`No position found matching ${searchCriteria}`);
        }

        elizaLogger.info(`Closing position: ${JSON.stringify(positionToClose)}`);

        // Create close position payload
        const payload = merkle.payloads.closePosition({
            userAddress: account.accountAddress,
            positionId: positionToClose.id
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
            throw new FailedSendTransactionError("Close position failed", signedTransaction as UserTransactionResponse);
        }

        elizaLogger.info("Position closed successfully");
        return { hash: signedTransaction.hash, position: positionToClose };
    } catch (error) {
        if (error instanceof MerkleBaseError) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Close position failed: ${errorMessage}`);
    }
}

/**
 * Formats the PnL result with a + or - sign
 */
function formatPnl(pnl: number): string {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}${pnl.toFixed(2)}`;
}

/**
 * Handler for MERKLE_CLOSE_POSITION action
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
            template: merkleClosePositionTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isMerkleClosePositionContent(content)) {
            elizaLogger.error("Invalid content for MERKLE_CLOSE_POSITION action.");
            callback?.({
                text: "Unable to process close position request. Please provide either a position ID or trading pair.",
                content: { action: "MERKLE_CLOSE_POSITION", status: "error", error: "Invalid close position content" },
            });
            return false;
        }

        // Send a confirmation message first
        const positionIdentifier = content.positionId ? `ID ${content.positionId}` : content.pair ? `for ${content.pair}` : '';
        callback?.({
            text: `Processing request to close Merkle Trade position ${positionIdentifier}...`,
            content: {
                action: "MERKLE_CLOSE_POSITION",
                status: "pending",
                positionId: content.positionId,
                pair: content.pair
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

        // Close the position
        const result = await closePositionWithMerkleTrade(
            aptosClient,
            account,
            content.positionId,
            content.pair
        );

        // Format the response
        const position = result.position;
        const positionType = position.isLong ? "Long" : "Short";
        const pnlPercent = position.unrealizedPnlPercentage;
        const pnlAmount = position.unrealizedPnl;

        const response = [
            `# ${positionType} Position Closed Successfully`,
            "",
            `**Pair**: ${position.pairType}`,
            `**Position ID**: ${position.id}`,
            `**Position Type**: ${positionType}`,
            `**Size**: ${position.size} USDC`,
            `**Collateral**: ${position.collateral} USDC`,
            `**Leverage**: ${position.leverage}x`,
            `**PnL**: ${formatPnl(pnlAmount)} USDC (${formatPnl(pnlPercent)}%)`,
            `**Transaction Hash**: \`${result.hash}\``,
            "",
            "Your position has been closed successfully. The funds have been returned to your account."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "MERKLE_CLOSE_POSITION",
                status: "complete",
                transactionHash: result.hash,
                position: position
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in MERKLE_CLOSE_POSITION handler:", error);

        let errorMessage = "Unknown error";
        if (error instanceof PositionNotFoundError) {
            errorMessage = `Position not found. ${error.message}`;
        } else if (error instanceof MerkleBaseError) {
            errorMessage = error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        callback?.({
            text: `Failed to close position on Merkle Trade: ${errorMessage}`,
            content: { action: "MERKLE_CLOSE_POSITION", status: "error", error: errorMessage }
        });
        return false;
    }
};

/**
 * Action for closing positions on Merkle Trade
 */
const merkleClosePositionAction: Action = {
    name: "MERKLE_CLOSE_POSITION",
    description: "Close a position on Merkle Trade",
    similes: [
        "CLOSE_POSITION_MERKLE",
        "MERKLE_CLOSE_TRADE",
        "EXIT_POSITION_MERKLE",
        "LIQUIDATE_POSITION_MERKLE"
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Close my BTC position on Merkle Trade"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Close position ID 5 on Merkle Trade"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Exit my ETH_USD trade on Merkle"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("close") || messageText.includes("exit") || messageText.includes("liquidate")) &&
               messageText.includes("position") &&
               (messageText.includes("merkle") || messageText.includes("merkle trade"));
    },
    suppressInitialMessage: true
};

export default merkleClosePositionAction;
