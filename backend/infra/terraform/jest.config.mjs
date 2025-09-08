export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/resolvers'],
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '^@aws-appsync/utils$': '<rootDir>/test/mocks/appsync-utils.js',
    '^@aws-appsync/utils/dynamodb$': '<rootDir>/test/mocks/appsync-utils-dynamodb.js'
  }
};
