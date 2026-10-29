import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_CHANNELS } from '../src/data/messagingData.js';

test('src/data/messagingData.ts does not contain hardcoded secret signing key', () => {
  const customWebhookChannel = INITIAL_CHANNELS.find((c) => c.id === 'custom_webhook');
  assert.ok(customWebhookChannel, 'custom_webhook channel should exist');
  assert.equal(customWebhookChannel.settings.secretSigningKey, '', 'secretSigningKey should be empty string by default');
  assert.equal(customWebhookChannel.isConfigured, false, 'custom_webhook should not be marked configured by default');
});

test('server.ts uses process.env for custom_webhook secretSigningKey and does not contain hardcoded whsec secret', () => {
  const serverContent = fs.readFileSync(path.resolve('server.ts'), 'utf-8');
  assert.equal(
    serverContent.includes('whsec_omnisend_default_key_2026'),
    false,
    'server.ts should not contain hardcoded key whsec_omnisend_default_key_2026'
  );
  assert.ok(
    serverContent.includes('process.env.CUSTOM_WEBHOOK_SECRET_SIGNING_KEY'),
    'server.ts should reference process.env.CUSTOM_WEBHOOK_SECRET_SIGNING_KEY'
  );
});
