const { Command } = require('commander');

jest.mock('../envTagging');

const tagging = require('../envTagging');
const { registerTaggingCommands } = require('../taggingCommands');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerTaggingCommands(program);
  return program;
}

beforeEach(() => jest.clearAllMocks());

describe('tag add', () => {
  it('calls tagKey and logs result', () => {
    tagging.tagKey.mockReturnValue(['sensitive']);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'e', 'tag', 'add', 'dev', 'API_KEY', 'sensitive']);
    expect(tagging.tagKey).toHaveBeenCalledWith('dev', 'API_KEY', 'sensitive');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('sensitive'));
    spy.mockRestore();
  });
});

describe('tag remove', () => {
  it('calls untagKey and logs remaining tags', () => {
    tagging.untagKey.mockReturnValue(['auth']);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'e', 'tag', 'remove', 'dev', 'API_KEY', 'sensitive']);
    expect(tagging.untagKey).toHaveBeenCalledWith('dev', 'API_KEY', 'sensitive');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('auth'));
    spy.mockRestore();
  });

  it('logs (none) when no remaining tags', () => {
    tagging.untagKey.mockReturnValue([]);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'e', 'tag', 'remove', 'dev', 'API_KEY', 'old']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('(none)'));
    spy.mockRestore();
  });
});

describe('tag list', () => {
  it('prints tags for a key', () => {
    tagging.getTagsForKey.mockReturnValue(['auth', 'rotation']);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'e', 'tag', 'list', 'dev', 'TOKEN']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('auth'));
    spy.mockRestore();
  });

  it('prints no tags message when empty', () => {
    tagging.getTagsForKey.mockReturnValue([]);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'e', 'tag', 'list', 'dev', 'TOKEN']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No tags'));
    spy.mockRestore();
  });
});

describe('tag find', () => {
  it('lists keys with given tag', () => {
    tagging.getKeysByTag.mockReturnValue(['A', 'B']);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'e', 'tag', 'find', 'dev', 'sensitive']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('A'));
    spy.mockRestore();
  });

  it('prints no keys message when empty', () => {
    tagging.getKeysByTag.mockReturnValue([]);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'e', 'tag', 'find', 'dev', 'ghost']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No keys'));
    spy.mockRestore();
  });
});

describe('tag dump', () => {
  it('prints all mappings', () => {
    tagging.loadKeyTags.mockReturnValue({ A: ['x'], B: ['y'] });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'e', 'tag', 'dump', 'dev']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('A'));
    spy.mockRestore();
  });

  it('prints no tags message when empty', () => {
    tagging.loadKeyTags.mockReturnValue({});
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'e', 'tag', 'dump', 'dev']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No tags'));
    spy.mockRestore();
  });
});
