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
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../enviroment";

export interface BurnNftContent extends Content {
    nftAddress: string;
}

function isBurnNftContent(content: unknown): content is BurnNftContent {
    elizaLogger.info("Content for NFT burning", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.nftAddress === "string";
}

const burnNftTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "nftAddress": "0x1::aptos_token::TokenId"
}
\`\`\`

{{recentMessages}}
`;

/**
 * Burns an NFT on the Aptos blockchain
 */
async function burnNft(
    aptosClient: Aptos,
    account: Account,
    nftAddress: string
): Promise<string> {
    try {
        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: "0x67c8564aee3799e9ac669553fdef3a3828d4626f24786b6a5642152fa09469dd::launchpad::burn_nft",
                functionArguments: [nftAddress],
            },
        });

        const committedTransaction = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction,
        });

        const signedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransaction.hash,
        });

        if (!signedTransaction.success) {
            elizaLogger.error("NFT burn failed", signedTransaction);
            throw new Error("NFT burn failed");
        }

        return signedTransaction.hash;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`NFT burn failed: ${error.message}`);
        }
        throw new Error("NFT burn failed with unknown error");
    }
}

/**
 * Handler for the BURN_NFT action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract NFT burning parameters from message
        const context = composeContext({
            state,
            template: burnNftTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isBurnNftContent(content)) {
            callback?.({
                text: "Please provide an NFT address to burn.",
                content: { action: "BURN_NFT", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Burning NFT ${content.nftAddress}...`,
            content: { action: "BURN_NFT", status: "pending" }
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

        // Burn the NFT
        const transactionHash = await burnNft(
            aptosClient,
            account,
            content.nftAddress
        );

        // Format the response
        const response = [
            "# NFT Burned Successfully",
            "",
            `**NFT Address**: \`${content.nftAddress}\``,
            `**Transaction Hash**: \`${transactionHash}\``,
            "",
            "The NFT has been permanently removed from circulation."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "BURN_NFT",
                status: "complete",
                burn: {
                    nftAddress: content.nftAddress,
                    transactionHash
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in BURN_NFT handler:", error);
        callback?.({
            text: `Failed to burn NFT: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "BURN_NFT", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for burning NFTs
 */
const burnNftAction: Action = {
    name: "BURN_NFT",
    description: "Burn an NFT on the Aptos blockchain",
    similes: [
        "NFT_BURN",
        "DESTROY_NFT",
        "REMOVE_NFT"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Burn my NFT 0x1::aptos_token::TokenId"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Destroy NFT 0x1::aptos_token::TokenId"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Remove my NFT at 0x1::aptos_token::TokenId"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("burn") ||
                messageText.includes("destroy") ||
                messageText.includes("remove")) &&
               messageText.includes("nft");
    },
    suppressInitialMessage: true
};

export default burnNftAction;
