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
        elizaLogger.info(`Getting Joule position for ${token} for address ${address}`);

        // Convert address string to proper AccountAddress format
        const accountAddress = AccountAddress.fromString(address);

        // First, we need to find all positions for this user
        const resources = await aptosClient.getAccountResources({
            accountAddress,
        });

        // Find Joule position resources
        const positionResources = resources.filter(r =>
            r.type.includes("0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6::pool::Position")
        );

        elizaLogger.info(`Found ${positionResources.length} Joule positions`);

        // If no positions found, return empty data
        if (positionResources.length === 0) {
            return {
                supplied: "0",
                borrowed: "0",
                collateral: false,
                supplyApy: "0",
                borrowApy: "0"
            };
        }

        // Look for the token in all positions
        // We'll aggregate data across all positions if the same token is in multiple positions
        let totalSupplied = 0;
        let totalBorrowed = 0;
        let isCollateral = false;

        // Loop through positions to find data for this token
        for (const resource of positionResources) {
            const positionData = resource.data as Record<string, any>;
            elizaLogger.info(`Checking position ${JSON.stringify(positionData.id)}`);

            // Check if this token exists in this position
            // For coins (APT)
            if (positionData.coin_balances) {
                for (const coinBalance of positionData.coin_balances) {
                    // Check if this is the token we're looking for
                    if (coinBalance.metadata &&
                        (coinBalance.metadata.symbol?.toLowerCase() === token.toLowerCase() ||
                         coinBalance.metadata.name?.toLowerCase().includes(token.toLowerCase()))) {

                        elizaLogger.info(`Found ${token} in coin balances with amount ${coinBalance.amount}`);

                        // Add to totals
                        if (coinBalance.amount) {
                            totalSupplied += Number(coinBalance.amount);
                        }

                        // Check if used as collateral
                        if (coinBalance.is_collateral) {
                            isCollateral = true;
                        }
                    }
                }
            }

            // For fungible assets (USDC, etc.)
            if (positionData.fungible_asset_balances) {
                for (const faBalance of positionData.fungible_asset_balances) {
                    // Check if this is the token we're looking for
                    if (faBalance.metadata &&
                        (faBalance.metadata.symbol?.toLowerCase() === token.toLowerCase() ||
                         faBalance.metadata.name?.toLowerCase().includes(token.toLowerCase()))) {

                        elizaLogger.info(`Found ${token} in fungible asset balances with amount ${faBalance.amount}`);

                        // Add to totals
                        if (faBalance.amount) {
                            totalSupplied += Number(faBalance.amount);
                        }

                        // Check if used as collateral
                        if (faBalance.is_collateral) {
                            isCollateral = true;
                        }
                    }
                }
            }

            // Check borrowings
            if (positionData.borrowings) {
                for (const borrowing of positionData.borrowings) {
                    // Check if this is the token we're looking for
                    if (borrowing.metadata &&
                        (borrowing.metadata.symbol?.toLowerCase() === token.toLowerCase() ||
                         borrowing.metadata.name?.toLowerCase().includes(token.toLowerCase()))) {

                        elizaLogger.info(`Found ${token} in borrowings with amount ${borrowing.amount}`);

                        // Add to totals
                        if (borrowing.amount) {
                            totalBorrowed += Number(borrowing.amount);
                        }
                    }
                }
            }
        }

        // Get APY rates from pool API
        // This is how the Move Agent Kit does it
        let supplyApy = "0";
        let borrowApy = "0";

        try {
            // Fetch pool data from Joule API
            const poolResponse = await fetch("https://price-api.joule.finance/api/market");
            const poolData = await poolResponse.json();

            // Find the pool for this token
            const poolInfo = poolData.data.find((pool: Record<string, any>) =>
                pool.asset.assetName.toLowerCase().includes(token.toLowerCase()) ||
                pool.asset.symbol?.toLowerCase() === token.toLowerCase()
            );

            if (poolInfo) {
                supplyApy = poolInfo.depositApy ? String(poolInfo.depositApy) : "0";
                borrowApy = poolInfo.borrowApy ? String(poolInfo.borrowApy) : "0";
                elizaLogger.info(`Found APY rates for ${token}: supply ${supplyApy}%, borrow ${borrowApy}%`);
            }
        } catch (err) {
            elizaLogger.warn(`Error fetching APY rates: ${err}`);
            // Continue with default rates
        }

        // Format the results
        // We need to normalize the amounts based on token decimals
        // For simplicity, we'll use 8 decimals which is common for Aptos tokens
        const DECIMALS = 8;
        const normalizedSupplied = (totalSupplied / Math.pow(10, DECIMALS)).toFixed(DECIMALS);
        const normalizedBorrowed = (totalBorrowed / Math.pow(10, DECIMALS)).toFixed(DECIMALS);

        return {
            supplied: normalizedSupplied,
            borrowed: normalizedBorrowed,
            collateral: isCollateral,
            supplyApy,
            borrowApy
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
