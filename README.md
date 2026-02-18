# TrackerFi Backend

API REST para o TrackerFi — app de rastreamento de portfolio crypto.

**Stack:** Node.js, Express v5, TypeScript, MongoDB Atlas

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Configure o `.env` na raiz do projeto:

```env
MONGO_URI=mongodb+srv://...
PORT=3000
JWT_SECRET=sua_chave_secreta
ENCRYPTION_KEY=chave-32-caracteres-aqui-ok!!!!
COINGECKO_API_KEY=sua_key
ZERION_API_KEY_HASH=base64_aqui
NODE_ENV=development
```

3. Rode o servidor:

```bash
npm run dev
```

O servidor sobe em `http://localhost:3000`.

## Estrutura

```
src/
  index.ts           # Entry point + Express setup
  mongo.ts           # Conexao MongoDB (pool persistente)
  routes/            # Rotas da API (auth, wallets, tokens, etc.)
  functions/         # Logica de negocio por dominio
  interfaces/        # TypeScript interfaces
  scripts/           # Jobs (snapshots, transactions, refresh tokens)
```

## Scripts uteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Roda em modo desenvolvimento |
| `npm run build` | Compila TypeScript |
| `npm run refresh:tokens` | Atualiza lista de tokens (CoinGecko) |
| `npm run snapshot:wallets` | Cria snapshot dos portfolios |
| `npm run fetch:transactions` | Busca transacoes das wallets |
