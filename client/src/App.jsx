import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

const WS_URL =
  "wss://real-time-pricing-engine-market.onrender.com/ws";

const ALL_SYMBOLS = [
  "AUDUSD", "AUDCAD", "AUDCHF", "AUDJPY", "AUDNZD", "AUDSGD",
  "CADCHF", "CADJPY", "CHFJPY", "CHFSGD",
  "EURAUD", "EURCAD", "EURCHF", "EURGBP", "EURJPY", "EURNZD", "EURUSD",
  "GBPAUD", "GBPCAD", "GBPCHF", "GBPJPY", "GBPNZD", "GBPUSD",
  "NZDCAD", "NZDCHF", "NZDJPY", "NZDUSD",
  "USDCAD", "USDCHF", "USDCNH", "USDJPY", "USDMXN",
  "USDNOK", "USDPLN", "USDSEK", "USDSGD", "USDTRY", "USDZAR",
  "EURTRY", "GBPTRY", "NOKJPY", "SEKJPY", "SGDJPY", "ZARJPY",
  "XAUUSD", "XAGUSD",
  "BTCUSD", "ETHUSD", "BNBUSD", "SOLUSD", "XRPUSD",
  "ADAUSD", "DOGUSD", "DOTUSD", "LTCUSD", "BCHUSD",
  "XLMUSD", "TRXUSD", "UNIUSD", "FILUSD", "AVXUSD"
];

const DEFAULT_SYMBOLS = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "XAUUSD",
  "BTCUSD"
];

function App() {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const manuallyClosedRef = useRef(false);

  const [status, setStatus] = useState("Connecting");
  const [prices, setPrices] = useState({});
  const [selectedSymbols, setSelectedSymbols] =
    useState(DEFAULT_SYMBOLS);

  const sendSubscription = useCallback(
    (ws, symbols) => {
      if (
        !ws ||
        ws.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      const message = {
        action: "subscribe",
        symbols
      };

      console.log(
        "Subscription sent:",
        symbols
      );

      ws.send(JSON.stringify(message));
    },
    []
  );

  const handleMessage = useCallback(
    (message) => {
      console.log(
        "Backend message:",
        message
      );

      // Backend connection
      if (message.type === "connected") {
        console.log(
          "Backend:",
          message.message
        );
        return;
      }

      // Subscription confirmation
      if (message.type === "subscribed") {
        console.log(
          "Subscribed:",
          message.symbols
        );
        return;
      }

      // Upstream status
      if (message.type === "upstreamStatus") {
        console.log(
          "UPSTREAM STATUS:",
          message.data
        );

        if (
          message.data?.connected === true
        ) {
          setStatus("Live");
        }

        return;
      }

      // Initial prices
      if (message.type === "snapshot") {
        console.log(
          "SNAPSHOT:",
          message.data
        );

        setPrices((previous) => ({
          ...previous,
          ...message.data
        }));

        return;
      }

      // Live price
      if (message.type === "tick") {
        console.log(
          "LIVE PRICE FROM BACKEND:",
          message.data
        );

        const symbol =
          message.data?.s;

        if (!symbol) {
          return;
        }

        setPrices((previous) => ({
          ...previous,
          [symbol]: {
            ...previous[symbol],
            ...message.data
          }
        }));

        return;
      }

      // Error
      if (message.type === "error") {
        console.error(
          "Backend error:",
          message.message
        );
      }
    },
    []
  );

  const connectWebSocket = useCallback(() => {
    if (manuallyClosedRef.current) {
      return;
    }

    // Prevent duplicate connections
    if (
      wsRef.current &&
      (
        wsRef.current.readyState ===
          WebSocket.OPEN ||
        wsRef.current.readyState ===
          WebSocket.CONNECTING
      )
    ) {
      return;
    }

    console.log(
      "Connecting:",
      WS_URL
    );

    setStatus("Connecting");

    const ws = new WebSocket(WS_URL);

    wsRef.current = ws;

    ws.onopen = () => {
      console.log(
        "WebSocket connected"
      );

      reconnectAttemptRef.current = 0;

      setStatus("Connected");

      sendSubscription(
        ws,
        selectedSymbols
      );
    };

    ws.onmessage = (event) => {
      try {
        const message =
          JSON.parse(event.data);

        handleMessage(message);
      } catch (error) {
        console.error(
          "Invalid WebSocket message:",
          event.data
        );
      }
    };

    ws.onerror = (error) => {
      console.error(
        "WebSocket error:",
        error
      );

      setStatus("Error");
    };

    ws.onclose = () => {
      console.log(
        "WebSocket disconnected"
      );

      wsRef.current = null;

      if (
        manuallyClosedRef.current
      ) {
        return;
      }

      setStatus("Reconnecting");

      const attempt =
        reconnectAttemptRef.current;

      const delay = Math.min(
        30000,
        1000 *
          Math.pow(2, attempt)
      );

      reconnectAttemptRef.current =
        attempt + 1;

      console.log(
        `Trying WebSocket reconnect in ${delay}ms`
      );

      clearTimeout(
        reconnectTimerRef.current
      );

      reconnectTimerRef.current =
        setTimeout(() => {
          connectWebSocket();
        }, delay);
    };
  }, [
    handleMessage,
    selectedSymbols,
    sendSubscription
  ]);

  // Initial connection
  useEffect(() => {
    manuallyClosedRef.current = false;

    connectWebSocket();

    return () => {
      manuallyClosedRef.current = true;

      clearTimeout(
        reconnectTimerRef.current
      );

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);

  // Update subscription
  useEffect(() => {
    const ws = wsRef.current;

    if (
      ws &&
      ws.readyState === WebSocket.OPEN
    ) {
      sendSubscription(
        ws,
        selectedSymbols
      );
    }
  }, [
    selectedSymbols,
    sendSubscription
  ]);

  function toggleSymbol(symbol) {
    setSelectedSymbols((previous) => {
      if (previous.includes(symbol)) {
        return previous.filter(
          (item) => item !== symbol
        );
      }

      return [
        ...previous,
        symbol
      ];
    });
  }

  function formatPrice(value) {
    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(Number(value))
    ) {
      return "Waiting...";
    }

    return Number(value).toFixed(5);
  }

  function formatChange(value) {
    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(Number(value))
    ) {
      return "Waiting...";
    }

    const number = Number(value);

    return `${number > 0 ? "+" : ""}${number.toFixed(4)}%`;
  }

  function formatTime(timestamp) {
    if (!timestamp) {
      return "Waiting...";
    }

    const date = new Date(
      Number(timestamp)
    );

    if (
      Number.isNaN(date.getTime())
    ) {
      return "Waiting...";
    }

    return date.toLocaleTimeString();
  }

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

        <div
          className={`status ${
            status === "Live"
              ? "live"
              : ""
          }`}
        >
          ● {status}
        </div>

      </div>

      {/* SYMBOLS */}

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
                  toggleSymbol(symbol)
                }
              >
                {symbol}
              </button>
            )
          )}

        </div>

      </div>

      {/* MARKET DATA */}

      <div className="card">

        <h2>
          Market Data
        </h2>

        <div className="table-container">

          <table>

            <thead>
              <tr>
                <th>Symbol</th>
                <th>Buy</th>
                <th>Sell</th>
                <th>24h High</th>
                <th>24h Low</th>
                <th>24h Change</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>

              {selectedSymbols.map(
                (symbol) => {

                  const price =
                    prices[symbol];

                  const change =
                    Number(
                      price?.c
                    );

                  return (
                    <tr key={symbol}>

                      <td>
                        <strong>
                          {symbol}
                        </strong>
                      </td>

                      <td className="buy">
                        {formatPrice(
                          price?.b
                        )}
                      </td>

                      <td className="sell">
                        {formatPrice(
                          price?.a
                        )}
                      </td>

                      <td>
                        {formatPrice(
                          price?.h
                        )}
                      </td>

                      <td>
                        {formatPrice(
                          price?.l
                        )}
                      </td>

                      <td
                        className={
                          change > 0
                            ? "positive"
                            : change < 0
                            ? "negative"
                            : ""
                        }
                      >
                        {formatChange(
                          price?.c
                        )}
                      </td>

                      <td>
                        {formatTime(
                          price?.t
                        )}
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