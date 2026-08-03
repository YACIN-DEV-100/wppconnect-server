import mongoose from 'mongoose';

import config from '../../../config';

if (config.tokenStoreType === 'mongodb') {
  mongoose.Promise = global.Promise;

  const userAndPassword =
    config.db.mongodbUser && config.db.mongodbPassword
      ? `${config.db.mongodbUser}:${config.db.mongodbPassword}@`
      : '';

  const uri = config.db.mongoIsRemote
    ? config.db.mongoURLRemote
    : `mongodb://${userAndPassword}${config.db.mongodbHost}:${config.db.mongodbPort}/${config.db.mongodbDatabase}`;

  mongoose
    .connect(uri)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));
}

export default mongoose;
