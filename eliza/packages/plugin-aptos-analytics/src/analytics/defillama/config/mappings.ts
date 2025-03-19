// Map of chain names to DefiLlama slugs
export const CHAIN_TO_DEFILLAMA_SLUG: Record<string, string> = {
  // Major chains
  'aptos': 'Aptos',
  'apt': 'Aptos',
  'ethereum': 'Ethereum',
  'eth': 'Ethereum',
  'polygon': 'Polygon',
  'matic': 'Polygon',
  'arbitrum': 'Arbitrum',
  'arb': 'Arbitrum',
  'arbitrum one': 'Arbitrum',
  'optimism': 'OP Mainnet',
  'op': 'OP Mainnet',
  'base': 'Base',
  'bsc': 'BSC',
  'binance': 'BSC',
  'bnb': 'BSC',
  'binance smart chain': 'BSC',
  'avalanche': 'Avalanche',
  'avax': 'Avalanche',
  'solana': 'Solana',
  'sol': 'Solana',
  'fantom': 'Fantom',
  'ftm': 'Fantom',

} as const;

// Map of protocol names to DefiLlama slugs
export const PROTOCOL_TO_DEFILLAMA_SLUG: Record<string, string> = {
  // Aptos Protocols
  'thala': 'thala',
  'thala protocol': 'thala',
  'thala labs': 'thala',

  'amnis': 'amnis-finance',
  'amnis finance': 'amnis-finance',

  'abel': 'abel-finance',
  'abel finance': 'abel-finance',

  'argo': 'argo-finance',
  'argo finance': 'argo-finance',

  'econia': 'econia',

  'hippo': 'hippo-labs',
  'hippo labs': 'hippo-labs',

  'tortuga': 'tortuga-finance',
  'tortuga finance': 'tortuga-finance',

  'ditto': 'ditto-staked-aptos',
  'ditto finance': 'ditto-staked-aptos',
  'ditto staked aptos': 'ditto-staked-aptos',

  'aptin': 'aptin-labs',
  'aptin labs': 'aptin-labs',

  'merkle': 'merkle-trade',
  'merkle trade': 'merkle-trade',

  'pontem': 'pontem-network',
  'pontem network': 'pontem-network',

  'tsunami': 'tsunami-finance',
  'tsunami finance': 'tsunami-finance',

  'aptoslaunch': 'aptoslaunch',

  'bluemove': 'bluemove',

  'pancake aptos': 'pancakeswap-aptos',
  'pancakeswap aptos': 'pancakeswap-aptos',
  'pancake on aptos': 'pancakeswap-aptos',
  'pancakeswap on aptos': 'pancakeswap-aptos',

  'liquidswap': 'liquidswap',

  'cetus': 'cetus-protocol',
  'cetus protocol': 'cetus-protocol',

  'aptoswap': 'aptoswap',

  'ferum': 'ferum',

  'kana': 'kana-labs',
  'kana labs': 'kana-labs',

  'joule': 'joule-finance',
  'joule finance': 'joule-finance',
  'joules': 'joule-finance',
  'joule protocol': 'joule-finance',

  'meso': 'meso-finance',
  'meso finance': 'meso-finance',

  'cellana': 'cellana-finance',
  'cellana finance': 'cellana-finance',

  'echelon': 'echelon-market',
  'echelon market': 'echelon-market',

  'truestake': 'truestake',

  'aries': 'aries-markets',
  'aries markets': 'aries-markets',

  'echo': 'echo-protocol',
  'echo protocol': 'echo-protocol',
  'echo lending': 'echo-protocol',

  // Major DEXes
  'uniswap': 'uniswap',
  'sushiswap': 'sushi',
  'sushi': 'sushi',
  'pancakeswap': 'pancakeswap',
  'cake': 'pancakeswap',
  'curve': 'curve',

  // Major Protocols
  'aave': 'aave',
  'compound': 'compound',
  'beefy': 'beefy',
  'eigenlayer': 'eigenlayer',
  'lido': 'lido',
  'pendle': 'pendle',
  'stargate': 'stargate',
  'across': 'across',
  'spark': 'spark',
  'morpho': 'morpho',
  'radiant': 'radiant',
  'benqi': 'benqi',
  'makerdao': 'makerdao',
  'maker': 'makerdao',
  'maker dao': 'makerdao',

  // Common protocols with variations
  'uniswap v2': 'uniswap',
  'uniswap v3': 'uniswap',
  'uni': 'uniswap',

  'aave v2': 'aave',
  'aave v3': 'aave',

  'curve finance': 'curve',

  'compound finance': 'compound',

  'balancer v2': 'balancer',

  'yearn': 'yearn-finance',
  'yearn finance': 'yearn-finance',

  'convex': 'convex-finance',
  'convex finance': 'convex-finance',

  'lido finance': 'lido',

  'pancake': 'pancakeswap',

  'frax': 'frax-finance',
  'frax finance': 'frax-finance',

  'beefy finance': 'beefy',

  // Stablecoins
  'usdc': 'usdc',
  'usdt': 'tether',
  'dai': 'makerdao',

  // Yield aggregators
  'yield yak': 'yield-yak',
  'yak': 'yield-yak',

  // Mantle Protocols
  'agni': 'agni-finance',
  'agni finance': 'agni-finance',
  'fusionx': 'fusionx',
  'lendle': 'lendle',
  'izumi': 'izumi-finance',
  'izumi finance': 'izumi-finance',
  'merchant moe': 'merchant-moe',

  // Aptos Protocols
  'beets': 'beets',
  'silo': 'silo-finance',
  'silo finance': 'silo-finance',
  'shadow-exchange': 'shadow-exchange',
  'shadow exchange': 'shadow-exchange',
  'swapx': 'swapx',
  'swapx algebra': 'swapx',
  'origin-aptos': 'origin-aptos',
  'origin aptos': 'origin-aptos'
} as const;
