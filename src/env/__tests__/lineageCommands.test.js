const { Command } = require('commander');

const mockRecordLineage = jest.fn().mockReturnValue([{ timestamp: 't', action: 'imported' }]);
const mockGetKeyLineage = jest.fn().mockReturnValue([]);
const mockClearKeyLineage = jest.fn();
const mockListTrackedKeys = jest.fn().mockReturnValue(['API_KEY', 'DB_PASS']);
const mockFormatLineageReport = jest.fn().mockReturnValue('Lineage report output');

jest.mock('../envLineage', () => ({
  recordLineage: mockRecordLineage,
  getKeyLineage: mockGetKeyLineage,
  clearKeyLineage: mockClearKeyLineage,
  listTrackedKeys: mockListTrackedKeys,
  formatLineageReport: mockFormatLineageReport,
}));

const { registerLineageCommands } = require('../lineageCommands');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerLineageCommands(program);
  return program;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
});

test('lineage record calls recordLineage with correct args', () => {
  const program = buildProgram();
  program.parse(['node', 'test', 'lineage', 'record', 'myapp', 'API_KEY', '--action', 'imported', '--source', 'ci', '--by', 'alice']);
  expect(mockRecordLineage).toHaveBeenCalledWith('myapp', 'API_KEY', { action: 'imported', source: 'ci', by: 'alice' });
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Total entries: 1'));
});

test('lineage record works without optional flags', () => {
  const program = buildProgram();
  program.parse(['node', 'test', 'lineage', 'record', 'myapp', 'SECRET', '--action', 'rotated']);
  expect(mockRecordLineage).toHaveBeenCalledWith('myapp', 'SECRET', { action: 'rotated' });
});

test('lineage show calls formatLineageReport', () => {
  const program = buildProgram();
  program.parse(['node', 'test', 'lineage', 'show', 'myapp', 'API_KEY']);
  expect(mockFormatLineageReport).toHaveBeenCalledWith('myapp', 'API_KEY');
  expect(console.log).toHaveBeenCalledWith('Lineage report output');
});

test('lineage list prints tracked keys', () => {
  const program = buildProgram();
  program.parse(['node', 'test', 'lineage', 'list', 'myapp']);
  expect(mockListTrackedKeys).toHaveBeenCalledWith('myapp');
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('API_KEY'));
});

test('lineage list prints message when no keys', () => {
  mockListTrackedKeys.mockReturnValueOnce([]);
  const program = buildProgram();
  program.parse(['node', 'test', 'lineage', 'list', 'emptyapp']);
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No lineage data'));
});

test('lineage clear calls clearKeyLineage', () => {
  const program = buildProgram();
  program.parse(['node', 'test', 'lineage', 'clear', 'myapp', 'DB_PASS']);
  expect(mockClearKeyLineage).toHaveBeenCalledWith('myapp', 'DB_PASS');
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Lineage cleared'));
});
