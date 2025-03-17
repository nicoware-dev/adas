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
    Account,
    Ed25519PrivateKey,
    AccountAddress,
    PrivateKey,
    PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../enviroment";

export interface TransferNftContent extends Content {
    recipient: string;
    nftAddress: string;
}

function isTransferNftContent(content: unknown): content is TransferNftContent {
    elizaLogger.info("Content for NFT transfer", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.recipient === "string" && typeof c.nftAddress === "string";
}

const transferNftTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "recipient": "0x123456789abcdef",
    "nftAddress": "0x1::aptos_token::TokenId"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested NFT transfer:
- Recipient wallet address (starting with 0x)
- NFT address or identifier (the full address of the NFT, starting with 0x)

If the NFT is mentioned with "id", "address", or a similar term followed by a string starting with 0x, extract that as the nftAddress.
For example, from "transfer my NFT with id 0xa257d5b17f0ec80afd47a4d69e5a0783f492c4063c8d47562517fc5a25e4fdd2", extract "0xa257d5b17f0ec80afd47a4d69e5a0783f492c4063c8d47562517fc5a25e4fdd2" as the nftAddress.

Respond with a JSON markdown block containing only the extracted values.
`;

/**
 * Transfers an NFT to a recipient on the Aptos blockchain
 */
async function transferNft(
    aptosClient: Aptos,
    account: Account,
    recipient: string,
    nftAddress: string
): Promise<string> {
    try {
        // Convert recipient to AccountAddress
        const recipientAddress = AccountAddress.fromString(recipient);

        elizaLogger.info(`Attempting to transfer NFT ${nftAddress} to ${recipient}`);

        // Use the standard Aptos function for transferring digital assets
        const transaction = await aptosClient.transferDigitalAssetTransaction({
            sender: account,
            digitalAssetAddress: nftAddress,
            recipient: recipientAddress,
        });

        const committedTransaction = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction,
        });

        const signedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransaction.hash,
        });

        if (!signedTransaction.success) {
            elizaLogger.error("NFT transfer failed", signedTransaction);
            throw new Error("NFT transfer failed");
        }

        return signedTransaction.hash;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`NFT transfer failed: ${error.message}`);
        }
        throw new Error("NFT transfer failed with unknown error");
    }
}

/**
 * Handler for the TRANSFER_NFT action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract NFT transfer parameters from message
        const context = composeContext({
            state,
            template: transferNftTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isTransferNftContent(content)) {
            callback?.({
                text: "Please provide a recipient address and NFT address to transfer.",
                content: { action: "TRANSFER_NFT", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Transferring NFT ${content.nftAddress} to ${content.recipient}...`,
            content: { action: "TRANSFER_NFT", status: "pending" }
        });

        // Initialize Aptos client and account
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Create account from private key
        const privateKey = new Ed25519PrivateKey(
            PrivateKey.formatPrivateKey(
                config.APTOS_PRIVATE_KEY,
                PrivateKeyVariants.Ed25519
            )
        );
        const account = Account.fromPrivateKey({ privateKey });

        // Transfer the NFT
        const transactionHash = await transferNft(
            aptosClient,
            account,
            content.recipient,
            content.nftAddress
        );

        // Format the response
        const response = [
            "# NFT Transferred Successfully",
            "",
            `**NFT Address**: \`${content.nftAddress}\``,
            `**Recipient**: \`${content.recipient}\``,
            `**Transaction Hash**: \`${transactionHash}\``,
            "",
            "The NFT has been transferred to the recipient's wallet."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "TRANSFER_NFT",
                status: "complete",
                transfer: {
                    nftAddress: content.nftAddress,
                    recipient: content.recipient,
                    transactionHash
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in TRANSFER_NFT handler:", error);
        callback?.({
            text: `Failed to transfer NFT: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "TRANSFER_NFT", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for transferring NFTs
 */
const transferNftAction: Action = {
    name: "TRANSFER_NFT",
    description: "Transfer an NFT to a recipient on the Aptos blockchain",
    similes: [
        "NFT_TRANSFER",
        "SEND_NFT",
        "GIFT_NFT"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Transfer my NFT 0x1::aptos_token::TokenId to 0x123456789abcdef"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Send NFT 0x1::aptos_token::TokenId to address 0x123456789abcdef"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Gift my NFT at 0x1::aptos_token::TokenId to 0x123456789abcdef"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        elizaLogger.info("TRANSFER_NFT validation for user:", message.userId, "with message:", messageText);

        // Check for NFT-specific keywords
        const hasNftKeywords =
            messageText.includes("nft") ||
            messageText.includes("digital asset") ||
            (messageText.includes("collection") && messageText.includes("named")) ||
            // Check for NFT address patterns
            (messageText.match(/\b(id|address|token)\b.*0x[0-9a-f]+/i) !== null);

        // Check for transfer verbs
        const hasTransferVerb =
            messageText.includes("transfer") ||
            messageText.includes("send") ||
            messageText.includes("gift");

        const shouldValidate = hasTransferVerb && hasNftKeywords;
        elizaLogger.info("TRANSFER_NFT validation result:", { shouldValidate, hasNftKeywords, hasTransferVerb });

        return shouldValidate;
    },
    suppressInitialMessage: true
};

export default transferNftAction;
