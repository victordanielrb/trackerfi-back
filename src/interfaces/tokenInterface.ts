export default interface TokensFromWallet {
    name: string;
    symbol: string;
    address: string;
    chain: string;
    position_type: string;
    price?: number;
    mcap?: number;
    usd_24h_volume?: number;
    usd_24h_change?: number;
    last_updated: number;
}