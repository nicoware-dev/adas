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
    InputGenerateTransactionPayloadData
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../../enviroment";

// Thala Protocol contract address
const THALA_CONTRACT_ADDRESS = "0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af";

/**
 * Interface for Thala Remove Liquidity content
 */
export interface ThalaRemoveLiquidityContent extends Content {
    tokenX: string;
    tokenY: string;
    lpAmount: string | number;
}

/**
 * Type guard for Thala Remove Liquidity content
 */
function isThalaRemoveLiquidityContent(content: unknown): content is ThalaRemoveLiquidityContent {
    elizaLogger.info("Content for Thala remove liquidity", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;

    // Validate required fields
    return typeof c.tokenX === "string" &&
        typeof c.tokenY === "string" &&
        (typeof c.lpAmount === "string" || typeof c.lpAmount === "number");
}

/**
 * Template for extracting remove liquidity information
 */
const thalaRemoveLiquidityTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenX": "0x1::aptos_coin::AptosCoin",
    "tokenY": "0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af::thala_token::THALA",
    "lpAmount": "50"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Thala Protocol remove liquidity operation:
- First token type (tokenX, e.g., "0x1::aptos_coin::AptosCoin" for APT)
- Second token type (tokenY)
- LP token amount to remove (lpAmount)

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Remove liquidity from Thala pool
 */
async function removeLiquidityWithThala(
    aptosClient: Aptos,
    account: Account,
    tokenX: string,
    tokenY: string,
    lpAmount: number
): Promise<string> {
    try {
        elizaLogger.info("Removing liquidity from Thala pool: " + tokenX + " + " + tokenY + ", amount: " + lpAmount);

        // Prepare transaction data
        const txData: InputGenerateTransactionPayloadData = {
            function: `${THALA_CONTRACT_ADDRESS}::weighted_pool_scripts::remove_liquidity`,
            typeArguments: [
                tokenX,
                tokenY,
                `${THALA_CONTRACT_ADDRESS}::base_pool::Null`,
                `${THALA_CONTRACT_ADDRESS}::base_pool::Null`,
                `${THALA_CONTRACT_ADDRESS}::weighted_pool::Weight_50`,
                `${THALA_CONTRACT_ADDRESS}::weighted_pool::Weight_50`,
                `${THALA_CONTRACT_ADDRESS}::base_pool::Null`,
                `${THALA_CONTRACT_ADDRESS}::base_pool::Null`,
            ],
            functionArguments: [lpAmount, 0, 0, 0, 0],
        };

        // Build transaction
        elizaLogger.info("Building transaction");
        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: txData,
        });

        // Sign and submit transaction
        elizaLogger.info("Signing and submitting transaction");
        const transactionHash = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction
        });

        // Wait for transaction to be processed
        elizaLogger.info("Transaction submitted with hash: " + transactionHash.hash);
        const signedTransaction = await aptosClient.waitForTransaction({ transactionHash: transactionHash.hash });

        if (!signedTransaction.success) {
            elizaLogger.error("Transaction failed:", signedTransaction);
            throw new Error("Remove liquidity failed");
        }

        elizaLogger.info("Remove liquidity completed successfully");
        return signedTransaction.hash;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error("Remove liquidity failed: " + errorMessage);
    }
}

/**
 * Helper to get token name for display
 */
function getTokenDisplayName(tokenAddress: string): string {
    if (tokenAddress === "0x1::aptos_coin::AptosCoin") {
        return "APT";
    }

    const tokenParts = tokenAddress.split("::");
    if (tokenParts.length > 2) {
        return tokenParts[2];
    }

    return "token";
}

/**
 * Handler for THALA_REMOVE_LIQUIDITY action
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
            template: thalaRemoveLiquidityTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isThalaRemoveLiquidityContent(content)) {
            elizaLogger.error("Invalid content for THALA_REMOVE_LIQUIDITY action.");
            callback?.({
                text: "Unable to process remove liquidity request. Please provide both token types and LP amount.",
                content: { action: "THALA_REMOVE_LIQUIDITY", status: "error", error: "Invalid remove liquidity content" },
            });
            return false;
        }

        // Send a confirmation message first
        const tokenXName = getTokenDisplayName(content.tokenX);
        const tokenYName = getTokenDisplayName(content.tokenY);

        callback?.({
            text: "Processing request to remove liquidity from " + tokenXName + "-" + tokenYName + " pool on Thala Protocol...",
            content: {
                action: "THALA_REMOVE_LIQUIDITY",
                status: "pending",
                tokenX: content.tokenX,
                tokenY: content.tokenY,
                lpAmount: content.lpAmount
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

        // Remove liquidity
        const hash = await removeLiquidityWithThala(
            aptosClient,
            account,
            content.tokenX,
            content.tokenY,
            Number(content.lpAmount)
        );

        // Format the response
        const response = [
            "# Liquidity Removed Successfully",
            "",
            "**Pool**: " + tokenXName + "-" + tokenYName,
            "**LP Amount**: " + content.lpAmount,
            "**Transaction Hash**: `" + hash + "`",
            "",
            "Your liquidity has been successfully removed from the Thala Protocol pool.",
            "The tokens have been returned to your account."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "THALA_REMOVE_LIQUIDITY",
                status: "complete",
                transactionHash: hash,
                tokenX: content.tokenX,
                tokenY: content.tokenY,
                lpAmount: content.lpAmount
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in THALA_REMOVE_LIQUIDITY handler:", error);
        callback?.({
            text: "Failed to remove liquidity on Thala Protocol: " + (error instanceof Error ? error.message : "Unknown error"),
            content: { action: "THALA_REMOVE_LIQUIDITY", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for removing liquidity on Thala Protocol
 */
const thalaRemoveLiquidityAction: Action = {
    name: "THALA_REMOVE_LIQUIDITY",
    description: "Remove liquidity from a Thala Protocol pool",
    similes: [
        "REMOVE_LIQUIDITY_THALA",
        "THALA_WITHDRAW_LIQUIDITY",
        "WITHDRAW_LIQUIDITY_THALA",
        "THALA_UNSTAKE_LP"
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Remove 50 LP tokens from my APT-THALA position on Thala Protocol"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Withdraw my liquidity from APT-USDC pool on Thala"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("remove liquidity") || messageText.includes("withdraw liquidity")) &&
               messageText.includes("thala");
    },
    suppressInitialMessage: true
};

export default thalaRemoveLiquidityAction;
