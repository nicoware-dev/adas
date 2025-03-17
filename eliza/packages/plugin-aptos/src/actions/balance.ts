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
    Account,
    Aptos,
    AptosConfig,
    Ed25519PrivateKey,
    Network,
    PrivateKey,
    PrivateKeyVariants,
    convertAmountFromOnChainToHumanReadable,
    AccountAddress,
} from "@aptos-labs/ts-sdk";
import type { MoveStructId } from "@aptos-labs/ts-sdk";
import { walletProvider } from "../providers/wallet";
import { validateAptosConfig } from "../enviroment";

export interface BalanceContent extends Content {
    tokenAddress?: string;
    tokenSymbol?: string;
}

function isBalanceContent(content: unknown): content is BalanceContent {
    elizaLogger.info("Content for balance check", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.tokenAddress === "string" || typeof c.tokenSymbol === "string" || true;
}

const balanceTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenAddress": "0x1::aptos_coin::AptosCoin",
    "tokenSymbol": "APT"
}
\`\`\`

{{recentMessages}}
`;

/**
 * Gets the balance of a token on the Aptos blockchain
 */
async function getBalance(
    aptosClient: Aptos,
    account: Account,
    mint?: string | MoveStructId,
    addressToCheck?: string
): Promise<number> {
    try {
        // Use the provided address if specified, otherwise use the agent's address
        const targetAddress = addressToCheck || account.accountAddress.toStringLong();
        elizaLogger.info(`Checking balance for address: ${targetAddress}`);

        if (mint) {
            let balance: number;
            if (mint.toString().split("::").length !== 3) {
                // For fungible assets, use getCurrentFungibleAssetBalances
                const balances = await aptosClient.getCurrentFungibleAssetBalances({
                    options: {
                        where: {
                            owner_address: {
                                _eq: targetAddress,
                            },
                            asset_type: { _eq: mint.toString() },
                        },
                    },
                });

                balance = balances.length > 0 ? Number(balances[0].amount) || 0 : 0;
                elizaLogger.info(`Fungible asset balance for ${mint}: ${balance}`);

                // Convert from base units to human-readable format (8 decimals is standard)
                const DECIMALS = 8;
                return balance / (10 ** DECIMALS);
            } else {
                // For standard coins, use getAccountCoinAmount
                balance = await aptosClient.getAccountCoinAmount({
                    accountAddress: AccountAddress.fromString(targetAddress),
                    coinType: mint.toString() as MoveStructId,
                });
                elizaLogger.info(`Standard coin balance for ${mint}: ${balance}`);

                // Convert from base units to human-readable format (8 decimals is standard)
                const DECIMALS = 8;
                return balance / (10 ** DECIMALS);
            }
        }

        // Default to APT balance if no token is specified
        const balance = await aptosClient.getAccountAPTAmount({
            accountAddress: AccountAddress.fromString(targetAddress),
        });

        const convertedBalance = convertAmountFromOnChainToHumanReadable(balance, 8);
        elizaLogger.info(`APT balance: ${convertedBalance}`);
        return convertedBalance;
    } catch (error) {
        elizaLogger.error("Error getting balance:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get balance: ${error.message}`);
        }
        throw new Error("Failed to get balance with unknown error");
    }
}

/**
 * Handler for the BALANCE action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract balance check parameters from message
        const context = composeContext({
            state,
            template: balanceTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isBalanceContent(content)) {
            callback?.({
                text: "Please provide a token address or symbol to check the balance.",
                content: { action: "BALANCE", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Extract wallet address from message text
        const messageText = message.content?.text?.toLowerCase() || "";
        let addressToCheck: string | undefined;

        // Look for wallet address pattern in the message
        const addressMatch = messageText.match(/0x[a-f0-9]{64}/i);
        if (addressMatch) {
            addressToCheck = addressMatch[0];
            elizaLogger.info(`Found address to check in message: ${addressToCheck}`);
        }

        // Look up token address from state if only symbol is provided
        let tokenAddress = content.tokenAddress;
        if (!tokenAddress && content.tokenSymbol && state.tokens) {
            // Find token by symbol in state
            const tokenInfo = Object.values(state.tokens).find(
                (token: { symbol: string; address: string }) => token.symbol === content.tokenSymbol
            );

            if (tokenInfo?.address) {
                tokenAddress = tokenInfo.address;
                elizaLogger.info(`Found token address ${tokenAddress} for symbol ${content.tokenSymbol}`);
            }
        }

        // Send a confirmation message first
        callback?.({
            text: `Checking balance${tokenAddress ? ` for ${tokenAddress}` : ''}${addressToCheck ? ` at address ${addressToCheck}` : ''}...`,
            content: { action: "BALANCE", status: "pending" }
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

        try {
            // Get the balance
            const balance = await getBalance(aptosClient, account, tokenAddress, addressToCheck);

            // Format the response with token symbol
            const tokenSymbol = content.tokenSymbol || (tokenAddress === "0x1::aptos_coin::AptosCoin" ? "APT" : "tokens");
            const response = [
                "# Balance",
                "",
                `**Balance**: ${balance} ${tokenSymbol}`,
                tokenAddress ? `**Token Address**: \`${tokenAddress}\`` : '',
                addressToCheck ? `**Wallet Address**: \`${addressToCheck}\`` : '',
                "",
                "Balance retrieved successfully."
            ].filter(Boolean).join("\n");

            callback?.({
                text: response,
                content: {
                    action: "BALANCE",
                    status: "complete",
                    balance: {
                        tokenAddress,
                        tokenSymbol,
                        balance,
                        walletAddress: addressToCheck
                    }
                }
            });

            return true;
        } catch (error) {
            elizaLogger.error("Error checking balance:", error);
            callback?.({
                text: `Failed to check balance: ${error instanceof Error ? error.message : "Unknown error"}`,
                content: { action: "BALANCE", status: "error", error: String(error) }
            });
            return false;
        }
    } catch (error) {
        elizaLogger.error("Error in BALANCE handler:", error);
        callback?.({
            text: `Failed to check balance: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "BALANCE", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for checking token balance
 */
const balanceAction: Action = {
    name: "BALANCE",
    description: "Check token balance on the Aptos blockchain",
    similes: [
        "CHECK_BALANCE",
        "GET_BALANCE",
        "TOKEN_BALANCE"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Check my APT balance"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "What's my balance for TTK tokens?"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";

        // Check for explicit balance keywords
        const hasBalanceKeyword = messageText.includes("balance") || messageText.includes("check") || messageText.includes("how much");
        const hasTokenKeyword = messageText.includes("token") || messageText.includes("coin") || messageText.includes("apt");

        // If the message explicitly mentions "balance" and "token/coin/apt"
        if (hasBalanceKeyword && hasTokenKeyword) {
            elizaLogger.info(`Balance action validated: ${messageText}`);
            return true;
        }

        return false;
    },
    suppressInitialMessage: true
};

export default balanceAction;
