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
    type MoveModuleBytecode
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../enviroment";

export interface GetModulesContent extends Content {
    address: string;
}

function isGetModulesContent(content: unknown): content is GetModulesContent {
    elizaLogger.info("Content for modules lookup", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.address === "string";
}

const getModulesTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "address": "0x123..."
}
\`\`\`

{{recentMessages}}
`;

// Define a simplified interface for module information
interface ModuleInfo {
    name: string;
    exposed_functions?: Record<string, { is_entry: boolean }>;
    structs?: Record<string, unknown>;
}

/**
 * Gets modules published by an account on the Aptos blockchain
 */
async function getAccountModules(
    aptosClient: Aptos,
    address: string
): Promise<ModuleInfo[]> {
    try {
        const accountAddress = AccountAddress.fromString(address);

        // Get account modules
        const modules = await aptosClient.account.getAccountModules({
            accountAddress
        });

        // Convert MoveModuleBytecode to ModuleInfo
        return modules.map(module => ({
            name: module.abi?.name || "unknown",
            exposed_functions: module.abi?.exposed_functions || {},
            structs: module.abi?.structs || {}
        }));
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get account modules: ${error.message}`);
        }
        throw new Error("Failed to get account modules with unknown error");
    }
}

/**
 * Handler for the GET_MODULES action
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
            template: getModulesTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isGetModulesContent(content)) {
            callback?.({
                text: "Please provide an account address to look up modules for.",
                content: { action: "GET_MODULES", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Looking up modules for account ${content.address}...`,
            content: { action: "GET_MODULES", status: "pending" }
        });

        // Initialize Aptos client
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Get account modules
        const modules = await getAccountModules(
            aptosClient,
            content.address
        );

        if (modules.length === 0) {
            callback?.({
                text: `No modules found for account ${content.address}.`,
                content: {
                    action: "GET_MODULES",
                    status: "complete",
                    modules: []
                }
            });
            return true;
        }

        // Format the response
        const response = [
            "# Account Modules",
            "",
            `**Address**: \`${content.address}\``,
            `**Total Modules**: ${modules.length}`,
            "",
            "## Module List",
            ""
        ];

        for (const module of modules) {
            response.push(`### ${module.name}`);
            response.push("");
            response.push(`- **Exposed Functions**: ${Object.keys(module.exposed_functions || {}).length}`);

            if (module.exposed_functions && Object.keys(module.exposed_functions).length > 0) {
                response.push("- **Functions**:");
                for (const [funcName, funcInfo] of Object.entries(module.exposed_functions)) {
                    response.push(`  - \`${funcName}\` (${funcInfo.is_entry ? "entry" : "non-entry"})`);
                }
            }

            response.push(`- **Structs**: ${Object.keys(module.structs || {}).length}`);
            response.push("");
        }

        callback?.({
            text: response.join("\n"),
            content: {
                action: "GET_MODULES",
                status: "complete",
                address: content.address,
                moduleCount: modules.length,
                modules: modules.map(m => ({
                    name: m.name,
                    functionCount: Object.keys(m.exposed_functions || {}).length,
                    structCount: Object.keys(m.structs || {}).length
                }))
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in GET_MODULES handler:", error);
        callback?.({
            text: `Failed to get module information: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "GET_MODULES", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for getting module information
 */
const getModulesAction: Action = {
    name: "GET_MODULES",
    description: "Get module information from the Aptos blockchain",
    similes: [
        "MODULE_INFO",
        "LOOKUP_MODULES",
        "CHECK_MODULES"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Get modules for account 0x123..."
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Look up modules published by 0x456..."
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Show me the smart contracts for 0x789..."
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("module") ||
                messageText.includes("smart contract") ||
                messageText.includes("contract")) &&
               (messageText.includes("get") ||
                messageText.includes("show") ||
                messageText.includes("list") ||
                messageText.includes("lookup") ||
                messageText.includes("look up"));
    },
    suppressInitialMessage: true
};

export default getModulesAction;
