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

// If an API key is provided via env, prefer apiKey auth by default in dev.
const apiKey = (import.meta.env.VITE_APPSYNC_API_KEY as string | undefined) || '';
const defaultAuthMode = apiKey ? 'apiKey' : 'lambda';

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