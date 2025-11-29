import { ObjectId } from "mongodb";

export interface TransactionTransfer {
    fungible_info?: {
        name: string;
        symbol: string;
        icon?: {
            url: string;
        };
    };
    direction: 'in' | 'out';
    quantity: {
        float: number;
        numeric: string;
    };
    value?: number;
    price?: number;
    nft_info?: {
        name?: string;
        collection?: string;
        image_url?: string;
    };
}

export interface TransactionFee {
    value: number;
    price: number;
    fungible_info: {
        name: string;
        symbol: string;
        icon?: {
            url: string;
        };
    };
}

export interface TransactionApplication {
    name: string;
    icon?: {
        url: string;
    };
}

export interface Transaction {
    id: string;
    type: 'send' | 'receive' | 'trade' | 'approve' | 'execute' | 'deploy' | 'mint' | 'burn' | string;
    protocol?: string;
    mined_at: string;
    hash: string;
    status: 'confirmed' | 'pending' | 'failed';
    direction?: 'in' | 'out' | 'self';
    address_from?: string;
    address_to?: string;
    chain?: string;
    fee?: TransactionFee;
    transfers?: TransactionTransfer[];
    applications?: TransactionApplication[];
}

export interface UserTransaction {
    _id?: ObjectId;
    user_id: ObjectId;
    wallet_address: string;
    chain: string;
    transaction: Transaction;
    created_at: Date;
    updated_at: Date;
}

export interface UserTransactionsDocument {
    _id?: ObjectId;
    user_id: ObjectId;
    transactions: Array<{
        wallet_address: string;
        chain: string;
        transaction: Transaction;
        fetched_at: Date;
    }>;
    last_updated: Date;
}

export interface TransactionFilter {
    wallet_address?: string;
    chain?: string;
    type?: string;
    direction?: 'in' | 'out' | 'self';
    from_date?: Date;
    to_date?: Date;
    limit?: number;
    cursor?: string;
}

export default Transaction;
