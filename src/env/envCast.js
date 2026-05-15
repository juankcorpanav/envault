/**
 * envCast.js — Type casting utilities for env values
 * Supports casting to boolean, number, integer, json, string, and array.
 */

const CAST_TYPES = ['string', 'boolean', 'number', 'integer', 'json', 'array'];

function listCastTypes() {
  return [...CAST_TYPES];
}

function castValue(value, type) {
  if (value === undefined || value === null) {
    throw new Error(`Cannot cast nullish value to ${type}`);
  }
  switch (type) {
    case 'string':
      return String(value);
    case 'boolean': {
      const lower = String(value).trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(lower)) return true;
      if (['false', '0', 'no', 'off'].includes(lower)) return false;
      throw new Error(`Cannot cast "${value}" to boolean`);
    }
    case 'number': {
      const n = Number(value);
      if (isNaN(n)) throw new Error(`Cannot cast "${value}" to number`);
      return n;
    }
    case 'integer': {
      const i = parseInt(value, 10);
      if (isNaN(i)) throw new Error(`Cannot cast "${value}" to integer`);
      return i;
    }
    case 'json': {
      try {
        return JSON.parse(value);
      } catch {
        throw new Error(`Cannot cast "${value}" to json`);
      }
    }
    case 'array':
      return String(value)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    default:
      throw new Error(`Unknown cast type: ${type}`);
  }
}

function castEnv(env, schema) {
  const result = {};
  for (const [key, value] of Object.entries(env)) {
    if (schema[key]) {
      result[key] = castValue(value, schema[key]);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function formatCastReport(results) {
  return results
    .map(({ key, from, to, type, error }) =>
      error
        ? `  [FAIL] ${key}: ${error}`
        : `  [OK]   ${key}: "${from}" => ${JSON.stringify(to)} (${type})`
    )
    .join('\n');
}

module.exports = { castValue, castEnv, listCastTypes, formatCastReport };
