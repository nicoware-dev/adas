import { elizaLogger } from "@elizaos/core";
import {
    type ActionExample,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    type Action,
} from "@elizaos/core";
import { composeContext } from "@elizaos/core";
import { generateObjectDeprecated } from "@elizaos/core";
import {
    Account,
    Aptos,
    AptosConfig,
    Ed25519PrivateKey,
    type Network,
    PrivateKey,
    PrivateKeyVariants,
    type InputGenerateTransactionPayloadData,
    type MoveStructId,
    type UserTransactionResponse,
    AccountAddress
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../../enviroment";
import {
    normalizeTokenSymbol,
    isFungibleAsset as isTokenFungibleAsset,
    getFungibleAssetAddress
} from "../../utils/token-utils";

// Joule Finance contract address
const JOULE_CONTRACT_ADDRESS = "0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6";

// USDC Fungible Asset Address from successful transaction
const USDC_FUNGIBLE_ASSET_ADDRESS = "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b";

// APT token address
const APT_TOKEN_ADDRESS = "0x1::aptos_coin::AptosCoin";

export interface JouleLendContent extends Content {
    amount: string | number;
    tokenType: string;
    positionId?: string | null;
    newPosition?: boolean | string;
    isFungibleAsset?: boolean | string;
}

function isJouleLendContent(content: unknown): content is JouleLendContent {
    elizaLogger.info("Content for Joule lend", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return (
        (typeof c.amount === "string" || typeof c.amount === "number") &&
        typeof c.tokenType === "string"
    );
}

const jouleLendTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "amount": "1000",
    "tokenType": "0x1::aptos_coin::AptosCoin",
    "positionId": "1",
    "newPosition": false,
    "isFungibleAsset": false
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Joule Finance lending operation:
- Amount to lend
- Token type to lend (e.g., "APT", "USDC", "USDT", "BTC", "ETH" or a full address like "0x1::aptos_coin::AptosCoin")
- Position ID (if specified, otherwise "1")
- Whether to create a new position (if specified, otherwise false)
- Whether the token is a fungible asset (if specified, otherwise false)

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Converts a value to a boolean
 */
function toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        const lowercased = value.toLowerCase();
        return lowercased === 'true' || lowercased === 'yes' || lowercased === '1';
    }
    return Boolean(value);
}

/**
 * Extracts the address part from a token type string
 * For example, "0x1::aptos_coin::AptosCoin" -> "0x1"
 */
function extractAddressPart(tokenType: string): string {
    // If it's already just an address, return it
    if (tokenType.match(/^0x[0-9a-fA-F]+$/)) {
        return tokenType;
    }

    // If it's a full module path, extract the address part
    const parts = tokenType.split("::");
    if (parts.length > 1) {
        return parts[0];
    }

    // Default to APT token address if we can't extract
    return "0x1";
}

/**
 * Updates Token maps with correct fungible asset addresses based on transaction data
 */
function getCorrectFungibleAssetAddress(tokenType: string): string {
    const normalizedType = normalizeTokenSymbol(tokenType);

    // Use transaction data for known tokens
    if (normalizedType.toLowerCase().includes("usdc")) {
        elizaLogger.info("Using exact USDC fungible asset address from transaction data");
        return USDC_FUNGIBLE_ASSET_ADDRESS;
    }

    // Default extraction logic for other tokens
    return extractAddressPart(normalizedType);
}

/**
 * Lends tokens on Joule Finance
 */
async function lendToken(
    aptosClient: Aptos,
    account: Account,
    amount: number,
    tokenType: string,
    positionId: string | null,
    newPosition: boolean,
    isFungibleAsset: boolean
): Promise<{ hash: string; positionId: string }> {
    try {
        elizaLogger.info(`Lending ${amount} of ${tokenType} on Joule Finance`);
        elizaLogger.info(`Position ID: ${positionId}, New Position: ${newPosition}, Fungible Asset: ${isFungibleAsset}`);

        // Normalize token type
        const normalizedTokenType = normalizeTokenSymbol(tokenType);
        elizaLogger.info(`Normalized token type: ${normalizedTokenType}`);

        // Convert amount to a number with appropriate decimals
        // Most Aptos tokens use 8 decimals
        const DECIMALS = 8;
        const adjustedAmount = Math.floor(amount * (10 ** DECIMALS));
        elizaLogger.info(`Adjusted amount: ${adjustedAmount}`);

        // Prepare transaction data based on token type
        let txData: InputGenerateTransactionPayloadData;

        // Based on the successful transaction, we need to use position ID "1" for new positions
        // This is likely because the first position for a user is always "1"
        const effectivePositionId = newPosition ? "1" : (positionId || "1");
        elizaLogger.info(`Using effective position ID: ${effectivePositionId}`);

        if (isFungibleAsset) {
            // For fungible assets
            elizaLogger.info("Using fungible asset method for lending");

            // Use the utility function to get the correct address format
            const tokenAddress = getFungibleAssetAddress(normalizedTokenType);
            elizaLogger.info(`Using token address for fungible asset: ${tokenAddress}`);

            txData = {
                function: `${JOULE_CONTRACT_ADDRESS}::pool::lend_fa`,
                functionArguments: [
                    effectivePositionId,
                    tokenAddress,
                    newPosition,
                    adjustedAmount
                ],
            };
            elizaLogger.info(`Using lend_fa with args: ${JSON.stringify(txData.functionArguments)}`);
        } else {
            // For standard coins - match the successful transaction
            txData = {
                function: `${JOULE_CONTRACT_ADDRESS}::pool::lend`,
                typeArguments: [normalizedTokenType],
                functionArguments: [
                    effectivePositionId,
                    adjustedAmount,
                    newPosition
                ],
            };
            elizaLogger.info(`Using lend with args: ${JSON.stringify(txData.functionArguments)}`);
        }

        elizaLogger.info("Building Joule lend transaction with data:", JSON.stringify(txData, null, 2));
        elizaLogger.info("Function arguments types:", txData.functionArguments.map(arg => `${arg} (${typeof arg})`));

        // Build the transaction
        const tx = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: txData,
        });

        // Sign and submit the transaction
        const committedTransaction = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction: tx,
        });

        elizaLogger.info(`Transaction submitted with hash: ${committedTransaction.hash}`);

        // Wait for the transaction to be processed
        const executedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransaction.hash,
        });

        if (!executedTransaction.success) {
            elizaLogger.error("Lending transaction failed", executedTransaction);
            throw new Error(`Lending transaction failed: ${executedTransaction.vm_status || "Unknown error"}`);
        }

        elizaLogger.info("Transaction executed successfully");

        // Try to extract position ID from transaction events
        let resultPositionId = positionId || "";
        try {
            // Cast to UserTransactionResponse to access events
            const txWithEvents = executedTransaction as UserTransactionResponse;

            elizaLogger.info(`Transaction has ${txWithEvents.events?.length || 0} events`);

            if (txWithEvents.events && txWithEvents.events.length > 0) {
                for (const event of txWithEvents.events) {
                    elizaLogger.info(`Checking event of type: ${event.type}`);
                    if (event.type?.includes("pool::LendEvent")) {
                        elizaLogger.info(`Found LendEvent: ${JSON.stringify(event.data)}`);
                        if (event.data && typeof event.data === 'object') {
                            const eventData = event.data as Record<string, unknown>;
                            if ('position_id' in eventData && eventData.position_id !== undefined) {
                                resultPositionId = String(eventData.position_id);
                                elizaLogger.info(`Extracted position ID from events: ${resultPositionId}`);

                                // Store this position ID in memory for future use
                                // This is especially important when lending USDC
                                if (tokenType.toLowerCase().includes("usdc")) {
                                    elizaLogger.info(`Storing USDC position ID ${resultPositionId} for future reference`);
                                    // We'd normally store this in a database, but for now we'll log it prominently
                                    elizaLogger.warn(`IMPORTANT: USDC position ID is ${resultPositionId} - use this ID for future USDC operations`);
                                }

                                break;
                            }
                        }
                    }
                }
            }
        } catch (eventError) {
            elizaLogger.warn("Could not extract position ID from transaction events:", eventError);
            // Continue with the default position ID
        }

        return {
            hash: executedTransaction.hash,
            positionId: resultPositionId
        };
    } catch (error) {
        elizaLogger.error("Error lending on Joule Finance:", error);
        if (error instanceof Error) {
            throw new Error(`Lending failed: ${error.message}`);
        }
        throw new Error("Lending failed with unknown error");
    }
}

export default {
    name: "JOULE_LEND",
    similes: [
        "LEND_JOULE",
        "JOULE_DEPOSIT",
        "DEPOSIT_JOULE",
        "LEND_ON_JOULE",
        "DEPOSIT_ON_JOULE",
    ],
    description: "Lend tokens on Joule Finance",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("Starting JOULE_LEND handler...");

        try {
            // Compose lend context
            const lendContext = composeContext({
                state,
                template: jouleLendTemplate,
            });

            // Generate lend content
            const content = await generateObjectDeprecated({
                runtime,
                context: lendContext,
                modelClass: ModelClass.SMALL,
            });

            elizaLogger.info("Generated content:", JSON.stringify(content, null, 2));

            // Validate lend content
            if (!isJouleLendContent(content)) {
                elizaLogger.error("Invalid content for JOULE_LEND action.");
                if (callback) {
                    callback({
                        text: "Unable to process lending request. Please provide token type and amount to lend.",
                        content: { action: "JOULE_LEND", status: "error", error: "Invalid lending content" },
                    });
                }
                return false;
            }

            // Get token display name for better UX
            let tokenDisplay = content.tokenType;
            if (content.tokenType.toLowerCase() === "apt" ||
                content.tokenType.toLowerCase() === "aptos" ||
                content.tokenType === "0x1::aptos_coin::AptosCoin") {
                tokenDisplay = "APT";
            } else if (content.tokenType.includes("::")) {
                const parts = content.tokenType.split("::");
                tokenDisplay = parts.length > 0 ? parts[parts.length - 1] : content.tokenType;
            }

            // Send a confirmation message first
            if (callback) {
                callback({
                    text: `Processing request to lend ${content.amount} ${tokenDisplay} on Joule Finance...`,
                    content: {
                        action: "JOULE_LEND",
                        status: "pending",
                        amount: content.amount,
                        tokenType: content.tokenType
                    },
                });
            }

            // Initialize Aptos client and account
            const config = await validateAptosConfig(runtime);
            const aptosConfig = new AptosConfig({
                network: config.APTOS_NETWORK as Network
            });
            const aptosClient = new Aptos(aptosConfig);

            // Create account from private key
            const privateKey = new Ed25519PrivateKey(
                PrivateKey.formatPrivateKey(
                    config.APTOS_PRIVATE_KEY,
                    PrivateKeyVariants.Ed25519
                )
            );
            const account = Account.fromPrivateKey({ privateKey });

            // Set defaults for optional parameters and ensure proper types
            // Prefer using an existing position by default instead of creating a new one
            let positionId: string | null = null;
            if (content.positionId && content.positionId !== "null" && content.positionId !== null) {
                positionId = content.positionId;
            } else {
                // Default to position ID 1 when no position is specified
                positionId = "1";
            }
            elizaLogger.info(`Using position ID: ${positionId}`);

            // Default to false (use existing position) unless explicitly set to true
            const newPosition = content.newPosition === undefined ? false : toBoolean(content.newPosition);
            elizaLogger.info(`Using newPosition: ${newPosition} (${typeof newPosition})`);

            // For APT, we should always use standard coin mode, not fungible asset mode
            let isFungibleAsset = content.isFungibleAsset === undefined ? false : toBoolean(content.isFungibleAsset);

            // Override fungible asset flag for APT
            if (content.tokenType.toLowerCase() === "apt" ||
                content.tokenType.toLowerCase() === "aptos" ||
                content.tokenType === "0x1::aptos_coin::AptosCoin") {
                isFungibleAsset = false;
                elizaLogger.info("Overriding isFungibleAsset to false for APT token");
            }

            elizaLogger.info(`Using isFungibleAsset: ${isFungibleAsset} (${typeof isFungibleAsset})`);

            // Convert amount to number
            const amount = Number(content.amount);
            if (Number.isNaN(amount) || amount <= 0) {
                throw new Error("Invalid amount. Must be a positive number.");
            }

            // Lend tokens on Joule
            const result = await lendToken(
                aptosClient,
                account,
                amount,
                content.tokenType,
                positionId,
                newPosition,
                isFungibleAsset
            );

            // Format the response
            const response = [
                "# Lending Successful on Joule Finance",
                "",
                `**Amount**: ${content.amount} ${tokenDisplay}`,
                `**Position ID**: ${result.positionId}`,
                `**Transaction Hash**: \`${result.hash}\``,
                "",
                "Your tokens have been successfully lent on Joule Finance.",
                "You can view your position on the Joule Finance dashboard."
            ].join("\n");

            if (callback) {
                callback({
                    text: response,
                    content: {
                        action: "JOULE_LEND",
                        status: "complete",
                        lend: {
                            amount: content.amount,
                            tokenType: content.tokenType,
                            tokenDisplay,
                            positionId: result.positionId,
                            transactionHash: result.hash,
                            newPosition
                        }
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error during Joule lending:", error);
            if (callback) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                callback({
                    text: `Error lending on Joule Finance: ${errorMessage}`,
                    content: {
                        action: "JOULE_LEND",
                        status: "error",
                        error: errorMessage
                    },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to lend 100 APT on Joule Finance",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Processing request to lend 100 APT on Joule Finance...",
                    action: "JOULE_LEND",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "# Lending Successful on Joule Finance\n\n**Amount**: 100 APT\n**Position ID**: 123456\n**Transaction Hash**: `0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0`\n\nYour tokens have been successfully lent on Joule Finance.\nYou can view your position on the Joule Finance dashboard.",
                },
            },
        ],
    ] as ActionExample[][],
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        elizaLogger.info("JOULE_LEND validation for user:", message.userId, "with message:", messageText);

        // Check for Joule-specific keywords
        const hasJouleKeywords =
            messageText.includes("joule") ||
            messageText.includes("lending protocol");

        // Check for lending-related verbs
        const hasLendingVerb =
            messageText.includes("lend") ||
            messageText.includes("deposit") ||
            messageText.includes("supply");

        // Check for token indicators
        const hasTokenIndicator =
            messageText.includes("apt") ||
            messageText.includes("usdc") ||
            messageText.includes("usdt") ||
            messageText.includes("token") ||
            messageText.includes("coin");

        const shouldValidate = hasJouleKeywords && hasLendingVerb && hasTokenIndicator;
        elizaLogger.info("JOULE_LEND validation result:", { shouldValidate, hasJouleKeywords, hasLendingVerb, hasTokenIndicator });

        return shouldValidate;
    },
    suppressInitialMessage: true,
} as Action;
