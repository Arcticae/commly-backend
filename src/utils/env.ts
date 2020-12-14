import { ServerConfigurationError } from './serverErrors';

const env = (env: string): string => {
  const envValue = process.env[env];
  if (envValue) {
    return envValue;
  }
  throw new ServerConfigurationError(`${env} is missing`);
};

export default env;
