import axios from 'axios';

// DefiLlama API base URL
const DEFILLAMA_BASE_URL = 'https://api.llama.fi';

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
    // Fetch Aptos chain TVL data
    const [tvlResponse, chartResponse] = await Promise.all([
      axios.get(`${DEFILLAMA_BASE_URL}/v2/chains`),
      axios.get(`${DEFILLAMA_BASE_URL}/charts/chains/Aptos`)
    ]);

    const aptosData = tvlResponse.data.find(chain => chain.name.toLowerCase() === 'aptos');

    return res.status(200).json({
      currentTVL: aptosData?.tvl || 0,
      change_1d: aptosData?.change_1d || 0,
      change_7d: aptosData?.change_7d || 0,
      historicalData: chartResponse.data
    });
  } catch (error) {
    console.error('Error fetching Aptos TVL data from DefiLlama:', error);
    return res.status(500).json({
      error: error.response?.data?.message || 'Failed to fetch Aptos TVL data from DefiLlama'
    });
  }
}
