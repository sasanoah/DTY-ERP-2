const MIN_SECRET_LENGTH = 32;

function isDatabaseUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === 'postgresql:' || url.protocol === 'postgres:') &&
      Boolean(url.hostname && url.pathname.slice(1)) &&
      !['change_me', 'dtyerp'].includes(url.username.toLowerCase()) &&
      !['change_me', 'dtyerp'].includes(url.password.toLowerCase());
  } catch {
    return false;
  }
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function runtimeEnvironmentErrors(env) {
  const errors = [];
  if (!env.DATABASE_URL) errors.push('DATABASE_URL is required');
  else if (!isDatabaseUrl(env.DATABASE_URL)) errors.push('DATABASE_URL must be a PostgreSQL URL without example credentials');

  if (!env.SESSION_SECRET) errors.push('SESSION_SECRET is required');
  else if (env.SESSION_SECRET.length < MIN_SECRET_LENGTH || env.SESSION_SECRET.startsWith('replace-with-')) errors.push(`SESSION_SECRET must be a non-placeholder value of at least ${MIN_SECRET_LENGTH} characters`);

  if (env.INTERNAL_JOB_TOKEN && env.INTERNAL_JOB_TOKEN.length < MIN_SECRET_LENGTH) {
    errors.push(`INTERNAL_JOB_TOKEN must be at least ${MIN_SECRET_LENGTH} characters when configured`);
  }

  if (env.N8N_WEBHOOK_URL) {
    if (!isHttpUrl(env.N8N_WEBHOOK_URL)) errors.push('N8N_WEBHOOK_URL must be an HTTP(S) URL');
    if (!env.INTEGRATION_WEBHOOK_SECRET || env.INTEGRATION_WEBHOOK_SECRET.length < MIN_SECRET_LENGTH || env.INTEGRATION_WEBHOOK_SECRET.startsWith('replace-with-')) {
      errors.push(`INTEGRATION_WEBHOOK_SECRET must be a non-placeholder value of at least ${MIN_SECRET_LENGTH} characters when N8N_WEBHOOK_URL is configured`);
    }
  }
  return errors;
}

export function assertRuntimeEnvironment(env = process.env) {
  const errors = runtimeEnvironmentErrors(env);
  if (errors.length) throw new Error(`Invalid production environment:\n- ${errors.join('\n- ')}`);
}
