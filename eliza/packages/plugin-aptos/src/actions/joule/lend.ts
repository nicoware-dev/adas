import { elizaLogger } from "@elizaos/core";
import {
    type ActionExample,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    type Action,
} from "@elizaos/core";
import { composeContext } from "@elizaos/core";
import { generateObjectDeprecated } from "@elizaos/core";
import {
    Account,
    Aptos,
    AptosConfig,
    Ed25519PrivateKey,
    type Network,
    PrivateKey,
    PrivateKeyVariants,
    type InputGenerateTransactionPayloadData,
    type MoveStructId
} from "@aptos-labs/ts-sdk";
import { walletProvider } from "../../providers/wallet";

// Joule Finance contract address
const JOULE_CONTRACT_ADDRESS = "0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6";

export interface JouleLendContent extends Content {
    amount: string | number;
    tokenType: string;
    positionId?: string;
    newPosition?: boolean;
    isFungibleAsset?: boolean;
}

function isJouleLendContent(content: unknown): content is JouleLendContent {
    elizaLogger.info("Content for Joule lend", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return (
        (typeof c.amount === "string" || typeof c.amount === "number") &&
        typeof c.tokenType === "string"
    );
}

const jouleLendTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "amount": "1000",
    "tokenType": "0x1::aptos_coin::AptosCoin",
    "positionId": "123456",
    "newPosition": false,
    "isFungibleAsset": false
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Joule Finance lending operation:
- Amount to lend
- Token type to lend (e.g., "0x1::aptos_coin::AptosCoin" for APT)
- Position ID (if specified, otherwise null)
- Whether to create a new position (if specified, otherwise true)
- Whether the token is a fungible asset (if specified, otherwise false)

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "JOULE_LEND",
    similes: [
        "LEND_JOULE",
        "JOULE_DEPOSIT",
        "DEPOSIT_JOULE",
        "LEND_ON_JOULE",
        "DEPOSIT_ON_JOULE",
    ],
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.info("Validating Joule lend from user:", message.userId);
        return true;
    },
    description: "Lend tokens on Joule Finance",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("Starting JOULE_LEND handler...");

        const walletInfo = await walletProvider.get(runtime, message, state);
        state.walletInfo = walletInfo;

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        // Compose lend context
        const lendContext = composeContext({
            state: currentState,
            template: jouleLendTemplate,
        });

        // Generate lend content
        const content = await generateObjectDeprecated({
            runtime,
            context: lendContext,
            modelClass: ModelClass.SMALL,
        });

        // Validate lend content
        if (!isJouleLendContent(content)) {
            elizaLogger.error("Invalid content for JOULE_LEND action.");
            if (callback) {
                callback({
                    text: "Unable to process lending request. Invalid content provided.",
                    content: { error: "Invalid lending content" },
                });
            }
            return false;
        }

        try {
            const privateKey = runtime.getSetting("APTOS_PRIVATE_KEY");
            const aptosAccount = Account.fromPrivateKey({
                privateKey: new Ed25519PrivateKey(
                    PrivateKey.formatPrivateKey(
                        privateKey,
                        PrivateKeyVariants.Ed25519
                    )
                ),
            });
            const network = runtime.getSetting("APTOS_NETWORK") as Network;
            const aptosClient = new Aptos(
                new AptosConfig({
                    network,
                })
            );

            // Set defaults for optional parameters
            const positionId = content.positionId || "0"; // Default position ID
            const newPosition = content.newPosition !== undefined ? content.newPosition : true;
            const isFungibleAsset = content.isFungibleAsset || false;

            // Convert amount to number
            const amount = Number(content.amount);

            // Prepare transaction data based on token type
            let txData: InputGenerateTransactionPayloadData;

            if (isFungibleAsset) {
                // Fungible asset lending
                txData = {
                    function: `${JOULE_CONTRACT_ADDRESS}::pool::lend_fa`,
                    functionArguments: [positionId, content.tokenType, newPosition, amount],
                };
            } else {
                // Standard coin lending
                txData = {
                    function: `${JOULE_CONTRACT_ADDRESS}::pool::lend`,
                    typeArguments: [content.tokenType],
                    functionArguments: [positionId, amount, newPosition],
                };
            }

            elizaLogger.info("Building Joule lend transaction with data:", txData);

            const tx = await aptosClient.transaction.build.simple({
                sender: aptosAccount.accountAddress.toStringLong(),
                data: txData,
            });

            const committedTransaction =
                await aptosClient.signAndSubmitTransaction({
                    signer: aptosAccount,
                    transaction: tx,
                });

            const executedTransaction = await aptosClient.waitForTransaction({
                transactionHash: committedTransaction.hash,
            });

            if (!executedTransaction.success) {
                throw new Error("Lending transaction failed");
            }

            elizaLogger.info("Joule lending successful:", executedTransaction.hash);

            // Extract token name for display
            let tokenName = "tokens";
            if (content.tokenType === "0x1::aptos_coin::AptosCoin") {
                tokenName = "APT";
            } else {
                const tokenParts = content.tokenType.split("::");
                tokenName = tokenParts.length > 2 ? tokenParts[2] : "tokens";
            }

            // Try to extract position ID from transaction events
            let resultPositionId = positionId;
            try {
                // Access transaction events if available
                // Note: This is a simplified approach and may need adjustment based on the actual API response structure
                const txResponse = executedTransaction as unknown;
                // Check if the transaction response has events
                if (
                    txResponse &&
                    typeof txResponse === 'object' &&
                    'events' in txResponse &&
                    Array.isArray((txResponse as Record<string, unknown>).events) &&
                    ((txResponse as Record<string, unknown>).events as unknown[]).length > 0
                ) {
                    const events = (txResponse as Record<string, unknown>).events as Array<Record<string, unknown>>;
                    for (const event of events) {
                        if (
                            event.data &&
                            typeof event.data === 'object' &&
                            'position_id' in (event.data as object)
                        ) {
                            resultPositionId = String((event.data as Record<string, unknown>).position_id);
                            break;
                        }
                    }
                }
            } catch (eventError) {
                elizaLogger.warn("Could not extract position ID from transaction events:", eventError);
                // Continue with the default position ID
            }

            if (callback) {
                callback({
                    text: `Successfully lent ${content.amount} ${tokenName} on Joule Finance. Position ID: ${resultPositionId}, Transaction: ${executedTransaction.hash}`,
                    content: {
                        success: true,
                        hash: executedTransaction.hash,
                        amount: content.amount,
                        tokenType: content.tokenType,
                        positionId: resultPositionId,
                        newPosition: newPosition,
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error during Joule lending:", error);
            if (callback) {
                callback({
                    text: `Error lending on Joule Finance: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to lend 100 APT on Joule Finance",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll process your lending request on Joule Finance...",
                    action: "JOULE_LEND",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully lent 100 APT on Joule Finance. Position ID: 123456, Transaction: 0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
