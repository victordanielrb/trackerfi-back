import { ObjectId } from "mongodb";
import TokensFromWallet from "./tokenInterface";

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
interface Alert {
    price_threshold: number;
    token : TokensFromWallet;
    alert_type: 'price_above' | 'price_below';
    created_at?: Date;
    updated_at?: Date;
    last_triggered?: string;
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