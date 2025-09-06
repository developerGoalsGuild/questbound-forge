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

  // Basic field validation for new fields
  const email = (args.email || '').trim();
  if (!email) util.error('email required', 'Validation');
  const emailRe = /^(?:[^\s@]+)@(?:[^\s@]+)\.(?:[^\s@]+)$/;
  if (!emailRe.test(email)) util.error('invalid email', 'Validation');
  const emailLower = email.toLowerCase();

  const fullName = (args.fullName || '').trim();
  if (!fullName) util.error('fullName required', 'Validation');

  const birthDateStr = (args.birthDate || '').trim();
  if (birthDateStr) {
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRe.test(birthDateStr)) util.error('invalid birthDate format, expected YYYY-MM-DD', 'Validation');

    // Compute max allowed birth date string (today - 1 year) in YYYY-MM-DD
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    const pad = (n) => String(n).padStart(2, '0');
    const maxBirthDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (birthDateStr > maxBirthDate) util.error('birthDate must be on or before ' + maxBirthDate, 'Validation');
  }

  // Country (required) — ensure it is from our allow-list
  const country = (args.country || '').trim();
  if (!country) util.error('country required', 'Validation');
  const allowedCountries = new Set([
    'US','CA','MX','BR','AR','CL','CO','PE','VE','UY','PY','BO','EC','GT','CR','PA','DO','CU','HN','NI','SV','JM','TT',
    'GB','IE','FR','DE','ES','PT','IT','NL','BE','LU','CH','AT','DK','SE','NO','FI','IS','PL','CZ','SK','HU','RO','BG','GR','HR','SI','RS','BA','MK','AL','ME','UA','BY','LT','LV','EE','MD','TR','CY','MT','RU',
    'CN','JP','KR','IN','PK','BD','LK','NP','BT','MV','TH','MY','SG','ID','PH','VN','KH','LA','MM','BN','TL',
    'AE','SA','QA','BH','KW','OM','YE','IR','IQ','JO','LB','SY','IL','PS','AF','KZ','KG','UZ','TM','TJ','MN',
    'AU','NZ','PG','FJ','SB','VU','WS','TO','TV','KI','FM','MH','NR','PW',
    'EG','MA','DZ','TN','LY','SD','SS','ET','ER','DJ','SO','KE','UG','TZ','RW','BI','CD','CG','GA','GQ','CM','NG','GH','CI','SN','ML','BF','NE','BJ','TG','GM','GN','GW','SL','LR','MR','EH','AO','ZM','ZW','MW','MZ','NA','BW','SZ','LS','MG','MU','SC','CV','ST','KM'
  ]);
  if (!allowedCountries.has(country)) util.error('invalid country', 'Validation');

  // Bio length constraint (optional)
  if (args.bio && String(args.bio).length > 200) util.error('bio too long (max 200)', 'Validation');

  // Optional password. Prefer passwordHash if provided; otherwise accept password in dev
  const providedPasswordHash = args.passwordHash;
  const providedPassword = args.password;
  const effectivePasswordHash = providedPasswordHash || (providedPassword ? 'plain$' + providedPassword : null);

  const identity = ctx.identity || {};
  const sub = identity.sub || util.autoId();

  const now = util.time.nowEpochMilliSeconds();

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
    pronouns: args.pronouns || '',
    bio: args.bio || '',
    tags: Array.isArray(args.tags) ? args.tags : [],
    tier: 'free',
    // Index by email for lookups/uniqueness checks
    GSI2PK: 'EMAIL#' + emailLower,
    GSI2SK: 'PROFILE#' + sub,
    ...(effectivePasswordHash ? {
      passwordHash: effectivePasswordHash,
      passwordAlgo: (providedPasswordHash ? 'bcrypt$12' : 'plain$dev'),
      passwordUpdatedAt: now,
    } : {}),
    createdAt: now,
    updatedAt: now,
    GSI1PK: 'USER#' + sub,
    GSI1SK: 'ENTITY#User#' + now
  };

  // Save the user attributes for the response mapping
  ctx.stash = ctx.stash || {};
  ctx.stash.user = {
    id: item.id,
    nickname: item.nickname,
    email: item.email,
    fullName: item.fullName,
    birthDate: item.birthDate,
    status: item.status,
    country: item.country,
    language: item.language,
    pronouns: item.pronouns,
    bio: item.bio,
    tags: item.tags,
    tier: item.tier,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };

  // Build a unique email lock item and write both via a single transaction
  const emailLockKey = { PK: 'EMAIL#' + emailLower, SK: 'UNIQUE#USER' };
  const emailLockItem = {
    ...emailLockKey,
    type: 'EmailUnique',
    email: emailLower,
    userId: sub,
    createdAt: now,
  };

  // Return a DynamoDB TransactWriteItems request
  return {
    operation: 'TransactWriteItems',
    transactItems: [
      {
        table: TABLE,
        operation: 'PutItem',
        // If an item already exists for this email, the transaction will fail
        key: emailLockKey,
        attributeValues: Object.fromEntries(Object.entries(emailLockItem).filter(([k]) => !(k === 'PK' || k === 'SK'))),
        condition: {
          expression: 'attribute_not_exists(#pk)',
          expressionNames: { '#pk': 'PK' },
          expressionValues: {},
          returnValuesOnConditionCheckFailure: false,
        },
      },
      {
        table: TABLE,
        operation: 'PutItem',
        key: { PK: item.PK, SK: item.SK },
        attributeValues: Object.fromEntries(Object.entries(item).filter(([k]) => !(k === 'PK' || k === 'SK'))),
      },
    ],
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  // For TransactWriteItems, there's no attributes in result; return what we stashed
  const a = (ctx.stash && ctx.stash.user) ? ctx.stash.user : {};
  return {
    id: a.id,
    nickname: a.nickname,
    email: a.email,
    fullName: a.fullName,
    birthDate: a.birthDate || null,
    status: a.status,
    country: a.country,
    language: a.language,
    pronouns: a.pronouns,
    bio: a.bio,
    tags: a.tags || [],
    tier: a.tier || 'free',
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}
