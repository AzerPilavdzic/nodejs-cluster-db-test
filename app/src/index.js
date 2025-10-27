import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";

// Env with sensible defaults
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017";
const DB_NAME = process.env.DB_NAME || "tickerdb";
const COLLECTION = process.env.COLLECTION_NAME || "ticks";
const INTERVAL_MS = Number(process.env.INSERT_INTERVAL_MS || "1000");

let client;
let timer;

/** Simple retry loop for initial Mongo connect */
async function connectWithRetry(maxAttempts = 30, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const c = new MongoClient(MONGO_URL, { maxPoolSize: 5 });
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

  // Optional: create an index for time-based queries
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

      // Light log — comment out if too chatty
      console.log(`[Ticker] Inserted ${id}`);
    } catch (err) {
      console.error("[Ticker] Insert error:", err.message);
    }
  }, INTERVAL_MS);
}

// Graceful shutdown
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
