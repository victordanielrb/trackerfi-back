import axios from "axios";

export default async function GlobalData(){
  const url = 'https://api.coingecko.com/api/v3/global';
  const apikey = process.env.CG_DEMO_API_KEY || '';
const options = {method: 'GET', headers: {'x-cg-demo-api-key': apikey}};
  const btcPriceUrl = 'https://api.coingecko.com/api/v3/coins/bitcoin';
  const ethPriceUrl = 'https://api.coingecko.com/api/v3/coins/ethereum';
try {
  const response = await axios.get(url, options);
  const btcResponse = await axios.get(btcPriceUrl, options);
  const ethResponse = await axios.get(ethPriceUrl, options);

  // debug
  console.log('BTC Price Response (usd):', btcResponse?.data?.market_data?.current_price?.usd);
  console.log('ETH Price Response (usd):', ethResponse?.data?.market_data?.current_price?.usd);
  // extract numeric USD prices from coin detail responses
  const btcPrice = btcResponse?.data?.market_data?.current_price?.usd ?? 0;
  const ethPrice = ethResponse?.data?.market_data?.current_price?.usd ?? 0;
  const data = response.data;
  // get BRL and EUR price
  const usd_mc = data.data.total_market_cap.usd;
  const brl_mc = data.data.total_market_cap.brl;
  const eur_mc = data.data.total_market_cap.eur;
  // compute numeric rates (keep as numbers)
  const eur_price = usd_mc ? (eur_mc / usd_mc) : null;
  const brl_price = usd_mc ? (brl_mc / usd_mc) : null;
  const mc = data.data.total_market_cap?.usd ?? 0;
  const btc_dominance = Number(data.data.market_cap_percentage?.btc ?? 0);
  const eth_dominance = Number(data.data.market_cap_percentage?.eth ?? 0);
  const mc_24h_change = Number(data.data.market_cap_change_percentage_24h_usd ?? data.data.market_cap_change_percentage_24h ?? 0);
  const volume = data.data.total_volume?.usd ?? 0;
  return {
    prices: {
      brl: brl_price,
      eur: eur_price
    },
    data : {
      market_cap: mc,
      btc_dominance: btc_dominance,
      eth_dominance: eth_dominance,
      btc_price: btcPrice,
      eth_price: ethPrice,
      volume_24h: volume,
      market_cap_change_24h: mc_24h_change,
      updated_at: new Date().toISOString()
    }
  };


} catch (error) {
  console.error(error);
  // Return safe defaults so callers don't break when the external API fails
  return {
    prices: { brl: null, eur: null },
    data: {
      market_cap: 0,
      btc_dominance: 0,
      eth_dominance: 0,
      btc_price: 0,
      eth_price: 0,
      volume_24h: 0,
      market_cap_change_24h: 0,
      updated_at: new Date().toISOString()
    }
  };
}
}
