const { logAuditEvent } = require('../audit/auditLog');

function consoleAlertNotifier(triggered, vaultName) {
  for (const alert of triggered) {
    const prefix = `[ALERT:${alert.severity.toUpperCase()}]`;
    if (alert.severity === 'error') {
      console.error(`${prefix} ${alert.id}: ${alert.message}`);
    } else {
      console.warn(`${prefix} ${alert.id}: ${alert.message}`);
    }
  }
}

function auditAlertNotifier(triggered, vaultName) {
  for (const alert of triggered) {
    logAuditEvent({
      type: 'alert_triggered',
      vault: vaultName,
      ruleId: alert.id,
      severity: alert.severity,
      message: alert.message,
      timestamp: new Date().toISOString()
    });
  }
}

function composeAlertNotifiers(...notifiers) {
  return (triggered, vaultName) => {
    for (const notifier of notifiers) {
      notifier(triggered, vaultName);
    }
  };
}

function withAlertCheck(evaluateFn, notifier) {
  return (vaultName, envObj) => {
    const triggered = evaluateFn(vaultName, envObj);
    if (triggered.length > 0) {
      notifier(triggered, vaultName);
    }
    return triggered;
  };
}

module.exports = {
  consoleAlertNotifier,
  auditAlertNotifier,
  composeAlertNotifiers,
  withAlertCheck
};
