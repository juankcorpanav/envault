/**
 * taggingCommands.js
 * CLI commands for managing key-level tags in a vault.
 */

const { tagKey, untagKey, getTagsForKey, getKeysByTag, loadKeyTags } = require('./envTagging');

function registerTaggingCommands(program) {
  const tag = program.command('tag').description('Manage key-level tags in a vault');

  tag
    .command('add <vault> <key> <tag>')
    .description('Add a tag to an env key')
    .action((vault, key, tagName) => {
      const result = tagKey(vault, key, tagName);
      console.log(`Tagged [${key}] with "${tagName}". Current tags: ${result.join(', ')}`);
    });

  tag
    .command('remove <vault> <key> <tag>')
    .description('Remove a tag from an env key')
    .action((vault, key, tagName) => {
      const result = untagKey(vault, key, tagName);
      console.log(`Removed tag "${tagName}" from [${key}]. Remaining: ${result.join(', ') || '(none)'}`);
    });

  tag
    .command('list <vault> <key>')
    .description('List all tags for an env key')
    .action((vault, key) => {
      const tags = getTagsForKey(vault, key);
      if (tags.length === 0) {
        console.log(`No tags for key [${key}].`);
      } else {
        console.log(`Tags for [${key}]: ${tags.join(', ')}`);
      }
    });

  tag
    .command('find <vault> <tag>')
    .description('Find all keys with a given tag')
    .action((vault, tagName) => {
      const keys = getKeysByTag(vault, tagName);
      if (keys.length === 0) {
        console.log(`No keys tagged with "${tagName}".`);
      } else {
        console.log(`Keys tagged "${tagName}": ${keys.join(', ')}`);
      }
    });

  tag
    .command('dump <vault>')
    .description('Show all key-tag mappings for a vault')
    .action((vault) => {
      const all = loadKeyTags(vault);
      if (Object.keys(all).length === 0) {
        console.log('No tags defined.');
      } else {
        Object.entries(all).forEach(([key, tags]) => {
          console.log(`  ${key}: ${tags.join(', ')}`);
        });
      }
    });
}

module.exports = { registerTaggingCommands };
