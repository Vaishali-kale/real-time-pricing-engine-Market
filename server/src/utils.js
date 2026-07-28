export function normalizeTick(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const symbol = String(
    item.symbol ??
    item.s ??
    item.sym ??
    item.ticker ??
    ""
  ).toUpperCase();

  if (!symbol) {
    return null;
  }

  const bid = Number(
    item.bid ??
    item.b ??
    item.buy ??
    item.price
  );

  const ask = Number(
    item.ask ??
    item.a ??
    item.sell ??
    item.price
  );

  if (
    !Number.isFinite(bid) &&
    !Number.isFinite(ask)
  ) {
    return null;
  }

  let timestamp = Number(
    item.timestamp ??
    item.ts ??
    item.t ??
    Date.now()
  );

  if (!Number.isFinite(timestamp)) {
    timestamp = Date.now();
  }

  if (timestamp < 10000000000) {
    timestamp *= 1000;
  }

  const high = Number(
    item.high ??
    item.h ??
    item.high24h
  );

  const low = Number(
    item.low ??
    item.l ??
    item.low24h
  );

  const change = Number(
    item.change ??
    item.c ??
    item.changePercent ??
    item.percentage
  );

  return {
    symbol,

    bid: Number.isFinite(bid)
      ? bid
      : null,

    ask: Number.isFinite(ask)
      ? ask
      : null,

    high: Number.isFinite(high)
      ? high
      : null,

    low: Number.isFinite(low)
      ? low
      : null,

    change: Number.isFinite(change)
      ? change
      : null,

    timestamp
  };
}