/**
 * Action for placing market orders on Merkle Trade
 */
const merklePlaceMarketOrderAction: Action = {
    name: "MERKLE_PLACE_MARKET_ORDER",
    description: "Place a market order on Merkle Trade",
    similes: [
        "PLACE_MARKET_ORDER_MERKLE",
        "MERKLE_MARKET_ORDER",
        "CREATE_MARKET_ORDER_MERKLE",
        "MAKE_MARKET_ORDER_MERKLE"
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Place a market order to buy BTC on Merkle Trade with 10 USDC collateral"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Create a short market order for ETH with 5x leverage on Merkle Trade"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Execute a long market order for BTC_USD with 20 USDC size and 10 USDC collateral on Merkle"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return messageText.includes("market order") &&
               (messageText.includes("merkle") || messageText.includes("merkle trade"));
    },
    suppressInitialMessage: true
};

export default merklePlaceMarketOrderAction;
