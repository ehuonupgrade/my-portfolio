import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';

// Setup isolated express app matching server.ts route logic
function createTestApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/v1/webhooks/messenger', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const configuredToken = process.env.FB_MESSENGER_VERIFY_TOKEN;

    if (mode === 'subscribe' && configuredToken && token === configuredToken) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).json({ error: 'Forbidden: Verify token mismatch or unconfigured' });
    }
  });

  return app;
}

describe('Facebook Messenger Webhook Verification Security', () => {
  it('should verify webhook subscription when FB_MESSENGER_VERIFY_TOKEN matches hub.verify_token', async () => {
    process.env.FB_MESSENGER_VERIFY_TOKEN = 'secret_verify_token_123';
    const app = createTestApp();
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const challenge = 'challenge_code_999';
      const url = `http://localhost:${port}/api/v1/webhooks/messenger?hub.mode=subscribe&hub.verify_token=secret_verify_token_123&hub.challenge=${challenge}`;
      const res = await fetch(url);

      assert.equal(res.status, 200);
      const body = await res.text();
      assert.equal(body, challenge);
    } finally {
      server.close();
      delete process.env.FB_MESSENGER_VERIFY_TOKEN;
    }
  });

  it('should reject verification when hub.verify_token is incorrect', async () => {
    process.env.FB_MESSENGER_VERIFY_TOKEN = 'secret_verify_token_123';
    const app = createTestApp();
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const url = `http://localhost:${port}/api/v1/webhooks/messenger?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test`;
      const res = await fetch(url);

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error, 'Forbidden: Verify token mismatch or unconfigured');
    } finally {
      server.close();
      delete process.env.FB_MESSENGER_VERIFY_TOKEN;
    }
  });

  it('should reject verification when FB_MESSENGER_VERIFY_TOKEN environment variable is unconfigured', async () => {
    delete process.env.FB_MESSENGER_VERIFY_TOKEN;
    const app = createTestApp();
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      // Attempt using old hardcoded default token
      const url = `http://localhost:${port}/api/v1/webhooks/messenger?hub.mode=subscribe&hub.verify_token=omnisend_verify_token_2026&hub.challenge=test`;
      const res = await fetch(url);

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error, 'Forbidden: Verify token mismatch or unconfigured');
    } finally {
      server.close();
    }
  });
});
