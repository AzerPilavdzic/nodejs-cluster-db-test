function sleep(ms){ Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms); }

sleep(8000);

const cfg = {
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 }, // prefer mongo1 as primary
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 1 }
  ]
};

try {
  rs.initiate(cfg);
  print("Replica set initiated.");
} catch (e) {
  print("rs.initiate (maybe already):", e.message);
}

sleep(2000);
const dbx = db.getSiblingDB("demo");
dbx.ticks.insertOne({ bootSeed: true, ts: new Date() });
print("Seed doc inserted into demo.ticks");
