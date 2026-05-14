/**
 * envInspect.js
 * Inspect and summarize env variables: type inference, stats, and anomaly detection.
 */

const VALUE_TYPES = {
  boolean: (v) => /^(true|false)$/i.test(v),
  integer: (v) => /^-?\d+$/.test(v),
  float: (v) => /^-?\d+\.\d+$/.test(v),
  url: (v) => /^https?:\/\/.+/.test(v),
  base64: (v) => /^[A-Za-z0-9+/]{16,}={0,2}$/.test(v),
  secret: (v) => v.length >= 16 && /[A-Z]/.test(v) && /[0-9]/.test(v),
  empty: (v) => v === '',
  string: () => true,
};

function inferType(value) {
  for (const [type, test] of Object.entries(VALUE_TYPES)) {
    if (test(value)) return type;
  }
  return 'string';
}

function inspectEntry(key, value) {
  return {
    key,
    value,
    type: inferType(value),
    length: value.length,
    hasWhitespace: /\s/.test(value),
    isQuoted: /^["'].*["']$/.test(value),
  };
}

function inspectEnv(parsed) {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new TypeError('inspectEnv expects a parsed env object');
  }

  const entries = Object.entries(parsed).map(([key, value]) =>
    inspectEntry(key, value)
  );

  const stats = {
    total: entries.length,
    empty: entries.filter((e) => e.type === 'empty').length,
    secrets: entries.filter((e) => e.type === 'secret' || e.type === 'base64').length,
    byType: entries.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {}),
  };

  const anomalies = entries
    .filter((e) => e.hasWhitespace || e.isQuoted || e.type === 'empty')
    .map((e) => ({
      key: e.key,
      reason: e.type === 'empty'
        ? 'empty value'
        : e.isQuoted
        ? 'value appears quoted'
        : 'value contains whitespace',
    }));

  return { entries, stats, anomalies };
}

function formatInspectReport(report) {
  const lines = [];
  lines.push(`Total keys: ${report.stats.total}`);
  lines.push(`Empty values: ${report.stats.empty}`);
  lines.push(`Secrets/Base64: ${report.stats.secrets}`);
  lines.push('Type breakdown:');
  for (const [type, count] of Object.entries(report.stats.byType)) {
    lines.push(`  ${type}: ${count}`);
  }
  if (report.anomalies.length > 0) {
    lines.push('Anomalies:');
    for (const a of report.anomalies) {
      lines.push(`  [${a.key}] ${a.reason}`);
    }
  }
  return lines.join('\n');
}

module.exports = { inferType, inspectEntry, inspectEnv, formatInspectReport };
