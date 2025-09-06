import { Amplify } from 'aws-amplify';
import awsConfigDev from './aws-exports.dev';
import awsConfigProd from './aws-exports.prod';

const isProd = process.env.NODE_ENV === 'production';

const awsConfig = isProd ? awsConfigProd : awsConfigDev;

Amplify.configure(awsConfig);

export default Amplify;
