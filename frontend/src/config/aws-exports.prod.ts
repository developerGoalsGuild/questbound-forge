const awsConfig = {
  API: {
    GraphQL: {
      endpoint: 'https://your-production-appsync-endpoint/graphql',
      region: 'us-east-2',
      defaultAuthMode: 'lambda',
      apiKey: import.meta.env.VITE_APPSYNC_API_KEY || '' ,
    }
  }
};

export default awsConfig;
