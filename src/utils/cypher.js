const crypto = require('crypto');
const config = require('../utils/config');

const algorithm = config.CRYPTO_ALGORITHM;
const password = config.CRYPTO_PASSWORD;

// Encrypt the string
function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, password);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Decrypt the string
function decrypt(text) {
    const decipher = crypto.createDecipheriv(algorithm, password);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = {
    encrypt,
    decrypt,
};
