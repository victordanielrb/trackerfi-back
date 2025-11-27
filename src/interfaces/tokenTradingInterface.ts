export interface TokenTradingData {
  id: string;
  symbol: string;
  name: string;
  current_price_usd: number | null;
  
  // Price change percentages
  price_change_percentage_1h: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d: number | null;
  price_change_percentage_14d?: number | null;
  price_change_percentage_30d?: number | null;
  price_change_percentage_1y?: number | null;
  
  // Market data
  market_cap_usd: number | null;
  total_volume_24h_usd: number | null;
  high_24h_usd: number | null;
  low_24h_usd: number | null;
  
  // All-time high/low
  ath_usd?: number | null;
  ath_date?: string | null;
  atl_usd?: number | null;
  atl_date?: string | null;
  
  last_updated: string;
  
  // OHLC data for all timeframes (each entry: [timestamp, open, high, low, close])
  ohlc_1d?: Array<[number, number, number, number, number]>;
  ohlc_7d?: Array<[number, number, number, number, number]>;
  ohlc_14d?: Array<[number, number, number, number, number]>;
  ohlc_30d?: Array<[number, number, number, number, number]>;
  ohlc_90d?: Array<[number, number, number, number, number]>;
  ohlc_180d?: Array<[number, number, number, number, number]>;
  ohlc_365d?: Array<[number, number, number, number, number]>;
  
  // Price data for all timeframes [timestamp, price]
  prices_1d?: Array<[number, number]>;
  prices_7d?: Array<[number, number]>;
  prices_30d?: Array<[number, number]>;
  prices_90d?: Array<[number, number]>;
  prices_365d?: Array<[number, number]>;
  
  // Market cap data for all timeframes [timestamp, market_cap]
  market_caps_1d?: Array<[number, number]>;
  market_caps_7d?: Array<[number, number]>;
  market_caps_30d?: Array<[number, number]>;
  market_caps_90d?: Array<[number, number]>;
  market_caps_365d?: Array<[number, number]>;
  
  // Volume data for all timeframes [timestamp, volume]
  volumes_1d?: Array<[number, number]>;
  volumes_7d?: Array<[number, number]>;
  volumes_30d?: Array<[number, number]>;
  volumes_90d?: Array<[number, number]>;
  volumes_365d?: Array<[number, number]>;
  
  // Legacy fields for backward compatibility
  ohlc_24h?: Array<[number, number, number, number, number]>;
  prices_24h?: Array<[number, number]>;
  market_caps_24h?: Array<[number, number]>;
  volumes_24h?: Array<[number, number]>;
}

export default TokenTradingData;