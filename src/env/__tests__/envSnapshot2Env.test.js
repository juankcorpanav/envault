const {
  promoteEnvToSnapshot,
  demoteSnapshotToEnv,
  serializeForTransport,
  deserializeFromTransport,
} = require('../envSnapshot2Env');

jest.mock('../../secrets/envParser', () => ({
  parseEnv: (str) => Object.fromEntries(str.split('\n').filter(Boolean).map(l => l.split('='))),
  serializeEnv: (obj) => Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('\n'),
}));

jest.mock('../../snapshot/envSnapshot', () => ({
  createSnapshot: jest.fn(async (vault, data, meta) => `snap-${vault}-001`),
  loadSnapshot: jest.fn(async (vault, id) => ({
    data: { API_KEY: 'abc', DB_URL: 'postgres://localhost' },
  })),
}));

jest.mock('../envChecksum', () => ({
  computeChecksum: jest.fn(() => 'deadbeef'),
}));

describe('promoteEnvToSnapshot', () => {
  it('creates a snapshot and returns id + checksum', async () => {
    const result = await promoteEnvToSnapshot('myVault', { API_KEY: 'abc' }, 'v1');
    expect(result.snapshotId).toBe('snap-myVault-001');
    expect(result.checksum).toBe('deadbeef');
  });
});

describe('demoteSnapshotToEnv', () => {
  it('returns the env object from a snapshot', async () => {
    const env = await demoteSnapshotToEnv('myVault', 'snap-myVault-001');
    expect(env).toEqual({ API_KEY: 'abc', DB_URL: 'postgres://localhost' });
  });

  it('throws if snapshot data is missing', async () => {
    const { loadSnapshot } = require('../../snapshot/envSnapshot');
    loadSnapshot.mockResolvedValueOnce(null);
    await expect(demoteSnapshotToEnv('myVault', 'bad-id')).rejects.toThrow("Snapshot 'bad-id' not found");
  });
});

describe('serializeForTransport / deserializeFromTransport', () => {
  it('round-trips an env object through base64', () => {
    const original = { FOO: 'bar', BAZ: 'qux' };
    const payload = serializeForTransport(original);
    expect(typeof payload).toBe('string');
    const restored = deserializeFromTransport(payload);
    expect(restored).toEqual(original);
  });

  it('produces a valid base64 string', () => {
    const payload = serializeForTransport({ X: '1' });
    expect(() => Buffer.from(payload, 'base64')).not.toThrow();
  });
});
