import axios from 'axios';
import { elizaLogger } from '@elizaos/core';
import { DEFILLAMA_API_URL, ENDPOINTS } from '../config/constants';
import { createErrorResponse, createSuccessResponse } from '../../utils/response';
import type { StandardResponse } from '../../utils/response';
import type { DefiLlamaChainResponse, DefiLlamaProtocolResponse } from '../types';

// Initialize axios client with retry logic and rate limiting
const client = axios.create({
  baseURL: DEFILLAMA_API_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json'
  }
});

// Add response interceptor for better error handling
client.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      elizaLogger.error('DeFiLlama API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        url: error.config?.url
      });

      // Handle specific error cases
      if (error.response.status === 404) {
        return Promise.reject(new Error('Resource not found. Please check the chain/protocol name.'));
      } else if (error.response.status === 429) {
        return Promise.reject(new Error('Rate limit exceeded. Please try again later.'));
      } else if (error.response.status === 500) {
        return Promise.reject(new Error('DeFiLlama API server error. Please try again later.'));
      }
    } else if (error.request) {
      elizaLogger.error('DeFiLlama API No Response:', error.request);
      return Promise.reject(new Error('No response from DeFiLlama API. Please try again.'));
    } else {
      elizaLogger.error('DeFiLlama API Error:', error.message);
      return Promise.reject(new Error('Failed to connect to DeFiLlama API.'));
    }
    return Promise.reject(error);
  }
);

/**
 * Validate chain data response
 */
function validateChainResponse(data: any): data is DefiLlamaChainResponse[] {
  if (!Array.isArray(data)) {
    elizaLogger.error('Chain data is not an array');
    return false;
  }

  return data.every(chain => {
    const isValid = typeof chain === 'object' &&
      typeof chain.name === 'string' &&
      typeof chain.tvl === 'number';

    if (!isValid) {
      elizaLogger.error('Invalid chain data format:', chain);
    }

    return isValid;
  });
}

/**
 * Validate protocol data response
 */
function validateProtocolResponse(data: any): data is DefiLlamaProtocolResponse {
  const isValid = typeof data === 'object' &&
    typeof data.name === 'string' &&
    typeof data.tvl === 'number' &&
    Array.isArray(data.chains);

  if (!isValid) {
    elizaLogger.error('Invalid protocol data format:', data);
  }

  return isValid;
}

/**
 * Get chain TVL data
 */
export async function getChainData(): Promise<StandardResponse> {
  try {
    const response = await client.get(ENDPOINTS.CHAINS);

    if (response.status !== 200) {
      return createErrorResponse('Failed to fetch chain data', 'API_ERROR');
    }

    if (!validateChainResponse(response.data)) {
      return createErrorResponse('Invalid chain data format received', 'DATA_FORMAT_ERROR');
    }

    return createSuccessResponse(response.data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    elizaLogger.error('Error fetching chain data:', {
      error,
      endpoint: ENDPOINTS.CHAINS,
      timestamp: new Date().toISOString()
    });
    return createErrorResponse(
      `Failed to fetch chain data: ${errorMessage}`,
      'API_ERROR'
    );
  }
}

/**
 * Get protocol TVL data
 */
export async function getProtocolData(slug: string): Promise<StandardResponse> {
  try {
    const response = await client.get(`${ENDPOINTS.PROTOCOL_TVL}/${encodeURIComponent(slug)}`);

    if (response.status !== 200) {
      return createErrorResponse('Failed to fetch protocol data', 'API_ERROR');
    }

    // The /tvl endpoint returns a single number
    if (typeof response.data !== 'number') {
      return createErrorResponse('Invalid protocol TVL data format received', 'DATA_FORMAT_ERROR');
    }

    return createSuccessResponse({
      name: slug,
      tvl: response.data
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    elizaLogger.error('Error fetching protocol data:', {
      error,
      protocol: slug,
      endpoint: ENDPOINTS.PROTOCOL_TVL,
      timestamp: new Date().toISOString()
    });
    return createErrorResponse(
      `Failed to fetch protocol data: ${errorMessage}`,
      'API_ERROR'
    );
  }
}

/**
 * Get historical TVL data
 */
export async function getHistoricalData(params: {
  chain?: string;
  protocol?: string;
}): Promise<StandardResponse> {
  try {
    let endpoint = '';

    if (params.protocol) {
      endpoint = `${ENDPOINTS.PROTOCOL}/${encodeURIComponent(params.protocol)}${ENDPOINTS.PROTOCOL_HISTORICAL}`;
    } else if (params.chain) {
      endpoint = `${ENDPOINTS.CHAIN_HISTORICAL}/${encodeURIComponent(params.chain)}`;
    } else {
      return createErrorResponse('Must specify either chain or protocol', 'INVALID_PARAMS');
    }

    const response = await client.get(endpoint);

    if (response.status !== 200) {
      return createErrorResponse('Failed to fetch historical data', 'API_ERROR');
    }

    if (!Array.isArray(response.data)) {
      return createErrorResponse('Invalid historical data format received', 'DATA_FORMAT_ERROR');
    }

    return createSuccessResponse(response.data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    elizaLogger.error('Error fetching historical data:', {
      error,
      params,
      timestamp: new Date().toISOString()
    });
    return createErrorResponse(
      `Failed to fetch historical data: ${errorMessage}`,
      'API_ERROR'
    );
  }
}

/**
 * Get global TVL data
 */
export async function getGlobalData(): Promise<StandardResponse> {
  try {
    const response = await client.get(ENDPOINTS.GLOBAL_TVL);

    if (response.status !== 200) {
      return createErrorResponse('Failed to fetch global TVL data', 'API_ERROR');
    }

    if (!response.data || typeof response.data.totalLiquidityUSD !== 'number') {
      return createErrorResponse('Invalid global TVL data format received', 'DATA_FORMAT_ERROR');
    }

    return createSuccessResponse(response.data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    elizaLogger.error('Error fetching global TVL data:', {
      error,
      endpoint: ENDPOINTS.GLOBAL_TVL,
      timestamp: new Date().toISOString()
    });
    return createErrorResponse(
      `Failed to fetch global TVL data: ${errorMessage}`,
      'API_ERROR'
    );
  }
}

/**
 * Get all protocols data
 */
export async function getAllProtocols(): Promise<StandardResponse> {
  try {
    elizaLogger.info('Fetching all protocols data from DeFiLlama API');
    const response = await client.get(ENDPOINTS.PROTOCOLS);

    if (response.status !== 200) {
      elizaLogger.error('Failed to fetch protocols data:', {
        status: response.status,
        statusText: response.statusText
      });
      return createErrorResponse('Failed to fetch protocols data', 'API_ERROR');
    }

    if (!Array.isArray(response.data)) {
      elizaLogger.error('Invalid protocols data format received:', {
        dataType: typeof response.data,
        isArray: Array.isArray(response.data)
      });
      return createErrorResponse('Invalid protocols data format received', 'DATA_FORMAT_ERROR');
    }

    // Log basic info about the response
    elizaLogger.info(`Received ${response.data.length} protocols from DeFiLlama API`);

    // Validate and clean the data
    const cleanedData = response.data.map((protocol: any) => {
      // Ensure required fields exist with defaults
      const cleanedProtocol = {
        name: protocol.name || protocol.slug || 'Unknown Protocol',
        slug: protocol.slug || '',
        tvl: typeof protocol.tvl === 'number' ? protocol.tvl : 0,
        change_1d: typeof protocol.change_1d === 'number' ? protocol.change_1d : undefined,
        change_7d: typeof protocol.change_7d === 'number' ? protocol.change_7d : undefined,
        category: protocol.category || '',
        chains: Array.isArray(protocol.chains) ? protocol.chains : [],
        chainTvls: protocol.chainTvls || {}
      };

      return cleanedProtocol;
    });

    // Filter out protocols with no TVL data
    const validProtocols = cleanedData.filter(p => p.tvl > 0);

    elizaLogger.info(`Processed ${validProtocols.length} valid protocols with TVL data`);

    return createSuccessResponse(validProtocols);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    elizaLogger.error('Error fetching all protocols data:', {
      error,
      endpoint: ENDPOINTS.PROTOCOLS,
      timestamp: new Date().toISOString()
    });
    return createErrorResponse(
      `Failed to fetch protocols data: ${errorMessage}`,
      'API_ERROR'
    );
  }
}
