export const util = {
  error: (message, type = 'Error') => {
    const e = new Error(message);
    e.type = type;
    throw e;
  },
  unauthorized: () => {
    const e = new Error('Unauthorized');
    e.type = 'Unauthorized';
    throw e;
  },
  time: {
    nowEpochMilliSeconds: () => 1725148800000, // 2024-09-01T00:00:00.000Z
    nowISO8601: () => '2024-09-01T00:00:00Z'
  },
  autoId: () => 'AUTO_ID',
  dynamodb: {
    toMapValues: (obj) => obj
  }
};

