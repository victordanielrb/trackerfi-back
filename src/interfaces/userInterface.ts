import { ObjectId } from "mongodb";

interface Wallet {
    chain: string;
    address: string;
    connected_at?: string;
    updated_at?: string;
}

interface Exchange {
    name: string;
    api_key: string;
    api_secret: string;
    connected_at?: Date;
    updated_at?: Date;
}

export interface Alert {
    token_id: string;        // CoinGecko ID
    token_symbol: string;
    token_name: string;
    price_threshold: number;
    alert_type: 'price_above' | 'price_below';
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    last_triggered?: string;
    triggered_count: number;
}

interface User {
    _id?: ObjectId | string;
    name: string;
    email: string;
    wallets?: Wallet[];
    alerts?: Alert[];
    triggered_alerts?: Alert[];
    favorites?: string[]; // Array of token IDs (CoinGecko IDs)
    exchanges?: Exchange[];
    portfolio_24h_change?: number;
    portfolio_24h_change_percent?: number;
}

export default User;