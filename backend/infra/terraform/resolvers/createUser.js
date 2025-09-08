// resolvers/createUser.js
import { util } from '@aws-appsync/utils';
const TABLE = 'gg_core';

// Lightweight password strength validation without RegExp
function validatePasswordStrength(pwd) {
  const s = (pwd || '') + '';
  if (s.length < 8) util.error('Password must be at least 8 characters long.', 'Validation');
  var hasLower = false, hasUpper = false, hasDigit = false, hasSpecial = false;
  var specials = "!@#$%^&*()-_=+[]{};:,.?/";
  for (var i = 0; i < s.length; i++) {
    var c = s[i];
    if (c >= 'a' && c <= 'z') hasLower = true;
    else if (c >= 'A' && c <= 'Z') hasUpper = true;
    else if (c >= '0' && c <= '9') hasDigit = true;
    else if (specials.indexOf(c) >= 0) hasSpecial = true;
  }
  if (!hasLower) util.error('Password must include at least one lowercase letter.', 'Validation');
  if (!hasUpper) util.error('Password must include at least one uppercase letter.', 'Validation');
  if (!hasDigit) util.error('Password must include at least one digit.', 'Validation');
  if (!hasSpecial) util.error('Password must include at least one special character.', 'Validation');
}

// Extract bcrypt cost if a bcrypt MCF hash is provided (e.g. $2b$12$...)
function parseBcryptCost(hash) {
  const parts = (('' + (hash || ''))).split('$');
  if (parts.length >= 4 && parts[1] && parts[2]) {
    var n = 0;
    // Ensure cost is exactly two digits
    if (parts[2].length === 2) {
      var tens = parts[2].charCodeAt(0) - 48; // '0' => 48
      var ones = parts[2].charCodeAt(1) - 48;
      if (tens >= 0 && tens <= 9 && ones >= 0 && ones <= 9) {
        n = tens * 10 + ones;
        if (n >= 4 && n <= 31) return n;
      }
    }
  }
  return null;
}

/**
 * Mutation.createUser(input: {
 *  nickname!,
 *  email!,
 *  fullName!,
 *  birthDate,           // YYYY-MM-DD, must be <= today - 1 year
 *  status,              // e.g. 'email confirmation pending'
 *  language,
 *  pronouns,
 *  bio,
 *  tags,
 *  passwordHash | password
 * }): User
 */
export function request(ctx) {
  const args = ctx.args && ctx.args.input ? ctx.args.input : {};
  const nickname = args.nickname;
  if (!nickname) util.error('nickname required', 'Validation');

  // Basic field validation for new fields (avoid regex and disallowed APIs)
  const email = (args.email || '').trim();
  if (!email) util.error('email required', 'Validation');
  const atIdx = email.indexOf('@');
  const dotIdx = email.lastIndexOf('.');
  if (!(atIdx > 0 && dotIdx > atIdx + 1 && dotIdx < email.length - 1)) {
    util.error('invalid email', 'Validation');
  }
  const emailLower = email.toLowerCase();

  const fullName = (args.fullName || '').trim();
  if (!fullName) util.error('fullName required', 'Validation');

  // Move birthDate and country checks to Function 2 (persistUser)
  const birthDateStr = (args.birthDate || '').trim();
  const country = (args.country || '').trim();

  // Bio length constraint (optional)
  if (args.bio && (('' + args.bio).length > 200)) util.error('bio too long (max 200)', 'Validation');

  // Optional password. Prefer passwordHash (bcrypt MCF). Otherwise accept plaintext in dev flows only.
  const providedPasswordHash = args.passwordHash ? ('' + args.passwordHash) : null;
  const providedPassword = args.password ? ('' + args.password) : null;

  // If plaintext password provided, enforce backend-equivalent strength rules.
  if (providedPassword && !providedPasswordHash) {
    validatePasswordStrength(providedPassword);
  }

  // Validate provided bcrypt hash format if present
  let passwordAlgo = null;
  if (providedPasswordHash) {
    // Basic MCF checks without RegExp: must start with $2a$NN$ or $2b$NN$ or $2y$NN$
    var okPrefix = false;
    if (providedPasswordHash.length > 7) {
      var pfx = providedPasswordHash.substring(0, 4);
      okPrefix = (pfx === '$2a$' || pfx === '$2b$' || pfx === '$2y$');
      if (okPrefix) {
        var cost = parseBcryptCost(providedPasswordHash);
        if (!cost) okPrefix = false;
      }
    }
    if (!okPrefix) util.error('passwordHash must be a valid bcrypt hash', 'Validation');
    const cost = parseBcryptCost(providedPasswordHash);
    passwordAlgo = cost ? ('bcrypt$' + cost) : 'bcrypt';
  }

  const effectivePasswordHash = providedPasswordHash || (providedPassword ? 'plain$' + providedPassword : null);

  const identity = ctx.identity || {};
  const sub = identity.sub || util.autoId();
  const now = util.time.nowEpochMilliSeconds();

    // Calculate age in years from birthDateStr
  var ageYears = null;
  if (birthDateStr) {
    var by = (birthDateStr.substring(0,4) - 0);
    var bm = (birthDateStr.substring(5,7) - 0);
    var bd = (birthDateStr.substring(8,10) - 0);
    var nowIso = util.time.nowISO8601();
    var cy = (nowIso.substring(0,4) - 0);
    var cm = (nowIso.substring(5,7) - 0);
    var cd = (nowIso.substring(8,10) - 0);
    ageYears = cy - by;
    if (cm < bm || (cm === bm && cd < bd)) { ageYears = ageYears - 1; }
    if (ageYears < 0) { ageYears = 0 }
  }
  if (ageYears < 0) { ageYears = 0 }
  const item = {
  PK: 'USER#' + sub,
  SK: 'PROFILE#' + sub,
  type: 'User',
  id: sub,
  nickname: nickname,
  email: emailLower,
  fullName: fullName,
  birthDate: birthDateStr || null,
  status: (args.status || 'email confirmation pending'),
  country: country,
  language: args.language || 'en',
  gender: args.gender || '',
  pronouns: args.pronouns || '',
  bio: args.bio || '',
  tags: Array.isArray(args.tags) ? args.tags : [],
  tier: 'free',
  GSI2PK: 'NICK#' + nickname,
  GSI2SK: 'PROFILE#' + sub,
  GSI3PK: 'EMAIL#' + emailLower,
  GSI3SK: 'PROFILE#' + sub,
  createdAt: now,
  updatedAt: now,
  GSI1PK: 'USER#' + sub,
  GSI1SK: 'ENTITY#User#' + now,
  ageYears: ageYears
};
if (effectivePasswordHash) {
  item.passwordHash = effectivePasswordHash;
  item.passwordAlgo = (providedPasswordHash ? (passwordAlgo || 'bcrypt') : 'plain$dev');
  item.passwordUpdatedAt = now;
}

  // Note: For UNIT resolvers, we cannot stash data; response will reconstruct from ctx.args

  // Build a unique email lock item and write both via a single transaction
  const emailLockKey = { PK: 'EMAIL#' + emailLower, SK: 'UNIQUE#USER' };
  // Attributes are inlined below in attributeValues

  // Instead of DDB writes here, invoke the Lambda data source to perform signup via API Gateway
  const payload = {
    input: {
      email: emailLower,
      fullName: fullName,
      password: providedPasswordHash ? null : (providedPassword || ''),
      nickname: nickname,
      birthDate: birthDateStr || null,
      country: country,
      language: args.language || 'en',
      gender: args.gender || '',
      pronouns: args.pronouns || '',
      bio: args.bio || '',
      tags: Array.isArray(args.tags) ? args.tags : [],
      status: args.status || 'email confirmation pending',
      // If a bcrypt hash was provided, we prefer the service to hash itself, so ignore it here.
    },
    identity: ctx.identity || {},
    action: 'signup'
  };
  return { operation: 'Invoke', payload };

}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  // Reconstruct response from args and identity. Fallback to keys from TransactWriteItems.
  const args = ctx.args && ctx.args.input ? ctx.args.input : {};
  const email = (args.email || '').trim().toLowerCase();
  const identity = ctx.identity || {};
  let sub = identity.sub || util.autoId();
  if (!sub) {
    const keys = (ctx.result && ctx.result.keys) ? ctx.result.keys : [];
    var derived = null;
    if (keys && keys.some(function (k) {
      var pk = (k && k.PK) ? '' + k.PK : '';
      var sk = (k && k.SK) ? '' + k.SK : '';
      if (pk.indexOf('USER#') === 0 && sk.indexOf('PROFILE#') === 0) {
        derived = pk.substring(5);
        return true;
      }
      return false;
    })) {
      sub = derived;
    }
  }
  return {
    id: sub,
    nickname: args.nickname || '',
    email: email,
    fullName: args.fullName || '',
    birthDate: (args.birthDate || null) || null,
    status: args.status || 'email confirmation pending',
    country: args.country || null,
    language: args.language || 'en',
    gender: args.gender || '',
    pronouns: args.pronouns || '',
    bio: args.bio || '',
    tags: Array.isArray(args.tags) ? args.tags : [],
    tier: 'free',
  };
}
