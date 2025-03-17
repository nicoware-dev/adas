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
        elizaLogger.info(`Getting all Joule positions for address ${address}`);

        // Convert address string to proper AccountAddress format
        const accountAddress = AccountAddress.fromString(address);

        // Get all account resources
        const resources = await aptosClient.getAccountResources({
            accountAddress,
        });

        // Find Joule position resources
        const positionResources = resources.filter(r =>
            r.type.includes("0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6::pool::Position")
        );

        elizaLogger.info(`Found ${positionResources.length} Joule positions`);

        // If no positions found, return empty array
        if (positionResources.length === 0) {
            return [];
        }

        // Get pool data for APY information
        let poolsData: Record<string, any>[] = [];
        try {
            // Fetch pool data from Joule API (same as in pool-detail.ts)
            const poolResponse = await fetch("https://price-api.joule.finance/api/market");
            const poolInfo = await poolResponse.json();

            if (poolInfo.data && Array.isArray(poolInfo.data)) {
                poolsData = poolInfo.data;
                elizaLogger.info(`Fetched data for ${poolsData.length} pools from Joule API`);
            }
        } catch (err) {
            elizaLogger.warn(`Failed to fetch pool data: ${err}`);
            // Continue with empty pools data
        }

        // Process all positions
        const positions: TokenPosition[] = [];

        for (const resource of positionResources) {
            const positionData = resource.data as Record<string, any>;
            elizaLogger.info(`Processing position ${positionData.id}`);

            // Process coin balances (for APT and other coins)
            if (positionData.coin_balances && Array.isArray(positionData.coin_balances)) {
                for (const coinBalance of positionData.coin_balances) {
                    if (!coinBalance.metadata) continue;

                    const tokenSymbol = coinBalance.metadata.symbol || 'Unknown';
                    const tokenName = coinBalance.metadata.name || 'Unknown';
                    const tokenType = coinBalance.metadata.token_type || `Unknown::${tokenSymbol}`;

                    elizaLogger.info(`Found ${tokenSymbol} in position ${positionData.id}`);

                    // Get APY rates for this token
                    const poolInfo = poolsData.find(p =>
                        (p.asset.symbol && p.asset.symbol.toLowerCase() === tokenSymbol.toLowerCase()) ||
                        (p.asset.assetName && p.asset.assetName.toLowerCase().includes(tokenSymbol.toLowerCase()))
                    );

                    const supplyApy = poolInfo?.depositApy ? String(poolInfo.depositApy) : "0";
                    const borrowApy = poolInfo?.borrowApy ? String(poolInfo.borrowApy) : "0";

                    // Check if there's a borrowed amount
                    let borrowedAmount = "0";
                    if (positionData.borrowings) {
                        const borrowing = positionData.borrowings.find(
                            (b: any) => b.metadata?.symbol === tokenSymbol
                        );
                        if (borrowing) {
                            borrowedAmount = String(borrowing.amount || 0);
                        }
                    }

                    // Apply decimal normalization
                    const decimals = coinBalance.metadata.decimals || 8;
                    const normalizedSupplied = (Number(coinBalance.amount || 0) / (10 ** decimals)).toFixed(decimals);
                    const normalizedBorrowed = (Number(borrowedAmount) / (10 ** decimals)).toFixed(decimals);

                    positions.push({
                        token: tokenType,
                        supplied: normalizedSupplied,
                        borrowed: normalizedBorrowed,
                        collateral: Boolean(coinBalance.is_collateral),
                        supplyApy,
                        borrowApy
                    });
                }
            }

            // Process fungible asset balances (for USDC, etc.)
            if (positionData.fungible_asset_balances && Array.isArray(positionData.fungible_asset_balances)) {
                for (const faBalance of positionData.fungible_asset_balances) {
                    if (!faBalance.metadata) continue;

                    const tokenSymbol = faBalance.metadata.symbol || 'Unknown';
                    const tokenName = faBalance.metadata.name || 'Unknown';
                    const tokenType = faBalance.metadata.token_type || `Unknown::${tokenSymbol}`;

                    elizaLogger.info(`Found ${tokenSymbol} (fungible asset) in position ${positionData.id}`);

                    // Get APY rates for this token
                    const poolInfo = poolsData.find(p =>
                        (p.asset.symbol && p.asset.symbol.toLowerCase() === tokenSymbol.toLowerCase()) ||
                        (p.asset.assetName && p.asset.assetName.toLowerCase().includes(tokenSymbol.toLowerCase()))
                    );

                    const supplyApy = poolInfo?.depositApy ? String(poolInfo.depositApy) : "0";
                    const borrowApy = poolInfo?.borrowApy ? String(poolInfo.borrowApy) : "0";

                    // Check if there's a borrowed amount
                    let borrowedAmount = "0";
                    if (positionData.borrowings) {
                        const borrowing = positionData.borrowings.find(
                            (b: any) => b.metadata?.symbol === tokenSymbol
                        );
                        if (borrowing) {
                            borrowedAmount = String(borrowing.amount || 0);
                        }
                    }

                    // Apply decimal normalization
                    const decimals = faBalance.metadata.decimals || 8;
                    const normalizedSupplied = (Number(faBalance.amount || 0) / (10 ** decimals)).toFixed(decimals);
                    const normalizedBorrowed = (Number(borrowedAmount) / (10 ** decimals)).toFixed(decimals);

                    positions.push({
                        token: tokenType,
                        supplied: normalizedSupplied,
                        borrowed: normalizedBorrowed,
                        collateral: Boolean(faBalance.is_collateral),
                        supplyApy,
                        borrowApy
                    });
                }
            }
        }

        elizaLogger.info(`Processed ${positions.length} token positions across ${positionResources.length} Joule positions`);
        return positions;
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
