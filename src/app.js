import { h, render } from 'preact-cycle';


const markets = {
  'tradogre': {},
  'tradesatoshi': {
    'orderbook': 'https://tradesatoshi.com/api/public/getorderbook?market=TRTL_BTC&type=both&depth=200'
  }
};


const START = (_, mutation) => {
  _.started = true;

  LISTEN_TO_TRADEOGRE(_, mutation);
  LISTEN_TO_TRADESATOSHI(_, mutation);
};

const LISTEN_TO_TRADEOGRE = (_, mutation) => {
  const socket = new WebSocket('wss://tradeogre.com:8080/');

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({"a":"submarket","name":"BTC-TRTL"}));

    setInterval(() => socket.send(JSON.stringify({"a":"submarket","name":"BTC-TRTL"})), 30 * 1000);
  });

  socket.addEventListener('message', ({data}) => {
    const obj = JSON.parse(data);

    if (obj.a === 'orders') {
      if (obj.t === 'buy') {
        mutation(NEW_MARKET_DATA)('tradeogre', 'buy', 'TRTL', Object.keys(obj.d).map((price) => [stringToSatoshis(price), parseFloat(obj.d[price])]));
      }
      else if (obj.t === 'sell') {
        mutation(NEW_MARKET_DATA)('tradeogre', 'sell', 'TRTL', Object.keys(obj.d).map((price) => [stringToSatoshis(price), parseFloat(obj.d[price])]));
      }
    }
  });
};

const LISTEN_TO_TRADESATOSHI = (_, mutation) => {
  fetch('https://tradesatoshi.com/api/public/getorderbook?market=TRTL_BTC&type=both&depth=50')
    .then(response => {
      console.log({response});
    })
    .catch(error => {
      console.log({error});
    });
};

const NEW_MARKET_DATA = (_, exchange, orderType, coin, data) => {
  const coinData = _.market[exchange][coin];
  coinData[orderType] = data;
  console.log(data.buy);
  coinData.totalBuyMarket = (coinData.buy || []).reduce((sum, [price, amount]) => sum + amount, 0);
  coinData.totalSellMarket = (coinData.sell || []).reduce((sum, [price, amount]) => sum + amount, 0);
  coinData.totalMarket = coinData.totalBuyMarket + coinData.totalSellMarket;
  console.log(_.market);
  return _;
};

const Markets = ({market}) => (
  <markets>
    {console.log({market})}
    {Object.keys(market['tradeogre']).map(coin => <Market coin={coin} data={market['tradeogre'][coin]} />)}
  </markets>
);

const Market = ({coin, data}) => (
  <market>
    <div>{coin} - {data.totalMarket}</div>
    <data>
      <buy>{(data.buy || []).map(([price, amount]) => <PriceBar price={price} amount={amount} ofTotalMarket={amount / data.totalMarket} />)}</buy>
      <sell>{(data.sell || []).map(([price, amount]) => <PriceBar price={price} amount={amount} ofTotalMarket={amount / data.totalMarket} />)}</sell>
    </data>
  </market>
);

const PriceBar = ({price, amount, ofTotalMarket}) => (
  <price-bar style={{'height': `${ofTotalMarket * 100}%`}} title={amount}>
    &nbsp;
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
      'tradeogre': {
        'TRTL': {

        }
      }
    }
  }, document.body
);


function stringToSatoshis(str) {
  const [big, little] = str.toString().split('.');
  return parseInt(little.padEnd(8, '0')) + parseInt(big) * 100000000
}