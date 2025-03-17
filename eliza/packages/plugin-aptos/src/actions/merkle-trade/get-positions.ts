import { elizaLogger } from "@elizaos/core";
import type {
    Action,
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@elizaos/core";
import { composeContext } from "@elizaos/core";
import { generateObjectDeprecated } from "@elizaos/core";
import {
    Aptos,
    AptosConfig,
    Network,
    Account,
    AccountAddress,
    Ed25519PrivateKey,
    PrivateKey,
    PrivateKeyVariants
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../../enviroment";
import { MerkleClient, toNumber } from "./client";
import { MerkleBaseError } from "./error";
import type { HumanReadableMerklePosition } from "./types";

/**
 * Interface for Merkle Trade Get Positions content
 */
export interface MerkleGetPositionsContent extends Content {
    address?: string;
}

/**
 * Type guard for Merkle Trade Get Positions content
 */
function isMerkleGetPositionsContent(content: unknown): content is MerkleGetPositionsContent {
    elizaLogger.info("Content for Merkle Trade Get Positions", content);
    return true; // No required fields
}

/**
 * Template for extracting position information
 */
const merkleGetPositionsTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "address": "0x123..."
}
\`\`\`

{{recentMessages}}
`;

/**
 * Gets positions from Merkle Trade
 */
async function getPositionsWithMerkleTrade(
    aptosClient: Aptos,
    account: Account,
    address?: string
): Promise<HumanReadableMerklePosition[]> {
    try {
        // Use the provided address or the account address
        const targetAddress = address || account.accountAddress.toString();
        elizaLogger.info(`Getting Merkle Trade positions for address ${targetAddress}`);

        // Initialize Merkle Trade client
        const merkleConfig = await MerkleClient.mainnetConfig();
        const merkle = new MerkleClient(merkleConfig);

        // Get positions
        const positions = await merkle.getPositions({
            address: targetAddress,
        });

        elizaLogger.info(`Got ${positions.length} positions from Merkle Trade`);

        // Convert positions to human readable format
        const humanReadablePositions = positions.map(position => ({
            id: position.id,
            pairType: position.pairType,
            isLong: position.isLong,
            size: toNumber(position.size, 6),
            collateral: toNumber(position.collateral, 6),
            avgPrice: toNumber(position.avgPrice, 10),
            stopLossTriggerPrice: toNumber(position.stopLossTriggerPrice, 10),
            takeProfitTriggerPrice: toNumber(position.takeProfitTriggerPrice, 10),
            liquidationPrice: toNumber(position.liquidationPrice || "0", 10),
            leverage: toNumber(position.leverage || "1", 2),
            unrealizedPnl: toNumber(position.unrealizedPnl || "0", 6),
            unrealizedPnlPercentage: toNumber(position.unrealizedPnlPercentage || "0", 4)
        }));

        return humanReadablePositions;
    } catch (error) {
        if (error instanceof MerkleBaseError) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Get positions failed: ${errorMessage}`);
    }
}

/**
 * Handler for MERKLE_GET_POSITIONS action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract parameters from message
        const context = composeContext({
            state,
            template: merkleGetPositionsTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        // Send a confirmation message first
        callback?.({
            text: "Fetching your Merkle Trade positions...",
            content: { action: "MERKLE_GET_POSITIONS", status: "pending" }
        });

        // Initialize Aptos client
        const config = await validateAptosConfig(runtime);
        const network = config.APTOS_NETWORK as Network;
        const aptosConfig = new AptosConfig({ network });
        const aptosClient = new Aptos(aptosConfig);

        // Create account from private key
        const privateKey = new Ed25519PrivateKey(
            PrivateKey.formatPrivateKey(
                config.APTOS_PRIVATE_KEY,
                PrivateKeyVariants.Ed25519
            )
        );
        const account = Account.fromPrivateKey({ privateKey });

        // Get positions
        const positions = await getPositionsWithMerkleTrade(
            aptosClient,
            account,
            content.address
        );

        // Format the response
        let response: string;

        if (positions.length === 0) {
            response = "# No Merkle Trade Positions\n\nYou currently have no open positions on Merkle Trade.";
        } else {
            const positionDetails = positions.map(position => {
                const posType = position.isLong ? "Long" : "Short";
                const pnlColor = parseFloat(String(position.unrealizedPnlPercentage)) >= 0 ? "green" : "red";
                const pnlPrefix = parseFloat(String(position.unrealizedPnlPercentage)) >= 0 ? "+" : "";

                return [
                    `## ${posType} ${position.pairType} Position (ID: ${position.id})`,
                    "",
                    `**Size**: ${position.size.toFixed(6)} USDC`,
                    `**Collateral**: ${position.collateral.toFixed(6)} USDC`,
                    `**Leverage**: ${position.leverage.toFixed(2)}x`,
                    `**Entry Price**: $${position.avgPrice.toFixed(2)}`,
                    `**Liquidation Price**: $${position.liquidationPrice.toFixed(2)}`,
                    `**Unrealized PnL**: ${pnlPrefix}${position.unrealizedPnlPercentage.toFixed(2)}% (${pnlPrefix}${position.unrealizedPnl.toFixed(6)} USDC)`,
                    "",
                    "**Risk Management**:",
                    `- Stop Loss: ${position.stopLossTriggerPrice > 0 ? '$' + position.stopLossTriggerPrice.toFixed(2) : 'Not set'}`,
                    `- Take Profit: ${position.takeProfitTriggerPrice > 0 ? '$' + position.takeProfitTriggerPrice.toFixed(2) : 'Not set'}`,
                    ""
                ].join("\n");
            });

            response = [
                "# Merkle Trade Positions",
                "",
                "Here are your current open positions on Merkle Trade:",
                "",
                ...positionDetails
            ].join("\n");
        }

        callback?.({
            text: response,
            content: {
                action: "MERKLE_GET_POSITIONS",
                status: "complete",
                positions
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in MERKLE_GET_POSITIONS handler:", error);
        callback?.({
            text: `Failed to get positions from Merkle Trade: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "MERKLE_GET_POSITIONS", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for getting positions on Merkle Trade
 */
const merkleGetPositionsAction: Action = {
    name: "MERKLE_GET_POSITIONS",
    description: "Get positions on Merkle Trade",
    similes: [
        "GET_POSITIONS_MERKLE",
        "MERKLE_POSITIONS",
        "CHECK_POSITIONS_MERKLE",
        "VIEW_MERKLE_POSITIONS"
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me my positions on Merkle Trade"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Check my Merkle Trade positions"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Get my Merkle positions"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("position") || messageText.includes("positions")) &&
                (messageText.includes("merkle") || messageText.includes("merkle trade"));
    },
    suppressInitialMessage: true
};

export default merkleGetPositionsAction;
