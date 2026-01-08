// Use Lambda authorizer by default. API key is only for public queries like isEmailAvailable/isNicknameAvailable
const apiKey = import.meta.env.VITE_APPSYNC_API_KEY || '';
const defaultAuthMode = 'lambda'; // Always use Lambda authorizer, API key auth is used selectively

const awsConfig = {
  API: {
    GraphQL: {
      endpoint: 'https://your-production-appsync-endpoint/graphql',
      region: 'us-east-2',
      defaultAuthMode,
      apiKey,
    }
  }
};

export default awsConfig;
