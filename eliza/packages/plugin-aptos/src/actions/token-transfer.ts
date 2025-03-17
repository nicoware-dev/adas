import { elizaLogger } from "@elizaos/core";
import type {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    Action,
} from "@elizaos/core";
import { composeContext, generateObjectDeprecated, ModelClass } from "@elizaos/core";
import {
    Aptos,
    AptosConfig,
    Network,
    Account,
    Ed25519PrivateKey,
    AccountAddress,
    PrivateKey,
    PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import type { InputGenerateTransactionPayloadData } from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../enviroment";

export interface TransferTokenContent extends Content {
    recipient: string;
    tokenAddress: string;
    amount: string | number;
}

function isTransferTokenContent(content: unknown): content is TransferTokenContent {
    elizaLogger.info("Content for token transfer", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return (
        typeof c.recipient === "string" &&
        typeof c.tokenAddress === "string" &&
        (typeof c.amount === "string" || typeof c.amount === "number")
    );
}

const transferTokenTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "recipient": "0x123456789abcdef",
    "tokenAddress": "0x1::aptos_coin::AptosCoin",
    "amount": "100"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token transfer:
- Recipient wallet address
- Token address or symbol (e.g., "APT", "USDC", "TTK", or a full address like "0x1::aptos_coin::AptosCoin")
- Amount to transfer

If the token is mentioned as "TTK tokens (address: 0x4717b796ed683a11c5946ec13aa982fd4304a73906d12a5bb5558d5238a3a15c)", extract the address part.
`;

/**
 * Validates if a string is a valid hex address
 */
function isValidHexAddress(address: string): boolean {
    // Check if it starts with 0x and contains only hex characters
    return /^0x[0-9a-fA-F]+$/.test(address);
}

// Define a type for coin store data
interface CoinStoreData {
    coin: {
        value: string;
    };
}

/**
 * Transfers tokens to a recipient on the Aptos blockchain
 */
async function transferToken(
    aptosClient: Aptos,
    account: Account,
    recipient: string,
    tokenAddress: string,
    amount: number | string
): Promise<string> {
    try {
        // Convert amount to number if it's a string
        const numericAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount;

        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
            throw new Error("Invalid amount. Must be a positive number.");
        }

        // Convert recipient to AccountAddress
        const recipientAddress = AccountAddress.fromString(recipient);

        // Normalize token address
        let normalizedTokenAddress = tokenAddress;

        // Handle common token symbols
        if (tokenAddress.toLowerCase() === "apt" || tokenAddress.toLowerCase() === "aptos") {
            normalizedTokenAddress = "0x1::aptos_coin::AptosCoin";
            elizaLogger.info(`Normalized token symbol ${tokenAddress} to ${normalizedTokenAddress}`);
        } else if (tokenAddress.toLowerCase() === "usdc") {
            normalizedTokenAddress = "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
            elizaLogger.info(`Normalized token symbol ${tokenAddress} to ${normalizedTokenAddress}`);
        } else if (tokenAddress.toLowerCase() === "usdt") {
            normalizedTokenAddress = "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT";
            elizaLogger.info(`Normalized token symbol ${tokenAddress} to ${normalizedTokenAddress}`);
        } else if (tokenAddress.toLowerCase() === "ttk") {
            normalizedTokenAddress = "0x4717b796ed683a11c5946ec13aa982fd4304a73906d12a5bb5558d5238a3a15c";
            elizaLogger.info(`Normalized token symbol ${tokenAddress} to ${normalizedTokenAddress}`);
        }

        // If the token address is already a full address, use it as is
        if (tokenAddress.match(/^0x[0-9a-f]+$/i)) {
            normalizedTokenAddress = tokenAddress;
            elizaLogger.info(`Using token address as provided: ${normalizedTokenAddress}`);
        }

        // Determine if we're dealing with a coin or fungible asset
        const isCoinStandard = normalizedTokenAddress.split("::").length === 3;

        // Convert to on-chain amount (with 8 decimals for Aptos standard)
        const DECIMALS = 6;
        const adjustedAmount = BigInt(Math.floor(numericAmount * (10 ** DECIMALS)));

        // Check balance before transfer
        if (isCoinStandard) {
            // For coin standard tokens
            const resources = await aptosClient.getAccountResources({
                accountAddress: account.accountAddress,
            });

            const coinType = normalizedTokenAddress;
            const coinStoreType = `0x1::coin::CoinStore<${coinType}>`;

            const coinStore = resources.find(r => r.type === coinStoreType);

            if (!coinStore) {
                throw new Error(`Token store for ${coinType} not found in account resources`);
            }

            const balance = BigInt((coinStore.data as CoinStoreData).coin.value);

            if (balance < adjustedAmount) {
                const balanceInTokens = Number(balance) / (10 ** DECIMALS);
                throw new Error(`Insufficient balance. You have ${balanceInTokens} tokens but attempted to transfer ${numericAmount} tokens.`);
            }

            elizaLogger.info(`Token balance check passed: ${balance} >= ${adjustedAmount}`);
        }

        elizaLogger.info(`Transferring ${numericAmount} tokens (${adjustedAmount} base units) of ${normalizedTokenAddress} to ${recipient}`);

        // Prepare transaction data based on token type
        const transactionData: InputGenerateTransactionPayloadData = isCoinStandard
            ? {
                function: "0x1::coin::transfer",
                typeArguments: [normalizedTokenAddress],
                functionArguments: [recipientAddress, adjustedAmount],
            }
            : {
                function: "0x1::primary_fungible_store::transfer",
                typeArguments: ["0x1::fungible_asset::Metadata"],
                functionArguments: [normalizedTokenAddress, recipientAddress, adjustedAmount],
            };

        // Build the transaction
        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: transactionData,
        });

        // Sign and submit the transaction
        const committedTransaction = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction,
        });

        // Wait for the transaction to be processed
        const signedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransaction.hash,
        });

        if (!signedTransaction.success) {
            elizaLogger.error("Token transfer failed", signedTransaction);
            throw new Error("Token transfer failed");
        }

        return signedTransaction.hash;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Token transfer failed: ${error.message}`);
        }
        throw new Error("Token transfer failed with unknown error");
    }
}

/**
 * Handler for the TOKEN_TRANSFER action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        elizaLogger.info("Starting TOKEN_TRANSFER handler...");

        // Extract token transfer parameters from message
        const context = composeContext({
            state,
            template: transferTokenTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        elizaLogger.info("Generated token transfer content:", content);

        if (!isTransferTokenContent(content)) {
            callback?.({
                text: "Please provide a recipient address, token address, and amount to transfer.",
                content: { action: "TOKEN_TRANSFER", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Validate recipient address
        if (!isValidHexAddress(content.recipient)) {
            callback?.({
                text: "Please provide a valid recipient address (must start with 0x followed by hex characters).",
                content: { action: "TOKEN_TRANSFER", status: "error", error: "Invalid recipient address" }
            });
            return false;
        }

        // Convert amount to number if it's a string
        const amount = typeof content.amount === "string" ? Number.parseFloat(content.amount) : content.amount;

        if (Number.isNaN(amount) || amount <= 0) {
            callback?.({
                text: "Please provide a valid positive amount to transfer.",
                content: { action: "TOKEN_TRANSFER", status: "error", error: "Invalid amount" }
            });
            return false;
        }

        // Get token display name for better UX
        let tokenDisplay = content.tokenAddress;
        if (content.tokenAddress.toLowerCase() === "apt" ||
            content.tokenAddress.toLowerCase() === "aptos" ||
            content.tokenAddress === "0x1::aptos_coin::AptosCoin") {
            tokenDisplay = "APT";
        } else if (content.tokenAddress.includes("::")) {
            tokenDisplay = content.tokenAddress.split("::").pop() || content.tokenAddress;
        }

        // Send a confirmation message first
        callback?.({
            text: `Transferring ${amount} ${tokenDisplay} to ${content.recipient}...`,
            content: { action: "TOKEN_TRANSFER", status: "pending" }
        });

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

        // Transfer the tokens
        const transactionHash = await transferToken(
            aptosClient,
            account,
            content.recipient,
            content.tokenAddress,
            amount
        );

        // Format the response
        const response = [
            "# Tokens Transferred Successfully",
            "",
            `**Token**: ${tokenDisplay}`,
            `**Amount**: ${amount}`,
            `**Recipient**: \`${content.recipient}\``,
            `**Transaction Hash**: \`${transactionHash}\``,
            "",
            "The tokens have been transferred to the recipient's wallet."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "TOKEN_TRANSFER",
                status: "complete",
                transfer: {
                    tokenAddress: content.tokenAddress,
                    tokenDisplay,
                    amount,
                    recipient: content.recipient,
                    transactionHash
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in TOKEN_TRANSFER handler:", error);
        callback?.({
            text: `Failed to transfer tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "TOKEN_TRANSFER", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for transferring tokens
 */
const tokenTransferAction: Action = {
    name: "TOKEN_TRANSFER",
    description: "Transfer tokens to a recipient on the Aptos blockchain",
    similes: [
        "TRANSFER_TOKEN",
        "SEND_TOKEN",
        "SEND_TOKENS"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Transfer 100 tokens of 0x1::aptos_coin::AptosCoin to 0x123456789abcdef"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Send 50 APT to address 0x123456789abcdef"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Transfer 200 USDC to 0x123456789abcdef"
            }
        }
    ]],
    handler,
    suppressInitialMessage: true,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        elizaLogger.info("TOKEN_TRANSFER validation for user:", message.userId, "with message:", messageText);

        // First check if this is an NFT-related message - if so, don't handle it
        if (messageText.includes("nft") ||
            messageText.includes("digital asset") ||
            (messageText.includes("collection") && messageText.includes("named"))) {
            elizaLogger.info("TOKEN_TRANSFER validation: Found NFT-related keywords, not a token transfer");
            return false;
        }

        // First, check if this is a token transfer request with a specific token mentioned
        const hasSpecificTokenMention =
            // Check for specific token names (excluding APT)
            messageText.includes("usdc") ||
            messageText.includes("usdt") ||
            messageText.includes("dai") ||
            messageText.includes("ttk") ||
            // Check for token addresses with module format
            messageText.includes("::") ||
            // Check for explicit token mentions with address
            messageText.match(/token.*0x[0-9a-f]+/i) ||
            messageText.match(/0x[0-9a-f]+.*token/i) ||
            // Check for explicit token address format
            messageText.match(/address.*0x[0-9a-f]+/i);

        // If we have a specific token mention, this should take precedence
        if (hasSpecificTokenMention && (messageText.includes("transfer") || messageText.includes("send"))) {
            elizaLogger.info("TOKEN_TRANSFER validation: Found specific token mention", { hasSpecificTokenMention });
            return true;
        }

        // Otherwise, check for general token transfer patterns
        const hasTransferVerb = messageText.includes("transfer") || messageText.includes("send");

        const hasTokenIndicator =
            // Check for explicit token mentions
            messageText.includes("token") ||
            // Check for explicit mentions of tokens/coins that are not APT
            (messageText.includes("coin") && !messageText.match(/\b(apt|aptos)\b/));

        // Check for explicit APT mentions that should go to the TRANSFER action instead
        const isExplicitAptTransfer =
            messageText.match(/\b(transfer|send|pay)\s+(apt|aptos)\b/) !== null;

        // Log the validation result for debugging
        const shouldValidate = hasTransferVerb && hasTokenIndicator && !isExplicitAptTransfer;
        elizaLogger.info("TOKEN_TRANSFER validation result:",
            { shouldValidate, hasTransferVerb, hasTokenIndicator, isExplicitAptTransfer });

        return shouldValidate;
    }
};

export default tokenTransferAction;
