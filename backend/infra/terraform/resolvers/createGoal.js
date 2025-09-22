// resolvers/createGoal.js
import { util } from '@aws-appsync/utils';
import { put } from '@aws-appsync/utils/dynamodb';

const nlpQuestionOrder = [
  'positive',
  'specific',
  'evidence',
  'resources',
  'obstacles',
  'ecology',
  'timeline',
  'firstStep',
];

function _digitsOnly(str) {
  if (!str) return false;
  const characters = `${str}`.split('');
  return characters.every((ch) => {
    const next = ch.slice(0, 1);
    if (!next) return false;
    const isDigit = next >= '0' && next <= '9';
    return isDigit;
  });
}

function _normalizeDateOnly(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length !== 10 || trimmed[4] !== '-' || trimmed[7] !== '-') {
    return null;
  }
  const y = trimmed.slice(0, 4);
  const m = trimmed.slice(5, 7);
  const d = trimmed.slice(8, 10);
  if (!_digitsOnly(y) || !_digitsOnly(m) || !_digitsOnly(d)) {
    return null;
  }
  const monthValid = m >= '01' && m <= '12';
  const dayValid = d >= '01' && d <= '31';
  if (!monthValid || !dayValid) {
    return null;
  }
  return `${y}-${m}-${d}`;
}

function _sanitizeAnswerValue(v) {
  if (v == null) return '';
  return `${v}`.trim();
}

function _isValidDateObject(value) {
  // AppSync disallows instanceof and getTime, so check for Date by duck typing without getTime
  // We'll check if value has toISOString method and returns a valid ISO string
  if (
    value &&
    typeof value === 'object' &&
    typeof value.toISOString === 'function'
  ) {
   
      //const iso = value.toISOString();
      const iso = value;
      // Basic check for ISO string format YYYY-MM-DDTHH:mm:ss.sssZ
      return typeof iso === 'string' && iso.length >= 20 && iso[4] === '-' && iso[7] === '-';
   
  }
  return false;
}

export function request(ctx) {
  console.log('CreateGoal request started');
  const identity = ctx.identity || {};
  const resolverCtx = identity.resolverContext || {};
  const userId = identity.sub || resolverCtx.sub || resolverCtx.userId;
  if (!userId) {
    util.error('Unauthorized: No userId found in identity', 'Unauthorized');
  }

  const input = ctx.args && ctx.args.input ? ctx.args.input : {};
  console.log('Input received: ' + JSON.stringify(input));

  const title = input.title;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    util.error('Validation error: title is required and must be a non-empty string', 'Validation');
  }

  const deadline = input.deadline;
  const normalizedDeadline = _normalizeDateOnly(deadline);
  if (!normalizedDeadline) {
    util.error('Validation error: deadline must be a valid date string in YYYY-MM-DD format', 'Validation');
  }

  const rawAnswers = Array.isArray(input.answers) ? input.answers : [];

  // Validate all answers have a non-empty string key using Array.prototype.some
  const invalidAnswerIndex = rawAnswers.findIndex(
    (ans) => !ans || typeof ans.key !== 'string' || ans.key.trim() === ''
  );
  if (invalidAnswerIndex !== -1) {
    util.error(`Validation error: answer at index ${invalidAnswerIndex} is missing a valid 'key' property`, 'Validation');
  }

  // Initialize base map with empty strings for all expected keys
  const baseMap = nlpQuestionOrder.reduce((map, key) => {
    map[key] = '';
    return map;
  }, {});

  // Fill baseMap with sanitized answers from input, normalized keys to lowercase
  const answersMap = rawAnswers.reduce((map, entry) => {
    if (!entry || typeof entry.key !== 'string') {
      return map;
    }
    const normalizedKey = entry.key.trim().toLowerCase();
    if (Object.hasOwn(map, normalizedKey)) {
      map[normalizedKey] = _sanitizeAnswerValue(entry.answer);
    }
    return map;
  }, baseMap);

  // Compose answers array in fixed order with keys and answers
  const answersCombined = nlpQuestionOrder.map((key) => ({
    name: key,
    answer: answersMap[key],
  }));

  const now = util.time.nowEpochMilliSeconds();
  const goalId = util.autoId();

  const item = {
    PK: 'USER#' + userId,
    SK: 'GOAL#' + goalId,
    type: 'Goal',
    id: goalId,
    userId: userId,
    title: title.trim(),
    description: typeof input.description === 'string' ? input.description.trim() : '',
    tags: Array.isArray(input.tags) ? input.tags : [],
    answers: answersCombined,
    deadline: normalizedDeadline,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    GSI1PK: 'USER#' + userId,
    GSI1SK: 'ENTITY#Goal#' + now,
  };

  if (ctx.stash) {
    ctx.stash.createdGoal = item;
  }
  console.log('Item to put: ' + JSON.stringify(item));

  return put({ item: item });
}

export function response(ctx) {
  if (ctx.error) {
    util.error('CreateGoal resolver error: ' + ctx.error.message, ctx.error.type);
  }
  const stashGoal = ctx.stash ? ctx.stash.createdGoal : undefined;
  const source = stashGoal || ((ctx.result && ctx.result.attributes) ? ctx.result.attributes : ctx.result);
  console.log('CreateGoal resolver response: ' + JSON.stringify(source));

  const answersOut = Array.isArray(source.answers)
    ? source.answers
        .map((entry) => {
          const item = entry || {};
          const keyValue = _sanitizeAnswerValue(item.key);
          if (!keyValue) {
            return null;
          }
          return {
            key: keyValue,
            answer: _sanitizeAnswerValue(item.answer),
          };
        })
        .filter((entry) => entry !== null)
    : [];

  // Ensure deadline is returned as string in YYYY-MM-DD format (matches AWSDate scalar)
  let deadlineOut = null;
  if (typeof source.deadline === 'string' && source.deadline.length === 10) {
    deadlineOut = source.deadline;
  } else if (_isValidDateObject(source.deadline)) {
    // Use toISOString without getTime
    deadlineOut = source.deadline.slice(0, 10);
    //deadlineOut = source.deadline.toISOString().slice(0, 10);
  } else if (typeof source.deadline === 'number') {
    // If stored as epoch millis, convert to YYYY-MM-DD string without getTime
      const d = source.deadline;
      //const d = new Date(source.deadline);
      // Check if date is valid by checking ISO string length and format
      //const iso = d.toISOString();
      const iso = d;
      if (typeof iso === 'string' && iso.length >= 20 && iso[4] === '-' && iso[7] === '-') {
        deadlineOut = iso.slice(0, 10);
      }
    
  }

  return {
    id: source.id,
    userId: source.userId,
    title: source.title,
    description: source.description,
    tags: source.tags || [],
    answers: answersOut,
    deadline: deadlineOut,
    status: source.status,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}
