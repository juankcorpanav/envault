/**
 * envBroadcast.js
 * Broadcasts env change events to registered channels (console, webhook, file).
 */

const fs = require('fs');
const path = require('path');

const channels = new Map();

/**
 * Register a named broadcast channel.
 * @param {string} name - Unique channel name.
 * @param {Function} handler - async (event) => void
 */
function registerChannel(name, handler) {
  if (typeof handler !== 'function') throw new Error('Channel handler must be a function');
  channels.set(name, handler);
}

function unregisterChannel(name) {
  return channels.delete(name);
}

function listChannels() {
  return Array.from(channels.keys());
}

/**
 * Broadcast an event to all registered channels.
 * @param {object} event - { type, vault, key?, actor?, timestamp? }
 */
async function broadcast(event) {
  const payload = {
    timestamp: new Date().toISOString(),
    ...event,
  };
  const results = [];
  for (const [name, handler] of channels) {
    try {
      await handler(payload);
      results.push({ channel: name, ok: true });
    } catch (err) {
      results.push({ channel: name, ok: false, error: err.message });
    }
  }
  return results;
}

// --- Built-in channel factories ---

function consoleChannel() {
  return async (event) => {
    console.log(`[envault:broadcast] ${event.type} | vault=${event.vault} | ${event.timestamp}`);
  };
}

function fileChannel(logFilePath) {
  return async (event) => {
    const line = JSON.stringify(event) + '\n';
    fs.appendFileSync(logFilePath, line, 'utf8');
  };
}

function webhookChannel(url, fetchFn = fetch) {
  return async (event) => {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error(`Webhook responded with ${res.status}`);
  };
}

module.exports = {
  registerChannel,
  unregisterChannel,
  listChannels,
  broadcast,
  consoleChannel,
  fileChannel,
  webhookChannel,
};
