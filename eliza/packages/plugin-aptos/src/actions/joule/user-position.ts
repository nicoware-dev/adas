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
    AccountAddress
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../../enviroment";

export interface UserPositionContent extends Content {
    token: string;
    address?: string;
}

function isUserPositionContent(content: unknown): content is UserPositionContent {
    elizaLogger.info("Content for Joule user position", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.token === "string";
}

const userPositionTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "token": "0x1::aptos_coin::AptosCoin",
    "address": "0x123..."
}
\`\`\`

{{recentMessages}}
`;

/**
 * Gets user position from Joule Finance
 */
async function getJouleUserPosition(
    aptosClient: Aptos,
    token: string,
    address: string
): Promise<{
    supplied: string;
    borrowed: string;
    collateral: boolean;
    supplyApy: string;
    borrowApy: string;
}> {
    try {
        const accountAddress = AccountAddress.fromString(address);

        // In a real implementation, we would query the Joule Finance contract
        // to get the user's position. For simplicity, we're returning placeholders.

        // This would involve getting resources from the account and parsing them
        // to extract the user's position in the specified token.

        return {
            supplied: "0",
            borrowed: "0",
            collateral: false,
            supplyApy: "0",
            borrowApy: "0"
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get Joule user position: ${error.message}`);
        }
        throw new Error("Failed to get Joule user position with unknown error");
    }
}

/**
 * Handler for the JOULE_USER_POSITION action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract user position parameters from message
        const context = composeContext(runtime, message, state);
        const content = await generateObjectDeprecated(
            runtime,
            userPositionTemplate,
            context,
            "function" as ModelClass,
            isUserPositionContent
        );

        if (!content.token) {
            callback?.({
                text: "Please specify a token to check your position for on Joule Finance.",
                content: { action: "JOULE_USER_POSITION", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Checking your position for ${content.token} on Joule Finance...`,
            content: { action: "JOULE_USER_POSITION", status: "pending" }
        });

        // Initialize Aptos client
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Use the provided address or the default from config
        const address = content.address || config.APTOS_ACCOUNT_ADDRESS;

        // Get user position
        const position = await getJouleUserPosition(
            aptosClient,
            content.token,
            address
        );

        // Format the response
        const response = [
            "# Joule Finance User Position",
            "",
            `**Token**: \`${content.token}\``,
            `**Address**: \`${address}\``,
            "",
            "## Supply Position",
            `**Supplied**: ${position.supplied}`,
            `**Supply APY**: ${position.supplyApy}%`,
            "",
            "## Borrow Position",
            `**Borrowed**: ${position.borrowed}`,
            `**Borrow APY**: ${position.borrowApy}%`,
            "",
            `**Used as Collateral**: ${position.collateral ? "Yes" : "No"}`
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "JOULE_USER_POSITION",
                status: "complete",
                userPosition: {
                    token: content.token,
                    address,
                    supplied: position.supplied,
                    borrowed: position.borrowed,
                    collateral: position.collateral,
                    supplyApy: position.supplyApy,
                    borrowApy: position.borrowApy
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in JOULE_USER_POSITION handler:", error);
        callback?.({
            text: `Failed to get user position from Joule Finance: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "JOULE_USER_POSITION", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for getting user position on Joule Finance
 */
const userPositionAction: Action = {
    name: "JOULE_USER_POSITION",
    description: "Get user position on Joule Finance",
    similes: [
        "USER_POSITION_JOULE",
        "JOULE_POSITION",
        "CHECK_POSITION_JOULE"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Check my APT position on Joule"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "What's my USDC position on Joule Finance?"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Show me my Joule position for BTC"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("position") ||
                messageText.includes("check") ||
                messageText.includes("status")) &&
               messageText.includes("joule");
    },
    suppressInitialMessage: true
};

export default userPositionAction;
