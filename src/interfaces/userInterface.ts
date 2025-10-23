interface User {
    _id?: string;
    name: string;
    email: string;
    wallets?: { chain: string; address: string; }[];
}

export default User;