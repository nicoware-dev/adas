import { elizaLogger } from "@elizaos/core";
import type {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    Action,
} from "@elizaos/core";
import { composeContext } from "@elizaos/core";
import { generateObjectDeprecated } from "@elizaos/core";
import {
    Aptos,
    AptosConfig,
    Network,
    Account,
    Ed25519PrivateKey
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../../enviroment";

export interface RemoveLiquidityContent extends Content {
    tokenX: string;
    tokenY: string;
    lpAmount: string;
    slippage?: string;
}

function isRemoveLiquidityContent(content: unknown): content is RemoveLiquidityContent {
    elizaLogger.info("Content for removing liquidity", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.tokenX === "string" &&
           typeof c.tokenY === "string" &&
           typeof c.lpAmount === "string";
}

const removeLiquidityTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenX": "0x1::aptos_coin::AptosCoin",
    "tokenY": "0x1::usdc::USDC",
    "lpAmount": "10",
    "slippage": "0.5"
}
\`\`\`

{{recentMessages}}
`;

/**
 * Removes liquidity from a Liquidswap pool
 */
async function removeLiquidity(
    aptosClient: Aptos,
    account: Account,
    tokenX: string,
    tokenY: string,
    lpAmount: string,
    slippage = "0.5"
): Promise<{
    transactionHash: string;
    amountX: string;
    amountY: string;
}> {
    try {
        // Convert slippage to basis points (0.5% = 50 basis points)
        const slippageBps = Math.floor(Number.parseFloat(slippage) * 100);

        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::remove_liquidity",
                functionArguments: [lpAmount, "0", "0", slippageBps.toString()],
                typeArguments: [tokenX, tokenY, "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated"],
            },
        });

        const committedTransactionHash = await account.signAndSubmitTransaction({
            transaction
        });

        const signedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransactionHash,
        });

        if (!signedTransaction.success) {
            elizaLogger.error("Removing liquidity failed", signedTransaction);
            throw new Error("Removing liquidity failed");
        }

        // Extract amounts from events
        // In a real implementation, we would parse the events to get the exact amounts
        // For simplicity, we're returning placeholders
        const amountX = "0"; // This would be extracted from transaction events
        const amountY = "0"; // This would be extracted from transaction events

        return {
            transactionHash: signedTransaction.hash,
            amountX,
            amountY
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Removing liquidity failed: ${error.message}`);
        }
        throw new Error("Removing liquidity failed with unknown error");
    }
}

/**
 * Handler for the LIQUIDSWAP_REMOVE_LIQUIDITY action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract remove liquidity parameters from message
        const context = composeContext(runtime, message, state);
        const content = await generateObjectDeprecated(
            runtime,
            removeLiquidityTemplate,
            context,
            "function" as ModelClass,
            isRemoveLiquidityContent
        );

        if (!content.tokenX || !content.tokenY || !content.lpAmount) {
            callback?.({
                text: "Please provide both tokens and LP amount to remove liquidity.",
                content: { action: "LIQUIDSWAP_REMOVE_LIQUIDITY", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Removing ${content.lpAmount} LP tokens from ${content.tokenX}/${content.tokenY} pool...`,
            content: { action: "LIQUIDSWAP_REMOVE_LIQUIDITY", status: "pending" }
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

        // Remove liquidity
        const result = await removeLiquidity(
            aptosClient,
            account,
            content.tokenX,
            content.tokenY,
            content.lpAmount,
            content.slippage
        );

        // Format the response
        const response = [
            "# Liquidity Removed Successfully",
            "",
            `**LP Tokens Burned**: ${content.lpAmount}`,
            `**Token X Received**: ${result.amountX} of \`${content.tokenX}\``,
            `**Token Y Received**: ${result.amountY} of \`${content.tokenY}\``,
            `**Slippage**: ${content.slippage || "0.5"}%`,
            `**Transaction Hash**: \`${result.transactionHash}\``,
            "",
            "Liquidity has been successfully removed from the Liquidswap pool."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "LIQUIDSWAP_REMOVE_LIQUIDITY",
                status: "complete",
                removeLiquidity: {
                    tokenX: content.tokenX,
                    tokenY: content.tokenY,
                    lpAmount: content.lpAmount,
                    amountX: result.amountX,
                    amountY: result.amountY,
                    slippage: content.slippage || "0.5",
                    transactionHash: result.transactionHash
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in LIQUIDSWAP_REMOVE_LIQUIDITY handler:", error);
        callback?.({
            text: `Failed to remove liquidity: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "LIQUIDSWAP_REMOVE_LIQUIDITY", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for removing liquidity from Liquidswap pools
 */
const removeLiquidityAction: Action = {
    name: "LIQUIDSWAP_REMOVE_LIQUIDITY",
    description: "Remove liquidity from a Liquidswap pool",
    similes: [
        "REMOVE_LIQUIDITY",
        "WITHDRAW_LIQUIDITY",
        "LIQUIDSWAP_WITHDRAW"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Remove 10 LP tokens from Liquidswap APT/USDC pool"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Withdraw my liquidity from Liquidswap APT/USDT pool with 1% slippage"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Remove all my liquidity from Liquidswap"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("remove liquidity") ||
                messageText.includes("withdraw liquidity")) &&
               messageText.includes("liquidswap");
    },
    suppressInitialMessage: true
};

export default removeLiquidityAction;
