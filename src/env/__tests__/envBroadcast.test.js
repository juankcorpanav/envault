const {
  registerChannel,
  unregisterChannel,
  listChannels,
  broadcast,
  consoleChannel,
  fileChannel,
  webhookChannel,
} = require('../envBroadcast');

const fs = require('fs');
const path = require('path');
const os = require('os');

// Reset channels between tests by re-requiring a fresh module
let mod;
beforeEach(() => {
  jest.resetModules();
  mod = require('../envBroadcast');
});

const event = { type: 'KEY_UPDATED', vault: 'dev', key: 'API_KEY', actor: 'alice' };

test('registerChannel and listChannels', () => {
  mod.registerChannel('test', async () => {});
  expect(mod.listChannels()).toContain('test');
});

test('registerChannel throws if handler is not a function', () => {
  expect(() => mod.registerChannel('bad', 'not-a-function')).toThrow('handler must be a function');
});

test('unregisterChannel removes channel', () => {
  mod.registerChannel('ch', async () => {});
  expect(mod.unregisterChannel('ch')).toBe(true);
  expect(mod.listChannels()).not.toContain('ch');
});

test('broadcast calls all registered channels', async () => {
  const calls = [];
  mod.registerChannel('a', async (e) => calls.push({ ch: 'a', e }));
  mod.registerChannel('b', async (e) => calls.push({ ch: 'b', e }));
  const results = await mod.broadcast(event);
  expect(calls).toHaveLength(2);
  expect(results).toEqual([
    { channel: 'a', ok: true },
    { channel: 'b', ok: true },
  ]);
});

test('broadcast adds timestamp if missing', async () => {
  let received;
  mod.registerChannel('ts', async (e) => { received = e; });
  await mod.broadcast({ type: 'TEST', vault: 'x' });
  expect(received.timestamp).toBeDefined();
});

test('broadcast captures channel errors without throwing', async () => {
  mod.registerChannel('fail', async () => { throw new Error('oops'); });
  const results = await mod.broadcast(event);
  expect(results[0]).toMatchObject({ channel: 'fail', ok: false, error: 'oops' });
});

test('consoleChannel logs to console', async () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const ch = mod.consoleChannel();
  await ch({ type: 'TEST', vault: 'v', timestamp: '2024-01-01T00:00:00.000Z' });
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('TEST'));
  spy.mockRestore();
});

test('fileChannel appends JSON lines to file', async () => {
  const tmpFile = path.join(os.tmpdir(), `envault-broadcast-test-${Date.now()}.log`);
  const ch = mod.fileChannel(tmpFile);
  await ch({ type: 'KEY_ADDED', vault: 'prod', timestamp: '2024-01-01T00:00:00.000Z' });
  const content = fs.readFileSync(tmpFile, 'utf8');
  expect(JSON.parse(content.trim())).toMatchObject({ type: 'KEY_ADDED', vault: 'prod' });
  fs.unlinkSync(tmpFile);
});

test('webhookChannel posts event and resolves on ok response', async () => {
  const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  const ch = mod.webhookChannel('https://example.com/hook', mockFetch);
  await expect(ch(event)).resolves.toBeUndefined();
  expect(mockFetch).toHaveBeenCalledWith('https://example.com/hook', expect.objectContaining({ method: 'POST' }));
});

test('webhookChannel throws on non-ok response', async () => {
  const mockFetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
  const ch = mod.webhookChannel('https://example.com/hook', mockFetch);
  await expect(ch(event)).rejects.toThrow('503');
});
