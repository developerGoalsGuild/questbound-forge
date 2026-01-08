import { Amplify } from 'aws-amplify';
import awsConfigDev from './aws-exports.dev';
import awsConfigProd from './aws-exports.prod';

const isProd = import.meta.env.PROD;

const awsConfig = isProd ? awsConfigProd : awsConfigDev;

const originalHeaders = awsConfig.API?.GraphQL?.headers;
awsConfig.API.GraphQL.headers = async (...args) => {
  const resolved = originalHeaders ? await originalHeaders(...args) : {};
  console.log('Amplify GraphQL headers', resolved);
  return resolved;
};

Amplify.configure(awsConfig);

export default Amplify;

