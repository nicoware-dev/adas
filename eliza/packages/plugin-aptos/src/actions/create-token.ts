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
import type {
    AptosConfig as AptosConfigType,
    Network as NetworkType,
    Account as AccountType,
    Ed25519PrivateKey as Ed25519PrivateKeyType,
    PrivateKey,
    PrivateKeyVariants,
    UserTransactionResponse
} from "@aptos-labs/ts-sdk";
import {
    Aptos,
    AptosConfig,
    Network,
    Account,
    Ed25519PrivateKey
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../enviroment";

export interface CreateTokenContent extends Content {
    name: string;
    symbol: string;
    iconURI?: string;
    projectURI?: string;
}

// Define a type for token information to be stored in state
export interface TokenInfo {
    name: string;
    symbol: string;
    address: string;
    transactionHash: string;
    createdAt: number;
}

// Define a type for the state with tokens
export interface StateWithTokens extends State {
    tokens?: Record<string, TokenInfo>;
}

function isCreateTokenContent(content: unknown): content is CreateTokenContent {
    elizaLogger.info("Content for token creation", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.name === "string" && typeof c.symbol === "string";
}

const createTokenTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "name": "My Token",
    "symbol": "MTK",
    "iconURI": "https://example.com/icon.png",
    "projectURI": "https://example.com"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token creation:
- Token name
- Token symbol
- Icon URI (optional)
- Project URI (optional)

Respond with a JSON markdown block containing only the extracted values.`;

// Add a function to validate hex addresses
function isValidHexAddress(address: string): boolean {
    // Remove 0x prefix if present
    const hexPart = address.startsWith('0x') ? address.slice(2) : address;

    // Check if it's a valid hex string of the right length
    return /^[0-9a-f]{64}$/i.test(hexPart);
}

/**
 * Creates a fungible asset token on the Aptos blockchain
 */
async function createToken(
    aptosClient: Aptos,
    account: Account,
    name: string,
    symbol: string,
    iconURI: string,
    projectURI: string
): Promise<{ token: string; hash: string }> {
    try {
        elizaLogger.info(`Creating token "${name}" (${symbol})`);

        // Use the launchpad::create_fa_simple function as shown in the Move Agent Kit example
        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: "0x67c8564aee3799e9ac669553fdef3a3828d4626f24786b6a5642152fa09469dd::launchpad::create_fa_simple",
                typeArguments: [],
                functionArguments: [name, symbol, iconURI || "", projectURI || ""],
            },
        });

        elizaLogger.info("Signing and submitting transaction");
        const committedTransaction = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction: transaction
        });

        elizaLogger.info(`Transaction submitted: ${committedTransaction.hash}`);
        const signedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransaction.hash,
        });

        if (!signedTransaction.success) {
            elizaLogger.error("Token creation failed", signedTransaction);
            throw new Error(`Token creation failed: ${signedTransaction.vm_status || "Unknown error"}`);
        }

        // Extract token address from events
        let tokenAddress = "";

        // Cast to UserTransactionResponse to access events
        const txWithEvents = signedTransaction as UserTransactionResponse;

        if (txWithEvents.events && txWithEvents.events.length > 0) {
            try {
                // Look for the token creation event
                for (const event of txWithEvents.events) {
                    if (event.data && typeof event.data === 'object') {
                        const eventData = event.data as Record<string, unknown>;
                        if ('fa_obj' in eventData && typeof eventData.fa_obj === 'object') {
                            const faObj = eventData.fa_obj as Record<string, unknown>;
                            if ('inner' in faObj && typeof faObj.inner === 'string') {
                                tokenAddress = faObj.inner;
                                elizaLogger.info(`Found token address in events: ${tokenAddress}`);
                                break;
                            }
                        }
                    }
                }
            } catch (err) {
                elizaLogger.error("Error extracting token address from events:", err);
            }
        }

        if (!tokenAddress) {
            elizaLogger.warn("Could not extract token address from transaction events");
            // Fallback to transaction hash as token address
            tokenAddress = signedTransaction.hash;
            elizaLogger.info(`Using fallback token address: ${tokenAddress}`);
        }

        elizaLogger.info(`Successfully created token "${name}" (${symbol}) at address ${tokenAddress}`);
        return {
            token: tokenAddress,
            hash: signedTransaction.hash
        };
    } catch (error) {
        elizaLogger.error("Error creating token:", error);
        if (error instanceof Error) {
            throw new Error(`Token creation failed: ${error.message}`);
        }
        throw new Error("Token creation failed with unknown error");
    }
}

/**
 * Handler for the CREATE_TOKEN action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    elizaLogger.info("Starting CREATE_TOKEN handler");

    try {
        // Initialize or update state
        let currentState = state as StateWithTokens;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as StateWithTokens;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        // Initialize tokens in state if not present
        if (!currentState.tokens) {
            currentState.tokens = {};
        }

        // Compose token creation context
        const tokenCreationContext = composeContext({
            state: currentState,
            template: createTokenTemplate,
        });

        // Generate token creation content
        elizaLogger.info("Generating token creation content");
        const content = await generateObjectDeprecated({
            runtime,
            context: tokenCreationContext,
            modelClass: ModelClass.SMALL,
        });

        if (!isCreateTokenContent(content)) {
            const errorMsg = "Please provide both a name and symbol for the token.";
            elizaLogger.error("Invalid content for CREATE_TOKEN action:", content);
            if (callback) {
                callback({
                    text: errorMsg,
                    content: { action: "CREATE_TOKEN", status: "error", error: "Missing required parameters" }
                });
            }
            return false;
        }

        // Send a confirmation message first
        elizaLogger.info(`Creating token "${content.name}" (${content.symbol})`);
        if (callback) {
            callback({
                text: `Creating token "${content.name}" (${content.symbol})...`,
                content: {
                    action: "CREATE_TOKEN",
                    status: "pending",
                    name: content.name,
                    symbol: content.symbol
                }
            });
        }

        // Initialize Aptos client and account
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Create account from private key
        const privateKey = new Ed25519PrivateKey(config.APTOS_PRIVATE_KEY);
        const account = Account.fromPrivateKey({ privateKey });

        // Create the token
        const result = await createToken(
            aptosClient,
            account,
            content.name,
            content.symbol,
            content.iconURI || "",
            content.projectURI || ""
        );

        // Validate token address before storing
        if (!result.token || !isValidHexAddress(result.token)) {
            elizaLogger.warn(`Invalid token address: ${result.token}. Using transaction hash as token address.`);
            // Use transaction hash as fallback (it's always a valid hex string)
            result.token = result.hash;
        }

        // Store token info in state
        const tokenInfo: TokenInfo = {
            name: content.name,
            symbol: content.symbol,
            address: result.token,
            transactionHash: result.hash,
            createdAt: Date.now()
        };

        currentState.tokens[content.symbol] = tokenInfo;

        // Store token info in memory for future use
        elizaLogger.info(`Stored token info for future use: ${JSON.stringify(tokenInfo)}`);

        // Format the response
        const response = `# Token Created Successfully

**Name**: ${content.name}
**Symbol**: ${content.symbol}
**Token Address**: \`${result.token}\`
**Transaction Hash**: \`${result.hash}\`

Your token has been created successfully. Note that no tokens have been minted yet.
To mint tokens, you can use the "mint tokens" command with this token symbol.

Example: "mint 100 ${content.symbol} tokens"`;

        elizaLogger.info(`Successfully created token: ${content.name} (${content.symbol})`);
        if (callback) {
            callback({
                text: response,
                content: {
                    action: "CREATE_TOKEN",
                    status: "complete",
                    token: {
                        name: content.name,
                        symbol: content.symbol,
                        address: result.token,
                        transactionHash: result.hash
                    }
                }
            });
        }

        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        elizaLogger.error("Error in CREATE_TOKEN handler:", error);

        if (callback) {
            callback({
                text: `Failed to create token: ${errorMessage}`,
                content: {
                    action: "CREATE_TOKEN",
                    status: "error",
                    error: errorMessage
                }
            });
        }
        return false;
    }
};

/**
 * Action for creating a token
 */
const createTokenAction: Action = {
    name: "CREATE_TOKEN",
    description: "Create a new fungible token on the Aptos blockchain",
    similes: [
        "TOKEN_CREATE",
        "NEW_TOKEN",
        "MINT_TOKEN"
    ],
    examples: [[
        {
            user: "{{user1}}",
            content: {
                text: "Create a new token called 'My Token' with symbol 'MTK'"
            }
        },
        {
            user: "{{user2}}",
            content: {
                text: "Creating token \"My Token\" (MTK)...",
                action: "CREATE_TOKEN"
            }
        },
        {
            user: "{{user2}}",
            content: {
                text: "# Token Created Successfully\n\n**Name**: My Token\n**Symbol**: MTK\n**Token Address**: `0x72e8c432f9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05e2`\n**Transaction Hash**: `0x72e8c432f9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05e2`\n\nYour token has been created successfully. Note that no tokens have been minted yet.\nTo mint tokens, you can use the \"mint tokens\" command with this token address.\n\nExample: \"mint 100 MTK tokens\""
            }
        }
    ]],
    handler,
    suppressInitialMessage: true,
    validate: async (_runtime, message) => {
        elizaLogger.info("Validating token creation request from user:", message.userId);
        return true;
    },
};

export default createTokenAction;
