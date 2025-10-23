export enum Blockchain {
  SUI = 'SUI',
  EVM = 'EVM',
  SOLANA = 'SOLANA',
}
export interface UserWallet {
  user_id: string;
  blockchain: Blockchain;
  wallet_address: string;
  connected_at: string;
  updated_at: string;
}