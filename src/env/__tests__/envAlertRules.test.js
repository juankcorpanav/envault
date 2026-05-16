const fs = require('fs');
const path = require('path');

jest.mock('fs');

const MOCK_RULES = [
  { id: 'no-empty-db', condition: 'env => !env.DB_URL', message: 'DB_URL must not be empty', severity: 'error', createdAt: '2024-01-01T00:00:00.000Z' }
];

let mod;
function freshModule() {
  jest.resetModules();
  mod = require('../envAlertRules');
  return mod;
}

beforeEach(() => {
  fs.existsSync.mockReturnValue(true);
  fs.mkdirSync.mockImplementation(() => {});
  fs.readFileSync.mockReturnValue(JSON.stringify(MOCK_RULES));
  fs.writeFileSync.mockImplementation(() => {});
  freshModule();
});

test('loadAlertRules returns parsed rules', () => {
  const rules = mod.loadAlertRules('myapp');
  expect(rules).toHaveLength(1);
  expect(rules[0].id).toBe('no-empty-db');
});

test('loadAlertRules returns empty array when file missing', () => {
  fs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
  const rules = mod.loadAlertRules('newvault');
  expect(rules).toEqual([]);
});

test('addAlertRule throws if id/condition/message missing', () => {
  fs.readFileSync.mockReturnValue('[]');
  expect(() => mod.addAlertRule('v', { id: 'x' })).toThrow('must have id, condition, and message');
});

test('addAlertRule throws on duplicate id', () => {
  expect(() => mod.addAlertRule('v', { id: 'no-empty-db', condition: 'x', message: 'y' })).toThrow("already exists");
});

test('addAlertRule saves new rule', () => {
  fs.readFileSync.mockReturnValue('[]');
  const rule = mod.addAlertRule('v', { id: 'new-rule', condition: 'env => true', message: 'test' });
  expect(rule.id).toBe('new-rule');
  expect(rule.createdAt).toBeDefined();
  expect(fs.writeFileSync).toHaveBeenCalled();
});

test('removeAlertRule removes existing rule', () => {
  mod.removeAlertRule('v', 'no-empty-db');
  const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(written).toHaveLength(0);
});

test('removeAlertRule throws if rule not found', () => {
  expect(() => mod.removeAlertRule('v', 'ghost')).toThrow("not found");
});

test('evaluateAlertRules returns triggered rules', () => {
  const triggered = mod.evaluateAlertRules('v', {});
  expect(triggered).toHaveLength(1);
  expect(triggered[0].id).toBe('no-empty-db');
});

test('evaluateAlertRules returns empty when rules pass', () => {
  const triggered = mod.evaluateAlertRules('v', { DB_URL: 'postgres://localhost' });
  expect(triggered).toHaveLength(0);
});

test('evaluateAlertRules handles broken condition gracefully', () => {
  fs.readFileSync.mockReturnValue(JSON.stringify([{ id: 'bad', condition: '!!invalid!!', message: 'oops', severity: 'warn' }]));
  const triggered = mod.evaluateAlertRules('v', {});
  expect(triggered[0].severity).toBe('error');
  expect(triggered[0].message).toMatch(/Rule eval error/);
});

test('listAlertRules returns all rules', () => {
  const rules = mod.listAlertRules('v');
  expect(rules).toHaveLength(1);
});
