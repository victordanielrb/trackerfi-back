import axios from 'axios';
import { getCoinGeckoPlatformId, getSupportedChains } from '../tokenRelated/coingeckoMapping';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || '';
const coingeckoHeaders = COINGECKO_API_KEY ? { 'x-cg-demo-api-key': COINGECKO_API_KEY } : {};

/**
 * Fetch the latest asset platforms from CoinGecko API
 * This function can be used to update your local mapping
 */
export async function fetchCoinGeckoAssetPlatforms(): Promise<any[]> {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/asset_platforms', {
      headers: { 'accept': 'application/json', ...coingeckoHeaders }
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching CoinGecko asset platforms:', error);
    throw error;
  }
}

/**
 * Process wallet tokens by chain and prepare for price fetching
 * @param tokens - Array of tokens from wallet
 * @returns Object with validated chains and their tokens
 */
export function processTokensByChain(tokens: any[]): {
  validChains: { [chain: string]: any[] };
  unsupportedChains: string[];
  summary: {
    totalTokens: number;
    validTokens: number;
    unsupportedTokens: number;
    chainsSupported: number;
    chainsUnsupported: number;
  };
} {
  const validChains: { [chain: string]: any[] } = {};
  const unsupportedChains: string[] = [];
  const chainSet = new Set<string>();
  
  let validTokens = 0;
  let unsupportedTokens = 0;
  
  tokens.forEach(token => {
    const chain = token.chain?.toLowerCase();
    console.log(chain);
    
    chainSet.add(chain);
    
    if (getCoinGeckoPlatformId(chain)) {
      if (!validChains[chain]) {
        validChains[chain] = [];
      }
      validChains[chain].push(token);
      validTokens++;
    } else {
    
      if (!unsupportedChains.includes(chain)) {
        unsupportedChains.push(chain);
      }
      unsupportedTokens++;
    }
  });
  console.log("Unsupported chains:", unsupportedChains);
  return {
    validChains,
    unsupportedChains,
    summary: {
      totalTokens: tokens.length,
      validTokens,
      unsupportedTokens,
      chainsSupported: Object.keys(validChains).length,
      chainsUnsupported: unsupportedChains.length
    }
  };
}

/**
 * Get detailed chain information for debugging
 * @param chainName - Name of the chain to analyze
 * @returns Detailed information about the chain
 */
export function getChainInfo(chainName: string): {
  original: string;
  normalized: string;
  platformId: string | null;
  isSupported: boolean;
  suggestions?: string[];
} {
  const normalized = chainName.toLowerCase().trim();
  const platformId = getCoinGeckoPlatformId(normalized);
  const isSupported = platformId !== null;
  
  let suggestions: string[] = [];
  if (!isSupported) {
    // Find similar chain names
    const supportedChains = getSupportedChains();
    suggestions = supportedChains.filter(chain => 
      chain.includes(normalized) || normalized.includes(chain)
    ).slice(0, 3);
  }
  
  return {
    original: chainName,
    normalized,
    platformId,
    isSupported,
    ...(suggestions.length > 0 && { suggestions })
  };
}

/**
 * Validate token addresses for a specific chain
 * @param addresses - Array of token addresses
 * @param chain - Blockchain name
 * @returns Validation results
 */
export function validateTokenAddresses(addresses: string[], chain: string): {
  valid: string[];
  invalid: string[];
  warnings: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];
  
  addresses.forEach(address => {
    // Basic validation
    if (!address || typeof address !== 'string') {
      invalid.push(address);
      return;
    }
    
    const cleanAddress = address.trim().toLowerCase();
    
    // Ethereum-based chains validation
    if (['ethereum', 'arbitrum', 'polygon', 'bsc', 'avalanche', 'optimism', 'base'].includes(chain)) {
      if (cleanAddress.startsWith('0x') && cleanAddress.length === 42) {
        valid.push(cleanAddress);
      } else if (cleanAddress === '0x0000000000000000000000000000000000000000') {
        valid.push(cleanAddress);
        warnings.push(`Native token address detected for ${chain}`);
      } else {
        invalid.push(address);
      }
    }
    // Solana validation
    else if (chain === 'solana') {
      if (cleanAddress.length >= 32 && cleanAddress.length <= 44) {
        valid.push(cleanAddress);
      } else {
        invalid.push(address);
      }
    }
    // Default: accept as-is but warn
    else {
      valid.push(cleanAddress);
      warnings.push(`No specific validation for ${chain} addresses`);
    }
  });
  
  return { valid, invalid, warnings };
}

/**
 * Generate a comprehensive report for token processing
 * @param tokens - Array of tokens to analyze
 * @returns Detailed report
 */
export function generateTokenReport(tokens: any[]): {
  chainAnalysis: ReturnType<typeof processTokensByChain>;
  chainDetails: { [chain: string]: ReturnType<typeof getChainInfo> };
  addressValidation: { [chain: string]: ReturnType<typeof validateTokenAddresses> };
  recommendations: string[];
} {
  const chainAnalysis = processTokensByChain(tokens);
  const chainDetails: { [chain: string]: ReturnType<typeof getChainInfo> } = {};
  const addressValidation: { [chain: string]: ReturnType<typeof validateTokenAddresses> } = {};
  const recommendations: string[] = [];
  
  // Analyze each chain
  const allChains = [...Object.keys(chainAnalysis.validChains), ...chainAnalysis.unsupportedChains];
  allChains.forEach(chain => {
    chainDetails[chain] = getChainInfo(chain);
    
    const chainTokens = chainAnalysis.validChains[chain] || [];
    const addresses = chainTokens.map(t => t.address);
    addressValidation[chain] = validateTokenAddresses(addresses, chain);
  });
  
  // Generate recommendations
  if (chainAnalysis.unsupportedChains.length > 0) {
    recommendations.push(`❌ ${chainAnalysis.unsupportedChains.length} unsupported chains found: ${chainAnalysis.unsupportedChains.join(', ')}`);
  }
  
  if (chainAnalysis.summary.validTokens > 0) {
    recommendations.push(`✅ ${chainAnalysis.summary.validTokens} tokens ready for price fetching across ${chainAnalysis.summary.chainsSupported} chains`);
  }
  
  Object.entries(addressValidation).forEach(([chain, validation]) => {
    if (validation.invalid.length > 0) {
      recommendations.push(`⚠️ ${validation.invalid.length} invalid addresses found in ${chain}`);
    }
  });
  
  return {
    chainAnalysis,
    chainDetails,
    addressValidation,
    recommendations
  };
}

/**
 * Test function to validate your current token setup
 */
export async function testTokenProcessing() {
  console.log('🧪 Testing Token Processing...\n');
  
  // Sample tokens for testing
  const sampleTokens = [
    {
      name: 'USDT',
      symbol: 'USDT',
      address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      chain: 'arbitrum'
    },
    {
      name: 'ETH',
      symbol: 'ETH',
      address: '0x0000000000000000000000000000000000000000',
      chain: 'ethereum'
    },
    {
      name: 'SOL',
      symbol: 'SOL',
      address: 'So11111111111111111111111111111111111111112',
      chain: 'solana'
    },
    {
      name: 'Unknown Token',
      symbol: 'UNK',
      address: '0x123',
      chain: 'unknown-chain'
    }
  ];
  
  const report = generateTokenReport(sampleTokens);
  
  console.log('📊 Chain Analysis:');
  console.log(`   Total Tokens: ${report.chainAnalysis.summary.totalTokens}`);
  console.log(`   Valid Tokens: ${report.chainAnalysis.summary.validTokens}`);
  console.log(`   Unsupported Tokens: ${report.chainAnalysis.summary.unsupportedTokens}`);
  console.log(`   Supported Chains: ${report.chainAnalysis.summary.chainsSupported}`);
  console.log(`   Unsupported Chains: ${report.chainAnalysis.summary.chainsUnsupported}\n`);
  
  console.log('🔗 Chain Details:');
  Object.entries(report.chainDetails).forEach(([chain, details]) => {
    console.log(`   ${chain}: ${details.isSupported ? '✅' : '❌'} ${details.platformId || 'Not supported'}`);
    if (details.suggestions?.length) {
      console.log(`      Suggestions: ${details.suggestions.join(', ')}`);
    }
  });
  
  console.log('\n💡 Recommendations:');
  report.recommendations.forEach(rec => console.log(`   ${rec}`));
  
  return report;
}

// Uncomment to run test
// testTokenProcessing();
