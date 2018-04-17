import { h, render } from 'preact-cycle';


const START = (_, mutation) => {
  _.started = true;

  LISTEN_TO_TRADEOGRE(_, mutation);
};

const LISTEN_TO_TRADEOGRE = (_, mutation) => {
  const socket = new WebSocket('wss://tradeogre.com:8080/');

  fetch('https://tradeogre.com/api/v1/markets')
    .then(response => response.json())
    .then(markets => {
      console.log(markets);
      const marketNames = markets.map(market => Object.keys(market)[0].split('-')[1]);
      let marketIndex = 0;

      socket.addEventListener('open', () => {
        const lastMarketCheckTime = new Date().getTime();

        marketNames.forEach(name => socket.send(JSON.stringify({'a': 'submarket', 'name': `BTC-${name}`})));

        // socket.send(JSON.stringify({"a":"submarket","name":"BTC-TRTL"}));

        // setInterval(() => socket.send(JSON.stringify({"a":"submarket","name":"BTC-TRTL"})), 30 * 1000);
      });

      socket.addEventListener('message', ({data}) => {
        const obj = JSON.parse(data);

        if (obj.a === 'orders') {
          if (obj.t === 'buy') {
            mutation(NEW_MARKET_DATA)('tradeogre', 'buy', marketNames[marketIndex], Object.keys(obj.d).map((price) => [stringToSatoshis(price), parseFloat(obj.d[price])]));
          }
          else if (obj.t === 'sell') {
            mutation(NEW_MARKET_DATA)('tradeogre', 'sell', marketNames[marketIndex++], Object.keys(obj.d).map((price) => [stringToSatoshis(price), parseFloat(obj.d[price])]));
          }
        }
      });
    })
    .catch(error => console.log('error fetching tradeogre markets!', error));
};

const NEW_MARKET_DATA = (_, exchange, orderType, coin, data) => {
  const coinData = (_.market[exchange][coin] = _.market[exchange][coin] || {});
  coinData[orderType] = data;

  coinData.statistics = {'amount': {max: -Infinity, min: Infinity}};
  coinData.sellStatistics = {'amount': {max: -Infinity, min: Infinity}};
  coinData.buyStatistics = {'amount': {max: -Infinity, min: Infinity}};

  coinData.totalBuyMarket = (coinData.buy || []).reduce((agg, [price, amount]) => {
    coinData.statistics.amount.max = Math.max(coinData.statistics.amount.max, amount);
    coinData.statistics.amount.min = Math.min(coinData.statistics.amount.min, amount);
    coinData.buyStatistics.amount.max = Math.max(coinData.buyStatistics.amount.max, amount);
    coinData.buyStatistics.amount.min = Math.min(coinData.buyStatistics.amount.min, amount);
    agg.totalBTCAmount += amount * price;
    agg.totalAmount += amount;
    return agg;
  }, {totalBTCAmount: 0, totalAmount: 0});

  coinData.totalSellMarket = (coinData.sell || []).reduce((agg, [price, amount]) => {
    coinData.statistics.amount.max = Math.max(coinData.statistics.amount.max, amount);
    coinData.statistics.amount.min = Math.min(coinData.statistics.amount.min, amount);
    coinData.sellStatistics.amount.max = Math.max(coinData.sellStatistics.amount.max, amount);
    coinData.sellStatistics.amount.min = Math.min(coinData.sellStatistics.amount.min, amount);
    agg.totalBTCAmount += amount * price;
    agg.totalAmount += amount;
    return agg;
  }, {totalBTCAmount: 0, totalAmount: 0});

  coinData.totalMarket = coinData.totalBuyMarket.totalAmount + coinData.totalSellMarket.totalAmount;

  return _;
};

const Markets = ({market}) => (
  <markets>
    <Summary exchange={market['tradeogre']} />
    <Charts exchange={market['tradeogre']} />
  </markets>
);

const Summary = ({exchange}) => (
  <summary>
    <Table headers={['Coin', 'Buy Market (btc)']} data={Object.keys(exchange)
                       .sort((a, b) => exchange[a].totalBuyMarket.totalBTCAmount > exchange[b].totalBuyMarket.totalBTCAmount ? -1 : 1)
                       .map(coin => [coin, (exchange[coin].totalBuyMarket.totalBTCAmount / 100000000).toFixed(8)])
                } />
  </summary>
);

const CoinSummary = ({coin, data}) => (
  <coin>
    {coin} - {(data.totalBuyMarket.totalBTCAmount / 100000000).toFixed(4)} btc
  </coin>
);

const Table = ({data, headers}) => (
  <table>
    {!headers ? undefined
              : <thead>
                {headers.map(header => <th>{header}</th>)}
                </thead>}
    <tbody>
      {data.map(row => <tr>{row.map(cell => <td>{cell}</td>)}</tr>)}
    </tbody>
  </table>
);

const Charts = ({exchange}) => (
  <charts>
    {console.log({exchange})}
    {Object.keys(exchange)
           .sort((a, b) => exchange[a].totalBuyMarket.totalBTCAmount > exchange[b].totalBuyMarket.totalBTCAmount ? -1 : 1)
           .map(coin => <Market coin={coin} data={exchange[coin]} />)}
  </charts>
);

const Market = ({coin, data}) => (
  <market>
    <div>{coin}| Total Market: ~{data.totalMarket.toFixed(0)} ||<buy>~{data.totalBuyMarket.totalAmount.toFixed(2)}</buy> to buy ({(data.totalBuyMarket.totalAmount / (data.totalBuyMarket.totalAmount + data.totalSellMarket.totalAmount)).toFixed(2)}) <sell>~{data.totalSellMarket.totalAmount.toFixed(2)}</sell> for sale  ({(data.totalSellMarket.totalAmount / (data.totalBuyMarket.totalAmount + data.totalSellMarket.totalAmount)).toFixed(2)})  [{(data.totalBuyMarket.totalAmount / data.totalSellMarket.totalAmount).toFixed(2)}]</div>
    <data>
      <buy style={{'width': data.totalBuyMarket.totalAmount / (data.totalBuyMarket.totalAmount + data.totalSellMarket.totalAmount) * 100 + '%'}}>{(data.buy || []).map(([price, amount]) => <PriceBar price={price} amount={amount} height={amount / data.statistics.amount.max} />)}</buy>
      <sell style={{'width': data.totalSellMarket.totalAmount / (data.totalBuyMarket.totalAmount + data.totalSellMarket.totalAmount) * 100 + '%'}}>{(data.sell || []).map(([price, amount]) => <PriceBar price={price} amount={amount} height={amount / data.statistics.amount.max} />)}</sell>
    </data>
  </market>
);

const PriceBar = ({price, amount, height}) => (
  <price-bar style={{'height': `${height * 100}%`}} title={amount}>
  </price-bar>
);

const View = (Component) => ({started, ...props}, {mutation}) => (
  <view>
    {started ? <Component {...props} /> : mutation(START)(mutation)}
  </view>
);

render(
  View(Markets), {
    'market': {
      'tradeogre': {}
    }
  }, document.body
);


function stringToSatoshis(str) {
  const [big, little] = str.toString().split('.');
  return parseInt(little.padEnd(8, '0')) + parseInt(big) * 100000000
}