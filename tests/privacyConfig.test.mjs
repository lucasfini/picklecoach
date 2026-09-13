import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appConfig = JSON.parse(
  readFileSync(new URL('../app.json', import.meta.url), 'utf8'),
).expo;

function pluginOptions(name) {
  const plugin = appConfig.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === name,
  );
  assert.ok(plugin, `${name} must remain configured.`);
  return plugin[1];
}

test('keeps capture silent and removes unused audio permissions', () => {
  const camera = pluginOptions('expo-camera');
  const imagePicker = pluginOptions('expo-image-picker');

  assert.equal(camera.microphonePermission, false);
  assert.equal(camera.recordAudioAndroid, false);
  assert.equal(imagePicker.microphonePermission, false);
});

test('keeps the native target aligned with the validated product scope', () => {
  assert.equal(appConfig.ios.supportsTablet, false);
  assert.equal(appConfig.ios.config.usesNonExemptEncryption, false);
  assert.equal(appConfig.orientation, 'portrait');
});
