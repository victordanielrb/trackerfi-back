📚 APIs que você vai precisar
##🔹 1. Blockchain (para rastrear carteiras e tokens)
Ethereum → Etherscan API

Endpoints: account/balance, account/tokentx, account/tokenbalance

Solana → Helius API ou Solana JSON-RPC (getBalance, getTokenAccountsByOwner)

Alternativas multi-chain (opcional):

Covalent API

Moralis API

Blockchair API

##🔹 2. Mapeamento de token → CoinGecko ID
CoinGecko Onchain API → /onchain/networks/{network}/tokens/{address}/info

Retorna coingecko_coin_id para usar nos endpoints de preço/histórico.

##🔹 3. Dados de mercado e histórico
#CoinGecko API

/coins/markets → preços atuais de várias moedas em lote.

/coins/{id}/market_chart → histórico de preços, volume e market cap.

#Binance Spot API (para moedas listadas na Binance, com dados mais rápidos)

/api/v3/ticker/price → preço atual.

/api/v3/klines → candles OHLCV para gráficos.

##🔹 4. Gráficos e indicadores técnicos
#TradingView Charting Library (open-source) ou Lightweight Charts

Você alimenta com dados da CoinGecko/Binance.

Permite aplicar indicadores como RSI, Médias Móveis, Bandas de Bollinger.

##🔹 5. Notificações e alertas
#Firebase Cloud Messaging (FCM) ou OneSignal

Push notifications para alertas de preço/volume.

##🔄 Fluxo de funcionamento
#1. Cadastro da wallet
Usuário informa endereço ETH ou SOL.

API blockchain (Etherscan/Helius) retorna lista de tokens e saldos.

Para cada token, chama CoinGecko Onchain API para obter coingecko_coin_id.

Salva no banco: endereço do token, símbolo, decimais, rede, coingecko_coin_id.

#2. Pooling de preços
Job no back-end varre todas as carteiras e gera lista única de IDs.

Chama /coins/markets da CoinGecko (ou Binance para moedas suportadas) em lote.

Armazena preços no cache (Redis) por 30–60 segundos.

Front-end consome dados do seu back-end, não diretamente da CoinGecko.

#3. Exibição de gráficos
Quando o usuário abre o gráfico de um ativo:

Verifica se histórico está no cache.

Se não estiver, chama /market_chart (CoinGecko) ou /klines (Binance).

Alimenta a TradingView Charting Library com os dados.

Aplica indicadores técnicos no front-end ou no back-end.

#4. Alertas
Usuário define gatilhos (ex.: preço > X, variação > Y%).

Back-end monitora preços no cache.

Quando condição é atendida, envia push notification via FCM/OneSignal.

#5. Otimizações
Lazy loading: só busca histórico quando o gráfico for aberto.

Agrupamento: várias moedas em uma chamada.

Cache compartilhado: evita chamadas repetidas para o mesmo ativo.

Prioridade: moedas mais populares atualizadas com mais frequência.
