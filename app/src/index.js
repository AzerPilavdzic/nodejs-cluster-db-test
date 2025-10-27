import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";

const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017";
const DB_NAME = process.env.DB_NAME || "tickerdb";
const COLLECTION = process.env.COLLECTION_NAME || "ticks";
const INTERVAL_MS = Number(process.env.INSERT_INTERVAL_MS || 5000);
const CONNECT_RETRY_ATTEMPTS=process.env.CONNECT_RETRY_ATTEMPTS || 30;
const DELAY_MS = process.DELAY_MS || 1000;
const MAX_POOL_SIZE= process.env.MAX_POOL_SIZE || 5;

let client;
let timer;

async function connectWithRetry(maxAttempts = CONNECT_RETRY_ATTEMPTS, delayMs = DELAY_MS) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const c = new MongoClient(MONGO_URL, { maxPoolSize: MAX_POOL_SIZE });
      await c.connect();
      return c;
    } catch (err) {
      console.log(`[Mongo] connect attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxAttempts) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

async function start() {
  client = await connectWithRetry();
  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION);

  await col.createIndex({ createdAt: -1 });

  console.log(
    `[Ticker] Connected. Inserting into ${DB_NAME}.${COLLECTION} every ${INTERVAL_MS}ms`
  );

  timer = setInterval(async () => {
    try {
      const id = randomUUID();
      const createdAt = new Date();
      const value = `value-${createdAt.toISOString()}-${id}`;

      const doc = { id, value, createdAt };
      await col.insertOne(doc);

      console.log(`[Ticker] Inserted ${id}`);
       console.log(`MONGO_URL: ${MONGO_URL}`);
       console.log(`DB_NAME: ${DB_NAME}`);
       console.log(`COLLECTION: ${COLLECTION}`);
    } catch (err) {
      console.error("[Ticker] Insert error:", err.message);
    }
  }, INTERVAL_MS);
}

async function shutdown(signal) {
  console.log(`[Ticker] Received ${signal}. Shutting down...`);
  if (timer) clearInterval(timer);
  if (client) await client.close().catch(() => {});
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch(err => {
  console.error("[Ticker] Fatal startup error:", err);
  process.exit(1);
});
