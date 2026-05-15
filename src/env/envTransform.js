const { parseEnv, serializeEnv } = require('../secrets/envParser');

const BUILTIN_TRANSFORMS = {
  uppercase: (value) => value.toUpperCase(),
  lowercase: (value) => value.toLowerCase(),
  trim: (value) => value.trim(),
  base64encode: (value) => Buffer.from(value).toString('base64'),
  base64decode: (value) => Buffer.from(value, 'base64').toString('utf8'),
  mask: (value) => '*'.repeat(Math.min(value.length, 8)),
  truncate: (value, arg) => value.slice(0, parseInt(arg, 10) || 16),
  prefix: (value, arg) => `${arg}${value}`,
  suffix: (value, arg) => `${value}${arg}`,
  replace: (value, arg) => {
    const [from, to] = (arg || '').split(':');
    return from ? value.split(from).join(to || '') : value;
  },
};

function parseTransformSpec(spec) {
  const colonIdx = spec.indexOf(':');
  if (colonIdx === -1) return { name: spec.trim(), arg: undefined };
  return { name: spec.slice(0, colonIdx).trim(), arg: spec.slice(colonIdx + 1) };
}

function applyTransform(value, spec) {
  const { name, arg } = parseTransformSpec(spec);
  const fn = BUILTIN_TRANSFORMS[name];
  if (!fn) throw new Error(`Unknown transform: "${name}"`);
  return fn(value, arg);
}

function transformValue(value, specs) {
  return specs.reduce((v, spec) => applyTransform(v, spec), value);
}

function transformEnv(parsed, rules) {
  const result = { ...parsed };
  for (const [key, specs] of Object.entries(rules)) {
    if (!(key in result)) continue;
    const specList = Array.isArray(specs) ? specs : [specs];
    result[key] = transformValue(result[key], specList);
  }
  return result;
}

function listTransforms() {
  return Object.keys(BUILTIN_TRANSFORMS);
}

function registerTransform(name, fn) {
  if (typeof fn !== 'function') throw new Error('Transform must be a function');
  BUILTIN_TRANSFORMS[name] = fn;
}

module.exports = { applyTransform, transformValue, transformEnv, listTransforms, registerTransform, parseTransformSpec };
