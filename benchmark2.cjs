const http = require('http');
const fs = require('fs');
const path = require('path');

const iterations = 500;
let syncLogLatencies = [];
let trafficLatencies = [];

// Prepare a large token_logs.json file
const logsPath = path.join(__dirname, 'server-data', 'user_token_logs.json');
const initialData = Array(100).fill({
    date: 'old_date',
    syncedAt: new Date().toISOString(),
    dummy: 'x'.repeat(1024) // 1KB per entry, 100KB total
});
if (!fs.existsSync(path.dirname(logsPath))) {
    fs.mkdirSync(path.dirname(logsPath), { recursive: true });
}
fs.writeFileSync(logsPath, JSON.stringify(initialData, null, 2));

async function makeRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : {}
    }, (res) => {
      res.resume();
      res.on('end', () => {
        const end = process.hrtime.bigint();
        resolve(Number(end - start) / 1e6);
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runBenchmark() {
  console.log('Warming up...');
  await makeRequest('/api/traffic', 'GET');
  await makeRequest('/api/tokens/sync-log', 'POST', { date: 'test' });

  console.log('Starting benchmark...');
  const promises = [];

  // Fire sync-log requests
  for (let i = 0; i < iterations; i++) {
    promises.push(
      makeRequest('/api/tokens/sync-log', 'POST', { date: 'test-' + i })
        .then(t => syncLogLatencies.push(t))
    );
  }

  // Concurrently fire traffic requests to see if they are blocked
  for (let i = 0; i < iterations; i++) {
    promises.push(
      makeRequest('/api/traffic', 'GET')
        .then(t => trafficLatencies.push(t))
    );
  }

  await Promise.all(promises);

  const avgTraffic = trafficLatencies.reduce((a, b) => a + b, 0) / trafficLatencies.length;
  const avgSyncLog = syncLogLatencies.reduce((a, b) => a + b, 0) / syncLogLatencies.length;

  console.log(`Average traffic latency: ${avgTraffic.toFixed(2)} ms`);
  console.log(`Average sync-log latency: ${avgSyncLog.toFixed(2)} ms`);
}

runBenchmark().catch(console.error);
