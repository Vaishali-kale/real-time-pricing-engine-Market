import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";

import { config } from "./config.js";
import { SYMBOL_SET } from "./symbols.js";
import {
  updatePrice,
  getSnapshot
} from "./pricing.js";
import { UpstreamFeed } from "./upstream/UpstreamFeed.js";

const app = express();

app.use(cors());

app.use(express.json());


// =============================
// HTTP SERVER
// =============================

const server =
  http.createServer(app);


// =============================
// HEALTH CHECK
// =============================

app.get(
  "/health",
  (req, res) => {
    res.json({
      success: true,
      message:
        "Server is running"
    });
  }
);


// =============================
// WEBSOCKET SERVER
// =============================

const wss =
  new WebSocketServer({
    server,
    path: "/ws"
  });


// =============================
// CLIENTS
// =============================

const clients =
  new Set();


// =============================
// BROADCAST
// =============================

function broadcast(message) {
  const text =
    JSON.stringify(message);

  for (const client of clients) {
    if (
      client.readyState === 1
    ) {
      client.send(text);
    }
  }
}


// =============================
// REACT CLIENT CONNECT
// =============================

wss.on(
  "connection",
  (ws) => {

    console.log(
      "React client connected"
    );

    clients.add(ws);

    // Send connected
    ws.send(
      JSON.stringify({
        type: "connected",
        message:
          "WebSocket connection successful"
      })
    );


    // Send current snapshot
    const snapshot =
      getSnapshot();

    if (
      Object.keys(snapshot)
        .length > 0
    ) {
      ws.send(
        JSON.stringify({
          type: "snapshot",
          data: snapshot
        })
      );
    }


    // =========================
    // CLIENT MESSAGE
    // =========================

    ws.on(
      "message",
      (buffer) => {

        let message;

        try {
          message =
            JSON.parse(
              buffer.toString()
            );
        } catch {
          ws.send(
            JSON.stringify({
              type: "error",
              message:
                "Invalid JSON"
            })
          );

          return;
        }

        console.log(
          "Message from React:",
          message
        );


        // Subscribe
        if (
          message.action ===
          "subscribe"
        ) {

          const requested =
            Array.isArray(
              message.symbols
            )
              ? message.symbols
              : [];


          const symbols =
            requested
              .map((symbol) =>
                String(
                  symbol
                ).toUpperCase()
              )
              .filter((symbol) =>
                SYMBOL_SET.has(
                  symbol
                )
              );


          ws.send(
            JSON.stringify({
              type: "subscribed",
              symbols
            })
          );
        }
      }
    );


    // =========================
    // DISCONNECT
    // =========================

    ws.on(
      "close",
      () => {

        console.log(
          "React client disconnected"
        );

        clients.delete(ws);
      }
    );
  }
);


// =============================
// UPSTREAM FEED
// =============================

const feed =
  new UpstreamFeed(

    // ON TICK
    (tick) => {

      const price =
        updatePrice(tick);

      if (!price) {
        return;
      }

      console.log(
        "PRICE UPDATE:",
        price
      );

      broadcast({
        type: "tick",
        data: price
      });
    },


    // ON STATUS
    (status) => {

      console.log(
        "UPSTREAM STATUS:",
        status
      );

      broadcast({
        type: "upstreamStatus",
        data: status
      });
    }
  );


// =============================
// START SERVER
// =============================

server.listen(
  config.port,
  () => {

    console.log(
      `Server running on port ${config.port}`
    );

    console.log(
      `WebSocket running at ws://localhost:${config.port}/ws`
    );

    feed.start();
  }
);

