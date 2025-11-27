"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NATIVE_TOKEN_ADDRESS_MAP = exports.COINGECKO_PLATFORM_MAP = void 0;
exports.getCoinGeckoTokenAddress = getCoinGeckoTokenAddress;
exports.getCoinGeckoPlatformId = getCoinGeckoPlatformId;
exports.isSupportedChain = isSupportedChain;
exports.getSupportedChains = getSupportedChains;
exports.validateChains = validateChains;
// Complete CoinGecko platform mapping based on official API
exports.COINGECKO_PLATFORM_MAP = {
    // Major EVM chains
    'ethereum': 'ethereum',
    'arbitrum': 'arbitrum-one',
    'arbitrum-one': 'arbitrum-one',
    'polygon': 'polygon-pos',
    'bsc': 'binance-smart-chain',
    'binance-smart-chain': 'binance-smart-chain',
    'avalanche': 'avalanche',
    'optimism': 'optimistic-ethereum',
    'base': 'base',
    // Layer 2s and sidechains
    'gnosis': 'xdai',
    'xdai': 'xdai',
    'metis': 'metis-andromeda',
    'manta': 'manta-pacific',
    'zora': 'zora-network',
    'zksync': 'zksync',
    'linea': 'linea',
    'scroll': 'scroll',
    // Other major chains
    'solana': 'solana',
    'cosmos': 'cosmos',
    'osmosis': 'osmosis',
    'juno': 'juno',
    'akash': 'akash',
    'kava': 'kava',
    'injective': 'injective',
    // Alternative chains
    'fantom': 'fantom',
    'cronos': 'cronos',
    'moonbeam': 'moonbeam',
    'moonriver': 'moonriver',
    'harmony': 'harmony-shard-0',
    'celo': 'celo',
    'aurora': 'aurora',
    'near': 'near-protocol',
    // Newer chains
    'sei': 'sei-v2',
    'aptos': 'aptos',
    'sui': 'sui',
    'starknet': 'starknet',
    // Gaming/NFT chains
    'ronin': 'ronin',
    'immutable-x': 'immutablex',
    'flow': 'flow',
    // Enterprise chains
    'hedera': 'hedera-hashgraph',
    'algorand': 'algorand',
    'cardano': 'cardano',
    'polkadot': 'polkadot',
    'kusama': 'kusama',
    // L2 solutions
    'blast': 'blast',
    'mode': 'mode',
    'mantle': 'mantle',
    'zetachain': 'zetachain',
    // Bitcoin layers
    'bitcoin': 'ordinals',
    'stacks': 'stacks',
    'lightning': 'bitcoin',
    // Test networks (optional)
    'goerli': 'ethereum',
    'sepolia': 'ethereum',
    'mumbai': 'polygon-pos',
    'fuji': 'avalanche',
};
// Native token address mapping for different chains
// Maps zero address (0x000...000) to actual wrapped token addresses that CoinGecko recognizes
exports.NATIVE_TOKEN_ADDRESS_MAP = {
    'arbitrum': {
        '0x0000000000000000000000000000000000000000': '0x82af49447d8a07e3bd95bd0d56f35241523fbab1' // WETH on Arbitrum
    },
    'ethereum': {
        '0x0000000000000000000000000000000000000000': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' // WETH on Ethereum
    },
    'polygon': {
        '0x0000000000000000000000000000000000000000': '0x7ceb23fd6c8a75c5c4e3c9b8c8c8c8c8c8c8c8c8' // WMATIC on Polygon
    },
    'optimism': {
        '0x0000000000000000000000000000000000000000': '0x4200000000000000000000000000000000000006' // WETH on Optimism
    },
    'base': {
        '0x0000000000000000000000000000000000000000': '0x4200000000000000000000000000000000000006' // WETH on Base
    },
    'avalanche': {
        '0x0000000000000000000000000000000000000000': '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7' // WAVAX on Avalanche
    },
    'bsc': {
        '0x0000000000000000000000000000000000000000': '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' // WBNB on BSC
    }
};
/**
 * Get the correct token address for CoinGecko API
 * Converts native token addresses (0x000...000) to wrapped token addresses
 * @param address - Original token address
 * @param chain - Blockchain name
 * @returns Correct address for CoinGecko or original address
 */
function getCoinGeckoTokenAddress(address, chain) {
    const normalizedChain = chain.toLowerCase().trim();
    const normalizedAddress = address.toLowerCase().trim();
    if (exports.NATIVE_TOKEN_ADDRESS_MAP[normalizedChain]?.[normalizedAddress]) {
        const mappedAddress = exports.NATIVE_TOKEN_ADDRESS_MAP[normalizedChain][normalizedAddress];
        console.log(`🔄 Mapping native token: ${address} → ${mappedAddress} on ${chain}`);
        return mappedAddress;
    }
    return address;
}
/**
 * Get the correct CoinGecko platform ID for a given chain
 * @param chainName - The chain name from your data
 * @returns The correct CoinGecko platform ID or null if not supported
 */
function getCoinGeckoPlatformId(chainName) {
    const normalizedChain = chainName.toLowerCase().trim();
    return exports.COINGECKO_PLATFORM_MAP[normalizedChain] || null;
}
/**
 * Check if a chain is supported by CoinGecko
 * @param chainName - The chain name to check
 * @returns boolean indicating if the chain is supported
 */
function isSupportedChain(chainName) {
    return getCoinGeckoPlatformId(chainName) !== null;
}
/**
 * Get all supported chain names
 * @returns Array of supported chain names
 */
function getSupportedChains() {
    return Object.keys(exports.COINGECKO_PLATFORM_MAP);
}
/**
 * Validate and map multiple chains
 * @param chains - Array of chain names
 * @returns Object with valid mappings and unsupported chains
 */
function validateChains(chains) {
    const validMappings = {};
    const unsupportedChains = [];
    chains.forEach(chain => {
        const platformId = getCoinGeckoPlatformId(chain);
        if (platformId) {
            validMappings[chain] = platformId;
        }
        else {
            unsupportedChains.push(chain);
        }
    });
    return { validMappings, unsupportedChains };
}
