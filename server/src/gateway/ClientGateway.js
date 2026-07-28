import { WebSocketServer } from "ws";

export class ClientGateway {
  constructor(server) {
    this.wss = new WebSocketServer({
      server,
      path: "/ws"
    });

    this.clients = new Set();

    this.setup();
  }

  setup() {
    this.wss.on("connection", (ws) => {
      console.log("React client connected");

      const client = {
        ws,
        symbols: new Set()
      };

      this.clients.add(client);

      // Send connection message
      this.send(ws, {
        type: "connected",
        message: "WebSocket connection successful"
      });

      // Receive messages from React
      ws.on("message", (buffer) => {
        this.handleMessage(
          client,
          buffer.toString()
        );
      });

      // Client disconnected
      ws.on("close", () => {
        console.log("React client disconnected");

        this.clients.delete(client);
      });

      ws.on("error", (error) => {
        console.error(
          "Client WebSocket error:",
          error.message
        );

        this.clients.delete(client);
      });
    });
  }

  handleMessage(client, text) {
    let message;

    try {
      message = JSON.parse(text);
    } catch (error) {
      this.send(client.ws, {
        type: "error",
        message: "Invalid JSON"
      });

      return;
    }

    console.log(
      "Message from React:",
      message
    );

    // Subscribe
    if (message.action === "subscribe") {
      const symbols = Array.isArray(
        message.symbols
      )
        ? message.symbols
        : [];

      client.symbols = new Set(
        symbols.map((symbol) =>
          String(symbol).toUpperCase()
        )
      );

      this.send(client.ws, {
        type: "subscribed",
        symbols: [...client.symbols]
      });

      return;
    }

    // Unsubscribe
    if (message.action === "unsubscribe") {
      const symbols = Array.isArray(
        message.symbols
      )
        ? message.symbols
        : [];

      for (const symbol of symbols) {
        client.symbols.delete(
          String(symbol).toUpperCase()
        );
      }

      this.send(client.ws, {
        type: "unsubscribed",
        symbols
      });

      return;
    }

    // Unknown action
    this.send(client.ws, {
      type: "error",
      message: "Unknown action"
    });
  }

  // Send message to one client
  send(ws, data) {
    if (
      ws.readyState === ws.OPEN
    ) {
      ws.send(
        JSON.stringify(data)
      );
    }
  }

  // Broadcast a tick to subscribed clients
  broadcastTick(tick) {
    const symbol =
      tick.symbol.toUpperCase();

    const payload = {
      type: "tick",

      data: {
        s: symbol,
        b: tick.buy,
        a: tick.sell,
        t: tick.timestamp
      }
    };

    for (const client of this.clients) {
      if (
        client.symbols.has(symbol)
      ) {
        this.send(
          client.ws,
          payload
        );
      }
    }
  }

  // Broadcast any data
  broadcast(data) {
    for (const client of this.clients) {
      this.send(
        client.ws,
        data
      );
    }
  }
}