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
    // Fetch Aptos chain TVL data from two endpoints
    const [chainsResponse, chartResponse] = await Promise.all([
      axios.get(`${DEFILLAMA_BASE_URL}/v2/chains`),
      axios.get(`${DEFILLAMA_BASE_URL}/charts/chains/Aptos`)
    ]);

    // Find Aptos chain data from chains endpoint
    const aptosData = chainsResponse.data.find(chain =>
      chain.name.toLowerCase() === 'aptos'
    );

    // Return formatted data with both current TVL and historical data
    return res.status(200).json({
      currentTVL: aptosData?.tvl || 0,
      change_1d: aptosData?.change_1d || 0,
      change_7d: aptosData?.change_7d || 0,
      historicalData: chartResponse.data // Historical TVL data
    });
  } catch (error) {
    console.error('Error fetching Aptos TVL data from DefiLlama:', error);

    // Try fallback to just the chart API if chains API fails
    try {
      const fallbackResponse = await axios.get(`${DEFILLAMA_BASE_URL}/charts/chains/Aptos`);
      const data = fallbackResponse.data;
      // Calculate approximate change percentages from historical data
      const latestTvl = data[data.length - 1]?.tvl || 0;
      const oneDayAgoTvl = data[data.length - 2]?.tvl || latestTvl;
      const sevenDaysAgoTvl = data[data.length - 8]?.tvl || latestTvl;

      return res.status(200).json({
        currentTVL: latestTvl,
        change_1d: ((latestTvl / oneDayAgoTvl) - 1) * 100,
        change_7d: ((latestTvl / sevenDaysAgoTvl) - 1) * 100,
        historicalData: data
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return res.status(500).json({
        error: 'Failed to fetch Aptos TVL data from DefiLlama'
      });
    }
  }
}
