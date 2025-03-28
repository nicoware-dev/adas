import type { Action, Handler } from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";
import { getAllProtocols } from "../../api/client";
import { extractChainName, extractProtocolName } from "../../utils/extract";
import { formatCurrency } from "../../utils/format";
import { CHAIN_TO_DEFILLAMA_SLUG, PROTOCOL_TO_DEFILLAMA_SLUG } from "../../config/mappings";

interface ChainTVLData {
  chain: string;
  tvl: number;
}

const handler: Handler = async (runtime, message, state, _options, callback) => {
  try {
    // Extract protocol and chain names from message
    const messageText = message.content?.text || "";
    elizaLogger.info(`Processing message for protocol TVL by chain: "${messageText}"`);

    // Send a confirmation message first
    callback?.({
      text: "Let me check the protocol TVL data for you...",
      content: { action: "GET_PROTOCOL_TVL_BY_CHAIN", status: "pending" }
    });

    const protocol = extractProtocolName(messageText);
    const chainSlug = extractChainName(messageText);

    elizaLogger.info(`Extracted protocol: ${protocol || 'none'}, chain: ${chainSlug || 'none'}`);

    if (!protocol || !chainSlug) {
      const supportedChains = Object.keys(CHAIN_TO_DEFILLAMA_SLUG)
        .filter(key => key.length > 2)
        .sort()
        .join(", ");

      callback?.({
        text: `Please specify both a protocol and chain name. For example:
'What's Uniswap's TVL on Arbitrum?' or 'Show me Aave's TVL on Optimism'

Supported chains include: ${supportedChains}`,
        content: { action: "GET_PROTOCOL_TVL_BY_CHAIN", status: "error", error: "Missing parameters" }
      });
      return false;
    }

    // Get the DefiLlama slug for the protocol if it exists in our mappings
    const protocolSlug = PROTOCOL_TO_DEFILLAMA_SLUG[protocol.toLowerCase()] || protocol.toLowerCase();
    elizaLogger.info(`Using protocol slug: ${protocolSlug}`);

    // Get the chain name as it appears in the DefiLlama API
    const chainName = CHAIN_TO_DEFILLAMA_SLUG[chainSlug.toLowerCase()];
    if (!chainName) {
      elizaLogger.info(`Chain not recognized: ${chainSlug}`);
      callback?.({
        text: `Chain '${chainSlug}' not recognized. Please use a supported chain name.`,
        content: { action: "GET_PROTOCOL_TVL_BY_CHAIN", status: "error", error: "Invalid chain" }
      });
      return false;
    }
    elizaLogger.info(`Using chain name: ${chainName}`);

    // Fetch all protocols data
    const result = await getAllProtocols();
    if (!result.success) {
      elizaLogger.error(`Failed to get protocol data: ${result.error?.message}`);
      callback?.({
        text: `Failed to get protocol data: ${result.error?.message || 'Unknown error'}`,
        content: { action: "GET_PROTOCOL_TVL_BY_CHAIN", status: "error", error: result.error }
      });
      return false;
    }

    // Log basic info about the protocols
    if (Array.isArray(result.result)) {
      elizaLogger.info(`Total protocols from API: ${result.result.length}`);
    } else {
      elizaLogger.error('Invalid protocol data format received');
      callback?.({
        text: "Invalid data format received from DeFiLlama API. Please try again later.",
        content: { action: "GET_PROTOCOL_TVL_BY_CHAIN", status: "error", error: "Invalid data format" }
      });
      return false;
    }

    // Find the protocol
    let protocolData = result.result.find((p) =>
      (p.slug && p.slug.toLowerCase() === protocolSlug.toLowerCase()) ||
      (p.name && p.name.toLowerCase() === protocolSlug.toLowerCase()) ||
      (p.name && p.name.toLowerCase() === protocol.toLowerCase())
    );

    if (!protocolData) {
      elizaLogger.info(`Protocol not found: ${protocol} (slug: ${protocolSlug})`);

      // Try a more flexible search as a fallback
      const fuzzyMatch = result.result.find((p) => {
        const slugMatch = p.slug ? p.slug.toLowerCase().includes(protocolSlug.toLowerCase()) : false;
        const nameMatch = p.name ? p.name.toLowerCase().includes(protocol.toLowerCase()) : false;
        return slugMatch || nameMatch;
      });

      if (fuzzyMatch) {
        elizaLogger.info(`Found fuzzy match: ${fuzzyMatch.name}`);
        protocolData = fuzzyMatch;
      } else {
        // Special case handling for common protocols
        if (protocol.toLowerCase() === 'uniswap') {
          const uniswapMatch = result.result.find((p) => {
            const nameMatch = p.name ? p.name.toLowerCase().includes('uni') : false;
            const slugMatch = p.slug ? p.slug.toLowerCase().includes('uni') : false;
            return nameMatch || slugMatch;
          });
          if (uniswapMatch) {
            elizaLogger.info(`Found special case match for Uniswap: ${uniswapMatch.name}`);
            protocolData = uniswapMatch;
          } else {
            callback?.({
              text: `Protocol 'Uniswap' not found. Please check the protocol name and try again.`,
              content: { action: "GET_PROTOCOL_TVL_BY_CHAIN", status: "error", error: "Protocol not found" }
            });
            return false;
          }
        } else if (protocol.toLowerCase() === 'aave') {
          const aaveMatch = result.result.find((p) => {
            const nameMatch = p.name ? p.name.toLowerCase().includes('aave') : false;
            const slugMatch = p.slug ? p.slug.toLowerCase().includes('aave') : false;
            return nameMatch || slugMatch;
          });
          if (aaveMatch) {
            elizaLogger.info(`Found special case match for Aave: ${aaveMatch.name}`);
            protocolData = aaveMatch;
          } else {
            callback?.({
              text: `Protocol 'Aave' not found. Please check the protocol name and try again.`,
              content: { action: "GET_PROTOCOL_TVL_BY_CHAIN", status: "error", error: "Protocol not found" }
            });
            return false;
          }
        } else {
          callback?.({
            text: `Protocol '${protocol}' not found. Please check the protocol name and try again.`,
            content: { action: "GET_PROTOCOL_TVL_BY_CHAIN", status: "error", error: "Protocol not found" }
          });
          return false;
        }
      }
    }
    elizaLogger.info(`Found protocol: ${protocolData.name} with slug: ${protocolData.slug || 'unknown'}`);

    // Check if protocol is deployed on the chain
    const chainTvls = protocolData.chainTvls || {};

    // Try different ways to match the chain name
    let chainTVL: number | undefined;
    let matchedChainName: string | undefined;

    // Handle different formats of chainTvls
    if (Array.isArray(chainTvls)) {
      // If chainTvls is an array of objects

      // 1. Try exact match
      const exactMatch = chainTvls.find(c => c.chain === chainName);
      if (exactMatch) {
        chainTVL = exactMatch.tvl;
        matchedChainName = exactMatch.chain;
        elizaLogger.info(`Found chain TVL using exact match in array: ${matchedChainName}`);
      }

      // 2. Try case-insensitive match
      if (chainTVL === undefined) {
        const caseMatch = chainTvls.find(c => c.chain.toLowerCase() === chainName.toLowerCase());
        if (caseMatch) {
          chainTVL = caseMatch.tvl;
          matchedChainName = caseMatch.chain;
          elizaLogger.info(`Found chain TVL using case-insensitive match in array: ${matchedChainName}`);
        }
      }

      // 3. Try partial match
      if (chainTVL === undefined) {
        const partialMatch = chainTvls.find(c =>
          c.chain.toLowerCase().includes(chainName.toLowerCase()) ||
          chainName.toLowerCase().includes(c.chain.toLowerCase())
        );
        if (partialMatch) {
          chainTVL = partialMatch.tvl;
          matchedChainName = partialMatch.chain;
          elizaLogger.info(`Found chain TVL using partial match in array: ${matchedChainName}`);
        }
      }
    } else if (typeof chainTvls === 'object' && chainTvls !== null) {
      // If chainTvls is a Record<string, number>

      // Filter out non-chain entries like 'borrowed', 'staking', etc.
      const validChainKeys = Object.keys(chainTvls).filter(key =>
        !['borrowed', 'staking', 'pool2', 'offers', 'treasury', 'vesting'].includes(key.toLowerCase())
      );

      // 1. Try exact match
      if (validChainKeys.includes(chainName)) {
        chainTVL = chainTvls[chainName] as number;
        matchedChainName = chainName;
        elizaLogger.info(`Found chain TVL using exact match: ${chainName}`);
      }

      // 2. Try case-insensitive match
      if (chainTVL === undefined) {
        const chainKey = validChainKeys.find(
          key => key.toLowerCase() === chainName.toLowerCase()
        );
        if (chainKey) {
          chainTVL = chainTvls[chainKey] as number;
          matchedChainName = chainKey;
          elizaLogger.info(`Found chain TVL using case-insensitive match: ${chainKey}`);
        }
      }

      // 3. Try partial match
      if (chainTVL === undefined) {
        const chainKey = validChainKeys.find(
          key => key.toLowerCase().includes(chainName.toLowerCase()) ||
                 chainName.toLowerCase().includes(key.toLowerCase())
        );
        if (chainKey) {
          chainTVL = chainTvls[chainKey] as number;
          matchedChainName = chainKey;
          elizaLogger.info(`Found chain TVL using partial match: ${chainKey}`);
        }
      }
    }

    if (chainTVL === undefined || chainTVL === 0) {
      elizaLogger.info(`Protocol ${protocolData.name} has no TVL on ${chainName}`);

      // Get available chains with TVL
      let availableChains = "";
      if (Array.isArray(chainTvls)) {
        availableChains = chainTvls
          .filter(c => c.tvl > 0)
          .map(c => c.chain)
          .sort()
          .join(", ");
      } else if (typeof chainTvls === 'object' && chainTvls !== null) {
        availableChains = Object.entries(chainTvls)
          .filter(([key, tvl]) => {
            // Filter out non-chain entries and ensure TVL is positive
            const isNonChainKey = ['borrowed', 'staking', 'pool2', 'offers', 'treasury', 'vesting'].includes(key.toLowerCase());
            return !isNonChainKey && typeof tvl === 'number' && tvl > 0;
          })
          .map(([chain]) => chain)
          .sort()
          .join(", ");
      }

      // Check if the protocol has TVL on Aptos specifically
      const hasAptosChain = availableChains.toLowerCase().includes('aptos');

      let responseText = `${protocolData.name} is not deployed or has no TVL on ${chainName}.`;

      // If the protocol has TVL on Aptos but user asked for a different chain
      if (hasAptosChain && chainName.toLowerCase() !== 'aptos') {
        responseText += "\n\n" + protocolData.name + " is available on Aptos. Would you like to see its TVL on Aptos instead?";
      } else if (availableChains) {
        responseText += "\n\nAvailable chains: " + availableChains;
      } else {
        responseText += "\n\nThis protocol doesn't appear to have active TVL on any chain in DeFiLlama's database.";
      }

      // If this is Joule Finance and it's not found, add a special note
      if (protocolData.name.toLowerCase().includes('joule') && !hasAptosChain) {
        responseText += "\n\nNote: Joule Finance is a newer protocol on Aptos and may not have complete data in DeFiLlama yet. You can check their official website for the most up-to-date information.";
      }
    // If this is Thala and it's not found, add a special note
        if (protocolData.name.toLowerCase().includes('thala') && !hasAptosChain) {
            responseText += "\n\nNote: Thala is a newer protocol on Aptos and may not have complete data in DeFiLlama yet. You can check their official website for the most up-to-date information.";
            }

      callback?.({
        text: responseText,
        content: {
          action: "GET_PROTOCOL_TVL_BY_CHAIN",
          status: "error",
          error: "No TVL on chain",
          protocol: protocolData.name,
          chain: chainName,
          availableChains: availableChains.split(", ").filter(c => c)
        }
      });
      return false;
    }
    elizaLogger.info(`Found TVL for ${protocolData.name} on ${matchedChainName || chainName}: ${chainTVL}`);

    // Format response
    const formattedTVL = formatCurrency(chainTVL);
    let response = `${protocolData.name} Protocol TVL on ${matchedChainName || chainName}: ${formattedTVL}`;

    // Calculate percentage of total TVL
    const totalTVL = protocolData.tvl || 0;
    if (totalTVL > 0) {
      const percentage = (chainTVL / totalTVL * 100).toFixed(2);
      response += ` (${percentage}% of total TVL)`;
    }

    // Add chain-specific metrics if available
    const chainMetrics = protocolData.chainMetrics?.[matchedChainName || chainName];
    if (chainMetrics) {
      if (chainMetrics.change_1d !== undefined) {
        response += `\n24h Change: ${chainMetrics.change_1d > 0 ? '+' : ''}${chainMetrics.change_1d.toFixed(2)}%`;
      }
      if (chainMetrics.change_7d !== undefined) {
        response += `\n7d Change: ${chainMetrics.change_7d > 0 ? '+' : ''}${chainMetrics.change_7d.toFixed(2)}%`;
      }
    }

    // Add total TVL for context
    response += `\n\nTotal Protocol TVL (all chains): ${formatCurrency(totalTVL)}`;

    callback?.({
      text: response,
      content: {
        action: "GET_PROTOCOL_TVL_BY_CHAIN",
        status: "complete",
        protocol: protocolData.name,
        chain: matchedChainName || chainName,
        tvl: chainTVL,
        formattedTVL,
        totalTVL,
        formattedTotalTVL: formatCurrency(totalTVL),
        percentage: totalTVL > 0 ? (chainTVL / totalTVL * 100) : 0,
        chainMetrics
      }
    });

    return true;
  } catch (error) {
    elizaLogger.error('Error in GET_PROTOCOL_TVL_BY_CHAIN handler:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    callback?.({
      text: `Sorry, I encountered an error while fetching the protocol TVL data: ${errorMessage}. Please try again in a moment.`,
      content: {
        action: "GET_PROTOCOL_TVL_BY_CHAIN",
        status: "error",
        error: errorMessage
      }
    });
    return false;
  }
};

export const protocolTVLByChainAction: Action = {
  name: "GET_PROTOCOL_TVL_BY_CHAIN",
  description: "Get the TVL of a specific protocol on a specific chain only",
  similes: [
    // Chain-specific patterns
    'PROTOCOL_TVL_ON_SPECIFIC_CHAIN',
    'CHAIN_SPECIFIC_PROTOCOL_TVL',
    'PROTOCOL_TVL_FOR_SPECIFIC_CHAIN',
    'SPECIFIC_CHAIN_PROTOCOL_TVL',
    // Direct matches
    'SHOW_ME_PROTOCOL_TVL_ON_CHAIN',
    'WHATS_PROTOCOL_TVL_ON_CHAIN',
    'GET_PROTOCOL_TVL_ON_CHAIN',
    'PROTOCOL_TVL_ON_CHAIN',
    'TVL_ON_CHAIN_FOR_PROTOCOL',
    'PROTOCOL_TVL_BY_CHAIN',
    'PROTOCOL_CHAIN_SPECIFIC_TVL',
    // Protocol-first patterns
    'PROTOCOL_TVL_CHAIN',
    'PROTOCOL_ON_CHAIN',
    'PROTOCOL_CHAIN_TVL',
    'PROTOCOL_CHAIN_SPECIFIC',
    'PROTOCOL_TVL_FOR_CHAIN',
    // Chain-first patterns
    'CHAIN_PROTOCOL_TVL',
    'CHAIN_SPECIFIC_TVL',
    'CHAIN_VALUE_PROTOCOL',
    'CHAIN_TVL_FOR_PROTOCOL',
    // Question patterns
    'HOW_MUCH_TVL_PROTOCOL_ON_CHAIN',
    'WHAT_IS_PROTOCOL_TVL_ON_CHAIN',
    'HOW_MUCH_TVL_DOES_PROTOCOL_HAVE_ON_CHAIN',
    'WHAT_PERCENTAGE_OF_PROTOCOL_TVL_IS_ON_CHAIN',
    // Common variations
    'TVL_BY_CHAIN',
    'TVL_ON_CHAIN',
    'CHAIN_SPECIFIC_PROTOCOL',
    // Specific examples
    'UNISWAP_TVL_ON_ARBITRUM',
    'AAVE_TVL_ON_OPTIMISM',
    'CURVE_TVL_ON_ETHEREUM',
    'GMX_TVL_ON_ARBITRUM'
  ],
  handler,
  suppressInitialMessage: true,
  validate: async () => true,
  examples: [[
    {
      user: 'user1',
      content: { text: "What's Uniswap's TVL on Arbitrum?" }
    },
    {
      user: 'assistant',
      content: { text: 'Uniswap Protocol TVL on Arbitrum: $820.5M (15.2% of total TVL)\n24h Change: +1.2%\n7d Change: +3.5%\n\nTotal Protocol TVL (all chains): $5.4B' }
    }
  ], [
    {
      user: 'user1',
      content: { text: "Show me Aave's TVL on Optimism" }
    },
    {
      user: 'assistant',
      content: { text: 'Aave Protocol TVL on Optimism: $480M (3.9% of total TVL)\n24h Change: +0.8%\n7d Change: +2.1%\n\nTotal Protocol TVL (all chains): $12.3B' }
    }
  ]]
};
