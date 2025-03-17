import { CHAIN_TO_DEFILLAMA_SLUG, PROTOCOL_TO_DEFILLAMA_SLUG } from '../config/mappings';
import { elizaLogger } from '@elizaos/core';

/**
 * Extract chain name from message
 */
export function extractChainName(message: string): string | null {
  try {
    const lowerMessage = message.toLowerCase();

    // Special case for Amnis Finance - it's only on Aptos
    if (lowerMessage.includes('amnis') || lowerMessage.includes('amnis finance')) {
      elizaLogger.debug('Found Amnis Finance, defaulting to Aptos chain');
      return 'Aptos';
    }

    // Special case for Joule Finance - it's primarily on Aptos
    if (lowerMessage.includes('joule') || lowerMessage.includes('joule finance')) {
      elizaLogger.debug('Found Joule Finance, defaulting to Aptos chain');
      return 'Aptos';
    }

    // Special case for Aptos since this is the Aptos plugin
    if (lowerMessage.includes('aptos') || lowerMessage.includes(' apt ') ||
        lowerMessage.includes('apt?') || lowerMessage.includes('apt.') ||
        lowerMessage.endsWith('apt')) {
      elizaLogger.debug('Found Aptos chain match (special case)');
      return 'Aptos';
    }

    // Try exact matches first
    for (const [key, value] of Object.entries(CHAIN_TO_DEFILLAMA_SLUG)) {
      if (lowerMessage.includes(key.toLowerCase())) {
        elizaLogger.debug('Found exact chain match:', { key, value });
        return value;
      }
    }

    // Try fuzzy matching for chain names
    const chainPattern = /(?:on|for|in|of|at|by)\s+([a-z0-9\s]+)(?:\s+chain|\s+network)?/i;
    const chainMatch = message.match(chainPattern);

    if (chainMatch) {
      const potentialChain = chainMatch[1].toLowerCase().trim();

      // Check if the potential chain exists in our mapping
      for (const [key, value] of Object.entries(CHAIN_TO_DEFILLAMA_SLUG)) {
        if (potentialChain.includes(key.toLowerCase())) {
          elizaLogger.debug('Found fuzzy chain match:', { key, value });
          return value;
        }
      }
    }

    // For Aptos-specific protocols, default to Aptos
    const aptosProtocols = [
      'thala', 'amnis', 'abel', 'argo', 'econia', 'hippo', 'tortuga',
      'ditto', 'aptin', 'merkle', 'pontem', 'tsunami', 'aptoslaunch',
      'bluemove', 'pancake aptos', 'liquidswap', 'cetus', 'aptoswap',
      'ferum', 'kana', 'joule', 'meso', 'cellana', 'echelon', 'truestake',
      'aries', 'echo'
    ];

    for (const protocol of aptosProtocols) {
      if (lowerMessage.includes(protocol)) {
        elizaLogger.debug(`Found Aptos-specific protocol (${protocol}), defaulting to Aptos chain`);
        return 'Aptos';
      }
    }

    // Default to Aptos for all TVL queries in this plugin
    elizaLogger.debug('No specific chain found, defaulting to Aptos for this plugin');
    return 'Aptos';
  } catch (error) {
    elizaLogger.error('Error extracting chain name:', { message, error });
    return 'Aptos'; // Default to Aptos even on error
  }
}

/**
 * Extract protocol name from message
 */
export function extractProtocolName(message: string): string | null {
  try {
    const lowerMessage = message.toLowerCase();

    // Try exact matches first
    for (const [key, value] of Object.entries(PROTOCOL_TO_DEFILLAMA_SLUG)) {
      if (lowerMessage.includes(key.toLowerCase())) {
        elizaLogger.debug('Found exact protocol match:', { key, value });
        return value;
      }
    }

    // Try fuzzy matching for protocol names
    const protocolPattern = /(?:of|for|in|at)\s+([a-z0-9\s]+?)(?:\s+protocol|\s+defi|\s+dex|\s+exchange)?/i;
    const protocolMatch = message.match(protocolPattern);

    if (protocolMatch) {
      const potentialProtocol = protocolMatch[1].toLowerCase().trim();

      // Check if the potential protocol exists in our mapping
      for (const [key, value] of Object.entries(PROTOCOL_TO_DEFILLAMA_SLUG)) {
        if (potentialProtocol.includes(key.toLowerCase())) {
          elizaLogger.debug('Found fuzzy protocol match:', { key, value });
          return value;
        }
      }
    }

    elizaLogger.debug('No protocol name found in message:', { message });
    return null;
  } catch (error) {
    elizaLogger.error('Error extracting protocol name:', { message, error });
    return null;
  }
}

/**
 * Extract timestamp from message
 */
export function extractTimestamp(message: string): number | null {
  try {
    const lowerMessage = message.toLowerCase();
    const now = Date.now();

    // Match time periods
    const dayMatch = lowerMessage.match(/(\d+)\s*days?\s+ago/);
    if (dayMatch) {
      const days = Number.parseInt(dayMatch[1], 10);
      return now - (days * 24 * 60 * 60 * 1000);
    }

    const weekMatch = lowerMessage.match(/(\d+)\s*weeks?\s+ago/);
    if (weekMatch) {
      const weeks = Number.parseInt(weekMatch[1], 10);
      return now - (weeks * 7 * 24 * 60 * 60 * 1000);
    }

    const monthMatch = lowerMessage.match(/(\d+)\s*months?\s+ago/);
    if (monthMatch) {
      const months = Number.parseInt(monthMatch[1], 10);
      return now - (months * 30 * 24 * 60 * 60 * 1000);
    }

    // Match relative time periods
    if (lowerMessage.includes('last week') || lowerMessage.includes('previous week')) {
      return now - (7 * 24 * 60 * 60 * 1000);
    }

    if (lowerMessage.includes('last month') || lowerMessage.includes('previous month')) {
      return now - (30 * 24 * 60 * 60 * 1000);
    }

    if (lowerMessage.includes('yesterday')) {
      return now - (24 * 60 * 60 * 1000);
    }

    elizaLogger.debug('No timestamp found in message:', { message });
    return null;
  } catch (error) {
    elizaLogger.error('Error extracting timestamp:', { message, error });
    return null;
  }
}

/**
 * Extract multiple chain names from message text
 */
export function extractMultipleChainNames(messageText: string): string[] {
  const chains = new Set<string>();
  const text = messageText.toLowerCase();

  // Split by common separators and 'and'
  const parts = text
    .replace(/\s+and\s+/g, ', ')
    .split(/[,\s]+/);

  for (const part of parts) {
    const cleanPart = part.replace(/['"]/g, '').toLowerCase();
    if (CHAIN_TO_DEFILLAMA_SLUG[cleanPart]) {
      chains.add(CHAIN_TO_DEFILLAMA_SLUG[cleanPart]);
      elizaLogger.debug(`Found chain in multiple extraction: ${cleanPart} -> ${CHAIN_TO_DEFILLAMA_SLUG[cleanPart]}`);
    }
  }

  return Array.from(chains);
}

/**
 * Extract multiple protocol names from message text
 */
export function extractMultipleProtocolNames(messageText: string): string[] {
  const protocols = new Set<string>();
  const text = messageText.toLowerCase();

  elizaLogger.info(`Extracting protocols from: "${text}"`);

  // First try to match multi-word protocol names
  for (const [key, value] of Object.entries(PROTOCOL_TO_DEFILLAMA_SLUG)) {
    if (key.includes(' ') && text.includes(key.toLowerCase())) {
      protocols.add(value);
      elizaLogger.info(`Found multi-word protocol: ${key} -> ${value}`);
    }
  }

  // Handle common protocol name formats
  const cleanText = text
    .replace(/\s+and\s+/g, ', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+of\s+/g, ' of ')
    .replace(/\s+for\s+/g, ' for ')
    .replace(/what'?s\s+the\s+tvl\s+of\s+/g, '')
    .replace(/show\s+(?:me\s+)?(?:the\s+)?tvl\s+(?:of|for)\s+/g, '')
    .replace(/compare\s+(?:the\s+)?tvl\s+(?:of|for)\s+/g, '');

  // Detailed logging commented out to reduce log volume
  // elizaLogger.info(`Cleaned text: "${cleanText}"`);

  // Split by common separators
  const parts = cleanText.split(/[,\s]+/);
  // elizaLogger.info(`Split parts: ${parts.join(', ')}`);

  // Then try to match single-word protocol names
  for (const part of parts) {
    const cleanPart = part.replace(/['"]/g, '').toLowerCase();
    if (PROTOCOL_TO_DEFILLAMA_SLUG[cleanPart]) {
      protocols.add(PROTOCOL_TO_DEFILLAMA_SLUG[cleanPart]);
      elizaLogger.info(`Found protocol in multiple extraction: ${cleanPart} -> ${PROTOCOL_TO_DEFILLAMA_SLUG[cleanPart]}`);
    }
  }

  // If no protocols found, try more aggressive pattern matching
  if (protocols.size === 0) {
    // Look for protocols mentioned in various contexts
    const protocolPatterns = [
      /(?:of|for|in|at|compare)\s+([a-z0-9\s]+?)(?:\s+protocol|\s+defi|\s+dex|\s+exchange)?/gi,
      /(?:what's|whats|show|display|get|fetch)\s+([a-z0-9\s]+?)(?:'s|\s+protocol|\s+defi|\s+dex)?\s+tvl/gi,
      /tvl\s+(?:of|for)\s+([a-z0-9\s]+?)(?:\s+protocol|\s+defi|\s+dex|\s+exchange)?/gi,
      /([a-z0-9\s]+?)(?:'s|\s+protocol|\s+defi|\s+dex)?\s+tvl/gi
    ];

    for (const pattern of protocolPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const potentialProtocol = match[1].toLowerCase().trim();
        // elizaLogger.info(`Found potential protocol via pattern: ${potentialProtocol}`);

        // Check if the potential protocol exists in our mapping
        for (const [key, value] of Object.entries(PROTOCOL_TO_DEFILLAMA_SLUG)) {
          if (potentialProtocol.includes(key.toLowerCase())) {
            protocols.add(value);
            elizaLogger.info(`Found protocol via pattern: ${key} -> ${value}`);
            break;
          }
        }
      }
    }
  }

  // If still no protocols found, check for direct mentions of protocol names
  if (protocols.size === 0) {
    for (const [key, value] of Object.entries(PROTOCOL_TO_DEFILLAMA_SLUG)) {
      if (text.includes(key.toLowerCase())) {
        protocols.add(value);
        elizaLogger.info(`Found protocol via direct mention: ${key} -> ${value}`);
      }
    }
  }

  // Special case handling for common protocols that might be missed
  const commonProtocols = ['uniswap', 'aave', 'curve', 'compound', 'sushi'];
  for (const proto of commonProtocols) {
    if (text.includes(proto) && PROTOCOL_TO_DEFILLAMA_SLUG[proto]) {
      protocols.add(PROTOCOL_TO_DEFILLAMA_SLUG[proto]);
      elizaLogger.info(`Added common protocol: ${proto} -> ${PROTOCOL_TO_DEFILLAMA_SLUG[proto]}`);
    }
  }

  elizaLogger.info(`Extracted protocols: ${Array.from(protocols).join(', ')}`);
  return Array.from(protocols);
}

/**
 * Extract limit from message
 */
export function extractLimit(message: string): number | null {
  try {
    const lowerMessage = message.toLowerCase();

    // Try to match "top N" or "N protocols" patterns
    const limitPatterns = [
      /top\s+(\d+)/i,
      /(\d+)\s+(?:protocols|chains|dexes|exchanges)/i,
      /show\s+(?:me\s+)?(?:the\s+)?(\d+)/i,
      /list\s+(?:the\s+)?(\d+)/i
    ];

    for (const pattern of limitPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        const limit = Number.parseInt(match[1], 10);
        if (!Number.isNaN(limit) && limit > 0) {
          return Math.min(limit, 100); // Cap at 100 to prevent excessive results
        }
      }
    }

    // Default to 5 if no limit specified
    return 5;
  } catch (error) {
    elizaLogger.error('Error extracting limit:', { message, error });
    return 5; // Default to 5 on error
  }
}
