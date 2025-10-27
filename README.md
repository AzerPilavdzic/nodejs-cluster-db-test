# Node.js Cluster Database Test

This project demonstrates how to manage a **database cluster** with one **master** and two **slave** databases.  
It automatically handles replication and failover — if the master node goes down, one of the slaves is promoted to master and continues serving requests.

---

## Features

- Connects to a 3-node database cluster (1 master, 2 slaves)
- Periodically inserts and reads data to verify replication
- Detects database node failure
- Promotes a slave to master when the current master becomes unavailable
- Logs status and events to the console for monitoring

---
