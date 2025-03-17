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
    PrivateKey,
    PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../enviroment";

export interface BurnTokenContent extends Content {
    tokenAddress: string;
    amount: string | number;
}

function isBurnTokenContent(content: unknown): content is BurnTokenContent {
    elizaLogger.info("Content for token burning", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.tokenAddress === "string" &&
           (typeof c.amount === "string" || typeof c.amount === "number");
}

const burnTokenTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenAddress": "0x1::aptos_coin::AptosCoin",
    "amount": 100
}
\`\`\`

{{recentMessages}}
`;

/**
 * Burns a fungible asset token on the Aptos blockchain
 */
async function burnToken(
    aptosClient: Aptos,
    account: Account,
    tokenAddress: string,
    amount: number
): Promise<string> {
    try {
        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: "0x67c8564aee3799e9ac669553fdef3a3828d4626f24786b6a5642152fa09469dd::launchpad::burn_fa",
                functionArguments: [tokenAddress, amount],
            },
        });

        const committedTransaction = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction,
        });

        const signedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransaction.hash,
        });

        if (!signedTransaction.success) {
            elizaLogger.error("Token burn failed", signedTransaction);
            throw new Error("Token burn failed");
        }

        return signedTransaction.hash;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Token burn failed: ${error.message}`);
        }
        throw new Error("Token burn failed with unknown error");
    }
}

/**
 * Handler for the BURN_TOKEN action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract token burning parameters from message
        const context = composeContext({
            state,
            template: burnTokenTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isBurnTokenContent(content)) {
            callback?.({
                text: "Please provide a token address and amount to burn.",
                content: { action: "BURN_TOKEN", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Convert amount to number if it's a string
        const amount = typeof content.amount === "string" ? Number.parseFloat(content.amount) : content.amount;

        if (Number.isNaN(amount) || amount <= 0) {
            callback?.({
                text: "Please provide a valid positive amount to burn.",
                content: { action: "BURN_TOKEN", status: "error", error: "Invalid amount" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Burning ${amount} tokens of ${content.tokenAddress}...`,
            content: { action: "BURN_TOKEN", status: "pending" }
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

        // Burn the tokens
        const transactionHash = await burnToken(
            aptosClient,
            account,
            content.tokenAddress,
            amount
        );

        // Format the response
        const response = [
            "# Tokens Burned Successfully",
            "",
            `**Token Address**: \`${content.tokenAddress}\``,
            `**Amount**: ${amount}`,
            `**Transaction Hash**: \`${transactionHash}\``,
            "",
            "The tokens have been permanently removed from circulation."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "BURN_TOKEN",
                status: "complete",
                burn: {
                    tokenAddress: content.tokenAddress,
                    amount,
                    transactionHash
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in BURN_TOKEN handler:", error);
        callback?.({
            text: `Failed to burn tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "BURN_TOKEN", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for burning tokens
 */
const burnTokenAction: Action = {
    name: "BURN_TOKEN",
    description: "Burn tokens on the Aptos blockchain",
    similes: [
        "TOKEN_BURN",
        "BURN_COINS",
        "DESTROY_TOKENS"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Burn 100 tokens of 0x1::aptos_coin::AptosCoin"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Destroy 50 coins of token 0x1::aptos_coin::AptosCoin"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Burn 200 tokens from 0x1::aptos_coin::AptosCoin"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("burn") ||
                messageText.includes("destroy")) &&
               (messageText.includes("token") ||
                messageText.includes("coin"));
    },
    suppressInitialMessage: true
};

export default burnTokenAction;
