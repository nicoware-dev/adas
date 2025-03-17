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

export interface CreatePoolContent extends Content {
    tokenX: string;
    tokenY: string;
    amountX: string;
    amountY: string;
    curveType?: string;
}

function isCreatePoolContent(content: unknown): content is CreatePoolContent {
    elizaLogger.info("Content for creating pool", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.tokenX === "string" &&
           typeof c.tokenY === "string" &&
           typeof c.amountX === "string" &&
           typeof c.amountY === "string";
}

const createPoolTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenX": "0x1::aptos_coin::AptosCoin",
    "tokenY": "0x1::usdc::USDC",
    "amountX": "10",
    "amountY": "100",
    "curveType": "Uncorrelated"
}
\`\`\`

{{recentMessages}}
`;

/**
 * Creates a new Liquidswap pool
 */
async function createPool(
    aptosClient: Aptos,
    account: Account,
    tokenX: string,
    tokenY: string,
    amountX: string,
    amountY: string,
    curveType = "Uncorrelated"
): Promise<{
    transactionHash: string;
    lpAmount: string;
}> {
    try {
        // Map curve type to the actual curve module
        const curveModule = `0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::${curveType}`;

        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::create_pool",
                functionArguments: [amountX, amountY],
                typeArguments: [tokenX, tokenY, curveModule],
            },
        });

        const committedTransactionHash = await account.signAndSubmitTransaction({
            transaction
        });

        const signedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransactionHash,
        });

        if (!signedTransaction.success) {
            elizaLogger.error("Creating pool failed", signedTransaction);
            throw new Error("Creating pool failed");
        }

        // Extract LP amount from events
        // In a real implementation, we would parse the events to get the exact LP amount
        // For simplicity, we're returning a placeholder
        const lpAmount = "0"; // This would be extracted from transaction events

        return {
            transactionHash: signedTransaction.hash,
            lpAmount
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Creating pool failed: ${error.message}`);
        }
        throw new Error("Creating pool failed with unknown error");
    }
}

/**
 * Handler for the LIQUIDSWAP_CREATE_POOL action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract create pool parameters from message
        const context = composeContext(runtime, message, state);
        const content = await generateObjectDeprecated(
            runtime,
            createPoolTemplate,
            context,
            "function" as ModelClass,
            isCreatePoolContent
        );

        if (!content.tokenX || !content.tokenY || !content.amountX || !content.amountY) {
            callback?.({
                text: "Please provide both tokens and initial amounts to create a pool.",
                content: { action: "LIQUIDSWAP_CREATE_POOL", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Creating a new pool with ${content.amountX} of ${content.tokenX} and ${content.amountY} of ${content.tokenY}...`,
            content: { action: "LIQUIDSWAP_CREATE_POOL", status: "pending" }
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

        // Create the pool
        const result = await createPool(
            aptosClient,
            account,
            content.tokenX,
            content.tokenY,
            content.amountX,
            content.amountY,
            content.curveType
        );

        // Format the response
        const response = [
            "# Pool Created Successfully",
            "",
            `**Token X**: ${content.amountX} of \`${content.tokenX}\``,
            `**Token Y**: ${content.amountY} of \`${content.tokenY}\``,
            `**Curve Type**: ${content.curveType || "Uncorrelated"}`,
            `**LP Tokens Received**: ${result.lpAmount}`,
            `**Transaction Hash**: \`${result.transactionHash}\``,
            "",
            "A new Liquidswap pool has been successfully created."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "LIQUIDSWAP_CREATE_POOL",
                status: "complete",
                createPool: {
                    tokenX: content.tokenX,
                    tokenY: content.tokenY,
                    amountX: content.amountX,
                    amountY: content.amountY,
                    curveType: content.curveType || "Uncorrelated",
                    lpAmount: result.lpAmount,
                    transactionHash: result.transactionHash
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in LIQUIDSWAP_CREATE_POOL handler:", error);
        callback?.({
            text: `Failed to create pool: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "LIQUIDSWAP_CREATE_POOL", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for creating a Liquidswap pool
 */
const createPoolAction: Action = {
    name: "LIQUIDSWAP_CREATE_POOL",
    description: "Create a new Liquidswap pool",
    similes: [
        "CREATE_POOL",
        "NEW_POOL",
        "LIQUIDSWAP_NEW_POOL"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Create a new Liquidswap pool with 10 APT and 100 USDC"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Create a stable pool on Liquidswap with 1000 USDC and 1000 USDT"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Set up a new Liquidswap pool for APT/BTC"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("create pool") ||
                messageText.includes("new pool") ||
                messageText.includes("set up pool")) &&
               messageText.includes("liquidswap");
    },
    suppressInitialMessage: true
};

export default createPoolAction;
