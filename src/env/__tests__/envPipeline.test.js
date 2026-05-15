const {
  registerPipeline,
  unregisterPipeline,
  listPipelines,
  runPipeline,
  runInlinePipeline,
  clearPipelines,
} = require('../envPipeline');

beforeEach(() => clearPipelines());

describe('registerPipeline', () => {
  test('registers a valid pipeline', () => {
    registerPipeline('test', [(env) => env]);
    expect(listPipelines()).toContain('test');
  });

  test('throws on empty name', () => {
    expect(() => registerPipeline('', [(e) => e])).toThrow('non-empty string');
  });

  test('throws on empty steps array', () => {
    expect(() => registerPipeline('p', [])).toThrow('at least one step');
  });

  test('throws if a step is not a function', () => {
    expect(() => registerPipeline('p', ['not-a-fn'])).toThrow('not a function');
  });
});

describe('unregisterPipeline', () => {
  test('removes an existing pipeline', () => {
    registerPipeline('rem', [(e) => e]);
    expect(unregisterPipeline('rem')).toBe(true);
    expect(listPipelines()).not.toContain('rem');
  });

  test('returns false for unknown pipeline', () => {
    expect(unregisterPipeline('ghost')).toBe(false);
  });
});

describe('runPipeline', () => {
  test('applies steps in order', async () => {
    registerPipeline('upper', [
      (env) => Object.fromEntries(Object.entries(env).map(([k, v]) => [k, v.toUpperCase()])),
      (env) => ({ ...env, EXTRA: 'yes' }),
    ]);
    const { result, steps } = await runPipeline('upper', { FOO: 'bar' });
    expect(result.FOO).toBe('BAR');
    expect(result.EXTRA).toBe('yes');
    expect(steps).toHaveLength(2);
  });

  test('passes options to each step', async () => {
    const received = [];
    registerPipeline('opts', [
      (env, opts) => { received.push(opts.tag); return env; },
    ]);
    await runPipeline('opts', { A: '1' }, { tag: 'hello' });
    expect(received).toEqual(['hello']);
  });

  test('throws for unknown pipeline', async () => {
    await expect(runPipeline('nope', {})).rejects.toThrow('not found');
  });

  test('records before/after snapshots per step', async () => {
    registerPipeline('snap', [
      (env) => ({ ...env, X: '2' }),
    ]);
    const { steps } = await runPipeline('snap', { X: '1' });
    expect(steps[0].before.X).toBe('1');
    expect(steps[0].after.X).toBe('2');
  });
});

describe('runInlinePipeline', () => {
  test('runs without permanently registering', async () => {
    const step = (env) => ({ ...env, INLINE: 'true' });
    const { result } = await runInlinePipeline([step], { A: 'b' });
    expect(result.INLINE).toBe('true');
    expect(listPipelines()).not.toContain('__inline__');
  });

  test('supports async steps', async () => {
    const step = async (env) => {
      await Promise.resolve();
      return { ...env, ASYNC: 'done' };
    };
    const { result } = await runInlinePipeline([step], {});
    expect(result.ASYNC).toBe('done');
  });
});
