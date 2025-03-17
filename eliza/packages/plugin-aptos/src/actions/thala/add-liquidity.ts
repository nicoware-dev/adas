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
import { walletProvider } from "../../providers/wallet";

// Thala Protocol contract address
const THALA_CONTRACT_ADDRESS = "0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af";

/**
 * Interface for Thala Add Liquidity content
 */
export interface ThalaAddLiquidityContent extends Content {
    tokenX: string;
    tokenY: string;
    amountX: string | number;
    amountY: string | number;
}

/**
 * Type guard for Thala Add Liquidity content
 */
function isThalaAddLiquidityContent(content: unknown): content is ThalaAddLiquidityContent {
    elizaLogger.info("Content for Thala add liquidity", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;

    // Validate required fields
    return typeof c.tokenX === "string" &&
        typeof c.tokenY === "string" &&
        (typeof c.amountX === "string" || typeof c.amountX === "number") &&
        (typeof c.amountY === "string" || typeof c.amountY === "number");
}

/**
 * Template for extracting add liquidity information
 */
const thalaAddLiquidityTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenX": "0x1::aptos_coin::AptosCoin",
    "tokenY": "0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af::thala_token::THALA",
    "amountX": "100",
    "amountY": "1000"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Thala Protocol add liquidity operation:
- First token type (tokenX, e.g., "0x1::aptos_coin::AptosCoin" for APT)
- Second token type (tokenY)
- Amount of first token (amountX)
- Amount of second token (amountY)

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Add liquidity to Thala pool
 */
async function addLiquidityWithThala(
    aptosClient: Aptos,
    account: Account,
    tokenX: string,
    tokenY: string,
    amountX: number,
    amountY: number
): Promise<string> {
    try {
        elizaLogger.info(`Adding liquidity to Thala pool: ${tokenX} + ${tokenY}, amounts: ${amountX}, ${amountY}`);

        // Prepare transaction data
        const txData: InputGenerateTransactionPayloadData = {
            function: `${THALA_CONTRACT_ADDRESS}::weighted_pool_scripts::add_liquidity`,
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
            functionArguments: [amountX, amountY, 0, 0, 0, 0, 0, 0],
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
        elizaLogger.info(`Transaction submitted with hash: ${transactionHash.hash}`);
        const signedTransaction = await aptosClient.waitForTransaction({ transactionHash: transactionHash.hash });

        if (!signedTransaction.success) {
            elizaLogger.error("Transaction failed:", signedTransaction);
            throw new Error("Add liquidity failed");
        }

        elizaLogger.info("Add liquidity completed successfully");
        return signedTransaction.hash;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Add liquidity failed: ${errorMessage}`);
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
 * Handler for THALA_ADD_LIQUIDITY action
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
            template: thalaAddLiquidityTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isThalaAddLiquidityContent(content)) {
            elizaLogger.error("Invalid content for THALA_ADD_LIQUIDITY action.");
            callback?.({
                text: "Unable to process add liquidity request. Please provide both token types and amounts.",
                content: { action: "THALA_ADD_LIQUIDITY", status: "error", error: "Invalid add liquidity content" },
            });
            return false;
        }

        // Send a confirmation message first
        const tokenXName = getTokenDisplayName(content.tokenX);
        const tokenYName = getTokenDisplayName(content.tokenY);

        callback?.({
            text: `Processing request to add liquidity to ${tokenXName}-${tokenYName} pool on Thala Protocol...`,
            content: {
                action: "THALA_ADD_LIQUIDITY",
                status: "pending",
                tokenX: content.tokenX,
                tokenY: content.tokenY,
                amountX: content.amountX,
                amountY: content.amountY
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

        // Add liquidity
        const hash = await addLiquidityWithThala(
            aptosClient,
            account,
            content.tokenX,
            content.tokenY,
            Number(content.amountX),
            Number(content.amountY)
        );

        // Format the response
        const response = [
            `# Liquidity Added Successfully`,
            "",
            `**Pool**: ${tokenXName}-${tokenYName}`,
            `**${tokenXName} Amount**: ${content.amountX}`,
            `**${tokenYName} Amount**: ${content.amountY}`,
            `**Transaction Hash**: \`${hash}\``,
            "",
            "Your liquidity has been successfully added to the Thala Protocol pool.",
            "You can now earn fees from trades in this pool."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "THALA_ADD_LIQUIDITY",
                status: "complete",
                transactionHash: hash,
                tokenX: content.tokenX,
                tokenY: content.tokenY,
                amountX: content.amountX,
                amountY: content.amountY
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in THALA_ADD_LIQUIDITY handler:", error);
        callback?.({
            text: `Failed to add liquidity on Thala Protocol: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "THALA_ADD_LIQUIDITY", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for adding liquidity on Thala Protocol
 */
const thalaAddLiquidityAction: Action = {
    name: "THALA_ADD_LIQUIDITY",
    description: "Add liquidity to a Thala Protocol pool",
    similes: [
        "ADD_LIQUIDITY_THALA",
        "THALA_PROVIDE_LIQUIDITY",
        "PROVIDE_LIQUIDITY_THALA",
        "DEPOSIT_LIQUIDITY_THALA"
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Add 100 APT and 1000 THALA tokens as liquidity on Thala Protocol"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Provide liquidity to APT-USDC pool on Thala with 50 APT and 500 USDC"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("add liquidity") || messageText.includes("provide liquidity")) &&
               messageText.includes("thala");
    },
    suppressInitialMessage: true
};

export default thalaAddLiquidityAction;
