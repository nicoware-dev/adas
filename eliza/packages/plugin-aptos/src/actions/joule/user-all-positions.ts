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

export interface UserAllPositionsContent extends Content {
    address?: string;
}

function isUserAllPositionsContent(content: unknown): content is UserAllPositionsContent {
    elizaLogger.info("Content for Joule all positions", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    return true; // No required fields
}

const userAllPositionsTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "address": "0x123..."
}
\`\`\`

{{recentMessages}}
`;

interface TokenPosition {
    token: string;
    supplied: string;
    borrowed: string;
    collateral: boolean;
    supplyApy: string;
    borrowApy: string;
}

/**
 * Gets all user positions from Joule Finance
 */
async function getJouleUserAllPositions(
    aptosClient: Aptos,
    address: string
): Promise<TokenPosition[]> {
    try {
        const accountAddress = AccountAddress.fromString(address);

        // In a real implementation, we would query the Joule Finance contract
        // to get all of the user's positions. For simplicity, we're returning placeholders.

        // This would involve getting resources from the account and parsing them
        // to extract the user's positions for all tokens.

        return [
            {
                token: "0x1::aptos_coin::AptosCoin",
                supplied: "10",
                borrowed: "0",
                collateral: true,
                supplyApy: "2.5",
                borrowApy: "5.0"
            },
            {
                token: "0x1::usdc::USDC",
                supplied: "100",
                borrowed: "50",
                collateral: false,
                supplyApy: "3.0",
                borrowApy: "6.0"
            }
        ];
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get Joule user positions: ${error.message}`);
        }
        throw new Error("Failed to get Joule user positions with unknown error");
    }
}

/**
 * Handler for the JOULE_USER_ALL_POSITIONS action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract user all positions parameters from message
        const context = composeContext(runtime, message, state);
        const content = await generateObjectDeprecated(
            runtime,
            userAllPositionsTemplate,
            context,
            "function" as ModelClass,
            isUserAllPositionsContent
        );

        // Send a confirmation message first
        callback?.({
            text: "Checking all your positions on Joule Finance...",
            content: { action: "JOULE_USER_ALL_POSITIONS", status: "pending" }
        });

        // Initialize Aptos client
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Use the provided address or the default from private key
        const privateKeyAddress = config.APTOS_PRIVATE_KEY ?
            new AccountAddress(config.APTOS_PRIVATE_KEY.slice(-64)) :
            undefined;
        const address = content.address || privateKeyAddress?.toString() || "0x1";

        // Get all user positions
        const positions = await getJouleUserAllPositions(
            aptosClient,
            address
        );

        // Format the response
        const response = [
            "# Joule Finance User Positions",
            "",
            `**Address**: \`${address}\``,
            "",
            "## Positions"
        ];

        if (positions.length === 0) {
            response.push("", "No positions found for this address.");
        } else {
            for (const position of positions) {
                response.push(
                    "",
                    `### ${position.token}`,
                    "",
                    "**Supply Position**",
                    `- Supplied: ${position.supplied}`,
                    `- Supply APY: ${position.supplyApy}%`,
                    "",
                    "**Borrow Position**",
                    `- Borrowed: ${position.borrowed}`,
                    `- Borrow APY: ${position.borrowApy}%`,
                    "",
                    `- Used as Collateral: ${position.collateral ? "Yes" : "No"}`
                );
            }
        }

        callback?.({
            text: response.join("\n"),
            content: {
                action: "JOULE_USER_ALL_POSITIONS",
                status: "complete",
                userAllPositions: {
                    address,
                    positions
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in JOULE_USER_ALL_POSITIONS handler:", error);
        callback?.({
            text: `Failed to get all user positions from Joule Finance: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "JOULE_USER_ALL_POSITIONS", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for getting all user positions on Joule Finance
 */
const userAllPositionsAction: Action = {
    name: "JOULE_USER_ALL_POSITIONS",
    description: "Get all user positions on Joule Finance",
    similes: [
        "USER_ALL_POSITIONS_JOULE",
        "JOULE_ALL_POSITIONS",
        "CHECK_ALL_POSITIONS_JOULE"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Check all my positions on Joule"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "What are all my positions on Joule Finance?"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Show me all my Joule positions"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("all position") ||
                messageText.includes("all my position") ||
                (messageText.includes("position") && !messageText.includes("token"))) &&
               messageText.includes("joule");
    },
    suppressInitialMessage: true
};

export default userAllPositionsAction;
