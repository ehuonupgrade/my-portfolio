import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'server-data');
const TOKEN_LOGS_FILE = path.join(DATA_DIR, 'user_token_logs.json');

test('POST /api/tokens/sync-log async functionality and file writing test', async () => {
  const testRecord = {
    date: '2026-03-30-test',
    promptTokens: 500,
    completionTokens: 200,
    totalTokens: 700,
  };

  const response = await fetch('http://localhost:3000/api/tokens/sync-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testRecord),
  });

  assert.strictEqual(response.status, 200);
  const data = await response.json();
  assert.strictEqual(data.success, true);
  assert.ok(typeof data.count === 'number');

  // Verify file content on disk
  assert.ok(fs.existsSync(TOKEN_LOGS_FILE));
  const fileContent = JSON.parse(await fs.promises.readFile(TOKEN_LOGS_FILE, 'utf-8'));
  const savedRecord = fileContent.find((r: any) => r.date === '2026-03-30-test');
  assert.ok(savedRecord);
  assert.strictEqual(savedRecord.promptTokens, 500);
  assert.strictEqual(savedRecord.completionTokens, 200);
  assert.ok(savedRecord.syncedAt);
});

test('POST /api/tokens/sync-log invalid record test', async () => {
  const response = await fetch('http://localhost:3000/api/tokens/sync-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  assert.strictEqual(response.status, 400);
  const data = await response.json();
  assert.strictEqual(data.error, 'Invalid record');
});
