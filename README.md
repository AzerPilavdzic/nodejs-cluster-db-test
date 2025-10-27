# Node – MongoDB Replica Set Demo

A simple Dockerized Node.js app that inserts a new document into a 5-node MongoDB replica set every second to demonstrate replication and automatic failover.

## Run the project

```bash
docker compose up
```

The app will start inserting data into MongoDB once a PRIMARY node is elected.

DB_NAME = `tickerdb`

COLLECTION = `ticks`

## Show last 5 inserted data
```
docker exec -it mongo1 mongosh \
  "mongodb://mongo1:27017,mongo2:27017,mongo3:27017,mongo4:27017,mongo5:27017/?replicaSet=rs0" \
  --eval 'db.getSiblingDB("tickerdb").ticks.find().sort({createdAt:-1}).limit(5).pretty()'
```

## Test failover

Stop the current primary (e.g., mongo1) and watch another node take over:

```bash
docker stop mongo1
docker exec -it mongo2 mongosh --eval 'rs.status().members.map(m=>({name:m.name,stateStr:m.stateStr}))'
```

The Node.js app will keep inserting automatically into the new PRIMARY.

## Remove all data and replica-set config (clean reset)

```bash
docker compose down -v
```
