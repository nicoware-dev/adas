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
    PrivateKey,
    PrivateKeyVariants,
    AccountAddress,
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../enviroment";

export interface CreateNftContent extends Content {
    collectionName: string;
    collectionDescription?: string;
    collectionUri?: string;
    nftName: string;
    nftDescription?: string;
    nftUri?: string;
    recipient?: string;
}

function isCreateNftContent(content: unknown): content is CreateNftContent {
    elizaLogger.info("Content for NFT creation", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return (
        typeof c.collectionName === "string" &&
        typeof c.nftName === "string" &&
        (c.collectionDescription === undefined || typeof c.collectionDescription === "string") &&
        (c.collectionUri === undefined || typeof c.collectionUri === "string") &&
        (c.nftDescription === undefined || typeof c.nftDescription === "string") &&
        (c.nftUri === undefined || typeof c.nftUri === "string") &&
        (c.recipient === undefined || typeof c.recipient === "string")
    );
}

const createNftTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "collectionName": "Example Collection",
    "collectionDescription": "This is an example collection.",
    "collectionUri": "aptos.dev",
    "nftName": "Example Asset",
    "nftDescription": "This is an example digital asset.",
    "nftUri": "aptos.dev/asset",
    "recipient": "0x123456789abcdef"
}
\`\`\`

{{recentMessages}}
`;

/**
 * Creates a collection and mints an NFT on the Aptos blockchain
 */
async function createNft(
    aptosClient: Aptos,
    account: Account,
    collectionName: string,
    collectionDescription: string,
    collectionUri: string,
    nftName: string,
    nftDescription: string,
    nftUri: string,
    recipient?: string
): Promise<{
    collectionTxHash: string;
    mintTxHash: string;
    transferTxHash?: string;
    digitalAssetAddress?: string;
}> {
    try {
        // Step 1: Create the collection
        elizaLogger.info(`Creating collection: ${collectionName}`);
        const createCollectionTransaction = await aptosClient.createCollectionTransaction({
            creator: account,
            description: collectionDescription,
            name: collectionName,
            uri: collectionUri,
        });

        const collectionTxn = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction: createCollectionTransaction,
        });

        await aptosClient.waitForTransaction({ transactionHash: collectionTxn.hash });
        elizaLogger.info(`Collection created successfully: ${collectionTxn.hash}`);

        // Step 2: Mint the NFT
        elizaLogger.info(`Minting NFT: ${nftName}`);
        const mintTokenTransaction = await aptosClient.mintDigitalAssetTransaction({
            creator: account,
            collection: collectionName,
            description: nftDescription,
            name: nftName,
            uri: nftUri,
        });

        const mintTxn = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction: mintTokenTransaction,
        });

        await aptosClient.waitForTransaction({ transactionHash: mintTxn.hash });
        elizaLogger.info(`NFT minted successfully: ${mintTxn.hash}`);

        // Wait for the indexer to update with the latest data
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Get the digital asset address
        const digitalAssets = await aptosClient.getOwnedDigitalAssets({
            ownerAddress: account.accountAddress,
        });

        if (digitalAssets.length === 0) {
            throw new Error("No digital assets found after minting. The minting might have failed.");
        }

        const digitalAssetAddress = digitalAssets[0].token_data_id;
        elizaLogger.info(`Digital asset address: ${digitalAssetAddress}`);

        // Step 3: Transfer the NFT if recipient is provided
        let transferTxHash: string | undefined;
        if (recipient && recipient !== "null" && recipient.startsWith("0x")) {
            elizaLogger.info(`Transferring NFT to: ${recipient}`);
            const transferTransaction = await aptosClient.transferDigitalAssetTransaction({
                sender: account,
                digitalAssetAddress,
                recipient: AccountAddress.fromString(recipient),
            });

            const transferTxn = await aptosClient.signAndSubmitTransaction({
                signer: account,
                transaction: transferTransaction,
            });

            await aptosClient.waitForTransaction({ transactionHash: transferTxn.hash });
            transferTxHash = transferTxn.hash;
            elizaLogger.info(`NFT transferred successfully: ${transferTxHash}`);
        } else {
            elizaLogger.info("No valid recipient provided, skipping NFT transfer");
        }

        return {
            collectionTxHash: collectionTxn.hash,
            mintTxHash: mintTxn.hash,
            transferTxHash,
            digitalAssetAddress,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`NFT creation failed: ${error.message}`);
        }
        throw new Error("NFT creation failed with unknown error");
    }
}

/**
 * Handler for the CREATE_NFT action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract NFT creation parameters from message
        const context = composeContext({
            state,
            template: createNftTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isCreateNftContent(content)) {
            callback?.({
                text: "Please provide collection name and NFT name to create an NFT.",
                content: { action: "CREATE_NFT", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Set default values for optional parameters
        const collectionDescription = content.collectionDescription || `Collection of ${content.collectionName}`;
        const collectionUri = content.collectionUri || "https://aptos.dev";
        const nftDescription = content.nftDescription || `${content.nftName} from ${content.collectionName}`;
        const nftUri = content.nftUri || "https://aptos.dev/asset";

        // Send a confirmation message first
        callback?.({
            text: `Creating NFT "${content.nftName}" in collection "${content.collectionName}"...`,
            content: { action: "CREATE_NFT", status: "pending" }
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

        // Create the NFT
        const result = await createNft(
            aptosClient,
            account,
            content.collectionName,
            collectionDescription,
            collectionUri,
            content.nftName,
            nftDescription,
            nftUri,
            content.recipient
        );

        // Format the response
        const response = [
            "# NFT Created Successfully",
            "",
            `**Collection**: ${content.collectionName}`,
            `**NFT**: ${content.nftName}`,
            "",
            "## Transaction Details",
            `**Collection Creation**: \`${result.collectionTxHash}\``,
            `**NFT Minting**: \`${result.mintTxHash}\``,
        ];

        if (result.transferTxHash) {
            response.push(`**NFT Transfer**: \`${result.transferTxHash}\``);
            response.push(`**Recipient**: \`${content.recipient}\``);
        }

        response.push("");
        response.push("You can view these transactions on the Aptos Explorer:");
        response.push("https://explorer.aptoslabs.com/");

        callback?.({
            text: response.join("\n"),
            content: {
                action: "CREATE_NFT",
                status: "complete",
                nft: {
                    collectionName: content.collectionName,
                    nftName: content.nftName,
                    digitalAssetAddress: result.digitalAssetAddress,
                    collectionTxHash: result.collectionTxHash,
                    mintTxHash: result.mintTxHash,
                    transferTxHash: result.transferTxHash,
                    recipient: content.recipient
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in CREATE_NFT handler:", error);
        callback?.({
            text: `Failed to create NFT: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "CREATE_NFT", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for creating NFTs
 */
const createNftAction: Action = {
    name: "CREATE_NFT",
    description: "Create an NFT collection and mint an NFT on the Aptos blockchain",
    similes: [
        "MINT_NFT",
        "CREATE_DIGITAL_ASSET",
        "MINT_DIGITAL_ASSET"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Create an NFT called 'My First NFT' in collection 'My Collection'"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Mint a digital asset named 'Awesome Art' with description 'My awesome digital artwork'"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Create an NFT called 'Gift NFT' and send it to 0x123456789abcdef"
            }
        }
    ]],
    handler,
    suppressInitialMessage: true,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";

        // Check for NFT creation keywords
        const hasCreateVerb =
            messageText.includes("create") ||
            messageText.includes("mint") ||
            messageText.includes("make");

        const hasNftIndicator =
            messageText.includes("nft") ||
            messageText.includes("digital asset") ||
            messageText.includes("token") && messageText.includes("collection");

        return hasCreateVerb && hasNftIndicator;
    }
};

export default createNftAction;
