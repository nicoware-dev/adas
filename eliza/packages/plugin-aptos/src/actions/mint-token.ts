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
} from "@aptos-labs/ts-sdk";
import type { InputGenerateTransactionPayloadData } from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../enviroment";

export interface TokenInfo {
    name: string;
    symbol: string;
    address: string;
}

export interface MintTokenContent extends Content {
    tokenAddress?: string;
    tokenSymbol?: string;
    amount: string | number;
    recipient?: string;
}

function isMintTokenContent(content: unknown): content is MintTokenContent {
    elizaLogger.info("Content for token minting", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;

    // Must have an amount
    if (typeof c.amount !== "string" && typeof c.amount !== "number") {
        return false;
    }

    // Must have either tokenAddress or tokenSymbol
    if (typeof c.tokenAddress !== "string" && typeof c.tokenSymbol !== "string") {
        return false;
    }

    return true;
}

const mintTokenTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenAddress": "0x123...",
    "tokenSymbol": "TTK",
    "amount": "1000",
    "recipient": "0x456..."
}
\`\`\`

{{recentMessages}}
`;

/**
 * Validates if a string is a valid hex address
 */
function isValidHexAddress(address: string): boolean {
    // For managed coins with :: format, we don't need to validate as hex
    if (address.includes("::")) {
        return true;
    }

    // Remove 0x prefix if present
    const hexPart = address.startsWith('0x') ? address.slice(2) : address;

    // Check if it's a valid hex string of the right length
    // We're being more lenient here to handle the addresses in the system
    return hexPart.length === 64;
}

/**
 * Mints tokens on the Aptos blockchain
 */
async function mintToken(
    aptosClient: Aptos,
    account: Account,
    tokenAddress: string,
    amount: number | string,
    recipient?: string
): Promise<{ success: boolean; hash: string }> {
    try {
        // Convert amount to number if it's a string
        const numericAmount = typeof amount === 'string' ? Number(amount) : amount;

        // Use sender address as recipient if not specified
        const recipientAddress = recipient || account.accountAddress.toString();

        // Adjust amount for decimals (standard is 8 decimals in Aptos)
        const DECIMALS = 6;
        const adjustedAmount = Math.floor(numericAmount * (10 ** DECIMALS));

        elizaLogger.info(`Minting ${numericAmount} tokens (${adjustedAmount} base units) from address ${tokenAddress} to ${recipientAddress}`);

        // Use the launchpad::mint_to_address function as shown in the Move Agent Kit example
        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: "0x67c8564aee3799e9ac669553fdef3a3828d4626f24786b6a5642152fa09469dd::launchpad::mint_to_address",
                typeArguments: [],
                functionArguments: [recipientAddress, tokenAddress, adjustedAmount],
            },
        });

        elizaLogger.info("Signing and submitting transaction");
        const committedTransaction = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction: transaction
        });

        elizaLogger.info(`Transaction submitted: ${committedTransaction.hash}`);
        const signedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransaction.hash,
        });

        if (!signedTransaction.success) {
            elizaLogger.error("Token minting failed", signedTransaction);
            throw new Error(`Token minting failed: ${signedTransaction.vm_status || "Unknown error"}`);
        }

        elizaLogger.info(`Successfully minted ${numericAmount} tokens (${adjustedAmount} base units) from ${tokenAddress} to ${recipientAddress}`);
        return { success: true, hash: signedTransaction.hash };
    } catch (error) {
        elizaLogger.error("Error in mintToken:", error);
        if (error instanceof Error) {
            throw new Error(`Token minting failed: ${error.message}`);
        }
        throw new Error("Token minting failed with unknown error");
    }
}

/**
 * Handler for the MINT_TOKEN action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract token minting parameters from message
        const context = composeContext({
            state,
            template: mintTokenTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isMintTokenContent(content)) {
            callback?.({
                text: "Please provide a token address or symbol and an amount to mint.",
                content: { action: "MINT_TOKEN", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Look up token address from state if only symbol is provided
        let tokenAddress = content.tokenAddress;
        if (!tokenAddress && content.tokenSymbol && state.tokens) {
            // Find token by symbol in state
            const tokenInfo = Object.values(state.tokens).find(
                (token: TokenInfo) => token.symbol === content.tokenSymbol
            );

            if (tokenInfo?.address) {
                tokenAddress = tokenInfo.address;
                elizaLogger.info(`Found token address ${tokenAddress} for symbol ${content.tokenSymbol}`);
            }
        }

        if (!tokenAddress) {
            callback?.({
                text: `Could not find token address for symbol ${content.tokenSymbol}. Please create the token first or provide the full token address.`,
                content: { action: "MINT_TOKEN", status: "error", error: "Token address not found" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Minting ${content.amount} tokens from ${tokenAddress}...`,
            content: { action: "MINT_TOKEN", status: "pending" }
        });

        // Initialize Aptos client and account
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Create account from private key
        const privateKey = new Ed25519PrivateKey(config.APTOS_PRIVATE_KEY);
        const account = Account.fromPrivateKey({ privateKey });

        // Convert amount to number
        const numericAmount = typeof content.amount === 'string' ? Number(content.amount) : content.amount;

        // Use sender address as recipient if not specified
        const recipientAddress = content.recipient || account.accountAddress.toString();

        try {
            // Mint the tokens using the mintToken function
            const result = await mintToken(
                aptosClient,
                account,
                tokenAddress,
                numericAmount,
                recipientAddress
            );

            // Format the response with token symbol
            const tokenSymbol = content.tokenSymbol || "tokens";
            const response = [
                "# Token Minting Successful",
                "",
                `**Amount**: ${content.amount} ${tokenSymbol}`,
                `**Token Address**: \`${tokenAddress}\``,
                `**Recipient**: \`${recipientAddress}\``,
                `**Transaction Hash**: \`${result.hash}\``,
                "",
                "The tokens have been successfully minted to the recipient's wallet."
            ].join("\n");

            callback?.({
                text: response,
                content: {
                    action: "MINT_TOKEN",
                    status: "complete",
                    mint: {
                        tokenAddress,
                        tokenSymbol: content.tokenSymbol,
                        amount: content.amount,
                        recipient: recipientAddress,
                        transactionHash: result.hash
                    }
                }
            });

            return true;
        } catch (error) {
            elizaLogger.error("Error minting tokens:", error);
            callback?.({
                text: `Failed to mint tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
                content: { action: "MINT_TOKEN", status: "error", error: String(error) }
            });
            return false;
        }
    } catch (error) {
        elizaLogger.error("Error in MINT_TOKEN handler:", error);
        callback?.({
            text: `Failed to mint tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "MINT_TOKEN", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Validates if the message is requesting to mint tokens
 */
function validateMintTokenAction(message: Memory): boolean {
    const messageText = message.content?.text?.toLowerCase() || "";

    // Check for explicit mint token keywords
    // Make sure we're explicitly asking to mint tokens, not just mentioning tokens
    // Also make sure we're not trying to transfer tokens
    const hasMintKeyword = messageText.includes("mint");
    const hasTokenKeyword = messageText.includes("token") || messageText.includes("coin");
    const notTransferAction = !messageText.includes("transfer") && !messageText.includes("send");

    // If the message explicitly mentions "mint" and "token/coin" and is not about transferring
    if (hasMintKeyword && hasTokenKeyword && notTransferAction) {
        elizaLogger.info(`Mint token action validated: ${messageText}`);
        return true;
    }

    return false;
}

/**
 * Action for minting tokens
 */
const mintTokenAction: Action = {
    name: "MINT_TOKEN",
    description: "Mint tokens on the Aptos blockchain",
    similes: [
        "MINT_TOKENS"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Mint 1000 TTK tokens"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Mint 500 tokens at 0x123..."
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => validateMintTokenAction(message),
    suppressInitialMessage: true
};

export default mintTokenAction;
