export interface Exchange {
  name: string;          // exchange name (e.g., "binance", "coinbase", "kraken")
  api_key: string;       // API key for the exchange
  api_secret: string;    // API secret for the exchange
  connected_at: Date;    // when the exchange was added
  updated_at: Date;      // last time the exchange credentials were updated
}

export interface ExchangeResponse {
  id: string;            // composite ID: userId-exchangeName-idx
  name: string;
  api_key: string;       // may be masked/truncated for security in responses
  api_secret: string;    // may be masked/truncated for security in responses
  connected_at: Date;
  updated_at: Date;
}