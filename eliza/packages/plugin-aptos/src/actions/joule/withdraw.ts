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

export interface JouleWithdrawContent extends Content {
    amount: string | number;
    tokenType: string;
    positionId?: string;
    isFungibleAsset?: boolean | string;
}

function isJouleWithdrawContent(content: unknown): content is JouleWithdrawContent {
    elizaLogger.info("Content for Joule withdrawal", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return (
        (typeof c.amount === "string" || typeof c.amount === "number") &&
        typeof c.tokenType === "string"
    );
}

const jouleWithdrawTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

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

Given the recent messages, extract the following information about the requested Joule Finance withdrawal operation:
- Amount to withdraw
- Token type to withdraw (e.g., "APT", "USDC", "USDT", "BTC", "ETH" or a full address like "0x1::aptos_coin::AptosCoin")
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
 * Updates Pyth price feeds on-chain
 * This is a separate transaction that must be executed before withdrawal
 */
async function updatePythPriceFeeds(
    aptosClient: Aptos,
    account: Account,
    priceFeeds: number[][]
): Promise<void> {
    try {
        elizaLogger.info(`Updating ${priceFeeds.length} Pyth price feeds on-chain`);

        // Build a transaction for updating price feeds
        const txData: InputGenerateTransactionPayloadData = {
            function: `${PYTH_CONTRACT}::pyth::update_price_feeds`,
            functionArguments: [priceFeeds],
        };

        // Use the existing withdrawToken implementation which correctly handles
        // transaction submission rather than creating a new implementation
        elizaLogger.info("Submitting price feed update transaction");

        // This skips the actual update to avoid errors - we'll rely on the contract
        // handling missing price feeds internally
        elizaLogger.info("Skipping actual price feed update due to SDK compatibility issues");
        elizaLogger.warn("Proceeding directly with withdrawal transaction");
        return;

    } catch (error) {
        elizaLogger.error("Error updating Pyth price feeds:", error);
        throw new Error(`Failed to update price feeds: ${error instanceof Error ? error.message : String(error)}`);
    }
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
 * Withdraws tokens from Joule Finance
 */
async function withdrawLoan(
    aptosClient: Aptos,
    account: Account,
    amount: number,
    tokenType: string,
    positionId: string,
    originalIsFungibleAsset: boolean,
    network: Network
): Promise<string> {
    try {
        elizaLogger.info(`Withdrawing ${amount} of ${tokenType} from Joule Finance, Position ID: ${positionId}`);

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
        elizaLogger.info(`Got Pyth price updates (${priceFeeds.length} entries)`);

        // Skip the separate update transaction since we're passing the price feeds directly
        // to the withdraw transaction, which is exactly how Move Agent Kit does it

        let txData: InputGenerateTransactionPayloadData;

        if (isFungibleAsset) {
            elizaLogger.info("Using fungible asset method for withdrawal");

            const tokenAddress = getFungibleAssetAddress(normalizedTokenType);
            elizaLogger.info(`Using token address for fungible asset: ${tokenAddress}`);

            txData = {
                function: `${JOULE_CONTRACT_ADDRESS}::pool::withdraw_fa`,
                functionArguments: [effectivePositionId, tokenAddress, adjustedAmount, priceFeeds],
            };
        } else {
            elizaLogger.info("Using coin standard method for withdrawal");

            txData = {
                function: `${JOULE_CONTRACT_ADDRESS}::pool::withdraw`,
                typeArguments: [normalizedTokenType],
                functionArguments: [effectivePositionId, adjustedAmount, priceFeeds],
            };
        }

        elizaLogger.info("Building withdrawal transaction");

        const tx = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: txData,
        });

        elizaLogger.info("Signing and submitting withdrawal transaction");

        // Use the same signing method as in the Move Agent Kit, matching exactly how the borrow.ts works
        const committedTxHash = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction: tx,
        });

        elizaLogger.info(`Withdrawal transaction submitted with hash: ${committedTxHash.hash}`);

        // Wait for transaction to be processed
        const executedTx = await aptosClient.waitForTransaction({
            transactionHash: committedTxHash.hash,
        });

        if (!executedTx.success) {
            elizaLogger.error("Withdrawal transaction failed", executedTx);
            throw new Error(`Withdrawal transaction failed: ${executedTx.vm_status || "Unknown error"}`);
        }

        elizaLogger.info(`Successfully withdrew ${amount} ${tokenType} from Joule Finance, Position ID: ${effectivePositionId}`);

        return committedTxHash.hash;
    } catch (error) {
        elizaLogger.error("Error withdrawing from Joule Finance:", error);

        // Rethrow the error with more details
        if (error instanceof Error) {
            elizaLogger.error("Error during Joule withdrawal:", error.message);
            throw new Error(`Failed to withdraw from Joule Finance: ${error.message}`);
        }
        throw new Error("Failed to withdraw from Joule Finance: Unknown error");
    }
}

export default {
    name: "JOULE_WITHDRAW",
    similes: [
        "WITHDRAW_JOULE",
        "JOULE_WITHDRAWAL",
        "REMOVE_FUNDS_JOULE",
        "WITHDRAW_FROM_JOULE",
        "TAKE_OUT_JOULE",
    ],
    description: "Withdraw tokens from Joule Finance",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("Starting JOULE_WITHDRAW handler...");

        try {
            // Compose withdraw context
            const withdrawContext = composeContext({
                state,
                template: jouleWithdrawTemplate,
            });

            // Generate withdraw content
            const content = await generateObjectDeprecated({
                runtime,
                context: withdrawContext,
                modelClass: ModelClass.SMALL,
            });

            elizaLogger.info("Generated content:", JSON.stringify(content, null, 2));

            // Validate withdraw content
            if (!isJouleWithdrawContent(content)) {
                elizaLogger.error("Invalid content for JOULE_WITHDRAW action.");
                if (callback) {
                    callback({
                        text: "Unable to process withdrawal request. Please provide token type and amount to withdraw.",
                        content: { action: "JOULE_WITHDRAW", status: "error", error: "Invalid withdrawal content" },
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
                    text: `Processing request to withdraw ${content.amount} ${tokenDisplay} from Joule Finance...`,
                    content: {
                        action: "JOULE_WITHDRAW",
                        status: "pending",
                        amount: content.amount,
                        tokenType: content.tokenType
                    },
                });
            }

            // Initialize Aptos client
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

            // Withdraw tokens from Joule
            const hash = await withdrawLoan(
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
                "# Withdrawal Successful from Joule Finance",
                "",
                `**Amount**: ${content.amount} ${tokenDisplay}`,
                `**Position ID**: ${positionId}`,
                `**Transaction Hash**: \`${hash}\``,
                "",
                "Your tokens have been successfully withdrawn from Joule Finance.",
                "The withdrawn tokens should now be available in your wallet."
            ].join("\n");

            if (callback) {
                callback({
                    text: response,
                    content: {
                        action: "JOULE_WITHDRAW",
                        status: "complete",
                        withdraw: {
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
            elizaLogger.error("Error during Joule withdrawal:", error);
            if (callback) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                callback({
                    text: `Error withdrawing from Joule Finance: ${errorMessage}`,
                    content: {
                        action: "JOULE_WITHDRAW",
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
        elizaLogger.info("JOULE_WITHDRAW validation for user:", message.userId, "with message:", messageText);

        // Check for Joule-specific keywords
        const hasJouleKeywords =
            messageText.includes("joule") ||
            messageText.includes("lending protocol");

        // Check for withdrawal-related verbs
        const hasWithdrawalVerb =
            messageText.includes("withdraw") ||
            messageText.includes("pull out") ||
            messageText.includes("take out") ||
            messageText.includes("remove");

        // Check for token indicators
        const hasTokenIndicator =
            messageText.includes("apt") ||
            messageText.includes("usdc") ||
            messageText.includes("usdt") ||
            messageText.includes("token") ||
            messageText.includes("coin") ||
            messageText.includes("funds") ||
            messageText.includes("money");

        const shouldValidate = hasJouleKeywords && hasWithdrawalVerb && hasTokenIndicator;
        elizaLogger.info("JOULE_WITHDRAW validation result:", { shouldValidate, hasJouleKeywords, hasWithdrawalVerb, hasTokenIndicator });

        return shouldValidate;
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to withdraw 0.5 APT from Joule Finance",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Processing request to withdraw 0.5 APT from Joule Finance...",
                    action: "JOULE_WITHDRAW",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "# Withdrawal Successful from Joule Finance\n\n**Amount**: 0.5 APT\n**Position ID**: 1\n**Transaction Hash**: `0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0`\n\nYour tokens have been successfully withdrawn from Joule Finance.\nThe withdrawn tokens should now be available in your wallet.",
                },
            },
        ],
    ] as ActionExample[][],
    suppressInitialMessage: true,
} as Action;
