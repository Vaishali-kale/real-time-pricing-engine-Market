import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 5000),

  redisUrl:
    process.env.REDIS_URL ||
    "redis://localhost:6379",

  upstreamUrl:
    process.env.UPSTREAM_WS_URL,

  apiKey:
    process.env.UPSTREAM_API_KEY,

  secret:
    process.env.UPSTREAM_SECRET
};

if (!config.upstreamUrl) {
  throw new Error(
    "UPSTREAM_WS_URL is missing in .env"
  );
}

if (!config.apiKey) {
  throw new Error(
    "UPSTREAM_API_KEY is missing in .env"
  );
}

if (!config.secret) {
  throw new Error(
    "UPSTREAM_SECRET is missing in .env"
  );
}