// resolvers/createUser.js
import { util } from '@aws-appsync/utils';
import { put } from '@aws-appsync/utils/dynamodb';
const TABLE = 'gg_core';

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

  const birthDateStr = (args.birthDate || '').trim();
  if (birthDateStr) {
    const parts = birthDateStr.split('-');
    if (parts.length !== 3) util.error('invalid birthDate format, expected YYYY-MM-DD', 'Validation');
    const y = (parts[0] - 0);
    const m = (parts[1] - 0);
    const d = (parts[2] - 0);
    if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
      util.error('invalid birthDate', 'Validation');
    }
    // Compare to (today - 1 year) without using Date constructors
    // Use ISO8601 string from util to extract UTC Y-M-D
    var iso = util.time.nowISO8601(); // e.g., "2025-09-05T22:04:41Z"
    var cy = (iso.substring(0, 4) - 0);
    var cm = (iso.substring(5, 7) - 0);
    var cd = (iso.substring(8, 10) - 0);
    var cutoffY = cy - 1;
    // If birth year is after cutoff year, it's too recent
    if (y > cutoffY) util.error('birthDate too recent', 'Validation');
    // If same cutoff year, compare month/day
    if (y === cutoffY) {
      if (m > cm) util.error('birthDate too recent', 'Validation');
      if (m === cm && d > cd) util.error('birthDate too recent', 'Validation');
    }
  }

  // Country (required) — ensure it is from our allow-list
  const country = (args.country || '').trim();
  if (!country) util.error('country required', 'Validation');
  var allowedCountries = { US:1,CA:1,MX:1,BR:1,AR:1,CL:1,CO:1,PE:1,VE:1,UY:1,PY:1,BO:1,EC:1,GT:1,CR:1,PA:1,DO:1,CU:1,HN:1,NI:1,SV:1,JM:1,TT:1,
    GB:1,IE:1,FR:1,DE:1,ES:1,PT:1,IT:1,NL:1,BE:1,LU:1,CH:1,AT:1,DK:1,SE:1,NO:1,FI:1,IS:1,PL:1,CZ:1,SK:1,HU:1,RO:1,BG:1,GR:1,HR:1,SI:1,RS:1,BA:1,MK:1,AL:1,ME:1,UA:1,BY:1,LT:1,LV:1,EE:1,MD:1,TR:1,CY:1,MT:1,RU:1,
    CN:1,JP:1,KR:1,IN:1,PK:1,BD:1,LK:1,NP:1,BT:1,MV:1,TH:1,MY:1,SG:1,ID:1,PH:1,VN:1,KH:1,LA:1,MM:1,BN:1,TL:1,
    AE:1,SA:1,QA:1,BH:1,KW:1,OM:1,YE:1,IR:1,IQ:1,JO:1,LB:1,SY:1,IL:1,PS:1,AF:1,KZ:1,KG:1,UZ:1,TM:1,TJ:1,MN:1,
    AU:1,NZ:1,PG:1,FJ:1,SB:1,VU:1,WS:1,TO:1,TV:1,KI:1,FM:1,MH:1,NR:1,PW:1,
    EG:1,MA:1,DZ:1,TN:1,LY:1,SD:1,SS:1,ET:1,ER:1,DJ:1,SO:1,KE:1,UG:1,TZ:1,RW:1,BI:1,CD:1,CG:1,GA:1,GQ:1,CM:1,NG:1,GH:1,CI:1,SN:1,ML:1,BF:1,NE:1,BJ:1,TG:1,GM:1,GN:1,GW:1,SL:1,LR:1,MR:1,EH:1,AO:1,ZM:1,ZW:1,MW:1,MZ:1,NA:1,BW:1,SZ:1,LS:1,MG:1,MU:1,SC:1,CV:1,ST:1,KM:1 };
  if (!allowedCountries[country]) util.error('invalid country', 'Validation');

  // Bio length constraint (optional)
  if (args.bio && (('' + args.bio).length > 200)) util.error('bio too long (max 200)', 'Validation');

  // Optional password. Prefer passwordHash if provided; otherwise accept password in dev
  const providedPasswordHash = args.passwordHash;
  const providedPassword = args.password;
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
  }    if (ageYears < 0) { ageYears = 0 }
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
  item.passwordAlgo = (providedPasswordHash ? 'bcrypt$12' : 'plain$dev');
  item.passwordUpdatedAt = now;
}

  // Note: For UNIT resolvers, we cannot stash data; response will reconstruct from ctx.args

  // Build a unique email lock item and write both via a single transaction
  const emailLockKey = { PK: 'EMAIL#' + emailLower, SK: 'UNIQUE#USER' };
  var emailLockAttrs = { type: 'EmailUnique', email: emailLower, userId: sub, createdAt: now };

  // Prepare user attributes map for PutItem
  const userAttrs = {
    type: item.type,
    id: item.id,
    nickname: item.nickname,
    email: item.email,
    fullName: item.fullName,
    birthDate: item.birthDate,
    status: item.status,
    country: item.country,
    language: item.language,
    gender: item.gender,
    pronouns: item.pronouns,
    bio: item.bio,
    tags: item.tags,
    ageYears: item.ageYears,
    tier: item.tier,
    GSI2PK: item.GSI2PK,
    GSI2SK: item.GSI2SK,
    GSI3PK: item.GSI3PK,
    GSI3SK: item.GSI3SK,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    GSI1PK: item.GSI1PK,
    GSI1SK: item.GSI1SK
  };
  if (effectivePasswordHash) {
    userAttrs.passwordHash = item.passwordHash;
    userAttrs.passwordAlgo = item.passwordAlgo;
    userAttrs.passwordUpdatedAt = item.passwordUpdatedAt;
  }
    // Return a DynamoDB TransactWriteItems request
      return {
        operation: 'TransactWriteItems',
        transactItems: [
      {
        table: TABLE,
        operation: 'PutItem',
        // If an item already exists for this email, the transaction will fail
        key: util.dynamodb.toMapValues({ PK: emailLockKey.PK, SK: emailLockKey.SK }),
        attributeValues: util.dynamodb.toMapValues({
          type: 'EmailUnique',
          email: emailLower,
          userId: sub,
          createdAt: now,
        }),
        condition: {
          expression: 'attribute_not_exists(#pk)',
          expressionNames: { '#pk': 'PK' },
        },
      },
      {
        table: TABLE,
        operation: 'PutItem',
        key: util.dynamodb.toMapValues({ PK: item.PK, SK: item.SK }),
        attributeValues: util.dynamodb.toMapValues(userAttrs),
      },
      ],
    };

}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  // Reconstruct response from args and identity. Fallback to keys from TransactWriteItems.
  const args = ctx.args && ctx.args.input ? ctx.args.input : {};
  const email = (args.email || '').trim().toLowerCase();
  const identity = ctx.identity || {};
  let sub = identity.sub || null;
  if (!sub) {
    const keys = (ctx.result && ctx.result.keys) ? ctx.result.keys : [];
    for (let i = 0; i < keys.length; i++) {
      const pk = keys[i].PK || '';
      const sk = keys[i].SK || '';
      if ((pk + '').indexOf('USER#') === 0 && (sk + '').indexOf('PROFILE#') === 0) {
        sub = (pk + '').substring(5); // after 'USER#'
        break;
      }
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
