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
    Aptos,
    AptosConfig,
    type Network,
    Account,
    Ed25519PrivateKey,
    PrivateKey,
    PrivateKeyVariants,
    type InputGenerateTransactionPayloadData
} from "@aptos-labs/ts-sdk";
import axios from "axios";
import { validateAptosConfig } from "../../enviroment";
import {
    normalizeTokenSymbol,
    isFungibleAsset as isTokenFungibleAsset,
    JOULE_TOKEN_ADDRESSES,
    getFungibleAssetAddress
} from "../../utils/token-utils";
import { PYTH_PRICE_FEEDS, getPythPriceUpdateData } from "../../utils/pyth-utils";

// Debug line to verify the module is loaded correctly
elizaLogger.info("Joule Borrow module loaded with Pyth SDK integration");

// Joule Finance contract address
const JOULE_CONTRACT_ADDRESS = "0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6";

// USDC Fungible Asset Address from successful transaction
const USDC_FUNGIBLE_ASSET_ADDRESS = "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b";

// Pyth Hermes endpoint (used in Move Agent Kit)
const PYTH_HERMES_ENDPOINT = "https://hermes.pyth.network";

// Pyth contract address on Aptos (updated to the correct mainnet address)
const PYTH_CONTRACT = "0x7e783b5b47eda3dcb278a16c3f10a47e3608c489aab9767b6b53d69e4ec85d3f";

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
 * More thorough extraction of token address from a token type string
 * Specifically handles fungible assets by ensuring we only get the address part
 */
function extractFungibleAssetAddress(tokenType: string): string {
    // If it's already just an address, return it
    if (tokenType.match(/^0x[0-9a-fA-F]+$/)) {
        return tokenType;
    }

    // If it's a full module path, extract the address part
    if (tokenType.includes("::")) {
        const parts = tokenType.split("::");
        if (parts.length > 0) {
            // Just return the address part (0x...)
            return parts[0];
        }
    }

    // Default to APT token address if we can't extract
    elizaLogger.warn(`Could not extract address from token type: ${tokenType}, defaulting to 0x1`);
    return "0x1";
}

export interface JouleBorrowContent extends Content {
    amount: string | number;
    tokenType: string;
    positionId?: string;
    isFungibleAsset?: boolean | string;
}

function isJouleBorrowContent(content: unknown): content is JouleBorrowContent {
    elizaLogger.info("Content for Joule borrowing", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return (
        (typeof c.amount === "string" || typeof c.amount === "number") &&
        typeof c.tokenType === "string"
    );
}

const jouleBorrowTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "amount": "0.5",
    "tokenType": "0x1::aptos_coin::AptosCoin",
    "positionId": "1",
    "isFungibleAsset": false
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Joule Finance borrowing operation:
- Amount to borrow
- Token type to borrow (e.g., "APT", "USDC", "USDT", "BTC", "ETH" or a full address like "0x1::aptos_coin::AptosCoin")
- Position ID (if specified, otherwise "1")
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
 * Fetches the latest price update data from Pyth Network
 * @returns The price update data for all required tokens
 */
async function fetchPythPriceUpdateData(): Promise<number[][]> {
    try {
        // Use the getPythPriceUpdateData function to fetch VAAs for ALL required price feeds
        // This exactly matches the Move Agent Kit implementation
        elizaLogger.info("Fetching ALL required Pyth price feeds like Move Agent Kit does");
        return await getPythPriceUpdateData();
    } catch (error) {
        elizaLogger.error("Error fetching Pyth price update data:", error);
        throw new Error(`Failed to fetch Pyth price data: ${error instanceof Error ? error.message : String(error)}`);
    }
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
    return extractFungibleAssetAddress(normalizedType);
}

/**
 * Borrows tokens from Joule Finance
 */
async function borrowToken(
    aptosClient: Aptos,
    account: Account,
    amount: number,
    tokenType: string,
    positionId: string,
    originalIsFungibleAsset: boolean,
    network: Network
): Promise<string> {
    try {
        elizaLogger.info(`Borrowing ${amount} of ${tokenType} from Joule Finance, Position ID: ${positionId}`);

        // Normalize token type using our utility function
        const normalizedTokenType = normalizeTokenSymbol(tokenType);
        elizaLogger.info(`Normalized token type: ${normalizedTokenType}`);

        // Get the token type from the normalized token (e.g., "USDC" from full address)
        let tokenSymbol = tokenType.toUpperCase();
        if (normalizedTokenType.includes("::")) {
            const parts = normalizedTokenType.split("::");
            tokenSymbol = parts[parts.length - 1].toUpperCase();
        }
        elizaLogger.info(`Token symbol: ${tokenSymbol}`);

        // Determine if token should be treated as fungible asset based on our knowledge
        // Use our utility function to determine the correct value
        let isFungibleAsset = originalIsFungibleAsset;
        const shouldBeFungibleAsset = isTokenFungibleAsset(normalizedTokenType);

        // Only override if we have explicit knowledge
        if (shouldBeFungibleAsset !== originalIsFungibleAsset) {
            elizaLogger.info(`Overriding isFungibleAsset from ${originalIsFungibleAsset} to ${shouldBeFungibleAsset} based on token type`);
            isFungibleAsset = shouldBeFungibleAsset;
        }

        // Convert amount to a number with appropriate decimals
        // Most Aptos tokens use 8 decimals
        const DECIMALS = 8;
        const adjustedAmount = Math.floor(amount * (10 ** DECIMALS));
        elizaLogger.info(`Adjusted amount: ${adjustedAmount}`);

        // Ensure position ID is properly formatted
        const effectivePositionId = positionId === "null" ? "1" : positionId;
        elizaLogger.info(`Using effective position ID: ${effectivePositionId}`);

        // Fetch Pyth price update data - this follows Move Agent Kit's approach exactly
        elizaLogger.info("Fetching Pyth price update data");
        const priceFeeds = await fetchPythPriceUpdateData();

        // Define the default function arguments like Move Agent Kit does
        const DEFAULT_FUNCTIONAL_ARGS = [effectivePositionId, adjustedAmount, priceFeeds];
        elizaLogger.info(`Got Pyth price updates (${priceFeeds.length} entries)`);

        // Prepare transaction data based on token type
        let txData: InputGenerateTransactionPayloadData;

        if (isFungibleAsset) {
            // For fungible assets
            elizaLogger.info("Using fungible asset method for borrowing");

            // Use the utility function to get the correct address format
            const tokenAddress = getFungibleAssetAddress(normalizedTokenType);
            elizaLogger.info(`Using token address for fungible asset: ${tokenAddress}`);

            txData = {
                function: `${JOULE_CONTRACT_ADDRESS}::pool::borrow_fa`,
                functionArguments: [effectivePositionId, tokenAddress, adjustedAmount, priceFeeds],
            };

            elizaLogger.info(`Using fungible asset args: ${JSON.stringify(txData.functionArguments)}`);
        } else {
            // For regular coins like APT
            elizaLogger.info("Using coin standard method for borrowing");
            txData = {
                function: `${JOULE_CONTRACT_ADDRESS}::pool::borrow`,
                typeArguments: [normalizedTokenType],
                functionArguments: DEFAULT_FUNCTIONAL_ARGS,
            };
        }

        // Build the transaction
        elizaLogger.info("Building borrow transaction");
        const borrowTx = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: txData,
        });

        // Sign and submit the transaction
        elizaLogger.info("Signing and submitting borrow transaction");
        const committedBorrowTx = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction: borrowTx,
        });

        elizaLogger.info(`Borrow transaction submitted with hash: ${committedBorrowTx.hash}`);

        // Wait for the transaction to be processed
        const executedBorrowTx = await aptosClient.waitForTransaction({
            transactionHash: committedBorrowTx.hash,
        });

        if (!executedBorrowTx.success) {
            elizaLogger.error("Borrow transaction failed", executedBorrowTx);
            throw new Error(`Borrow transaction failed: ${executedBorrowTx.vm_status || "Unknown error"}`);
        }

        elizaLogger.info("Borrow transaction completed successfully");
        return committedBorrowTx.hash;
    } catch (error) {
        elizaLogger.error("Error borrowing from Joule Finance:", error);
        throw new Error(`Token borrow failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Updates Pyth price feeds on-chain before using them
 * @param aptosClient The Aptos client
 * @param account The account to use for the transaction
 * @param priceUpdateData The price update data (VAAs) to submit
 */
async function updatePythPriceFeeds(
    aptosClient: Aptos,
    account: Account,
    priceUpdateData: string[]
): Promise<void> {
    try {
        elizaLogger.info(`Updating Pyth price feeds with ${priceUpdateData.length} price updates`);

        // Skip the Pyth update step in case of errors - we'll use a direct transaction
        elizaLogger.info("Skipping Pyth price update step due to previous errors");
        elizaLogger.warn("Proceeding directly with borrow transaction");
        return;

        // The code below is skipped but kept for future reference
        /*
        // Build update price feeds transaction
        const updateTxData: InputGenerateTransactionPayloadData = {
            function: `${PYTH_CONTRACT}::pyth::update_price_feeds`,
            functionArguments: [priceUpdateData],
        };

        // Build the transaction
        const updateTx = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: updateTxData,
        });

        // Sign and submit the transaction
        const committedUpdateTx = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction: updateTx,
        });

        elizaLogger.info(`Price update transaction submitted with hash: ${committedUpdateTx.hash}`);

        // Wait for the transaction to be processed
        const executedUpdateTx = await aptosClient.waitForTransaction({
            transactionHash: committedUpdateTx.hash,
        });

        if (!executedUpdateTx.success) {
            elizaLogger.error("Price update transaction failed", executedUpdateTx);
            throw new Error(`Price update transaction failed: ${executedUpdateTx.vm_status || "Unknown error"}`);
        }

        elizaLogger.info("Pyth price feeds successfully updated on-chain");
        */
    } catch (error) {
        elizaLogger.error("Error updating Pyth price feeds:", error);
        // Don't throw error, just log and continue
        elizaLogger.warn("Proceeding with borrow despite Pyth update failure");
    }
}

export default {
    name: "JOULE_BORROW",
    similes: [
        "BORROW_JOULE",
        "JOULE_LOAN",
        "TAKE_LOAN_JOULE",
        "BORROW_FROM_JOULE",
        "GET_LOAN_JOULE",
    ],
    description: "Borrow tokens from Joule Finance",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("Starting JOULE_BORROW handler...");

        try {
            // Compose borrow context
            const borrowContext = composeContext({
                state,
                template: jouleBorrowTemplate,
            });

            // Generate borrow content
            const content = await generateObjectDeprecated({
                runtime,
                context: borrowContext,
                modelClass: ModelClass.SMALL,
            });

            elizaLogger.info("Generated content:", JSON.stringify(content, null, 2));

            // Validate borrow content
            if (!isJouleBorrowContent(content)) {
                elizaLogger.error("Invalid content for JOULE_BORROW action.");
                if (callback) {
                    callback({
                        text: "Unable to process borrowing request. Please provide token type and amount to borrow.",
                        content: { action: "JOULE_BORROW", status: "error", error: "Invalid borrowing content" },
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
                    text: `Processing request to borrow ${content.amount} ${tokenDisplay} from Joule Finance...`,
                    content: {
                        action: "JOULE_BORROW",
                        status: "pending",
                        amount: content.amount,
                        tokenType: content.tokenType
                    },
                });
            }

            // Initialize Aptos client and account
            const config = await validateAptosConfig(runtime);
            const network = config.APTOS_NETWORK as Network;
            const aptosConfig = new AptosConfig({
                network
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
            let positionId = content.positionId || "1"; // Default to position ID 1

            // Handle "null" string value for position ID
            if (positionId === "null") {
                positionId = "1";
            }

            elizaLogger.info(`Using position ID: ${positionId}`);

            // Determine if we should use fungible asset handling based on token type
            const isFungibleAsset = content.isFungibleAsset === undefined
                ? isTokenFungibleAsset(content.tokenType)
                : toBoolean(content.isFungibleAsset);

            elizaLogger.info(`Initial isFungibleAsset: ${isFungibleAsset} (${typeof isFungibleAsset})`);

            // Convert amount to number
            const amount = Number(content.amount);
            if (Number.isNaN(amount) || amount <= 0) {
                throw new Error("Invalid amount. Must be a positive number.");
            }

            // Borrow tokens from Joule
            const hash = await borrowToken(
                aptosClient,
                account,
                amount,
                content.tokenType,
                positionId,
                isFungibleAsset,
                network
            );

            // Format the response
            const response = [
                "# Borrowing Successful from Joule Finance",
                "",
                `**Amount**: ${content.amount} ${tokenDisplay}`,
                `**Position ID**: ${positionId}`,
                `**Transaction Hash**: \`${hash}\``,
                "",
                "Your tokens have been successfully borrowed from Joule Finance.",
                "The borrowed tokens should now be available in your wallet.",
                "",
                "Remember to monitor your collateral ratio to avoid liquidation."
            ].join("\n");

            if (callback) {
                callback({
                    text: response,
                    content: {
                        action: "JOULE_BORROW",
                        status: "complete",
                        borrow: {
                            amount: content.amount,
                            tokenType: content.tokenType,
                            tokenDisplay,
                            positionId,
                            transactionHash: hash
                        }
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error during Joule borrowing:", error);
            if (callback) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                callback({
                    text: `Error borrowing from Joule Finance: ${errorMessage}`,
                    content: {
                        action: "JOULE_BORROW",
                        status: "error",
                        error: errorMessage
                    },
                });
            }
            return false;
        }
    },

    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        elizaLogger.info("JOULE_BORROW validation for user:", message.userId, "with message:", messageText);

        // Check for Joule-specific keywords
        const hasJouleKeywords =
            messageText.includes("joule") ||
            messageText.includes("lending protocol");

        // Check for borrowing-related verbs
        const hasBorrowingVerb =
            messageText.includes("borrow") ||
            messageText.includes("loan") ||
            messageText.includes("get credit") ||
            messageText.includes("take out loan");

        // Check for token indicators
        const hasTokenIndicator =
            messageText.includes("apt") ||
            messageText.includes("usdc") ||
            messageText.includes("usdt") ||
            messageText.includes("token") ||
            messageText.includes("coin") ||
            messageText.includes("funds") ||
            messageText.includes("money");

        const shouldValidate = hasJouleKeywords && hasBorrowingVerb && hasTokenIndicator;
        elizaLogger.info("JOULE_BORROW validation result:", { shouldValidate, hasJouleKeywords, hasBorrowingVerb, hasTokenIndicator });

        return shouldValidate;
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to borrow 0.5 APT from Joule Finance",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Processing request to borrow 0.5 APT from Joule Finance...",
                    action: "JOULE_BORROW",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "# Borrowing Successful from Joule Finance\n\n**Amount**: 0.5 APT\n**Position ID**: 1\n**Transaction Hash**: `0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0`\n\nYour tokens have been successfully borrowed from Joule Finance.\nThe borrowed tokens should now be available in your wallet.\n\nRemember to monitor your collateral ratio to avoid liquidation.",
                },
            },
        ],
    ] as ActionExample[][],
    suppressInitialMessage: true,
} as Action;
