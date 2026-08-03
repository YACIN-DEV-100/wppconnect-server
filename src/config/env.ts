import 'dotenv/config';

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value && defaultValue === undefined) {
    throw new Error(
      `❌ Erreur fatale : La variable d'environnement ${key} est manquante.`
    );
  }
  return value!;
};

export const config = {
  nodeEnv: getEnv('NODE_ENV', 'production'),
  internalKey: getEnv('INTERNAL_KEY'),
  secretKey: getEnv('WPP_SECRET_KEY'),
  accessSecret: getEnv('ACCESS_SECRET'),
  refreshSecret: getEnv('REFRESH_SECRET'),
  wppWebhookSecret: getEnv('WPP_WEBHOOK_SECRET'),
  cookieDomain: getEnv('COOKIE_DOMAIN', 'localhost'),
};
