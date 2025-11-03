import { ObjectId } from "mongodb";

interface Wallet {
    chain: string;
    address: string;
    connected_at?: Date;
    updated_at?: Date;
}

interface Exchange {
    name: string;
    api_key: string;
    api_secret: string;
    connected_at?: Date;
    updated_at?: Date;
}

interface User {
    _id?: ObjectId | string;
    name: string;
    email: string;
    wallets?: Wallet[];
    exchanges?: Exchange[];
}

export default User;