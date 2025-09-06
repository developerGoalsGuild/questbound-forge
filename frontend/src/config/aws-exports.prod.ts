const awsConfig = {
  API: {
    GraphQL: {
      endpoint: 'https://your-production-appsync-endpoint/graphql',
      region: 'us-east-2',
      defaultAuthMode: 'lambda',
    }
  }
};

export default awsConfig;
