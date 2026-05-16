jest.mock('../../audit/auditLog', () => ({
  logAuditEvent: jest.fn()
}));

const { logAuditEvent } = require('../../audit/auditLog');
const {
  consoleAlertNotifier,
  auditAlertNotifier,
  composeAlertNotifiers,
  withAlertCheck
} = require('../alertNotifier');

const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

afterEach(() => jest.clearAllMocks());

const warnAlert = { id: 'r1', message: 'low disk', severity: 'warn' };
const errorAlert = { id: 'r2', message: 'no db', severity: 'error' };

test('consoleAlertNotifier logs warn alerts to console.warn', () => {
  consoleAlertNotifier([warnAlert], 'vault1');
  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('low disk'));
});

test('consoleAlertNotifier logs error alerts to console.error', () => {
  consoleAlertNotifier([errorAlert], 'vault1');
  expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('no db'));
});

test('auditAlertNotifier calls logAuditEvent for each alert', () => {
  auditAlertNotifier([warnAlert, errorAlert], 'vault1');
  expect(logAuditEvent).toHaveBeenCalledTimes(2);
  expect(logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'alert_triggered', ruleId: 'r1' }));
});

test('composeAlertNotifiers calls all notifiers', () => {
  const n1 = jest.fn();
  const n2 = jest.fn();
  const composed = composeAlertNotifiers(n1, n2);
  composed([warnAlert], 'v');
  expect(n1).toHaveBeenCalledWith([warnAlert], 'v');
  expect(n2).toHaveBeenCalledWith([warnAlert], 'v');
});

test('withAlertCheck calls notifier only when alerts triggered', () => {
  const evalFn = jest.fn().mockReturnValue([warnAlert]);
  const notifier = jest.fn();
  const checked = withAlertCheck(evalFn, notifier);
  checked('vault1', { KEY: 'val' });
  expect(notifier).toHaveBeenCalledWith([warnAlert], 'vault1');
});

test('withAlertCheck does not call notifier when no alerts', () => {
  const evalFn = jest.fn().mockReturnValue([]);
  const notifier = jest.fn();
  const checked = withAlertCheck(evalFn, notifier);
  checked('vault1', { KEY: 'val' });
  expect(notifier).not.toHaveBeenCalled();
});

test('withAlertCheck returns triggered alerts', () => {
  const evalFn = jest.fn().mockReturnValue([errorAlert]);
  const checked = withAlertCheck(evalFn, jest.fn());
  const result = checked('vault1', {});
  expect(result).toEqual([errorAlert]);
});
