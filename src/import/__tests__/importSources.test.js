const { importFromJson, importFromBase64 } = require('../importSources');

describe('importFromJson', () => {
  it('parses a valid JSON string into a key-value map', () => {
    const json = JSON.stringify({ API_KEY: 'abc123', DB_HOST: 'localhost' });
    const result = importFromJson(json);
    expect(result).toEqual({ API_KEY: 'abc123', DB_HOST: 'localhost' });
  });

  it('accepts a plain object directly', () => {
    const result = importFromJson({ SECRET: 'mysecret' });
    expect(result).toEqual({ SECRET: 'mysecret' });
  });

  it('throws if JSON is an array', () => {
    expect(() => importFromJson('["a","b"]')).toThrow('JSON input must be a plain object');
  });

  it('throws if JSON is null', () => {
    expect(() => importFromJson('null')).toThrow('JSON input must be a plain object');
  });

  it('throws if a value is not a string', () => {
    expect(() => importFromJson({ PORT: 3000 })).toThrow('Value for key "PORT" must be a string');
  });

  it('throws on invalid JSON string', () => {
    expect(() => importFromJson('{not valid json')).toThrow('importFromJson failed');
  });

  it('returns empty object for empty JSON object', () => {
    expect(importFromJson('{}')).toEqual({});
  });
});

describe('importFromBase64', () => {
  it('decodes a base64-encoded .env string', () => {
    const raw = 'API_KEY=abc123\nDB_HOST=localhost\n';
    const encoded = Buffer.from(raw).toString('base64');
    const result = importFromBase64(encoded);
    expect(result).toEqual({ API_KEY: 'abc123', DB_HOST: 'localhost' });
  });

  it('handles quoted values in base64-encoded content', () => {
    const raw = 'SECRET="hello world"\n';
    const encoded = Buffer.from(raw).toString('base64');
    const result = importFromBase64(encoded);
    expect(result).toEqual({ SECRET: 'hello world' });
  });

  it('throws on invalid base64 that produces unparseable content', () => {
    // valid base64 but content that parseEnv would reject as malformed
    // We just ensure it doesn't silently swallow errors
    expect(() => importFromBase64('!!!notbase64!!!')).toThrow('importFromBase64 failed');
  });

  it('returns empty object for base64-encoded empty string', () => {
    const encoded = Buffer.from('').toString('base64');
    expect(importFromBase64(encoded)).toEqual({});
  });
});
