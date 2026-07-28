const market = new Map();

export function updatePrice(tick) {
  const symbol = tick.symbol;

  const old = market.get(symbol);

  const current =
    tick.bid ??
    tick.ask;

  if (!Number.isFinite(current)) {
    return null;
  }

  if (!old) {
    const data = {
      s: symbol,
      b: tick.bid,
      a: tick.ask,
      h: current,
      l: current,
      c: 0,
      t: tick.timestamp,
      startPrice: current
    };

    market.set(symbol, data);

    return data;
  }

  const high = Math.max(
    old.h,
    current
  );

  const low = Math.min(
    old.l,
    current
  );

  const change =
    old.startPrice !== 0
      ? ((current - old.startPrice) /
          old.startPrice) *
        100
      : 0;

  const data = {
    s: symbol,
    b:
      tick.bid ??
      old.b,

    a:
      tick.ask ??
      old.a,

    h: high,

    l: low,

    c: Number(
      change.toFixed(4)
    ),

    t: tick.timestamp,

    startPrice:
      old.startPrice
  };

  market.set(symbol, data);

  return data;
}

export function getSnapshot() {
  const snapshot = {};

  for (const [symbol, data] of market) {
    snapshot[symbol] = {
      ...data
    };

    delete snapshot[symbol].startPrice;
  }

  return snapshot;
}