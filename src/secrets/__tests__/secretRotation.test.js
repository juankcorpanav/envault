const fs = require('fs');
const path = require('path');
const os = require('os');
const { generateSecret, rotateSecret, logRotation } = require('../secretRotation');
const { parseEnv, serializeEnv } = require('../envParser');

describe('generateSecret', () => {
  it('should generate a hex string of correct length', () => {
    const secret = generateSecret(32);
    expect(typeof secret).toBe('string');
    expect(secret).toHaveLength(64); // 32 bytes = 64 hex chars
  });

  it('should generate unique secrets each call', () => {
    const a = generateSecret();
    const b = generateSecret();
    expect(a).not.toBe(b);
  });
});

describe('rotateSecret', () => {
  const envVars = { DB_PASSWORD: 'oldpassword123', API_KEY: 'abc123' };

  it('should rotate an existing key with a new value', () => {
    const { updatedEnv, rotationRecord } = rotateSecret(envVars, 'DB_PASSWORD');
    expect(updatedEnv.DB_PASSWORD).not.toBe('oldpassword123');
    expect(rotationRecord.key).toBe('DB_PASSWORD');
    expect(rotationRecord.previousValue).toBe('oldpassword123');
    expect(rotationRecord.newValue).toBe(updatedEnv.DB_PASSWORD);
    expect(rotationRecord.rotatedAt).toBeDefined();
  });

  it('should not mutate the original envVars object', () => {
    rotateSecret(envVars, 'API_KEY');
    expect(envVars.API_KEY).toBe('abc123');
  });

  it('should throw an error for a non-existent key', () => {
    expect(() => rotateSecret(envVars, 'MISSING_KEY')).toThrow(
      'Key "MISSING_KEY" not found in env variables.'
    );
  });
});

describe('logRotation', () => {
  it('should write rotation record to a new history file', () => {
    const tmpFile = path.join(os.tmpdir(), `rotation-history-${Date.now()}.json`);
    const record = { key: 'API_KEY', previousValue: 'old', newValue: 'new', rotatedAt: new Date().toISOString() };

    logRotation(tmpFile, record);

    const saved = JSON.parse(fs.readFileSync(tmpFile, 'utf-8'));
    expect(saved).toHaveLength(1);
    expect(saved[0].key).toBe('API_KEY');

    fs.unlinkSync(tmpFile);
  });
});

describe('parseEnv + serializeEnv round-trip', () => {
  it('should parse and reserialize env content consistently', () => {
    const raw = `# comment\nDB_HOST=localhost\nDB_PASSWORD=secret123\nAPP_NAME="My App"`;
    const parsed = parseEnv(raw);
    expect(parsed.DB_HOST).toBe('localhost');
    expect(parsed.APP_NAME).toBe('My App');

    const serialized = serializeEnv(parsed);
    const reparsed = parseEnv(serialized);
    expect(reparsed).toEqual(parsed);
  });
});
