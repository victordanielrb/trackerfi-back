export default async function GlobalData(){
  const url = 'https://api.coingecko.com/api/v3/global';
  const apikey = process.env.CG_DEMO_API_KEY || '';
const options = {method: 'GET', headers: {'x-cg-demo-api-key': apikey}};

try {
  const response = await fetch(url, options);
  const data = await response.json();
  // get BRL and EUR price
  const usd_mc = data.data.total_market_cap.usd;
  const brl_mc = data.data.total_market_cap.brl;
  const eur_mc = data.data.total_market_cap.eur;
  const eur_price = (eur_mc / usd_mc).toFixed(4);
  const brl_price = (brl_mc / usd_mc).toFixed(4);
  const mc = data.data.total_market_cap.usd;
  const btc_dominance = data.data.market_cap_percentage.btc.toFixed(2);
  const volume = data.data.total_volume.usd;
  return {
    prices: {
      brl: brl_price,
      eur: eur_price
    },
    data : {
      market_cap: mc,
      btc_dominance: btc_dominance,
      volume_24h: volume
    }
  };


} catch (error) {
  console.error(error);
}
}
