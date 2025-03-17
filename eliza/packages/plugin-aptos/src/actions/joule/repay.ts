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
import { validateAptosConfig } from "../../enviroment";
import {
    normalizeTokenSymbol,
    isFungibleAsset as isTokenFungibleAsset,
    JOULE_TOKEN_ADDRESSES,
    getFungibleAssetAddress
} from "../../utils/token-utils";
import axios from "axios";
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

export interface JouleRepayContent extends Content {
    amount: string | number;
    tokenType: string;
    positionId?: string;
    isFungibleAsset?: boolean | string;
}

function isJouleRepayContent(content: unknown): content is JouleRepayContent {
    elizaLogger.info("Content for Joule repaying", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return (
        (typeof c.amount === "string" || typeof c.amount === "number") &&
        typeof c.tokenType === "string"
    );
}

const jouleRepayTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

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

Given the recent messages, extract the following information about the requested Joule Finance repayment operation:
- Amount to repay
- Token type to repay (e.g., "APT", "USDC", "USDT", "BTC", "ETH" or a full address like "0x1::aptos_coin::AptosCoin")
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
        elizaLogger.warn("Proceeding directly with repay transaction");
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
        elizaLogger.warn("Proceeding with repay despite Pyth update failure");
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
 * Repays a loan on Joule Finance
 */
async function repayLoan(
    aptosClient: Aptos,
    account: Account,
    amount: number,
    tokenType: string,
    positionId: string,
    originalIsFungibleAsset: boolean,
    network: Network
): Promise<string> {
    try {
        elizaLogger.info(`Repaying ${amount} of ${tokenType} on Joule Finance, Position ID: ${positionId}`);

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

        // Note: The Move Agent Kit repay.ts does NOT use Pyth price feeds for repayment
        // So we're removing this step to match their implementation exactly
        elizaLogger.info("Note: Repay does not require Pyth price feeds according to Move Agent Kit");

        // Prepare transaction data based on token type
        let txData: InputGenerateTransactionPayloadData;

        if (isFungibleAsset) {
            // For fungible assets
            const tokenAddress = getFungibleAssetAddress(normalizedTokenType);
            elizaLogger.info(`Using token address for fungible asset: ${tokenAddress}`);

            txData = {
                function: `${JOULE_CONTRACT_ADDRESS}::pool::repay_fa`,
                functionArguments: [
                    effectivePositionId,
                    tokenAddress,
                    adjustedAmount
                ],
            };
            elizaLogger.info(`Using repay_fa with args: ${JSON.stringify(txData.functionArguments)}`);
        } else {
            // For standard coins
            txData = {
                function: `${JOULE_CONTRACT_ADDRESS}::pool::repay`,
                typeArguments: [normalizedTokenType],
                functionArguments: [effectivePositionId, adjustedAmount],
            };
            elizaLogger.info(`Using repay with args: ${JSON.stringify(txData.functionArguments)}`);
        }

        elizaLogger.info("Building Joule repay transaction with data:", JSON.stringify(txData, null, 2));
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
            elizaLogger.error("Repayment transaction failed", executedTransaction);
            throw new Error(`Repayment transaction failed: ${executedTransaction.vm_status || "Unknown error"}`);
        }

        elizaLogger.info("Transaction executed successfully");

        return executedTransaction.hash;
    } catch (error) {
        elizaLogger.error("Error repaying loan on Joule Finance:", error);
        if (error instanceof Error) {
            throw new Error(`Repayment failed: ${error.message}`);
        }
        throw new Error("Repayment failed with unknown error");
    }
}

export default {
    name: "JOULE_REPAY",
    similes: [
        "REPAY_JOULE",
        "JOULE_LOAN_REPAYMENT",
        "PAY_BACK_JOULE",
        "REPAY_TO_JOULE",
        "SETTLE_LOAN_JOULE",
    ],
    description: "Repay a loan on Joule Finance",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("Starting JOULE_REPAY handler...");

        try {
            // Compose repay context
            const repayContext = composeContext({
                state,
                template: jouleRepayTemplate,
            });

            // Generate repay content
            const content = await generateObjectDeprecated({
                runtime,
                context: repayContext,
                modelClass: ModelClass.SMALL,
            });

            elizaLogger.info("Generated content:", JSON.stringify(content, null, 2));

            // Validate repay content
            if (!isJouleRepayContent(content)) {
                elizaLogger.error("Invalid content for JOULE_REPAY action.");
                if (callback) {
                    callback({
                        text: "Unable to process repayment request. Please provide token type and amount to repay.",
                        content: { action: "JOULE_REPAY", status: "error", error: "Invalid repayment content" },
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
                    text: `Processing request to repay ${content.amount} ${tokenDisplay} on Joule Finance...`,
                    content: {
                        action: "JOULE_REPAY",
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

            // Repay loan on Joule
            const hash = await repayLoan(
                aptosClient,
                account,
                amount,
                content.tokenType,
                positionId,
                isFungibleAsset,
                config.APTOS_NETWORK as Network
            );

            // Format the response
            const response = [
                "# Loan Repayment Successful on Joule Finance",
                "",
                `**Amount Repaid**: ${content.amount} ${tokenDisplay}`,
                `**Position ID**: ${positionId}`,
                `**Transaction Hash**: \`${hash}\``,
                "",
                "Your loan repayment has been processed successfully.",
                "Your borrowed balance has been reduced accordingly.",
                "",
                "Consider closing your position if you have fully repaid your loan."
            ].join("\n");

            if (callback) {
                callback({
                    text: response,
                    content: {
                        action: "JOULE_REPAY",
                        status: "complete",
                        repay: {
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
            elizaLogger.error("Error during Joule loan repayment:", error);
            if (callback) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                callback({
                    text: `Error repaying loan on Joule Finance: ${errorMessage}`,
                    content: {
                        action: "JOULE_REPAY",
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
        elizaLogger.info("JOULE_REPAY validation for user:", message.userId, "with message:", messageText);

        // Check for Joule-specific keywords
        const hasJouleKeywords =
            messageText.includes("joule") ||
            messageText.includes("lending protocol");

        // Check for repayment-related verbs
        const hasRepaymentVerb =
            messageText.includes("repay") ||
            messageText.includes("pay back") ||
            messageText.includes("settle") ||
            messageText.includes("return loan") ||
            messageText.includes("pay loan");

        // Check for token indicators
        const hasTokenIndicator =
            messageText.includes("apt") ||
            messageText.includes("usdc") ||
            messageText.includes("usdt") ||
            messageText.includes("token") ||
            messageText.includes("coin") ||
            messageText.includes("loan") ||
            messageText.includes("debt");

        const shouldValidate = hasJouleKeywords && hasRepaymentVerb && hasTokenIndicator;
        elizaLogger.info("JOULE_REPAY validation result:", { shouldValidate, hasJouleKeywords, hasRepaymentVerb, hasTokenIndicator });

        return shouldValidate;
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to repay 0.5 APT on my Joule Finance loan",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Processing request to repay 0.5 APT on Joule Finance...",
                    action: "JOULE_REPAY",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "# Loan Repayment Successful on Joule Finance\n\n**Amount Repaid**: 0.5 APT\n**Position ID**: 1\n**Transaction Hash**: `0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0`\n\nYour loan repayment has been processed successfully.\nYour borrowed balance has been reduced accordingly.\n\nConsider closing your position if you have fully repaid your loan.",
                },
            },
        ],
    ] as ActionExample[][],
    suppressInitialMessage: true,
} as Action;
