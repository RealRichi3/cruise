const { Buffer } = require('buffer');
const crypto = require('crypto');
const config = require('./config');

const algorithm = config.CRYPTO_ALGORITHM;
const password = Buffer.from(config.CRYPTO_PASSWORD, 'hex')
const iv = Buffer.from(config.CRYPTO_IV, 'hex')

// Encrypt the string
function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, password, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Decrypt the string
function decrypt(text) {
    const decipher = crypto.createDecipheriv(algorithm, password, iv);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = {
    encrypt,
    decrypt,
};
