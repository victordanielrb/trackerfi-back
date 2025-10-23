interface TokensFromWallet {
    name: string;
    symbol: string;
    address: string;
    chain: string;
    position_type: string;
    quantity?: string | number;
    decimals?: number;
    price?: number;
    value?: number;
    mcap?: number;
    usd_24h_volume?: number;
    usd_24h_change?: number;
    price_change_24h?: number;
    icon_url?: string;
    updated_at?: string;
    // Chain-specific data for cross-chain comparison
    chain_specific?: {
        native_chain: string;
        bridge_contract?: string;
        liquidity_pool?: string;
        chain_tvl?: number;
    };
}

export default TokensFromWallet;