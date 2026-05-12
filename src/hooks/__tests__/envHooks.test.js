const {
  registerHook,
  unregisterHook,
  runHooks,
  clearHooks,
  listHooks,
} = require('../envHooks');

beforeEach(() => {
  clearHooks();
});

describe('registerHook', () => {
  it('registers a hook for a valid event', () => {
    const fn = jest.fn();
    registerHook('preRead', fn);
    expect(listHooks().preRead).toBe(1);
  });

  it('throws for unknown event', () => {
    expect(() => registerHook('onMagic', jest.fn())).toThrow('Unknown hook event');
  });

  it('throws if fn is not a function', () => {
    expect(() => registerHook('preRead', 'notAFunction')).toThrow('Hook must be a function');
  });
});

describe('unregisterHook', () => {
  it('removes a previously registered hook', () => {
    const fn = jest.fn();
    registerHook('postWrite', fn);
    unregisterHook('postWrite', fn);
    expect(listHooks().postWrite).toBe(0);
  });

  it('does nothing if hook was not registered', () => {
    expect(() => unregisterHook('postWrite', jest.fn())).not.toThrow();
  });
});

describe('runHooks', () => {
  it('runs hooks in order and passes context', async () => {
    const order = [];
    registerHook('preWrite', async (ctx) => { order.push('first'); return ctx; });
    registerHook('preWrite', async (ctx) => { order.push('second'); return ctx; });
    await runHooks('preWrite', { vaultName: 'test' });
    expect(order).toEqual(['first', 'second']);
  });

  it('allows hooks to mutate context', async () => {
    registerHook('postRead', async (ctx) => ({ ...ctx, injected: true }));
    const result = await runHooks('postRead', { vaultName: 'test' });
    expect(result.injected).toBe(true);
  });

  it('throws for unknown event', async () => {
    await expect(runHooks('onMagic', {})).rejects.toThrow('Unknown hook event');
  });
});

describe('clearHooks', () => {
  it('clears hooks for a specific event', () => {
    registerHook('preRotate', jest.fn());
    clearHooks('preRotate');
    expect(listHooks().preRotate).toBe(0);
  });

  it('clears all hooks when no event given', () => {
    registerHook('preRead', jest.fn());
    registerHook('postWrite', jest.fn());
    clearHooks();
    const counts = Object.values(listHooks());
    expect(counts.every((c) => c === 0)).toBe(true);
  });
});

describe('listHooks', () => {
  it('returns counts for all events', () => {
    const summary = listHooks();
    expect(summary).toHaveProperty('preRead');
    expect(summary).toHaveProperty('postRotate');
  });
});
