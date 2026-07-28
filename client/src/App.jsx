import {
  useEffect,
  useRef,
  useState
} from "react";

import "./App.css";

const ALL_SYMBOLS = [
 "AUDUSD",
  "AUDCAD",
  "AUDCHF",
  "AUDJPY",
  "AUDNZD",
  "AUDSGD",

  "CADCHF",
  "CADJPY",

  "CHFJPY",
  "CHFSGD",

  "EURAUD",
  "EURCAD",
  "EURCHF",
  "EURGBP",
  "EURJPY",
  "EURNZD",
  "EURUSD",

  "GBPAUD",
  "GBPCAD",
  "GBPCHF",
  "GBPJPY",
  "GBPNZD",
  "GBPUSD",

  "NZDCAD",
  "NZDCHF",
  "NZDJPY",
  "NZDUSD",

  "USDCAD",
  "USDCHF",
  "USDCNH",
  "USDJPY",
  "USDMXN",
  "USDNOK",
  "USDPLN",
  "USDSEK",
  "USDSGD",
  "USDTRY",
  "USDZAR",

  "EURTRY",
  "GBPTRY",

  "NOKJPY",
  "SEKJPY",
  "SGDJPY",
  "ZARJPY",

  "XAUUSD",
  "XAGUSD",

  "BTCUSD",
  "ETHUSD",
  "BNBUSD",
  "SOLUSD",
  "XRPUSD",
  "ADAUSD",
  "DOGUSD",
  "DOTUSD",
  "LTCUSD",
  "BCHUSD",
  "XLMUSD",
  "TRXUSD",
  "UNIUSD",
  "FILUSD",
  "AVXUSD"
];

function App() {

  const wsRef =
    useRef(null);

  const [
    status,
    setStatus
  ] = useState("Connecting");

  const [
    prices,
    setPrices
  ] = useState({});

  const [
    selectedSymbols,
    setSelectedSymbols
  ] = useState([
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "XAUUSD",
    "BTCUSD"
  ]);


  // =========================
  // CONNECT
  // =========================

  useEffect(() => {

    const ws =
      new WebSocket(
        "ws://localhost:5000/ws"
      );

    wsRef.current = ws;


    ws.onopen = () => {

      console.log(
        "Connected to Node WebSocket"
      );

      setStatus(
        "Connected"
      );

      sendSubscription(
        ws,
        selectedSymbols
      );
    };


    ws.onmessage = (
      event
    ) => {

      console.log(
        "Received:",
        event.data
      );

      try {

        const message =
          JSON.parse(
            event.data
          );

        handleMessage(
          message
        );

      } catch (error) {

        console.error(
          "Invalid WebSocket message:",
          error
        );
      }
    };


    ws.onerror = (
      error
    ) => {

      console.error(
        "WebSocket Error:",
        error
      );

      setStatus(
        "Error"
      );
    };


    ws.onclose = () => {

      console.log(
        "WebSocket disconnected"
      );

      setStatus(
        "Disconnected"
      );
    };


    return () => {

      ws.close();

    };

  }, []);


  // =========================
  // SEND SUBSCRIPTION
  // =========================

  function sendSubscription(
    ws,
    symbols
  ) {

    if (
      ws &&
      ws.readyState ===
        WebSocket.OPEN
    ) {

      ws.send(
        JSON.stringify({
          action:
            "subscribe",
          symbols
        })
      );

      console.log(
        "Subscribed:",
        symbols
      );
    }
  }


  // =========================
  // HANDLE MESSAGE
  // =========================

  function handleMessage(
    message
  ) {

    if (
      message.type ===
      "connected"
    ) {

      console.log(
        "Backend:",
        message.message
      );

      return;
    }


    if (
      message.type ===
      "subscribed"
    ) {

      console.log(
        "Subscribed symbols:",
        message.symbols
      );

      return;
    }


    if (
      message.type ===
      "upstreamStatus"
    ) {

      console.log(
        "Upstream:",
        message.data
      );

      return;
    }


    if (
      message.type ===
      "snapshot"
    ) {

      setPrices(
        (previous) => ({
          ...previous,
          ...message.data
        })
      );

      return;
    }


    if (
      message.type ===
      "tick"
    ) {

      const symbol =
        message.data.s;

      setPrices(
        (previous) => ({
          ...previous,

          [symbol]: {
            ...previous[
              symbol
            ],
            ...message.data
          }
        })
      );

      return;
    }


    if (
      message.type ===
      "error"
    ) {

      console.error(
        "Backend error:",
        message.message
      );
    }
  }


  // =========================
  // SYMBOL TOGGLE
  // =========================

  function toggleSymbol(
    symbol
  ) {

    setSelectedSymbols(
      (previous) => {

        if (
          previous.includes(
            symbol
          )
        ) {

          return previous.filter(
            (item) =>
              item !== symbol
          );
        }

        return [
          ...previous,
          symbol
        ];
      }
    );
  }


  // =========================
  // UPDATE SUBSCRIPTION
  // =========================

  useEffect(() => {

    if (
      wsRef.current &&
      wsRef.current.readyState ===
        WebSocket.OPEN
    ) {

      sendSubscription(
        wsRef.current,
        selectedSymbols
      );
    }

  }, [
    selectedSymbols
  ]);


  // =========================
  // UI
  // =========================

  return (

    <div className="app">

      <div className="header">

        <div>

          <h1>
            Real-Time Pricing Engine
          </h1>

          <p>
            Live Market Price Dashboard
          </p>

        </div>


        <div className="status">

          ● {status}

        </div>

      </div>


      <div className="card">

        <h2>
          Select Symbols
        </h2>


        <div className="symbols">

          {ALL_SYMBOLS.map(
            (symbol) => (

              <button
                key={symbol}
                className={
                  selectedSymbols.includes(
                    symbol
                  )
                    ? "symbol active"
                    : "symbol"
                }
                onClick={() =>
                  toggleSymbol(
                    symbol
                  )
                }
              >
                {symbol}
              </button>

            )
          )}

        </div>

      </div>


      <div className="card">

        <h2>
          Market Data
        </h2>


        <div className="table-container">

          <table>

            <thead>

              <tr>

                <th>
                  Symbol
                </th>

                <th>
                  Buy
                </th>

                <th>
                  Sell
                </th>

                <th>
                  24h High
                </th>

                <th>
                  24h Low
                </th>

                <th>
                  24h Change
                </th>

                <th>
                  Time
                </th>

              </tr>

            </thead>


            <tbody>

              {selectedSymbols.map(
                (symbol) => {

                  const price =
                    prices[
                      symbol
                    ];


                  return (

                    <tr
                      key={symbol}
                    >

                      <td>
                        <strong>
                          {symbol}
                        </strong>
                      </td>


                      <td>
                        {price?.b ??
                          "-"}
                      </td>


                      <td>
                        {price?.a ??
                          "-"}
                      </td>


                      <td>
                        {price?.h ??
                          "-"}
                      </td>


                      <td>
                        {price?.l ??
                          "-"}
                      </td>


                      <td
                        className={
                          price?.c > 0
                            ? "positive"
                            : price?.c < 0
                            ? "negative"
                            : ""
                        }
                      >

                        {price?.c !==
                        undefined
                          ? `${price.c}%`
                          : "-"}

                      </td>


                      <td>

                        {price?.t
                          ? new Date(
                              price.t
                            ).toLocaleTimeString()
                          : "-"}

                      </td>

                    </tr>

                  );

                }
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default App;