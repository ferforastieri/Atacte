const crypto = require('crypto');


// 1. JWT Secret (mínimo 32 caracteres)
const jwtSecret = crypto.randomBytes(64).toString('hex');

// 2. Encryption Key (exatamente 32 caracteres)
const encryptionKey = crypto.randomBytes(16).toString('hex');

// 3. Backup das chaves

