import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_CHANNELS } from '../src/data/messagingData';

test('src/data/messagingData.ts does not contain hardcoded secret signing key', () => {
  const customWebhook = INITIAL_CHANNELS.find((c) => c.id === 'custom_webhook');
  assert.ok(customWebhook, 'custom_webhook channel should exist');
  assert.equal(customWebhook.settings.secretSigningKey, '', 'secretSigningKey should be empty string by default');
  assert.equal(customWebhook.isConfigured, false, 'isConfigured should be false when secret key is not set');
});
