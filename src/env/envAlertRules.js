const fs = require('fs');
const path = require('path');

const ALERTS_DIR = path.join(process.cwd(), '.envault', 'alerts');

function ensureAlertsDir() {
  if (!fs.existsSync(ALERTS_DIR)) {
    fs.mkdirSync(ALERTS_DIR, { recursive: true });
  }
}

function alertsFilePath(vaultName) {
  return path.join(ALERTS_DIR, `${vaultName}.alerts.json`);
}

function loadAlertRules(vaultName) {
  ensureAlertsDir();
  const file = alertsFilePath(vaultName);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function saveAlertRules(vaultName, rules) {
  ensureAlertsDir();
  fs.writeFileSync(alertsFilePath(vaultName), JSON.stringify(rules, null, 2));
}

function addAlertRule(vaultName, rule) {
  if (!rule.id || !rule.condition || !rule.message) {
    throw new Error('Alert rule must have id, condition, and message');
  }
  const rules = loadAlertRules(vaultName);
  if (rules.find(r => r.id === rule.id)) {
    throw new Error(`Alert rule with id '${rule.id}' already exists`);
  }
  const entry = { ...rule, createdAt: new Date().toISOString() };
  rules.push(entry);
  saveAlertRules(vaultName, rules);
  return entry;
}

function removeAlertRule(vaultName, ruleId) {
  const rules = loadAlertRules(vaultName);
  const filtered = rules.filter(r => r.id !== ruleId);
  if (filtered.length === rules.length) {
    throw new Error(`Alert rule '${ruleId}' not found`);
  }
  saveAlertRules(vaultName, filtered);
  return ruleId;
}

function evaluateAlertRules(vaultName, envObj) {
  const rules = loadAlertRules(vaultName);
  const triggered = [];
  for (const rule of rules) {
    try {
      const fn = new Function('env', `return (${rule.condition})(env)`);
      if (fn(envObj)) {
        triggered.push({ id: rule.id, message: rule.message, severity: rule.severity || 'warn' });
      }
    } catch (e) {
      triggered.push({ id: rule.id, message: `Rule eval error: ${e.message}`, severity: 'error' });
    }
  }
  return triggered;
}

function listAlertRules(vaultName) {
  return loadAlertRules(vaultName);
}

module.exports = {
  ensureAlertsDir,
  alertsFilePath,
  loadAlertRules,
  saveAlertRules,
  addAlertRule,
  removeAlertRule,
  evaluateAlertRules,
  listAlertRules
};
