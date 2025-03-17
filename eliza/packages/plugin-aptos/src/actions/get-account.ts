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
    AccountAddress,
    type MoveResource
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../enviroment";

export interface GetAccountContent extends Content {
    address: string;
}

function isGetAccountContent(content: unknown): content is GetAccountContent {
    elizaLogger.info("Content for account lookup", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.address === "string";
}

const getAccountTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "address": "0x123..."
}
\`\`\`

{{recentMessages}}
`;

interface CoinData {
    data: {
        coin: {
            value: string;
        };
    };
    type: string;
}

/**
 * Gets account information from the Aptos blockchain
 */
async function getAccountInfo(
    aptosClient: Aptos,
    address: string
): Promise<{
    accountAddress: string;
    sequenceNumber: string;
    authenticationKey: string;
    resources: MoveResource[];
}> {
    try {
        const accountAddress = AccountAddress.fromString(address);

        // Get account information
        const accountInfo = await aptosClient.account.getAccountInfo({
            accountAddress
        });

        // Get account resources
        const resources = await aptosClient.account.getAccountResources({
            accountAddress
        });

        return {
            accountAddress: accountAddress.toString(),
            sequenceNumber: accountInfo.sequence_number,
            authenticationKey: accountInfo.authentication_key,
            resources
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get account information: ${error.message}`);
        }
        throw new Error("Failed to get account information with unknown error");
    }
}

/**
 * Handler for the GET_ACCOUNT action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract account address from message
        const context = composeContext({
            state,
            template: getAccountTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isGetAccountContent(content)) {
            callback?.({
                text: "Please provide an account address to look up.",
                content: { action: "GET_ACCOUNT", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Looking up account ${content.address}...`,
            content: { action: "GET_ACCOUNT", status: "pending" }
        });

        // Initialize Aptos client
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Get account information
        const accountInfo = await getAccountInfo(
            aptosClient,
            content.address
        );

        // Find APT balance
        const aptResource = accountInfo.resources.find(
            resource => resource.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
        );

        let aptBalance = "0";
        if (aptResource && 'data' in aptResource &&
            typeof aptResource.data === 'object' && aptResource.data !== null &&
            'coin' in aptResource.data && typeof aptResource.data.coin === 'object' &&
            aptResource.data.coin !== null && 'value' in aptResource.data.coin) {
            const value = aptResource.data.coin.value;
            aptBalance = (Number(value) / (10 ** 8)).toFixed(8);
        }

        // Format the response
        const response = [
            "# Account Information",
            "",
            `**Address**: \`${accountInfo.accountAddress}\``,
            `**Sequence Number**: ${accountInfo.sequenceNumber}`,
            `**Authentication Key**: \`${accountInfo.authenticationKey}\``,
            `**APT Balance**: ${aptBalance} APT`,
            "",
            `**Total Resources**: ${accountInfo.resources.length}`,
            ""
        ];

        // Add some key resources
        response.push("## Key Resources");
        response.push("");

        const keyResources = accountInfo.resources
            .filter(resource => resource.type.includes("::coin::CoinStore"))
            .slice(0, 5);

        if (keyResources.length > 0) {
            for (const resource of keyResources) {
                const coinType = resource.type.split("<")[1].replace(">", "");
                response.push(`- **${coinType}**`);
            }
        } else {
            response.push("No coin resources found.");
        }

        callback?.({
            text: response.join("\n"),
            content: {
                action: "GET_ACCOUNT",
                status: "complete",
                address: content.address,
                sequenceNumber: accountInfo.sequenceNumber,
                aptBalance
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in GET_ACCOUNT handler:", error);
        callback?.({
            text: `Failed to get account information: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "GET_ACCOUNT", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for getting account information
 */
const getAccountAction: Action = {
    name: "GET_ACCOUNT",
    description: "Get account information from the Aptos blockchain",
    similes: [
        "ACCOUNT_INFO",
        "LOOKUP_ACCOUNT",
        "CHECK_ACCOUNT"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Get account info for 0x123..."
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Look up account 0x456..."
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Show me the details for wallet 0x789..."
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("account") ||
                messageText.includes("wallet")) &&
               (messageText.includes("get") ||
                messageText.includes("show") ||
                messageText.includes("details") ||
                messageText.includes("info") ||
                messageText.includes("lookup") ||
                messageText.includes("look up"));
    },
    suppressInitialMessage: true
};

export default getAccountAction;
