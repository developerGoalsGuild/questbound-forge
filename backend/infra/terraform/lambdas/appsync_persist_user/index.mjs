// appsync_persist_user Lambda: persists user profile into gg_core
const TABLE = process.env.TABLE || 'gg_core';

export async function handler(event) {
  // Obtain a DocumentClient lazily to avoid local test dependency on aws-sdk
  let ddb;
  if (globalThis.__DOC) {
    ddb = globalThis.__DOC;
  } else {
    try {
      const AWS = await import('aws-sdk');
      ddb = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });
    } catch {
      throw new Error('aws-sdk unavailable');
    }
  }
  // event = { email, nickname, fullName, birthDate, status, country, language, gender, pronouns, bio, tags, identitySub, now }
  const e = event || {};
  const email = (e.email || '').trim().toLowerCase();
  const nickname = (e.nickname || '').trim();
  const fullName = (e.fullName || '').trim();
  if (!email) throw new Error('email required');
  if (!nickname) throw new Error('nickname required');
  if (!fullName) throw new Error('fullName required');

  const sub = e.identitySub || `anon-${Math.random().toString(36).slice(2, 10)}`;
  const now = Number.isFinite(e.now) ? e.now : Date.now();

  const userPk = `USER#${sub}`;
  const userSk = `PROFILE#${sub}`;
  const emailKey = `EMAIL#${email}`;

  const item = {
    PK: userPk,
    SK: userSk,
    type: 'User',
    id: sub,
    nickname,
    email,
    fullName,
    birthDate: e.birthDate || null,
    status: e.status || 'email confirmation pending',
    country: e.country || '',
    language: e.language || 'en',
    gender: e.gender || '',
    pronouns: e.pronouns || '',
    bio: e.bio || '',
    tags: Array.isArray(e.tags) ? e.tags : [],
    tier: 'free',
    GSI2PK: `NICK#${nickname}`,
    GSI2SK: `PROFILE#${sub}`,
    GSI3PK: `EMAIL#${email}`,
    GSI3SK: `PROFILE#${sub}`,
    createdAt: now,
    updatedAt: now,
    GSI1PK: `USER#${sub}`,
    GSI1SK: `ENTITY#User#${now}`,
  };

  const emailLock = {
    PK: emailKey,
    SK: 'UNIQUE#USER',
    type: 'EmailUnique',
    email,
    userId: sub,
    createdAt: now,
  };

  // Transact: insert email lock if not exists, and upsert user profile
  const tx = {
    TransactItems: [
      {
        Put: {
          TableName: TABLE,
          Item: emailLock,
          ConditionExpression: 'attribute_not_exists(#pk)',
          ExpressionAttributeNames: { '#pk': 'PK' }
        }
      },
      {
        Put: {
          TableName: TABLE,
          Item: item
        }
      }
    ]
  };

  try {
    await ddb.transactWrite(tx).promise();
  } catch (err) {
    // If email exists, surface a clear message
    const code = err && (err.code || err.name);
    if (code === 'ConditionalCheckFailedException') {
      throw new Error('Email already in use');
    }
    throw err;
  }

  return { ok: true, id: sub };
}
