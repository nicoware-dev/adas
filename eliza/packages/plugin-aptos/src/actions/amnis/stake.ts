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
} from "@aptos-labs/ts-sdk";
import { walletProvider } from "../../providers/wallet";

// Amnis Finance contract address
const AMNIS_CONTRACT_ADDRESS = "0xf9bf731c49b6c9e10a3d3d3d2d75d5a7d0376b8e1a81b9a9cf8473e6f5c9fa7d";

export interface AmnisStakeContent extends Content {
    amount: string | number;
    poolId?: string;
}

function isAmnisStakeContent(content: unknown): content is AmnisStakeContent {
    elizaLogger.info("Content for Amnis stake", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return (
        (typeof c.amount === "string" || typeof c.amount === "number")
    );
}

const amnisStakeTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "amount": "1000",
    "poolId": "1"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Amnis Finance staking operation:
- Amount to stake
- Pool ID (if specified, otherwise null)

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "AMNIS_STAKE",
    similes: [
        "STAKE_AMNIS",
        "AMNIS_DEPOSIT",
        "DEPOSIT_AMNIS",
        "STAKE_ON_AMNIS",
        "DEPOSIT_ON_AMNIS",
    ],
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.info("Validating Amnis stake from user:", message.userId);
        return true;
    },
    description: "Stake APT on Amnis Finance",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("Starting AMNIS_STAKE handler...");

        const walletInfo = await walletProvider.get(runtime, message, state);
        state.walletInfo = walletInfo;

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        // Compose stake context
        const stakeContext = composeContext({
            state: currentState,
            template: amnisStakeTemplate,
        });

        // Generate stake content
        const content = await generateObjectDeprecated({
            runtime,
            context: stakeContext,
            modelClass: ModelClass.SMALL,
        });

        // Validate stake content
        if (!isAmnisStakeContent(content)) {
            elizaLogger.error("Invalid content for AMNIS_STAKE action.");
            if (callback) {
                callback({
                    text: "Unable to process staking request. Invalid content provided.",
                    content: { error: "Invalid staking content" },
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
            const poolId = content.poolId || "1"; // Default pool ID

            // Convert amount to number and adjust for decimals
            const APT_DECIMALS = 8;
            const adjustedAmount = BigInt(
                Number(content.amount) * (10 ** APT_DECIMALS)
            );

            // Prepare transaction data
            const txData: InputGenerateTransactionPayloadData = {
                function: `${AMNIS_CONTRACT_ADDRESS}::staking::stake`,
                typeArguments: [],
                functionArguments: [poolId, adjustedAmount],
            };

            elizaLogger.info("Building Amnis stake transaction with data:", txData);

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
                throw new Error("Staking transaction failed");
            }

            elizaLogger.info("Amnis staking successful:", executedTransaction.hash);

            if (callback) {
                callback({
                    text: `Successfully staked ${content.amount} APT on Amnis Finance. Pool ID: ${poolId}, Transaction: ${executedTransaction.hash}`,
                    content: {
                        success: true,
                        hash: executedTransaction.hash,
                        amount: content.amount,
                        poolId: poolId,
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error during Amnis staking:", error);
            if (callback) {
                callback({
                    text: `Error staking on Amnis Finance: ${error.message}`,
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
                    text: "I want to stake 50 APT on Amnis Finance",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll process your staking request on Amnis Finance...",
                    action: "AMNIS_STAKE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully staked 50 APT on Amnis Finance. Pool ID: 1, Transaction: 0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
