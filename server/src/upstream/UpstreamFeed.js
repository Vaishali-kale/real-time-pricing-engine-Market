import WebSocket from "ws";

import { config } from "../config.js";
import {
  SYMBOLS,
  SYMBOL_SET
} from "../symbols.js";
import { normalizeTick } from "../utils.js";

export class UpstreamFeed {
  constructor(onTick, onStatus) {
    this.onTick = onTick;
    this.onStatus = onStatus;

    this.ws = null;

    this.retry = 0;

    this.closed = false;

    this.latestTimestamp = new Map();
  }

  start() {
    this.closed = false;

    this.connect();
  }

  stop() {
    this.closed = true;

    if (this.ws) {
      this.ws.close();
    }
  }

  connect() {
    if (this.closed) {
      return;
    }

    console.log(
      "Connecting to upstream..."
    );

    this.ws = new WebSocket(
      config.upstreamUrl
    );

    this.ws.on("open", () => {
      console.log(
        "Upstream WebSocket connected"
      );

      this.retry = 0;

      this.authenticate();
    });

    this.ws.on("message", (buffer) => {
      this.handleMessage(
        buffer.toString()
      );
    });

    this.ws.on("error", (error) => {
      console.error(
        "Upstream error:",
        error.message
      );
    });

    this.ws.on("close", () => {
      console.log(
        "Upstream connection closed"
      );

      this.reconnect();
    });
  }

  authenticate() {
    const message = {
      action: "auth",
      api_key: config.apiKey,
      secret: config.secret
    };

    console.log(
      "Sending authentication..."
    );

    this.ws.send(
      JSON.stringify(message)
    );
  }

  subscribe() {
    const message = {
      action: "subscribeMarketPrice",
      symbols: SYMBOLS
    };

    console.log(
      "Subscribing to market prices..."
    );

    this.ws.send(
      JSON.stringify(message)
    );
  }

  handleMessage(text) {
    let message;

    try {
      message = JSON.parse(text);
    } catch {
      console.log(
        "Invalid upstream JSON:",
        text
      );

      return;
    }

    console.log(
      "UPSTREAM MESSAGE:",
      JSON.stringify(
        message,
        null,
        2
      )
    );

    // Authentication success
    const authSuccess =
      message?.success === true ||
      message?.authenticated === true ||
      message?.status ===
        "authenticated";

    if (authSuccess) {
      console.log(
        "Authentication successful"
      );

      this.subscribe();

      this.onStatus?.({
        connected: true,
        message: "subscribed"
      });

      return;
    }

    // Authentication error
    if (
      message?.success === false ||
      message?.error
    ) {
      console.error(
        "Upstream error response:",
        message
      );

      this.onStatus?.({
        connected: false,
        message:
          message?.error ||
          "Upstream error"
      });

      return;
    }

    // Extract data
    let data = [];

    if (Array.isArray(message)) {
      data = message;
    } else if (
      Array.isArray(message?.data)
    ) {
      data = message.data;
    } else if (message?.data) {
      data = [message.data];
    } else {
      data = [message];
    }

    for (const item of data) {
      const tick =
        normalizeTick(item);

      if (!tick) {
        console.log(
          "Could not normalize:",
          item
        );

        continue;
      }

      if (
        !SYMBOL_SET.has(
          tick.symbol
        )
      ) {
        console.log(
          "Unknown symbol:",
          tick.symbol
        );

        continue;
      }

      const previous =
        this.latestTimestamp.get(
          tick.symbol
        ) || 0;

      if (
        tick.timestamp <
        previous
      ) {
        continue;
      }

      this.latestTimestamp.set(
        tick.symbol,
        tick.timestamp
      );

      console.log(
        "LIVE TICK:",
        tick
      );

      this.onTick?.(tick);
    }
  }

  reconnect() {
    if (this.closed) {
      return;
    }

    const delay = Math.min(
      30000,
      1000 *
        2 ** this.retry
    );

    this.retry++;

    console.log(
      `Reconnecting in ${delay}ms`
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }
}