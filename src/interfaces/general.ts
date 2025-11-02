export enum Blockchain {
  SUI = 'SUI',
  EVM = 'EVM',
  SOLANA = 'SOLANA',
}
export interface UserWallet {
  // Wallet object as stored inside the `users` collection (users.wallets)
  address: string;
  chain: Blockchain;
  connected_at?: string;
  updated_at?: string;
}