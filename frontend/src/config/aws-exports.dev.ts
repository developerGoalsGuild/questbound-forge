// Amplify expects an absolute URL. Allow override via env for dev.
const envEndpoint = import.meta.env.VITE_APPSYNC_ENDPOINT as string | undefined;

const inferredBrowserEndpoint = () => {
  // Use AppSync endpoint from environment variable or fallback
  return import.meta.env.VITE_APPSYNC_ENDPOINT || 'https://f7qjx3q3nfezdnix3wuyxtrnre.appsync-api.us-east-2.amazonaws.com/graphql';
};

const endpoint = envEndpoint && envEndpoint.trim()
  ? envEndpoint.trim()
  : (import.meta.env.DEV
      ? inferredBrowserEndpoint()
      : 'https://f7qjx3q3nfezdnix3wuyxtrnre.appsync-api.us-east-2.amazonaws.com/graphql');

// Use Lambda authorizer by default. API key is only for public queries like isEmailAvailable/isNicknameAvailable
const apiKey = (import.meta.env.VITE_APPSYNC_API_KEY as string | undefined) || '';
const defaultAuthMode = 'lambda'; // Always use Lambda authorizer, API key auth is used selectively

const awsConfig = {
  API: {
    GraphQL: {
      endpoint,
      region: 'us-east-2',
      defaultAuthMode,
      apiKey,
    }
  }
};

export default awsConfig;