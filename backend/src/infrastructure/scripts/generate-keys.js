const crypto = require('crypto');

console.log('🔐 Gerando chaves de segurança para o Atacte...\n');

// 1. JWT Secret (mínimo 32 caracteres)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('📝 JWT_SECRET (para autenticação):');
console.log(jwtSecret);
console.log(`Tamanho: ${jwtSecret.length} caracteres\n`);

// 2. Encryption Key (exatamente 32 caracteres)
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('🔒 ENCRYPTION_KEY (para criptografar senhas):');
console.log(encryptionKey);
console.log(`Tamanho: ${encryptionKey.length} caracteres\n`);

// 3. Backup das chaves
console.log('💾 Salve estas chaves em local seguro:');
console.log('=====================================');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log('=====================================\n');

console.log('📋 Como usar:');
console.log('1. Copie as chaves acima');
console.log('2. Cole no arquivo config.env');
console.log('3. Nunca compartilhe essas chaves!');
