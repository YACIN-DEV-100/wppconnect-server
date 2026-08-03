import { createClient } from 'redis';

import config from '../../../config';

let RedisClient: ReturnType<typeof createClient> | null = null;

if (config.tokenStoreType === 'redis') {
  const url = `redis://${
    config.db.redisPassword ? `:${config.db.redisPassword}@` : ''
  }${config.db.redisHost}:${config.db.redisPort}/${config.db.redisDb}`;

  RedisClient = createClient({ url });

  RedisClient.connect()
    .then(() => console.log('✅ Redis connected'))
    .catch((err) => console.error('❌ Redis connection error:', err));
}

export default RedisClient;
