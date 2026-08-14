import { ServerOptions } from './types/ServerOptions';

export default {
  secretKey: 'THISISMYSECURETOKEN',
  host: 'http://localhost',
  port: '21465',
  deviceName: 'WppConnect',
  poweredBy: 'WPPConnect-Server',
  startAllSession: false,
  tokenStoreType: 'file',
  maxListeners: 15,
  customUserDataDir: './userDataDir/',
  webhook: {
    url: null,
    autoDownload: true,
    uploadS3: false,
    readMessage: true,
    allUnreadOnStart: false,
    listenAcks: true,
    // Désactivé : dayaxcash-bot ne traite pas cet event (whatsapp.controller.ts
    // ne gère que onmessage/unreadmessages/session-started) — chaque
    // changement de présence (en ligne, "en train d'écrire...") déclenchait
    // quand même un appel webhook signé (HMAC) pour rien côté serveur, et un
    // aller-retour HTTP + vérification de signature pour rien côté bot.
    onPresenceChanged: false,
    // Désactivé pour la même raison : non géré par whatsapp.controller.ts,
    // et dayaxcash-bot fonctionne en conversations 1:1 (pas de logique
    // groupe) — cet event (ajout/retrait de participant) ne concerne de
    // toute façon aucun flux actuel.
    onParticipantsChanged: false,
    // Les 4 events suivants sont eux aussi relayés sans être consommés par
    // whatsapp.controller.ts (onmessage/unreadmessages/session-started
    // uniquement) — désactivés pour éviter un appel webhook signé HMAC pour
    // rien à chaque réaction emoji, suppression de message, vote de sondage
    // (le bot n'en envoie pas) ou changement de label WhatsApp Business.
    onReactionMessage: false,
    onPollResponse: false,
    onRevokedMessage: false,
    onLabelUpdated: false,
    onSelfMessage: false,
    ignore: ['status@broadcast'],
  },
  websocket: {
    autoDownload: false,
    uploadS3: false,
  },
  chatwoot: {
    sendQrCode: true,
    sendStatus: true,
  },
  archive: {
    enable: false,
    waitTime: 10,
    daysToArchive: 45,
  },
  log: {
    level: 'silly', // Before open a issue, change level to silly and retry a action
    logger: ['console', 'file'],
  },
  createOptions: {
    browserArgs: [
      '--disable-web-security',
      '--no-sandbox',
      '--disable-web-security',
      // Le cache disque/mémoire de Chromium était désactivé ici
      // (--aggressive-cache-discard, --disable-cache,
      // --disable-application-cache, --disable-offline-load-stale-cache,
      // --disk-cache-size=0). Une session WhatsApp Web recharge en
      // permanence les mêmes assets JS/CSS/images WhatsApp : les désactiver
      // forçait un re-fetch réseau à chaque navigation/reload au lieu de
      // servir depuis le cache local, pour aucun bénéfice fonctionnel.
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-translate',
      '--hide-scrollbars',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--ignore-certificate-errors-spki-list',
    ],
    /**
     * Example of configuring the linkPreview generator
     * If you set this to 'null', it will use global servers; however, you have the option to define your own server
     * Clone the repository https://github.com/wppconnect-team/wa-js-api-server and host it on your server with ssl
     *
     * Configure the attribute as follows:
     * linkPreviewApiServers: [ 'https://www.yourserver.com/wa-js-api-server' ]
     */
    linkPreviewApiServers: null,

    /**
     * Set specific whatsapp version
     */
    // whatsappVersion: '2.xxxxx',
  },
  mapper: {
    enable: false,
    prefix: 'tagone-',
  },
  db: {
    mongodbDatabase: 'tokens',
    mongodbCollection: '',
    mongodbUser: '',
    mongodbPassword: '',
    mongodbHost: '',
    mongoIsRemote: true,
    mongoURLRemote: '',
    mongodbPort: 27017,
    redisHost: 'localhost',
    redisPort: 6379,
    redisPassword: '',
    redisDb: 0,
    redisPrefix: 'docker',
  },
  aws_s3: {
    region: 'sa-east-1' as any,
    access_key_id: null,
    secret_key: null,
    defaultBucketName: null,
    endpoint: null,
    forcePathStyle: null,
  },
} as unknown as ServerOptions;
