import axios from 'axios';

// DefiLlama API base URL
const DEFILLAMA_BASE_URL = 'https://api.llama.fi';

// Add Joule protocol data since it might not be in DefiLlama yet
const JOULE_PROTOCOL = {
  name: "Joule",
  tvl: 1000000, // Example TVL, should be updated with real data
  change_1d: 2.5,
  change_7d: 15.4,
  category: "Lending",
  chains: ["Aptos"],
  url: "https://joule.finance"
};

// Vercel serverless function handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await axios.get(`${DEFILLAMA_BASE_URL}/protocols`);

    // Filter protocols for Aptos chain
    const aptosProtocols = response.data
      .filter(protocol => protocol.chains.includes('Aptos'))
      .map(protocol => ({
        name: protocol.name,
        tvl: protocol.tvl,
        change_1d: protocol.change_1d,
        change_7d: protocol.change_7d,
        category: protocol.category,
        chains: protocol.chains,
        url: protocol.url
      }));

    // Add Joule to the protocols list if not present
    if (!aptosProtocols.find(p => p.name === "Joule")) {
      aptosProtocols.push(JOULE_PROTOCOL);
    }

    // Sort by TVL
    aptosProtocols.sort((a, b) => b.tvl - a.tvl);

    return res.status(200).json(aptosProtocols);
  } catch (error) {
    console.error('Error fetching Aptos protocols from DefiLlama:', error);
    return res.status(500).json({
      error: error.response?.data?.message || 'Failed to fetch Aptos protocols from DefiLlama'
    });
  }
}
