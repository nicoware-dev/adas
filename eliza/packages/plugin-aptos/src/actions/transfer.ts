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
} from "@aptos-labs/ts-sdk";
import { walletProvider } from "../providers/wallet";

export interface TransferContent extends Content {
    recipient: string;
    amount: string | number;
}

function isTransferContent(content: unknown): content is TransferContent {
    elizaLogger.info("Content for transfer", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return (
        typeof c.recipient === "string" &&
        (typeof c.amount === "string" ||
            typeof c.amount === "number")
    );
}

const transferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "recipient": "0x2badda48c062e861ef17a96a806c451fd296a49f45b272dee17f85b0e32663fd",
    "amount": "1000"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested APT transfer:
- Recipient wallet address
- Amount to transfer

Respond with a JSON markdown block containing only the extracted values.`;

const transferAptos: Action = {
    name: "TRANSFER",
    similes: [
        "TRANSFER_APT",
        "SEND_APT",
        "PAY",
    ],
    description: "Transfer APT from the agent's wallet to another address",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("Starting TRANSFER handler...");

        const walletInfo = await walletProvider.get(runtime, message, state);
        state.walletInfo = walletInfo;

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        // Compose transfer context
        const transferContext = composeContext({
            state: currentState,
            template: transferTemplate,
        });

        // Generate transfer content
        const content = await generateObjectDeprecated({
            runtime,
            context: transferContext,
            modelClass: ModelClass.SMALL,
        });

        // Validate transfer content
        if (!isTransferContent(content)) {
            elizaLogger.error("Invalid content for TRANSFER action.");
            if (callback) {
                callback({
                    text: "Unable to process transfer request. Invalid content provided.",
                    content: { error: "Invalid transfer content" },
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

            // Check balance before transfer
            const resources = await aptosClient.getAccountResources({
                accountAddress: aptosAccount.accountAddress,
            });

            const aptCoinStore = resources.find(
                (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
            );

            if (!aptCoinStore) {
                throw new Error("APT coin store not found in account resources");
            }

            const balance = BigInt((aptCoinStore.data as { coin: { value: string } }).coin.value);
            const APT_DECIMALS = 8;
            const adjustedAmount = BigInt(
                Number(content.amount) * (10 ** APT_DECIMALS)
            );

            // Check if balance is sufficient
            if (balance < adjustedAmount) {
                const balanceInApt = Number(balance) / (10 ** APT_DECIMALS);
                throw new Error(`Insufficient balance. You have ${balanceInApt} APT but attempted to transfer ${content.amount} APT.`);
            }

            elizaLogger.info(
                `Transferring: ${content.amount} APT (${adjustedAmount} base units) from balance of ${balance} base units`
            );

            const tx = await aptosClient.transaction.build.simple({
                sender: aptosAccount.accountAddress.toStringLong(),
                data: {
                    function: "0x1::aptos_account::transfer",
                    typeArguments: [],
                    functionArguments: [content.recipient, adjustedAmount],
                },
            });
            const committedTransaction =
                await aptosClient.signAndSubmitTransaction({
                    signer: aptosAccount,
                    transaction: tx,
                });
            const executedTransaction = await aptosClient.waitForTransaction({
                transactionHash: committedTransaction.hash,
            });

            elizaLogger.info("Transfer successful:", executedTransaction.hash);

            if (callback) {
                callback({
                    text: `Successfully transferred ${content.amount} APT to ${content.recipient}, Transaction: ${executedTransaction.hash}`,
                    content: {
                        success: true,
                        hash: executedTransaction.hash,
                        amount: content.amount,
                        recipient: content.recipient,
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error during APT transfer:", error);
            if (callback) {
                callback({
                    text: `Error transferring APT: ${error.message}`,
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
                    text: "Send 69 APT to 0x4f2e63be8e7fe287836e29cde6f3d5cbc96eefd0c0e3f3747668faa2ae7324b0",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 69 APT now...",
                    action: "TRANSFER",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully sent 69 APT to 0x4f2e63be8e7fe287836e29cde6f3d5cbc96eefd0c0e3f3747668faa2ae7324b0, Transaction: 0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0",
                },
            },
        ],
    ] as ActionExample[][],
    suppressInitialMessage: true,
    // Add a more specific validation function that only triggers for APT transfers
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.info("TRANSFER validation for user:", message.userId);

        const messageText = message.content?.text?.toLowerCase() || "";
        elizaLogger.info("TRANSFER validation message:", messageText);

        // Check if this is an NFT-related message - if so, don't handle it
        if (messageText.includes("nft") ||
            messageText.includes("digital asset") ||
            (messageText.includes("collection") && messageText.includes("named"))) {
            elizaLogger.info("TRANSFER validation: Found NFT-related keywords, not an APT transfer");
            return false;
        }

        // First, check if this is an explicit APT transfer
        const isExplicitAptTransfer =
            messageText.match(/\b(transfer|send|pay)\s+(apt|aptos)\b/) !== null;

        // If it's an explicit APT transfer, this should take precedence
        if (isExplicitAptTransfer) {
            elizaLogger.info("TRANSFER validation: Found explicit APT transfer mention");
            return true;
        }

        // If there are any token-specific indicators, this should NOT be handled by the APT transfer
        const hasTokenSpecificIndicators =
            messageText.includes("token") ||
            messageText.includes("ttk") ||
            messageText.includes("usdc") ||
            messageText.includes("usdt") ||
            messageText.includes("dai") ||
            messageText.includes("::") ||
            messageText.includes("nft") ||
            messageText.includes("digital asset");

        if (hasTokenSpecificIndicators) {
            elizaLogger.info("TRANSFER validation: Found token-specific indicators, not an APT transfer");
            return false;
        }

        // If it's a simple "transfer X to address" without specifying a token type,
        // assume it's an APT transfer (legacy behavior)
        const isImplicitAptTransfer =
            (messageText.includes("transfer") || messageText.includes("send")) &&
            messageText.includes("to") &&
            !messageText.includes("coin");

        elizaLogger.info("TRANSFER validation result:",
            { isImplicitAptTransfer });

        return isImplicitAptTransfer;
    }
} as Action;

export default transferAptos;
