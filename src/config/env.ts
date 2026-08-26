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

  // Adresse à laquelle CE service doit rappeler apps/bot quand un message
  // WhatsApp arrive — toujours interne au réseau Docker partagé
  // (dayaxcash_net), jamais une adresse pensée pour le NAVIGATEUR
  // (NEXT_PUBLIC_API_URL côté web-manager, ex. http://localhost:8080 quand
  // le frontend tourne hors Docker, ou le domaine public en prod) : ce
  // conteneur ne peut résoudre ni l'une ni l'autre, seul le nom de service
  // Docker "bot" l'est. Un appel start-session qui laissait le client
  // (navigateur) fournir sa propre valeur de webhook produisait un vrai bug
  // (ECONNREFUSED localhost:8080 vu depuis CE conteneur) — voir
  // createSessionUtil.ts, qui ignore désormais toute valeur envoyée par
  // l'appelant et utilise systématiquement celle-ci.
  botWebhookUrl: getEnv('BOT_WEBHOOK_URL', 'http://bot:8080/whatsapp'),
};
