export default interface User {
    _id?: string;
    name: string;
    email: string;
    wallets?: { chain: string; address: string; }[];
    tokens?: { id: string; quantity: number; }[];
}