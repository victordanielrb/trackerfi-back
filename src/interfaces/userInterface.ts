import { ObjectId } from "mongodb";

interface User {
    _id?: ObjectId | string;
    name: string;
    email: string;
    wallets?: { chain: string; address: string; }[];
    exchanges?: { name: string; apiKey: string; apiSecret: string; }[];
}

export default User;